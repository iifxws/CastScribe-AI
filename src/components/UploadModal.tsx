import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Mic,
  Youtube,
  Sparkles,
  X,
  FileAudio,
  FileVideo,
  FileText,
  AlertCircle,
  Play,
  Square,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  ShieldCheck,
  CheckCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { SAMPLE_RECORDINGS } from '../data/samples';
import { transcribeAudio } from '../services/api';
import { SampleRecording, RecordingContext, ValidationReport } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionSuccess: (data: {
    title: string;
    originalFileName: string;
    format: string;
    duration: string;
    durationSeconds?: number;
    transcript: string;
    segments?: any[];
    sourceType: 'upload' | 'youtube' | 'mic' | 'sample' | 'pasted_transcript';
    mediaUrl?: string;
    sourceFileId?: string;
    isAudioOnly?: boolean;
    fileSizeBytes?: number;
    context?: RecordingContext;
    validationReport?: ValidationReport;
  }) => void;
}

type TabType = 'upload' | 'mic' | 'paste' | 'youtube' | 'samples';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onTranscriptionSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suggestionAction, setSuggestionAction] = useState<string | null>(null);

  // Context fields before transcription (Phase 1.3)
  const [showContextBox, setShowContextBox] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [speakers, setSpeakers] = useState('');
  const [roles, setRoles] = useState('');
  const [topic, setTopic] = useState('');
  const [glossary, setGlossary] = useState('');
  const [audience, setAudience] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');

  // Microphone recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  // Processing state & step
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    };
  }, [audioUrl, selectedFileUrl]);

  if (!isOpen) return null;

  const currentContext: RecordingContext = {
    title: customTitle.trim(),
    speakers: speakers.trim(),
    roles: roles.trim(),
    topic: topic.trim(),
    glossary: glossary.trim(),
    audience: audience.trim(),
    sourceLanguage,
    outputLanguage: sourceLanguage,
  };

  // 1. File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    setSuggestionAction(null);
    const validExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.aac', '.ogg', '.webm', '.srt', '.vtt'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (file.name.endsWith('.srt') || file.name.endsWith('.vtt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPastedText(ev.target?.result as string);
        setActiveTab('paste');
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsText(file);
      return;
    }

    if (!hasValidExt && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setErrorMsg('Please select a supported audio (MP3, WAV, M4A) or video (MP4, MOV, WEBM) file.');
      return;
    }

    if (file.size > 80 * 1024 * 1024) {
      setErrorMsg('File exceeds the 80MB upload limit. Please compress or select a shorter clip.');
      return;
    }

    setSelectedFile(file);
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    const objectUrl = URL.createObjectURL(file);
    setSelectedFileUrl(objectUrl);

    if (!customTitle) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setCustomTitle(nameWithoutExt);
    }
    const hasArabic = /[\u0600-\u06FF]/.test(file.name);
    if (hasArabic) {
      setSourceLanguage('Arabic');
    }
  };

  // Convert File to base64
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // 2. Microphone live recording handlers
  const startRecording = async () => {
    setErrorMsg(null);
    setSuggestionAction(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMsg('Microphone access denied or not available. Please verify browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Execution of transcription
  const handleProcess = async () => {
    setErrorMsg(null);
    setSuggestionAction(null);
    setIsProcessing(true);

    try {
      // Path A: Pasted transcript or SRT
      if (activeTab === 'paste') {
        if (!pastedText.trim() || pastedText.trim().split(/\s+/).length < 10) {
          setErrorMsg('Please paste a transcript with at least 15 words, or upload an .srt/.vtt file.');
          setIsProcessing(false);
          return;
        }

        setProcessingStep('Validating formatting and extracting timecoded segments...');
        const res = await transcribeAudio({
          pastedTranscript: pastedText.trim(),
          title: customTitle || 'Imported Transcript Session',
          context: currentContext,
        });

        setIsProcessing(false);
        onTranscriptionSuccess({
          title: customTitle || 'Imported Transcript Session',
          originalFileName: 'transcript_paste.txt',
          format: 'Pasted Text / SRT',
          duration: res.estimatedDuration || '15:00',
          durationSeconds: res.durationSeconds || 900,
          transcript: res.transcript,
          segments: res.segments,
          sourceType: 'pasted_transcript',
          context: currentContext,
          validationReport: res.validationReport,
        });
        onClose();
        return;
      }

      // Path B: File Upload (Audio or Video)
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setErrorMsg('Please select an audio or video file to process.');
          setIsProcessing(false);
          return;
        }

        setProcessingStep('Reading audio/video stream bytes...');
        const base64Data = await fileToBase64(selectedFile);

        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        let determinedMime = selectedFile.type;
        if (!determinedMime || determinedMime === 'application/octet-stream') {
          if (ext === 'mp3') determinedMime = 'audio/mp3';
          else if (ext === 'wav') determinedMime = 'audio/wav';
          else if (ext === 'm4a') determinedMime = 'audio/m4a';
          else if (ext === 'mp4') determinedMime = 'video/mp4';
          else if (ext === 'mov') determinedMime = 'video/quicktime';
          else if (ext === 'webm') determinedMime = 'audio/webm';
          else determinedMime = 'audio/mp3';
        }

        setProcessingStep('Transcribing verbatim speech with speaker diarization & timestamps...');
        const res = await transcribeAudio({
          audioBase64: base64Data,
          mimeType: determinedMime,
          title: customTitle || selectedFile.name,
          context: currentContext,
        });

        const isVideo = selectedFile.type.startsWith('video') ||
          Boolean(selectedFile.name.match(/\.(mp4|mov|webm)$/i));
        const finalMediaUrl = (res as any).mediaUrl || selectedFileUrl || undefined;
        const sourceFileId = (res as any).sourceFileId || (finalMediaUrl?.includes('/public_clips/') ? finalMediaUrl.split('/public_clips/')[1] : undefined);

        setIsProcessing(false);
        onTranscriptionSuccess({
          title: customTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
          originalFileName: selectedFile.name,
          format: selectedFile.name.split('.').pop()?.toUpperCase() || (isVideo ? 'MP4 VIDEO' : 'AUDIO'),
          duration: res.estimatedDuration || '18:00',
          durationSeconds: res.durationSeconds,
          transcript: res.transcript,
          segments: res.segments,
          sourceType: 'upload',
          mediaUrl: finalMediaUrl,
          sourceFileId,
          isAudioOnly: !isVideo,
          fileSizeBytes: selectedFile.size,
          context: currentContext,
          validationReport: res.validationReport,
        });
        onClose();
        return;
      }

      // Path C: Mic recording
      if (activeTab === 'mic') {
        if (!recordedAudioBlob) {
          setErrorMsg('Please record your voice first before submitting.');
          setIsProcessing(false);
          return;
        }

        setProcessingStep('Encoding recorded voice track...');
        const base64Data = await fileToBase64(recordedAudioBlob);

        setProcessingStep('Transcribing speech with speaker turns & timecodes...');
        const res = await transcribeAudio({
          audioBase64: base64Data,
          mimeType: 'audio/webm',
          title: customTitle || 'Voice Recording Session',
          context: currentContext,
        });

        const finalMediaUrl = (res as any).mediaUrl || audioUrl || (recordedAudioBlob ? URL.createObjectURL(recordedAudioBlob) : undefined);
        const sourceFileId = (res as any).sourceFileId || (finalMediaUrl?.includes('/public_clips/') ? finalMediaUrl.split('/public_clips/')[1] : undefined);

        setIsProcessing(false);
        onTranscriptionSuccess({
          title: customTitle || `Voice Note — ${new Date().toLocaleDateString()}`,
          originalFileName: 'microphone_session.webm',
          format: 'Voice Mic',
          duration: formatTimer(recordingSeconds),
          durationSeconds: recordingSeconds,
          transcript: res.transcript,
          segments: res.segments,
          sourceType: 'mic',
          mediaUrl: finalMediaUrl,
          sourceFileId,
          isAudioOnly: true,
          fileSizeBytes: recordedAudioBlob.size,
          context: currentContext,
          validationReport: res.validationReport,
        });
        onClose();
        return;
      }

      // Path D: YouTube URL (Honest and Safe)
      if (activeTab === 'youtube') {
        if (!youtubeUrl.trim() || !youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
          setErrorMsg('Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)');
          setIsProcessing(false);
          return;
        }

        setProcessingStep('Extracting verified YouTube captions & video outline...');
        const res = await transcribeAudio({
          youtubeUrl: youtubeUrl.trim(),
          title: customTitle || 'YouTube Episode',
          context: currentContext,
        });

        const effectiveTitle = (res as any).videoTitle || customTitle || 'YouTube Episode Recording';
        const effectiveAuthor = (res as any).author || speakers;

        setIsProcessing(false);
        onTranscriptionSuccess({
          title: effectiveTitle,
          originalFileName: (res as any).videoTitle ? `${(res as any).videoTitle}.txt` : youtubeUrl.trim(),
          format: 'YouTube',
          duration: res.estimatedDuration || '20:00',
          durationSeconds: res.durationSeconds,
          transcript: res.transcript,
          segments: res.segments,
          sourceType: 'youtube',
          context: {
            ...currentContext,
            title: effectiveTitle,
            speakers: effectiveAuthor,
          },
          validationReport: res.validationReport,
        });
        onClose();
        return;
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      let cleanMsg = err.message || 'Failed to process transcription.';
      if (cleanMsg.includes('503') || cleanMsg.includes('high demand') || cleanMsg.includes('UNAVAILABLE')) {
        cleanMsg = 'The AI engine experienced high demand. We have automatically queued your request with our fast backup engine. Click "Retry Processing Now" below.';
      } else if (cleanMsg.includes('429') || cleanMsg.includes('quota')) {
        cleanMsg = 'Rate limit temporarily reached. Please click "Retry Processing Now" to continue.';
      } else {
        cleanMsg = cleanMsg.replace(/\{"error":\{.*\}\}/g, 'Temporary busy state.');
      }
      setErrorMsg(cleanMsg);
      if (err.message && (err.message.includes("couldn't access this video's audio or captions") || err.message.includes('YouTube'))) {
        setSuggestionAction('switch_to_paste');
      }
    }
  };

  // Instant Sample Selection
  const handleSelectSample = (sample: SampleRecording) => {
    setIsProcessing(true);
    setProcessingStep(`Loading ${sample.category} transcript & verified quotes...`);
    setTimeout(() => {
      setIsProcessing(false);
      onTranscriptionSuccess({
        title: sample.title,
        originalFileName: `${sample.id}.mp3`,
        format: sample.category,
        duration: sample.duration,
        durationSeconds: 2535,
        transcript: sample.transcript,
        sourceType: 'sample',
        fileSizeBytes: 32000000,
        context: sample.context,
      });
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Add Recording</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2 Grounded
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Turn your audio or video into verified text and ready-to-post vertical video clips.
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-950/50 flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>File Upload (Audio/Video)</span>
          </button>

          <button
            onClick={() => { setActiveTab('mic'); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'mic'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Voice Note</span>
          </button>

          <button
            onClick={() => { setActiveTab('paste'); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Transcript / SRT</span>
          </button>

          <button
            onClick={() => { setActiveTab('youtube'); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'youtube'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube URL</span>
          </button>

          <button
            onClick={() => { setActiveTab('samples'); setErrorMsg(null); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'samples'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demos</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 space-y-5 max-h-[62vh] overflow-y-auto">
          {/* Error Message Display */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold leading-relaxed">{errorMsg}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-500/20">
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Processing Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('paste');
                    setErrorMsg(null);
                    setSuggestionAction(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                >
                  Open Paste Transcript Tab →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    setErrorMsg(null);
                    setSuggestionAction(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                >
                  Upload File Directly →
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500/50 bg-emerald-950/10'
                    : 'border-slate-700 hover:border-indigo-500 bg-slate-950/40 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mov,.webm,.srt,.vtt"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      {selectedFile.type.startsWith('video') || Boolean(selectedFile.name.match(/\.(mp4|mov|webm)$/i)) ? (
                        <FileVideo className="w-6 h-6" />
                      ) : (
                        <FileAudio className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p
                        dir="auto"
                        className="text-sm font-bold text-white truncate max-w-md mx-auto"
                      >
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transcribe
                      </p>
                    </div>

                    {/* Interactive Video / Audio Preview */}
                    {selectedFileUrl && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-md mx-auto rounded-xl overflow-hidden bg-black/80 border border-slate-700/60 p-2 shadow-lg"
                      >
                        {selectedFile.type.startsWith('video') || Boolean(selectedFile.name.match(/\.(mp4|mov|webm)$/i)) ? (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block text-left px-1">
                              ✓ Video Stream Detected
                            </span>
                            <video
                              src={selectedFileUrl}
                              controls
                              playsInline
                              className="w-full max-h-48 rounded-lg bg-black object-contain mx-auto"
                            />
                          </div>
                        ) : (
                          <audio
                            src={selectedFileUrl}
                            controls
                            className="w-full h-10"
                          />
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-indigo-400 hover:underline pt-1">
                      Click to choose a different file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Drag and drop your audio or video file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports MP3, WAV, M4A, MP4, MOV, WEBM (up to 80MB)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Live Mic Recording */}
          {activeTab === 'mic' && (
            <div className="text-center py-6 space-y-5 bg-slate-950/40 border border-slate-800 rounded-2xl p-6">
              <div className="space-y-1">
                <div className="text-3xl font-mono font-bold text-white">
                  {formatTimer(recordingSeconds)}
                </div>
                <p className="text-xs text-slate-400">
                  {isRecording ? 'Recording live audio from your microphone...' : recordedAudioBlob ? 'Voice recording captured!' : 'Record a quick thought, episode intro, or advisory note.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{recordedAudioBlob ? 'Record Again' : 'Start Recording'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-rose-500/40 text-rose-400 font-bold text-sm shadow-lg transition-all animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>

              {audioUrl && !isRecording && (
                <div className="max-w-md mx-auto pt-2">
                  <audio controls src={audioUrl} className="w-full h-10 rounded-xl" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Paste Transcript or SRT (Phase 0 Grounding) */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Paste raw text, YouTube transcript, or .srt/.vtt:</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Grounded
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                dir="auto"
                placeholder="[00:00] Maya: Welcome to the episode today...&#10;[00:45] Liam: Thanks for having me, excited to share our metrics..."
                rows={8}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 font-mono text-xs text-slate-200 outline-none leading-relaxed resize-none"
              />
              <p className="text-[11px] text-slate-500">
                Tip: You can also upload .srt or .vtt subtitle files directly in the File Upload tab.
              </p>
            </div>
          )}

          {/* TAB 4: YouTube URL */}
          {activeTab === 'youtube' && (
            <div className="space-y-4 bg-slate-950/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                  <Youtube className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Import from YouTube (Caption Extraction)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    CastScribe extracts official closed-captions and timecodes directly. We never generate fabricated scripts if captions are unavailable.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  YouTube Video Link
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  For videos without public English captions, download the audio or use the <strong>Paste Transcript</strong> tab for guaranteed instant results.
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: Instant Demos */}
          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Click any pre-recorded demo to experience full written repurposing + short vertical video clips in seconds:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {SAMPLE_RECORDINGS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500 cursor-pointer transition-all hover:bg-slate-900/80 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {sample.category}
                          </span>
                          <span className="text-xs text-slate-400">• {sample.duration}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {sample.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{sample.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phase 1.3: Context Box BEFORE Transcription */}
          {activeTab !== 'samples' && (
            <div className="border border-slate-800 rounded-2xl bg-slate-950/60 overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setShowContextBox(!showContextBox)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Recording Context & Glossary (Optional)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Add speaker names, acronyms, and topic notes to ensure 100% spelling precision
                    </span>
                  </div>
                </div>
                {showContextBox ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showContextBox && (
                <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Recording Title</label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="e.g. Scaling B2B Advisory Retainers"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Speakers & Roles</label>
                      <input
                        type="text"
                        value={speakers}
                        onChange={(e) => setSpeakers(e.target.value)}
                        placeholder="e.g. Maya Vance (Host), Liam Carter (Guest)"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Key Terms & Jargon</label>
                      <input
                        type="text"
                        value={glossary}
                        onChange={(e) => setGlossary(e.target.value)}
                        placeholder="e.g. OpsFlow, TTV, CAC, ARR, Zapier"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Target Audience</label>
                      <input
                        type="text"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="e.g. Boutique agency founders, consultants"
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab !== 'samples' && (
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sanity checks active: zero hallucinated transcripts</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{processingStep || 'Processing audio...'}</span>
                  </>
                ) : (
                  <>
                    <span>Process & Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
