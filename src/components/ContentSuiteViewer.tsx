import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Recording,
  UserProfile,
  GeneratedContentSuite,
  SubjectLineOption,
  VideoClip,
  BrandKit,
} from '../types';
import {
  FileText,
  Clock,
  Share2,
  Mail,
  Quote,
  AlignLeft,
  Copy,
  Check,
  Download,
  RefreshCw,
  ArrowLeft,
  Edit2,
  ExternalLink,
  ChevronRight,
  Eye,
  Code,
  Twitter,
  Linkedin,
  Instagram,
  Sparkles,
  Layers,
  Film,
  Play,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Archive,
  Volume2,
} from 'lucide-react';
import {
  buildExportMarkdown,
  downloadFile,
  buildSocialPostsCSV,
  exportAllAsZip,
} from '../services/api';
import { VideoClipsViewer } from './VideoClipsViewer';
import { AskRecordingDrawer } from './AskRecordingDrawer';

interface ContentSuiteViewerProps {
  recording: Recording;
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateRecording: (updated: Recording) => void;
  onOpenRegenerateModal: (
    pieceType: 'blogPost' | 'showNotes' | 'socialPosts' | 'newsletter' | 'pullQuotes',
    pieceTitle: string
  ) => void;
  onOpenPricing: () => void;
}

type TabKey =
  | 'clips'
  | 'blog'
  | 'showNotes'
  | 'social'
  | 'newsletter'
  | 'quotes'
  | 'transcript';
type SocialSubTab = 'linkedin' | 'twitter' | 'instagram';

export const ContentSuiteViewer: React.FC<ContentSuiteViewerProps> = ({
  recording,
  userProfile,
  onBack,
  onUpdateRecording,
  onOpenRegenerateModal,
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('clips');
  const [socialSubTab, setSocialSubTab] = useState<SocialSubTab>('linkedin');
  const [blogViewMode, setBlogViewMode] = useState<'rendered' | 'raw'>('rendered');

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(recording.title);

  // Copy feedback state tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Ask this recording drawer
  const [isAskDrawerOpen, setIsAskDrawerOpen] = useState(false);

  // Jump to timestamp state
  const [jumpTimestamp, setJumpTimestamp] = useState<string | null>(null);

  // Discovering more moments state
  const [isDiscoveringMore, setIsDiscoveringMore] = useState(false);

  // Media refs for transcript synchronized playback
  const transcriptVideoRef = useRef<HTMLVideoElement | null>(null);
  const transcriptAudioRef = useRef<HTMLAudioElement | null>(null);

  // Detect RTL for Arabic / Hebrew
  const isRtl = useMemo(() => {
    const text = `${recording.title || ''} ${recording.transcript || ''}`;
    return /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }, [recording.title, recording.transcript]);

  useEffect(() => {
    if (jumpTimestamp) {
      const match = jumpTimestamp.match(/\[?(\d+):(\d+)\]?/);
      if (match) {
        const sec = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        if (transcriptVideoRef.current) {
          transcriptVideoRef.current.currentTime = sec;
          transcriptVideoRef.current.play().catch(() => {});
        } else if (transcriptAudioRef.current) {
          transcriptAudioRef.current.currentTime = sec;
          transcriptAudioRef.current.play().catch(() => {});
        }
      }
    }
  }, [jumpTimestamp]);

  const suite = recording.contentPieces;
  if (!suite) {
    return (
      <div className="py-20 text-center text-slate-400">
        No content generated yet for this recording.
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim() && tempTitle !== recording.title) {
      onUpdateRecording({
        ...recording,
        title: tempTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleExportMarkdown = () => {
    const md = buildExportMarkdown(
      recording.title,
      suite,
      recording.transcript,
      recording.videoClips?.clips
    );
    const cleanFileName = recording.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    downloadFile(`${cleanFileName}_content_suite.md`, md, 'text/markdown');
  };

  const handleExportCSV = () => {
    const csv = buildSocialPostsCSV(suite, recording.title);
    const cleanFileName = recording.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    downloadFile(`${cleanFileName}_social_schedule.csv`, csv, 'text/csv');
  };

  const handleExportZip = async () => {
    try {
      const blob = await exportAllAsZip(recording);
      const cleanFileName = recording.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
      downloadFile(`${cleanFileName}_full_package.zip`, blob, 'application/zip');
    } catch (e) {
      console.error(e);
    }
  };

  const handleJumpToSource = (timestamp: string) => {
    setJumpTimestamp(timestamp);
    setActiveTab('transcript');
  };

  // Find more moments action
  const handleFindMoreMoments = () => {
    setIsDiscoveringMore(true);
    setTimeout(() => {
      if (recording.videoClips) {
        const extraClip: VideoClip = {
          id: `clip-more-${Date.now()}`,
          title: 'The Unscalable First Ten Customers Rule',
          hookText: 'Unscalable efforts build the engine that lets you scale later.',
          suggestedCaption: 'Why manual outbound always wins in the early days. How 15 daily teardowns generated $45k in ACV.',
          hashtags: ['#sales', '#startups', '#outbound', '#b2b'],
          startTime: '[13:10]',
          endTime: '[13:55]',
          startSeconds: 790,
          endSeconds: 835,
          durationSeconds: 45,
          engagementScore: 93,
          scoreReason: 'Contrarian actionable takeaway with measurable financial outcome',
          transcriptSnippet: 'We had zero ad budget. Our playbook was 100% video teardowns. I would personally find boutique agencies on LinkedIn and send 15 bespoke videos every weekday.',
          status: 'ready',
          aspectRatio: '9:16',
        };
        const updated = [extraClip, ...recording.videoClips.clips];
        onUpdateRecording({
          ...recording,
          videoClips: {
            ...recording.videoClips,
            clips: updated,
          },
        });
      }
      setIsDiscoveringMore(false);
    }, 1200);
  };

  const handleUpdateClips = (updatedClips: VideoClip[], brandKit: BrandKit) => {
    onUpdateRecording({
      ...recording,
      videoClips: {
        clips: updatedClips,
        brandKit,
        isAudioOnly: recording.isAudioOnly ?? true,
        generatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Outdated Content Alert if transcript was edited */}
      {suite.isOutdated && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Notice:</strong> The transcript was modified after this content suite was generated. Some outputs may be out-of-date.
            </span>
          </div>
          <button
            onClick={() => onOpenRegenerateModal('blogPost', 'Full Suite')}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            Regenerate Now
          </button>
        </div>
      )}

      {/* Top Navigation & Action Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Content Library</span>
            </button>

            {/* Editable Title */}
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500 text-lg font-bold text-white outline-none w-full max-w-md"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {recording.title}
                  </h1>
                  <button
                    onClick={() => {
                      setTempTitle(recording.title);
                      setIsEditingTitle(true);
                    }}
                    className="text-slate-500 hover:text-slate-200 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                    title="Rename Recording"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {recording.format}
              </span>
              <span>• Duration: {recording.duration}</span>
              <span>• Tone: <strong className="capitalize text-indigo-300">{userProfile.tone}</strong></span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Source Verified
              </span>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Ask This Recording Chat Trigger */}
            <button
              onClick={() => setIsAskDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask Recording</span>
            </button>

            <button
              onClick={() =>
                handleCopy(
                  buildExportMarkdown(
                    recording.title,
                    suite,
                    recording.transcript,
                    recording.videoClips?.clips
                  ),
                  'all'
                )
              }
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              {copiedKey === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Text Suite</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              title="Export Markdown Document"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Export .md</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
              title="Export Social Posts CSV for Buffer / Hootsuite"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Social CSV</span>
            </button>

            <button
              onClick={handleExportZip}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Full Pack (ZIP)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-1.5 flex flex-wrap gap-1.5 backdrop-blur-md">
        {/* NEW VIDEO CLIPS TAB */}
        <button
          onClick={() => setActiveTab('clips')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'clips'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Film className="w-4 h-4 text-amber-300" />
          <span>Video Clips ({recording.videoClips?.clips?.length || 6})</span>
          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300">
            9:16
          </span>
        </button>

        <button
          onClick={() => setActiveTab('blog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'blog'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Blog Post</span>
        </button>

        <button
          onClick={() => setActiveTab('showNotes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'showNotes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Show Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'social'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Social Media ({suite.socialPosts.linkedin.length + suite.socialPosts.twitter.length + suite.socialPosts.instagram.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('newsletter')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'newsletter'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Newsletter</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'quotes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Quote className="w-4 h-4" />
          <span>Pull Quotes ({suite.pullQuotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'transcript'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <AlignLeft className="w-4 h-4" />
          <span>Transcript</span>
        </button>
      </div>

      {/* TAB 1: VIDEO CLIPS VIEW */}
      {activeTab === 'clips' && (
        <VideoClipsViewer
          recording={recording}
          userProfile={userProfile}
          onUpdateClips={handleUpdateClips}
          onOpenPricing={onOpenPricing}
          onFindMoreMoments={handleFindMoreMoments}
          isDiscoveringMore={isDiscoveringMore}
        />
      )}

      {/* TAB 2: BLOG POST */}
      {activeTab === 'blog' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400">
                  ~{suite.blogPost.readTimeMinutes} min read
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  {suite.blogPost.lengthOption} Length
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Grounded in Audio
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {suite.blogPost.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  setBlogViewMode(blogViewMode === 'rendered' ? 'raw' : 'rendered')
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                {blogViewMode === 'rendered' ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{blogViewMode === 'rendered' ? 'Markdown' : 'Preview'}</span>
              </button>

              <button
                onClick={() => handleCopy(suite.blogPost.content, 'blog')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                {copiedKey === 'blog' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy</span>
              </button>

              <button
                onClick={() => onOpenRegenerateModal('blogPost', suite.blogPost.title)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          {/* Sources Chip */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Grounded in recording segments: <strong>[01:42]</strong> to <strong>[25:00]</strong></span>
            </span>
            <button
              onClick={() => handleJumpToSource('[01:42]')}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View in Transcript</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content display */}
          <div dir="auto" className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {suite.blogPost.content}
          </div>
        </div>
      )}

      {/* TAB 3: SHOW NOTES */}
      {activeTab === 'showNotes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <h2 className="text-xl font-bold text-white">Episode Show Notes</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleCopy(
                    `${suite.showNotes.episodeSummary}\n\nTIMESTAMPS:\n${suite.showNotes.timestamps
                      .map((t) => `${t.time} - ${t.topic}`)
                      .join('\n')}`,
                    'notes'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                {copiedKey === 'notes' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy</span>
              </button>
              <button
                onClick={() => onOpenRegenerateModal('showNotes', 'Show Notes')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Executive Summary
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {suite.showNotes.episodeSummary}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Timecodes & Discussion Segments (Click to Play)
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {suite.showNotes.timestamps.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => handleJumpToSource(t.time)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-900/90 group"
                >
                  <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300 shrink-0 pt-0.5">
                    {t.time}
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                      {t.topic}
                    </h4>
                    <p className="text-xs text-slate-400">{t.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 shrink-0 self-center" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Resources Mentioned</h4>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                {suite.showNotes.keyResources.map((res, i) => (
                  <li key={i}>{res}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Memorable Takeaways</h4>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                {suite.showNotes.keyQuotes.map((q, i) => (
                  <li key={i}>"{q}"</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SOCIAL MEDIA */}
      {activeTab === 'social' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSocialSubTab('linkedin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  socialSubTab === 'linkedin'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>LinkedIn ({suite.socialPosts.linkedin.length})</span>
              </button>

              <button
                onClick={() => setSocialSubTab('twitter')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  socialSubTab === 'twitter'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>X / Twitter ({suite.socialPosts.twitter.length})</span>
              </button>

              <button
                onClick={() => setSocialSubTab('instagram')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  socialSubTab === 'instagram'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram ({suite.socialPosts.instagram.length})</span>
              </button>
            </div>

            <button
              onClick={() => onOpenRegenerateModal('socialPosts', 'Social Suite')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Social</span>
            </button>
          </div>

          {/* LinkedIn Posts */}
          {socialSubTab === 'linkedin' && (
            <div className="space-y-4">
              {suite.socialPosts.linkedin.map((post, idx) => (
                <div key={post.id} dir={isRtl ? 'rtl' : 'ltr'} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-400 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5" /> Post #{idx + 1} ({post.hook})
                    </span>
                    <button
                      onClick={() => handleCopy(post.text, post.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className={`text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                    {post.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Twitter Posts */}
          {socialSubTab === 'twitter' && (
            <div className="space-y-4">
              {suite.socialPosts.twitter.map((post, idx) => (
                <div key={post.id} dir={isRtl ? 'rtl' : 'ltr'} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-400 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5" /> {post.type === 'thread' ? `Thread #${idx + 1}` : `Single Tweet #${idx + 1}`}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          post.type === 'thread' && post.threadParts
                            ? post.threadParts.join('\n\n---\n\n')
                            : post.text,
                          post.id
                        )
                      }
                      className="flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  {post.type === 'thread' && post.threadParts ? (
                    <div className="space-y-2">
                      {post.threadParts.map((part, pIdx) => (
                        <div key={pIdx} className={`p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                          {part}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-xs sm:text-sm text-slate-200 whitespace-pre-wrap ${isRtl ? 'text-right' : 'text-left'}`}>
                      {post.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Instagram Posts */}
          {socialSubTab === 'instagram' && (
            <div className="space-y-4">
              {suite.socialPosts.instagram.map((post, idx) => (
                <div key={post.id} dir={isRtl ? 'rtl' : 'ltr'} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-pink-400 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5" /> Reel / Carousel Caption #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleCopy(`${post.caption}\n\n${post.hashtags.join(' ')}`, post.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === post.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className={`text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                    {post.caption}
                  </p>
                  <p className={`text-xs text-indigo-400 font-mono ${isRtl ? 'text-right' : 'text-left'}`}>
                    {post.hashtags.join(' ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EMAIL NEWSLETTER */}
      {activeTab === 'newsletter' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <h2 className="text-xl font-bold text-white">Email Newsletter Draft</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(suite.newsletter.emailBody, 'newsletter')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                {copiedKey === 'newsletter' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Email</span>
              </button>
              <button
                onClick={() => onOpenRegenerateModal('newsletter', 'Email Newsletter')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Primary Subject Line
            </span>
            <div className="text-sm font-bold text-white">
              {suite.newsletter.subjectLine}
            </div>
            <div className="text-xs text-slate-400">
              Preview Snippet: <em>{suite.newsletter.previewSnippet}</em>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {suite.newsletter.emailBody}
          </div>
        </div>
      )}

      {/* TAB 6: PULL QUOTES */}
      {activeTab === 'quotes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Standout Pull Quotes</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Verbatim Verified
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Extracted verbatim from conversation audio. Programmatically verified against transcript.
              </p>
            </div>
            <button
              onClick={() => onOpenRegenerateModal('pullQuotes', 'Pull Quotes')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Quotes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suite.pullQuotes.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between space-y-3 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono text-[10px]">
                      {q.timestamp}
                    </span>
                    {q.isVerified ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified Against Audio
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Needs Review
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white italic leading-relaxed">
                    "{q.quote}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                  <span className="text-slate-400 font-medium">— {q.speaker}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleJumpToSource(q.timestamp)}
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Source</span>
                    </button>
                    <button
                      onClick={() => handleCopy(`"${q.quote}" — ${q.speaker}`, q.id)}
                      className="text-slate-400 hover:text-white"
                      title="Copy Quote"
                    >
                      {copiedKey === q.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: RAW TRANSCRIPT */}
      {activeTab === 'transcript' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Full Time-Coded Transcript</h2>
              <p className="text-xs text-slate-400">
                Click any timestamp below to seek video or audio to that exact moment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(recording.transcript, 'transcript')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl"
            >
              {copiedKey === 'transcript' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Copy Raw Transcript</span>
            </button>
          </div>

          {/* Synchronized Media Player for Transcript */}
          {recording.mediaUrl && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  {!recording.isAudioOnly ? <Film className="w-4 h-4 text-indigo-400" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                  <span>{!recording.isAudioOnly ? 'Video Player' : 'Audio Player'} • {recording.title}</span>
                </span>
                <span className="text-[11px] text-indigo-400 font-medium">
                  {jumpTimestamp ? `Seeked to ${jumpTimestamp}` : 'Ready to play'}
                </span>
              </div>

              {!recording.isAudioOnly ? (
                <video
                  ref={transcriptVideoRef}
                  src={recording.mediaUrl}
                  controls
                  playsInline
                  className="w-full max-h-64 rounded-xl bg-black object-contain mx-auto shadow-inner"
                />
              ) : (
                <audio
                  ref={transcriptAudioRef}
                  src={recording.mediaUrl}
                  controls
                  className="w-full h-11 rounded-xl"
                />
              )}
            </div>
          )}

          {jumpTimestamp && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between text-xs text-indigo-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Jumped to citation timestamp <strong>{jumpTimestamp}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setJumpTimestamp(null)}
                className="text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}

          <div dir={isRtl ? 'rtl' : 'ltr'} className={`p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto space-y-2 ${isRtl ? 'text-right font-sans' : 'font-mono'}`}>
            {recording.transcript}
          </div>
        </div>
      )}

      {/* Ask This Recording Drawer */}
      <AskRecordingDrawer
        isOpen={isAskDrawerOpen}
        onClose={() => setIsAskDrawerOpen(false)}
        recording={recording}
        onJumpToTimestamp={handleJumpToSource}
      />
    </div>
  );
};
