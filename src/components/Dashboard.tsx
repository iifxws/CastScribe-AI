import React, { useState } from 'react';
import { Recording, UserProfile, SynthesisProject } from '../types';
import {
  Search,
  Filter,
  Mic,
  FileAudio,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Trash2,
  Edit2,
  Check,
  FileText,
  Share2,
  Mail,
  Quote,
  Crown,
  Zap,
  Film,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface DashboardProps {
  recordings: Recording[];
  userProfile: UserProfile;
  synthesisProjects?: SynthesisProject[];
  onSelectRecording: (recording: Recording) => void;
  onOpenUpload: () => void;
  onOpenPricing: () => void;
  onOpenSynthesis: () => void;
  onDeleteRecording: (id: string) => void;
  onRenameRecording: (id: string, newTitle: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  recordings,
  userProfile,
  synthesisProjects = [],
  onSelectRecording,
  onOpenUpload,
  onOpenPricing,
  onOpenSynthesis,
  onDeleteRecording,
  onRenameRecording,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const isPro = userProfile.plan === 'pro';
  const isCreator = userProfile.plan === 'creator';

  // Filter recordings
  const filteredRecordings = recordings.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.originalFileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFormat =
      filterFormat === 'all' ||
      r.format.toLowerCase().includes(filterFormat.toLowerCase());
    return matchesSearch && matchesFormat;
  });

  const handleStartRename = (r: Recording, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(r.id);
    setEditingTitle(r.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameRecording(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CastScribe AI v2 • Text + Video Clips</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            One Recording In. A Full Content Engine Out.
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Generate both your comprehensive written content suite (Blog, Show Notes, Socials, Newsletter, Quotes) AND ready-to-post 9:16 vertical video clips with animated speech captions—grounded 100% in your actual recording.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>New Recording</span>
            </button>

            {recordings.length >= 2 && (
              <button
                onClick={onOpenSynthesis}
                className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-indigo-200 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-500/30 rounded-xl transition-all"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Synthesize 2+ Recordings</span>
              </button>
            )}

            {!isPro && !isCreator && (
              <button
                onClick={onOpenPricing}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Upgrade to Creator Pro ($29/mo)</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Free Tier Usage Tracker Notice */}
      {!isPro && !isCreator && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-white">
                Starter Free Plan: {userProfile.recordingsUsed} of {userProfile.maxRecordings} recording used
              </p>
              <p className="text-slate-400 text-[11px]">
                Upgrade to Creator Pro for 10 recordings/month and unlimited watermark-free 9:16 video clips.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenPricing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shrink-0"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Multi-Recording Syntheses list (if any exist) */}
      {synthesisProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Multi-Recording Syntheses ({synthesisProjects.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {synthesisProjects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">
                    {p.type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {p.recordingTitles.length} source recordings
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{p.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{p.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Library Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">Your Content Library</h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {recordings.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recordings..."
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 w-48 sm:w-56"
            />
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 ml-2 text-slate-500" />
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none pr-2 py-1 cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Formats</option>
              <option value="mp3" className="bg-slate-900">Audio (MP3/WAV)</option>
              <option value="mp4" className="bg-slate-900">Video (MP4/MOV)</option>
              <option value="youtube" className="bg-slate-900">YouTube</option>
              <option value="sample" className="bg-slate-900">Demos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recordings Grid */}
      {filteredRecordings.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <FileAudio className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No recordings found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload an audio or video file, or record a quick live mic session to generate your full content suite.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white inline-flex items-center gap-2"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Add First Recording</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRecordings.map((recording) => {
            const hasClips = recording.videoClips?.clips && recording.videoClips.clips.length > 0;
            const clipsCount = recording.videoClips?.clips?.length || 0;

            return (
              <div
                key={recording.id}
                onClick={() => onSelectRecording(recording)}
                className="group relative rounded-3xl p-5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-indigo-500/60 shadow-lg hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top tags row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
                        {recording.format}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {recording.duration}
                      </span>
                    </div>

                    {/* Dual Badges: Text Suite + Video Clips */}
                    <div className="flex items-center gap-1.5">
                      {hasClips && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1">
                          <Film className="w-2.5 h-2.5" />
                          <span>{clipsCount} Clips</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        <span>Ready</span>
                      </span>
                    </div>
                  </div>

                  {/* Title (Inline editable) */}
                  <div className="space-y-1">
                    {editingId === recording.id ? (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(recording.id, e)}
                          className="w-full px-2.5 py-1 text-sm font-bold bg-slate-950 border border-indigo-500 rounded-lg text-white outline-none"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(recording.id, e)}
                          className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {recording.title}
                      </h3>
                    )}
                  </div>

                  {/* Snippet preview */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {recording.contentPieces?.showNotes.episodeSummary ||
                      recording.transcript.slice(0, 140) + '...'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Action icons */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(recording, e)}
                      title="Rename"
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecording(recording.id);
                      }}
                      title="Delete recording"
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
