import React from 'react';
import { UserProfile } from '../types';
import {
  Sparkles,
  Sliders,
  Mic,
  Crown,
  AudioWaveform,
  Activity,
  Type,
} from 'lucide-react';

interface NavbarProps {
  userProfile: UserProfile;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenBrandVoice: () => void;
  onOpenAdminMetrics: () => void;
  onOpenPricing: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenUpload,
  onOpenSettings,
  onOpenBrandVoice,
  onOpenAdminMetrics,
  onOpenPricing,
  onGoHome,
}) => {
  const isPro = userProfile.plan === 'pro';
  const isCreator = userProfile.plan === 'creator';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <AudioWaveform className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                CastScribe<span className="text-indigo-400">AI</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2 Video & Text
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-400">
              Unified Content Multiplication Platform
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Plan & Usage Badge */}
          <button
            onClick={onOpenPricing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
              isPro
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : isCreator
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isPro ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Agency Pro</span>
              </>
            ) : isCreator ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Creator Pro</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>Free ({userProfile.recordingsUsed}/1)</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-semibold">
                  Upgrade
                </span>
              </>
            )}
          </button>

          {/* Brand Voice Button */}
          <button
            onClick={onOpenBrandVoice}
            title="Brand Voice Profile"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <span>Brand Voice</span>
          </button>

          {/* Admin Metrics Button */}
          <button
            onClick={onOpenAdminMetrics}
            title="Owner Admin & Cost Telemetry"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin</span>
          </button>

          {/* Voice & Tone Settings */}
          <button
            onClick={onOpenSettings}
            title="Edit Tone & Settings"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline capitalize">{userProfile.tone}</span>
          </button>

          {/* New Recording Action CTA */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-95 transition-all duration-150"
          >
            <Mic className="w-4 h-4" />
            <span>New Recording</span>
          </button>
        </div>
      </div>
    </header>
  );
};
