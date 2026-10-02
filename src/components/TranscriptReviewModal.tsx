import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Edit3,
  Search,
  Clock,
  FileText,
  Check,
  ArrowRight,
  X,
  AlertTriangle,
  Play,
  RotateCcw,
  RotateCw,
  Users,
  Replace,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { UserProfile, RecordingContext, ValidationReport } from '../types';

interface TranscriptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingTitle: string;
  duration: string;
  transcript: string;
  userProfile: UserProfile;
  context?: RecordingContext;
  validationReport?: ValidationReport;
  onStartGeneration: (
    editedTranscript: string,
    options: { blogLength: 'short' | 'long' }
  ) => void;
  isGenerating: boolean;
  generationStep?: string;
}

export const TranscriptReviewModal: React.FC<TranscriptReviewModalProps> = ({
  isOpen,
  onClose,
  recordingTitle,
  duration,
  transcript: initialTranscript,
  userProfile,
  context,
  validationReport,
  onStartGeneration,
  isGenerating,
  generationStep,
}) => {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [history, setHistory] = useState<string[]>([initialTranscript]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Search & Replace
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplaceBar, setShowReplaceBar] = useState(false);

  // Speaker global rename
  const [showSpeakerRename, setShowSpeakerRename] = useState(false);
  const [oldSpeakerName, setOldSpeakerName] = useState('Speaker 1');
  const [newSpeakerName, setNewSpeakerName] = useState('');

  // Target Blog Length
  const [blogLength, setBlogLength] = useState<'short' | 'long'>('long');

  // Active playing simulation / preview
  const [playingTimestamp, setPlayingTimestamp] = useState<string | null>(null);

  useEffect(() => {
    setTranscript(initialTranscript);
    setHistory([initialTranscript]);
    setHistoryIndex(0);
  }, [initialTranscript]);

  if (!isOpen) return null;

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const isRtl = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    `${recordingTitle} ${transcript}`
  );

  // History tracking for undo/redo
  const handleTranscriptChange = (newVal: string) => {
    setTranscript(newVal);
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newVal);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setTranscript(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setTranscript(history[newIdx]);
    }
  };

  // Find & Replace
  const handleReplaceAll = () => {
    if (!searchTerm.trim()) return;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const replaced = transcript.replace(regex, replaceTerm);
    handleTranscriptChange(replaced);
    setSearchTerm('');
    setReplaceTerm('');
  };

  // Global Speaker Rename
  const handleGlobalSpeakerRename = () => {
    if (!oldSpeakerName.trim() || !newSpeakerName.trim()) return;
    const regex = new RegExp(`(^|\\n)(\\[?\\d{1,2}:\\d{2}\\]?\\s*)(${oldSpeakerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(:)`, 'gi');
    const updated = transcript.replace(regex, `$1$2${newSpeakerName}$4`);
    handleTranscriptChange(updated);
    setShowSpeakerRename(false);
    setNewSpeakerName('');
  };

  // Match count
  const matchCount = searchTerm.trim()
    ? (transcript.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  // Handle playing click on line
  const handleSimulatePlay = (timestamp: string) => {
    setPlayingTimestamp(timestamp);
    setTimeout(() => {
      setPlayingTimestamp(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Grounded & Verified
              </span>
              <span className="text-xs text-slate-400">• Duration: {duration}</span>
              <span className="text-xs text-slate-400">• ~{wordCount} words</span>
              {validationReport && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                  {validationReport.wordsPerMinute} WPM • {validationReport.detectedLanguage}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white truncate max-w-xl">
              Review & Correct Transcript: {recordingTitle}
            </h2>
          </div>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Toolbar: Tip, Find & Replace, Speaker Rename, Undo/Redo */}
        <div className="px-6 py-2.5 bg-indigo-950/30 border-b border-indigo-900/30 flex flex-wrap items-center justify-between text-xs text-indigo-300 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                <strong>Align Timecodes:</strong> Correct misheard company names or speakers before multiplying content.
              </span>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center gap-1 border-l border-indigo-900/40 pl-3">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1 rounded hover:bg-indigo-900/50 text-indigo-300 disabled:opacity-30"
                title="Undo edit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1 rounded hover:bg-indigo-900/50 text-indigo-300 disabled:opacity-30"
                title="Redo edit"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSpeakerRename(!showSpeakerRename)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-[11px] text-indigo-200 border border-indigo-800/40"
            >
              <Users className="w-3 h-3" />
              <span>Rename Speaker Globally</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReplaceBar(!showReplaceBar)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 text-[11px] text-indigo-200 border border-indigo-800/40"
            >
              <Replace className="w-3 h-3" />
              <span>Find & Replace</span>
            </button>
          </div>
        </div>

        {/* Global Speaker Rename Banner */}
        {showSpeakerRename && (
          <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-3 text-xs shrink-0">
            <span className="text-slate-400 font-semibold">Rename:</span>
            <input
              type="text"
              value={oldSpeakerName}
              onChange={(e) => setOldSpeakerName(e.target.value)}
              placeholder="Old label (e.g. Speaker 1)"
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-32 outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400">to</span>
            <input
              type="text"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              placeholder="Real Name (e.g. Liam Carter)"
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-40 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleGlobalSpeakerRename}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Apply All
            </button>
            <button
              type="button"
              onClick={() => setShowSpeakerRename(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Find & Replace Banner */}
        {showReplaceBar && (
          <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-3 text-xs shrink-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find text..."
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-36 outline-none focus:border-indigo-500"
            />
            {matchCount > 0 && <span className="text-[10px] text-indigo-400 font-mono">{matchCount} matches</span>}
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white w-36 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleReplaceAll}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Replace All
            </button>
            <button
              type="button"
              onClick={() => setShowReplaceBar(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>
        )}

        {/* Audio click-to-play status indicator */}
        {playingTimestamp && (
          <div className="px-6 py-1.5 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-400 animate-fadeIn">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            <span>Simulating media playback from exact timestamp <strong>{playingTimestamp}</strong></span>
          </div>
        )}

        {/* Editable Transcript Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <label className="font-semibold">Time-Coded Transcript Text (Editable & Grounded)</label>
            <span className="text-[11px] text-slate-500">
              Timestamps [MM:SS] will be preserved in blog show notes and vertical video clips
            </span>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => handleTranscriptChange(e.target.value)}
            rows={14}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`w-full h-full min-h-[320px] p-4 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm text-slate-200 leading-relaxed outline-none resize-none ${
              isRtl ? 'text-right font-sans' : 'text-left font-mono'
            }`}
            placeholder="[00:00] Host: ..."
          />
        </div>

        {/* Footer with Generation Options */}
        <div className="px-6 py-4 bg-slate-950/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Target Blog Length Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">Target Blog Length:</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setBlogLength('short')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  blogLength === 'short'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Short (~500 words)
              </button>
              <button
                type="button"
                onClick={() => setBlogLength('long')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  blogLength === 'long'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Comprehensive (~1200 words)
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Save Draft Only
            </button>
            <button
              onClick={() => onStartGeneration(transcript, { blogLength })}
              disabled={isGenerating || !transcript.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>{isGenerating ? (generationStep || 'Generating Content & Clips...') : 'Generate Full Content Suite'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
