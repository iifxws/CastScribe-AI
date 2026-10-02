import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  VideoClip,
  BrandKit,
  UserProfile,
  Recording,
  CaptionStyle,
  CaptionPosition,
} from '../types';
import {
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Sparkles,
  Scissors,
  Share2,
  Lock,
  Palette,
  Maximize2,
  Volume2,
  VolumeX,
  PlusCircle,
  Archive,
  Flame,
  Video,
  AudioWaveform,
  Upload,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { renderVideoClip, exportAllAsZip, downloadFile } from '../services/api';

interface VideoClipsViewerProps {
  recording: Recording;
  userProfile: UserProfile;
  onUpdateClips: (updatedClips: VideoClip[], brandKit: BrandKit) => void;
  onOpenPricing: () => void;
  onFindMoreMoments: () => void;
  isDiscoveringMore?: boolean;
}

export const VideoClipsViewer: React.FC<VideoClipsViewerProps> = ({
  recording,
  userProfile,
  onUpdateClips,
  onOpenPricing,
  onFindMoreMoments,
  isDiscoveringMore,
}) => {
  const clipsSuite = recording.videoClips;
  const isPro = userProfile.plan === 'pro' || userProfile.plan === 'creator';

  const [clips, setClips] = useState<VideoClip[]>(clipsSuite?.clips || []);
  const [brandKit, setBrandKit] = useState<BrandKit>(
    clipsSuite?.brandKit || {
      fontFamily: 'Inter',
      captionStyle: 'bold_highlight',
      captionPosition: 'bottom',
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      outlineColor: '#000000',
      fontSize: 32,
      showWatermark: !isPro,
      watermarkText: 'CastScribe AI',
      showHookOverlay: true,
    }
  );

  const [selectedClipId, setSelectedClipId] = useState<string>(
    clips[0]?.id || ''
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // References for reliable state access in event handlers
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  // Custom attached video state (user can attach or change video at any time)
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<'video' | 'audiogram'>(
    recording.isAudioOnly ? 'audiogram' : 'video'
  );

  // Trim editor state
  const [isTrimming, setIsTrimming] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(45);

  // Crop / Pan Horizontal adjustment (-50% to +50%)
  const [cropOffset, setCropOffset] = useState<number>(0);

  // Rendering state
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderMessage, setRenderMessage] = useState<string>('');
  const [renderErrorMessage, setRenderErrorMessage] = useState<string | null>(null);
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);

  // Audio wave animation ref & elements
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const customFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  // Detect Arabic / Hebrew / RTL text
  const isClipRtl = useMemo(() => {
    const textToCheck = `${activeClip?.title || ''} ${activeClip?.hookText || ''} ${activeClip?.suggestedCaption || ''} ${activeClip?.transcriptSnippet || ''} ${recording.title || ''} ${recording.transcript || ''}`;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(textToCheck);
  }, [activeClip, recording.title, recording.transcript]);

  // Resolve video source with resilient fallback chain
  const videoSource = useMemo(() => {
    // 1. Direct rendered video for this clip
    if (activeClip?.renderUrl && activeClip.status !== 'failed') return activeClip.renderUrl;
    // 2. Custom attached video uploaded by the user in this session
    if (customVideoUrl) return customVideoUrl;
    // 3. Recording mediaUrl if video format
    if (recording.mediaUrl && !recording.isAudioOnly) return recording.mediaUrl;
    if (recording.mediaUrl && recording.mediaUrl.match(/\.(mp4|mov|webm)$/i)) return recording.mediaUrl;
    // 4. Default high-definition vertical video sample for instant preview ONLY IF seed recording
    if (recording.id === 'rec-seed-1') return '/public_clips/clip_seed_1_rendered.mp4';
    return null;
  }, [activeClip?.renderUrl, activeClip?.status, customVideoUrl, recording.mediaUrl, recording.isAudioOnly, recording.id]);

  const audioSource = useMemo(() => {
    // 1. If audio-only or if previewing raw recording audio
    if (recording.mediaUrl) return recording.mediaUrl;
    return null;
  }, [recording.mediaUrl]);

  // Check if active clip has a confirmed, non-empty audio source
  const hasAudioTrack = useMemo(() => {
    if (activeClip?.status === 'failed') return false;
    if (activeClip?.renderUrl) return true;
    if (customVideoUrl) return true;
    if (recording.mediaUrl) return true;
    if (recording.id === 'rec-seed-1') return true;
    return false;
  }, [activeClip?.status, activeClip?.renderUrl, customVideoUrl, recording.mediaUrl, recording.id]);

  // Auto-switch mode based on available sources
  useEffect(() => {
    if (!videoSource && audioSource) {
      setPlaybackMode('audiogram');
    } else if (videoSource && (activeClip?.renderUrl || customVideoUrl)) {
      setPlaybackMode('video');
    }
  }, [videoSource, audioSource, activeClip?.renderUrl, customVideoUrl]);

  // When active clip changes, reset trimmer and seek player
  useEffect(() => {
    if (activeClip) {
      setTrimStart(activeClip.startSeconds || 0);
      setTrimEnd(activeClip.endSeconds || (activeClip.startSeconds || 0) + (activeClip.durationSeconds || 30));
      setCropOffset(activeClip.cropOffset || 0);
      setCurrentTime(0);
      setIsPlaying(false);

      const seekTarget = activeClip.renderUrl ? 0 : (activeClip.startSeconds || 0);
      if (videoRef.current) {
        videoRef.current.currentTime = seekTarget;
        videoRef.current.muted = isMutedRef.current;
        videoRef.current.volume = volumeRef.current;
      }
      if (audioRef.current) {
        audioRef.current.currentTime = activeClip.startSeconds || 0;
        audioRef.current.muted = isMutedRef.current;
        audioRef.current.volume = volumeRef.current;
      }
    }
  }, [selectedClipId, activeClip?.renderUrl]);

  // Sync mute state and volume to media elements directly
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  const handleToggleMute = () => {
    const nextMuted = !isMutedRef.current;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;
    if (videoRef.current) videoRef.current.muted = nextMuted;
    if (audioRef.current) audioRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    volumeRef.current = clamped;
    if (clamped > 0 && isMutedRef.current) {
      setIsMuted(false);
      isMutedRef.current = false;
    }
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
  };

  // Handle Play/Pause Toggle with guaranteed audio playback
  const togglePlay = async () => {
    if (!hasAudioTrack) {
      if (activeClip) handleRenderClip(activeClip);
      return;
    }

    const nextPlay = !isPlayingRef.current;
    setIsPlaying(nextPlay);

    const activeEl = (playbackMode === 'video' && videoRef.current) ? videoRef.current : audioRef.current;

    if (activeEl) {
      if (nextPlay) {
        try {
          activeEl.muted = isMutedRef.current;
          activeEl.volume = volumeRef.current;
          await activeEl.play();
        } catch (err) {
          console.warn('Playback note:', err);
          activeEl.play().catch(() => {});
        }
      } else {
        activeEl.pause();
      }
    }
  };

  const handlePlayClip = (clip: VideoClip) => {
    setSelectedClipId(clip.id);
    setTrimStart(clip.startSeconds || 0);
    setTrimEnd(clip.endSeconds || (clip.startSeconds || 0) + (clip.durationSeconds || 30));
    setCropOffset(clip.cropOffset || 0);
    setCurrentTime(0);

    const seekTarget = clip.renderUrl ? 0 : (clip.startSeconds || 0);

    setTimeout(() => {
      const activeEl = (playbackMode === 'video' && videoRef.current) ? videoRef.current : audioRef.current;
      if (activeEl) {
        try {
          activeEl.currentTime = seekTarget;
          activeEl.muted = isMutedRef.current;
          activeEl.volume = volumeRef.current;
          activeEl.play().catch(() => {});
        } catch (_) {}
      }
      setIsPlaying(true);
    }, 60);
  };

  // Global keyboard shortcuts: Enter / Space to Play/Pause, M to Mute, F for Fullscreen, Arrows for Seek
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.key === 'Enter' || e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(activeClip?.durationSeconds || 30, currentTime + 5));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeClip, currentTime]);

  // Video timeupdate handler
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !activeClip) return;
    const baseStart = activeClip.renderUrl ? 0 : (activeClip.startSeconds || 0);
    const clipDur = activeClip.durationSeconds || 30;
    const currentVideoTime = videoRef.current.currentTime;
    const elapsed = Math.max(0, currentVideoTime - baseStart);

    setCurrentTime(elapsed);

    // Loop within clip boundaries
    if (elapsed >= clipDur) {
      videoRef.current.currentTime = baseStart;
      videoRef.current.play().catch(() => {});
      setCurrentTime(0);
    }
  };

  // Audio timeupdate handler
  const handleAudioTimeUpdate = () => {
    if (!audioRef.current || !activeClip) return;
    const baseStart = activeClip.startSeconds || 0;
    const clipDur = activeClip.durationSeconds || 30;
    const elapsed = Math.max(0, audioRef.current.currentTime - baseStart);

    setCurrentTime(elapsed);

    if (elapsed >= clipDur) {
      audioRef.current.currentTime = baseStart;
      audioRef.current.play().catch(() => {});
      setCurrentTime(0);
    }
  };

  // Seek bar handler
  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (!activeClip) return;

    if (playbackMode === 'video' && videoRef.current) {
      const baseStart = activeClip.renderUrl ? 0 : (activeClip.startSeconds || 0);
      videoRef.current.currentTime = baseStart + newTime;
    } else if (audioRef.current) {
      const baseStart = activeClip.startSeconds || 0;
      audioRef.current.currentTime = baseStart + newTime;
    }
  };

  // Fallback Playback Timer when no real media is loaded
  useEffect(() => {
    let interval: number | null = null;
    const hasMedia = (playbackMode === 'video' && videoRef.current) || (playbackMode === 'audiogram' && audioRef.current);
    if (isPlaying && !hasMedia && activeClip) {
      interval = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= (activeClip.durationSeconds || 30)) {
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackMode, activeClip]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // User attaches custom video directly in the viewer
  const handleAttachVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setCustomVideoName(file.name);
      setPlaybackMode('video');
      // Update clip in state
      if (activeClip) {
        const updated = clips.map((c) =>
          c.id === activeClip.id ? { ...c, renderUrl: url, isAudioOnly: false } : c
        );
        setClips(updated);
        onUpdateClips(updated, brandKit);
      }
    }
  };

  // Canvas Waveform Animation for Audiogram Mode
  useEffect(() => {
    if (playbackMode !== 'audiogram') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let wavePhase = 0;
    const renderWave = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw animated soundwave lines if playing
      if (isPlaying) {
        wavePhase += 0.08;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#818cf8';
        ctx.beginPath();
        for (let x = 40; x < w - 40; x += 12) {
          const waveHeight = Math.sin(x * 0.04 + wavePhase) * 28 + Math.cos(x * 0.08 - wavePhase) * 16;
          const yCenter = h * 0.45;
          ctx.moveTo(x, yCenter - Math.abs(waveHeight));
          ctx.lineTo(x, yCenter + Math.abs(waveHeight));
        }
        ctx.stroke();
      } else {
        // Static sound bars
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#4f46e5';
        ctx.beginPath();
        for (let x = 40; x < w - 40; x += 12) {
          const barH = 14 + Math.sin(x) * 10;
          const yCenter = h * 0.45;
          ctx.moveTo(x, yCenter - barH);
          ctx.lineTo(x, yCenter + barH);
        }
        ctx.stroke();
      }

      // Watermark if free tier
      if (!isPro || brandKit.showWatermark) {
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.fillText(brandKit.watermarkText || 'CastScribe AI Preview', w / 2, 80);
      }

      animFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isPro, brandKit, playbackMode]);

  // Sync brand kit updates
  const handleSaveBrandKit = (newKit: BrandKit) => {
    setBrandKit(newKit);
    onUpdateClips(clips, newKit);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  // Handle trim save
  const handleSaveTrim = () => {
    if (!activeClip) return;
    const dur = Math.max(5, trimEnd - trimStart);
    const updated = clips.map((c) => {
      if (c.id === activeClip.id) {
        return {
          ...c,
          startSeconds: trimStart,
          endSeconds: trimEnd,
          durationSeconds: dur,
          startTime: `[${Math.floor(trimStart / 60).toString().padStart(2, '0')}:${(trimStart % 60).toString().padStart(2, '0')}]`,
          endTime: `[${Math.floor(trimEnd / 60).toString().padStart(2, '0')}:${(trimEnd % 60).toString().padStart(2, '0')}]`,
        };
      }
      return c;
    });
    setClips(updated);
    onUpdateClips(updated, brandKit);
    setIsTrimming(false);
  };

  // Handle Crop Offset adjustment
  const handleCropChange = (offset: number) => {
    setCropOffset(offset);
    if (!activeClip) return;
    const updated = clips.map((c) => (c.id === activeClip.id ? { ...c, cropOffset: offset } : c));
    setClips(updated);
    onUpdateClips(updated, brandKit);
  };

  // Render & Export MP4
  const handleRenderClip = async (clip: VideoClip) => {
    if (!isPro && clips.indexOf(clip) >= 2) {
      onOpenPricing();
      return;
    }

    setIsRendering(true);
    setRenderErrorMessage(null);
    setRenderMessage('Synthesizing 9:16 vertical clip with burned-in animated captions...');
    try {
      const res = await renderVideoClip({
        clip,
        sourceMediaUrl: recording.mediaUrl,
        sourceRecordingId: recording.id,
        sourceFileId: (clip as any)?.sourceFileId || (recording as any)?.sourceFileId,
        recordingTitle: recording.title,
        mediaUrl: recording.mediaUrl,
        sourceVideoUrl: !recording.isAudioOnly ? recording.mediaUrl : (customVideoUrl || undefined),
        isAudioOnly: recording.isAudioOnly ?? playbackMode === 'audiogram',
        brandKit,
        userPlan: userProfile.plan,
      });

      if (res.status === 'failed' || res.error) {
        const errorMsg = res.error || 'Audio/video mismatch detected — please regenerate';
        const updated = clips.map((c) =>
          c.id === clip.id ? { ...c, status: 'failed' as const, errorMessage: errorMsg, renderUrl: undefined } : c
        );
        setClips(updated);
        onUpdateClips(updated, brandKit);
        setRenderErrorMessage(errorMsg);
        return;
      }

      if (res.renderUrl) {
        // Update clip with rendered video
        const updated = clips.map((c) =>
          c.id === clip.id ? { ...c, renderUrl: res.renderUrl, status: 'ready' as const, errorMessage: undefined } : c
        );
        setClips(updated);
        onUpdateClips(updated, brandKit);
        setRenderErrorMessage(null);

        // Trigger direct download
        const link = document.createElement('a');
        link.href = res.renderUrl;
        link.download = `${clip.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/gi, '_')}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (res.srtContent) {
        downloadFile(`${clip.title.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/gi, '_')}.srt`, res.srtContent, 'text/plain');
      }
    } catch (e: any) {
      console.error('Rendering failed:', e);
      const errorMsg = e.message || 'Audio/video mismatch detected — please regenerate';
      const updated = clips.map((c) =>
        c.id === clip.id ? { ...c, status: 'failed' as const, errorMessage: errorMsg, renderUrl: undefined } : c
      );
      setClips(updated);
      onUpdateClips(updated, brandKit);
      setRenderErrorMessage(errorMsg);
    } finally {
      setIsRendering(false);
      setRenderMessage('');
    }
  };

  // Download All as Zip
  const handleDownloadAllZip = async () => {
    if (!isPro) {
      onOpenPricing();
      return;
    }
    try {
      setIsRendering(true);
      setRenderMessage('Zipping full content suite + clips & SRT files...');
      const zipBlob = await exportAllAsZip(recording);
      downloadFile(`${recording.title.replace(/[^a-z0-9]/gi, '_')}_content_pack.zip`, zipBlob, 'application/zip');
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsRendering(false);
      setRenderMessage('');
    }
  };

  // Extract words for karaoke caption preview
  const words = (activeClip?.transcriptSnippet || activeClip?.title || '').split(/\s+/).filter(Boolean);
  const activeWordIdx = Math.min(
    words.length - 1,
    Math.floor((currentTime / Math.max(1, activeClip?.durationSeconds || 30)) * words.length)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: AI Short-Form Video Engine */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Short-Form Video Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">
              • {clips.length} Vertical Cuts (9:16)
            </span>
            {customVideoName && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Attached: {customVideoName}
              </span>
            )}
          </div>
          <h2 className="text-lg font-extrabold text-white">
            Ready-to-Post Vertical Clips
          </h2>
          <p className="text-xs text-slate-400">
            Ranked by predicted engagement score. Plays real video and speech with opening hooks and synchronized captions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Custom Video Attachment Trigger */}
          <input
            ref={customFileInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.webm"
            className="hidden"
            onChange={handleAttachVideo}
          />
          <button
            onClick={() => customFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            title="Attach your own video footage to these clips"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>{customVideoName ? 'Change Video' : 'Attach Video'}</span>
          </button>

          <button
            onClick={onFindMoreMoments}
            disabled={isDiscoveringMore}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isDiscoveringMore ? 'Discovering...' : 'Find More Moments'}</span>
          </button>

          <button
            onClick={handleDownloadAllZip}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Download All Clips (ZIP)</span>
          </button>
        </div>
      </div>

      {/* Main Studio View: Preview Player on Left, Clip Grid & Brand Kit on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive 9:16 Vertical Video Player (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
            {/* Header: Clip Title & Mode Switcher */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200 truncate max-w-[200px]" title={activeClip?.title}>
                {activeClip?.title}
              </span>

              {/* View Switcher: Video vs Audiogram */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPlaybackMode('video')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    playbackMode === 'video'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlaybackMode('audiogram')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                    playbackMode === 'audiogram'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AudioWaveform className="w-3 h-3" />
                  <span>Waveform</span>
                </button>
              </div>
            </div>

            {/* 9:16 Aspect Ratio Phone Mockup Container */}
            <div
              ref={videoContainerRef}
              className="relative w-full aspect-[9/16] max-h-[520px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between p-4 sm:p-5 select-none group"
            >
              {/* REAL VIDEO ELEMENT */}
              {playbackMode === 'video' && videoSource ? (
                <video
                  ref={videoRef}
                  src={videoSource}
                  playsInline
                  preload="auto"
                  muted={isMuted}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onVolumeChange={(e) => {
                    const el = e.currentTarget;
                    setIsMuted(el.muted);
                    setVolume(el.volume);
                  }}
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget;
                    el.muted = isMutedRef.current;
                    el.volume = volumeRef.current;
                    if (activeClip) {
                      const seekTarget = activeClip.renderUrl ? 0 : (activeClip.startSeconds || 0);
                      el.currentTime = seekTarget;
                    }
                  }}
                  onCanPlay={(e) => {
                    const el = e.currentTarget;
                    el.muted = isMutedRef.current;
                    el.volume = volumeRef.current;
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-150"
                  style={{
                    transform: `translateX(${cropOffset}%) scale(1.08)`,
                  }}
                />
              ) : (
                /* Dynamic Waveform Visualizer Canvas */
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={640}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Real Audio Element for Audiogram / Audio-only sources */}
              {audioSource && (
                <audio
                  ref={audioRef}
                  src={audioSource}
                  preload="auto"
                  muted={isMuted}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onVolumeChange={(e) => {
                    const el = e.currentTarget;
                    setIsMuted(el.muted);
                    setVolume(el.volume);
                  }}
                  onLoadedMetadata={(e) => {
                    const el = e.currentTarget;
                    el.muted = isMutedRef.current;
                    el.volume = volumeRef.current;
                    if (activeClip) {
                      el.currentTime = activeClip.startSeconds || 0;
                    }
                  }}
                  onCanPlay={(e) => {
                    const el = e.currentTarget;
                    el.muted = isMutedRef.current;
                    el.volume = volumeRef.current;
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  className="hidden"
                />
              )}

              {/* Subtle Vignette Overlay for Crisp Captions */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 pointer-events-none z-10" />

              {/* Sound Status & Unmute Trigger (Top-Right of video container) */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                {!hasAudioTrack ? (
                  <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border shadow-lg bg-amber-950/85 text-amber-300 border-amber-500/40"
                    title={activeClip?.errorMessage || 'Audio track is unavailable for this clip — please regenerate'}
                  >
                    <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    <span>No Audio Track</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMute();
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      isMuted
                        ? 'bg-rose-950/85 text-rose-300 border-rose-500/50 hover:bg-rose-900/90'
                        : 'bg-black/65 text-emerald-300 border-emerald-500/30 hover:bg-black/85'
                    }`}
                    title={isMuted ? 'Audio is currently muted. Click or press M to unmute' : 'Audio is playing. Click or press M to mute'}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        <span>Sound Muted (Tap to Unmute)</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sound ON ({Math.round(volume * 100)}%)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Watermark Overlay */}
              {(!isPro || brandKit.showWatermark) && (
                <div className="relative z-20 text-center">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white/70 border border-white/10 uppercase tracking-widest">
                    {brandKit.watermarkText || 'CastScribe AI Preview'}
                  </span>
                </div>
              )}

              {/* Opening Hook Overlay (First 3.5 seconds) */}
              {brandKit.showHookOverlay && currentTime < 3.5 && activeClip?.hookText && (
                <div
                  dir={isClipRtl ? 'rtl' : 'ltr'}
                  className={`relative z-20 mt-2 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-indigo-500/40 animate-fadeIn shadow-xl ${
                    isClipRtl ? 'text-right' : 'text-center'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-0.5">
                    ⚡ {isClipRtl ? 'المقدمة الجاذبة' : 'Opening Hook'}
                  </span>
                  <p dir="auto" className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    "{activeClip.hookText}"
                  </p>
                </div>
              )}

              {/* Center Play/Pause or Audio Unavailable Alert */}
              {!hasAudioTrack ? (
                <div className="relative z-20 my-auto mx-auto p-4 max-w-[280px] rounded-2xl bg-black/90 border border-amber-500/40 text-center shadow-2xl backdrop-blur-md space-y-2.5">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Audio Unavailable</h4>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {activeClip?.errorMessage || 'Source audio is missing or could not be verified for this clip.'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenderClip(activeClip);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Regenerate Clip</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={togglePlay}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePlay();
                    }
                  }}
                  aria-label={isPlaying ? 'Pause video (Enter or Space)' : 'Play video (Enter or Space)'}
                  className="relative z-20 my-auto mx-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer shadow-2xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95 group-hover:opacity-100 focus:outline-none focus:ring-4 focus:ring-indigo-400"
                  title="Press Enter or Space to toggle playback"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </button>
              )}

              {/* Animated Speech-Synced Captions Overlay */}
              <div
                dir={isClipRtl ? 'rtl' : 'ltr'}
                className={`relative z-20 px-2 py-3 rounded-xl transition-all ${
                  isClipRtl ? 'text-right' : 'text-center'
                } ${
                  brandKit.captionPosition === 'top'
                    ? 'mb-auto mt-2'
                    : brandKit.captionPosition === 'center'
                    ? 'my-auto'
                    : 'mt-auto'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-black/75 backdrop-blur-md inline-block max-w-[95%] shadow-lg border border-white/10">
                  <p
                    dir={isClipRtl ? 'rtl' : 'ltr'}
                    className={`font-extrabold tracking-tight leading-relaxed select-none ${
                      isClipRtl ? 'text-right font-sans' : 'text-center'
                    }`}
                    style={{
                      fontFamily: isClipRtl ? 'system-ui, -apple-system, sans-serif' : brandKit.fontFamily,
                      fontSize: `${Math.round(brandKit.fontSize * 0.45)}px`,
                      color: brandKit.textColor,
                      textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                      direction: isClipRtl ? 'rtl' : 'ltr',
                      unicodeBidi: 'embed',
                    }}
                  >
                    {words.slice(Math.max(0, activeWordIdx - 3), activeWordIdx + 4).map((w, idx) => {
                      const absoluteIdx = Math.max(0, activeWordIdx - 3) + idx;
                      const isCurrent = absoluteIdx === activeWordIdx;
                      return (
                        <span
                          key={idx}
                          dir="auto"
                          className="inline-block mx-1 transition-all"
                          style={{
                            color: isCurrent ? brandKit.highlightColor : brandKit.textColor,
                            transform: isCurrent ? 'scale(1.18)' : 'scale(1)',
                            fontWeight: isCurrent ? '900' : '700',
                            unicodeBidi: 'isolate',
                          }}
                        >
                          {w}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Playback Controls & Scrubber */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  tabIndex={0}
                  onClick={togglePlay}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePlay();
                    }
                  }}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  title="Play / Pause (Enter or Space)"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={handleToggleMute}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1.5 rounded-lg appearance-none bg-slate-800 accent-indigo-500 cursor-pointer"
                    title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                    aria-label="Adjust volume"
                  />
                </div>

                <input
                  type="range"
                  min={0}
                  max={activeClip?.durationSeconds || 30}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none bg-slate-800 accent-indigo-500 cursor-pointer"
                />

                <span className="text-xs font-mono text-slate-300 shrink-0">
                  {Math.floor(currentTime)}s / {activeClip?.durationSeconds || 30}s
                </span>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Horizontal Crop / Pan Slider */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-indigo-400" />
                  Horizontal Speaker Alignment:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono">Left</span>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    value={cropOffset}
                    onChange={(e) => handleCropChange(parseInt(e.target.value, 10))}
                    className="w-24 h-1 rounded-lg appearance-none bg-slate-800 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono">Right</span>
                </div>
              </div>
            </div>

            {/* Action Bar for this clip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsTrimming(!isTrimming);
                  if (isEditingCaption) setIsEditingCaption(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isTrimming ? 'Close' : 'Trim'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditingCaption(!isEditingCaption);
                  if (isTrimming) setIsTrimming(false);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditingCaption ? 'Close' : 'Captions'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleRenderClip(activeClip)}
                disabled={isRendering}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isRendering ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Render MP4</span>
                  </>
                )}
              </button>
            </div>

            {renderMessage && (
              <p className="text-[11px] text-indigo-300 animate-pulse text-center">
                {renderMessage}
              </p>
            )}

            {renderErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{renderErrorMessage}</p>
                  <p className="text-[11px] text-rose-400/80 mt-0.5">Please check that the source audio file is present or regenerate the clip.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRenderErrorMessage(null)}
                  className="text-rose-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Caption & Hook RTL Editor */}
          {isEditingCaption && activeClip && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  {isClipRtl ? 'تعديل النصوص والشرح (RTL)' : 'Caption & Hook Editor'}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {isClipRtl ? 'الاتجاه: من اليمين لليسار' : 'Text Direction: LTR'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {isClipRtl ? 'المقدمة الجاذبة (Hook Text):' : 'Opening Hook Text:'}
                  </label>
                  <input
                    type="text"
                    value={activeClip.hookText || ''}
                    dir={isClipRtl ? 'rtl' : 'ltr'}
                    onChange={(e) => {
                      const updated = clips.map((c) =>
                        c.id === activeClip.id ? { ...c, hookText: e.target.value } : c
                      );
                      setClips(updated);
                      onUpdateClips(updated, brandKit);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 ${
                      isClipRtl ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {isClipRtl ? 'عنوان المقطع (Clip Title):' : 'Clip Title:'}
                  </label>
                  <input
                    type="text"
                    value={activeClip.title || ''}
                    dir={isClipRtl ? 'rtl' : 'ltr'}
                    onChange={(e) => {
                      const updated = clips.map((c) =>
                        c.id === activeClip.id ? { ...c, title: e.target.value } : c
                      );
                      setClips(updated);
                      onUpdateClips(updated, brandKit);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 ${
                      isClipRtl ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {isClipRtl ? 'نص الترجمة / المنطوق (Captions):' : 'Transcript Captions Snippet:'}
                  </label>
                  <textarea
                    rows={2}
                    value={activeClip.transcriptSnippet || ''}
                    dir={isClipRtl ? 'rtl' : 'ltr'}
                    onChange={(e) => {
                      const updated = clips.map((c) =>
                        c.id === activeClip.id ? { ...c, transcriptSnippet: e.target.value } : c
                      );
                      setClips(updated);
                      onUpdateClips(updated, brandKit);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 resize-none ${
                      isClipRtl ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    {isClipRtl ? 'النص المقترح للنشر (Social Caption):' : 'Suggested Social Caption:'}
                  </label>
                  <textarea
                    rows={2}
                    value={activeClip.suggestedCaption || ''}
                    dir={isClipRtl ? 'rtl' : 'ltr'}
                    onChange={(e) => {
                      const updated = clips.map((c) =>
                        c.id === activeClip.id ? { ...c, suggestedCaption: e.target.value } : c
                      );
                      setClips(updated);
                      onUpdateClips(updated, brandKit);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-amber-400 resize-none ${
                      isClipRtl ? 'text-right' : 'text-left'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mini-Timeline Trim Editor */}
          {isTrimming && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-indigo-400" />
                  Trim Clip Boundaries
                </span>
                <span className="text-indigo-400 font-mono">
                  Duration: {Math.max(5, trimEnd - trimStart)}s
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Start: {trimStart}s</span>
                  <span>End: {trimEnd}s</span>
                </div>
                <div className="flex gap-3">
                  <input
                    type="range"
                    min={Math.max(0, (activeClip.startSeconds || 0) - 30)}
                    max={trimEnd - 5}
                    value={trimStart}
                    onChange={(e) => setTrimStart(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500"
                  />
                  <input
                    type="range"
                    min={trimStart + 5}
                    max={(activeClip.endSeconds || 45) + 30}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTrimming(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTrim}
                  className="px-3.5 py-1 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Apply Trim
                </button>
              </div>
            </div>
          )}

          {/* Brand Kit Quick Styling Panel */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                Brand Kit & Captions
              </span>
              <span className="text-[10px] text-slate-400">Synced to all clips</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Caption Style</label>
                <select
                  value={brandKit.captionStyle}
                  onChange={(e) =>
                    handleSaveBrandKit({ ...brandKit, captionStyle: e.target.value as CaptionStyle })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none"
                >
                  <option value="bold_highlight">Bold Highlight</option>
                  <option value="classic">Classic White</option>
                  <option value="minimal">Minimal Clean</option>
                  <option value="karaoke">Karaoke Glow</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Position</label>
                <select
                  value={brandKit.captionPosition}
                  onChange={(e) =>
                    handleSaveBrandKit({ ...brandKit, captionPosition: e.target.value as CaptionPosition })
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none"
                >
                  <option value="bottom">Bottom (Standard)</option>
                  <option value="center">Center Focus</option>
                  <option value="top">Top Header</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-slate-400">Highlight Color</span>
              <div className="flex items-center gap-2">
                {['#FACC15', '#38BDF8', '#4ADE80', '#F43F5E', '#A855F7'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSaveBrandKit({ ...brandKit, highlightColor: color })}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      brandKit.highlightColor === color
                        ? 'border-white scale-110 shadow-md shadow-white/20'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Grid of Discovered Clips (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300">
              Showing {clips.length} Candidate Segments
            </span>
            <span>Sorted by Predicted Virality</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {clips.map((clip, index) => {
              const isSelected = clip.id === selectedClipId;
              const isFreePreviewLocked = !isPro && index >= 2;

              return (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Score badge */}
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current" />
                          Score: {clip.engagementScore}/100
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {clip.startTime} - {clip.endTime} ({clip.durationSeconds}s)
                        </span>

                        {clip.status === 'failed' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Failed
                          </span>
                        )}

                        {clip.renderUrl && clip.status !== 'failed' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Video Ready
                          </span>
                        )}

                        {isFreePreviewLocked && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center gap-1 font-medium">
                            <Lock className="w-2.5 h-2.5" /> Pro Only
                          </span>
                        )}
                      </div>

                      <h3 dir={isClipRtl ? 'rtl' : 'ltr'} className={`text-sm font-bold text-white group-hover:text-indigo-300 ${isClipRtl ? 'text-right' : ''}`}>
                        {clip.title}
                      </h3>

                      <p dir={isClipRtl ? 'rtl' : 'ltr'} className={`text-xs text-slate-400 line-clamp-2 italic ${isClipRtl ? 'text-right' : ''}`}>
                        "{clip.transcriptSnippet}"
                      </p>

                      <div dir={isClipRtl ? 'rtl' : 'ltr'} className={`text-[11px] text-slate-500 ${isClipRtl ? 'text-right' : ''}`}>
                        <strong>{isClipRtl ? 'سبب التميز:' : 'Why it ranks:'}</strong> {clip.scoreReason}
                      </div>

                      {clip.errorMessage && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between gap-2 mt-2">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            {clip.errorMessage}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenderClip(clip);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white transition-colors shrink-0"
                          >
                            Regenerate
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Clip Actions */}
                    <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayClip(clip);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                        title="Preview Clip"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(
                            `${clip.suggestedCaption}\n\n${clip.hashtags.join(' ')}`,
                            `caption-${clip.id}`
                          );
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                        title="Copy Caption & Hook"
                      >
                        {copiedKey === `caption-${clip.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenderClip(clip);
                        }}
                        className="p-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
                        title="Download MP4 / Subtitles"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Ready-to-post Caption accordion preview */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span dir={isClipRtl ? 'rtl' : 'ltr'} className={`text-[11px] text-slate-400 truncate max-w-sm ${isClipRtl ? 'text-right' : ''}`}>
                      <strong>{isClipRtl ? 'النص المقترح:' : 'Caption:'}</strong> {clip.suggestedCaption}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(
                          `${clip.suggestedCaption}\n\n${clip.hashtags.join(' ')}`,
                          `caption-${clip.id}`
                        );
                      }}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 shrink-0 ml-2"
                    >
                      {copiedKey === `caption-${clip.id}` ? 'Copied!' : 'Copy Caption'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
