import React, { useState } from 'react';
import { UserProfile, PreferredTone } from '../types';
import {
  X,
  Check,
  Sparkles,
  ArrowRight,
  Radio,
  Video,
  Mic,
  PhoneCall,
  Youtube,
  Play,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onLaunchDemo?: () => void;
  isInitialSetup?: boolean;
}

const CONTENT_TYPES = [
  { id: 'podcast', label: 'Podcast Episode', icon: Mic, desc: 'Solo or guest interview audio' },
  { id: 'webinar', label: 'Webinar & Workshop', icon: Video, desc: 'Slide presentations & group talks' },
  { id: 'coaching', label: 'Coaching / Advisory Call', icon: PhoneCall, desc: '1-on-1 strategic consulting session' },
  { id: 'youtube', label: 'YouTube Video', icon: Youtube, desc: 'Tutorials and thought leadership' },
];

const TONE_OPTIONS: { id: PreferredTone; label: string; description: string; icon: string }[] = [
  {
    id: 'authoritative',
    label: 'Authoritative',
    description: 'Direct, insight-driven, executive leadership cadence. No fluff.',
    icon: '🎯',
  },
  {
    id: 'conversational',
    label: 'Conversational',
    description: 'Approachable, candid, like an honest coffee chat with a peer.',
    icon: '☕',
  },
  {
    id: 'energetic',
    label: 'Energetic',
    description: 'Enthusiastic, punchy, inspiring, momentum-building.',
    icon: '⚡',
  },
  {
    id: 'warm',
    label: 'Warm & Empathetic',
    description: 'Supportive, thoughtful, storytelling focused, deeply human.',
    icon: '🌱',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Polished, structured, clear, suitable for enterprise audiences.',
    icon: '👔',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
  onLaunchDemo,
  isInitialSetup = false,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedContentType, setSelectedContentType] = useState('podcast');
  const [tone, setTone] = useState<PreferredTone>(userProfile.tone);
  const [name, setName] = useState(userProfile.name);
  const [targetAudience, setTargetAudience] = useState(userProfile.targetAudience);

  if (!isOpen) return null;

  const handleFinish = () => {
    const updated: UserProfile = {
      ...userProfile,
      name: name.trim() || 'Content Creator',
      targetAudience: targetAudience.trim() || 'Founders & Decision Makers',
      tone,
    };
    onSave(updated);
    onClose();
  };

  const handleRunDemo = () => {
    handleFinish();
    if (onLaunchDemo) {
      onLaunchDemo();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isInitialSetup ? 'Get Started with CastScribe AI' : 'Brand Voice & Tone Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                Step {step} of 3 • Set your preferences in under 60 seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <div
            className={`flex-1 h-1 rounded-full ${
              step >= 1 ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step >= 2 ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step >= 3 ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          />
        </div>

        {/* Body based on current step */}
        <div className="p-6 space-y-5">
          {/* STEP 1: Content Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  1. What type of recording do you primarily create?
                </h3>
                <p className="text-xs text-slate-400">
                  We optimize transcript formatting, social hooks, and clip detection for this format.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONTENT_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const isSel = selectedContentType === ct.id;
                  return (
                    <div
                      key={ct.id}
                      onClick={() => setSelectedContentType(ct.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSel
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSel
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{ct.label}</div>
                          <div className="text-[11px] text-slate-400">{ct.desc}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Tone & Voice */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  2. Choose your default brand voice & tone
                </h3>
                <p className="text-xs text-slate-400">
                  Controls sentence rhythm, vocabulary, and hook angle across all written content.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {TONE_OPTIONS.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      tone === t.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[11px] text-slate-400">{t.description}</div>
                      </div>
                    </div>
                    {tone === t.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Demo Launch */}
          {step === 3 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white">
                  You're all set! Ready to see the results?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Run our <strong>Bootstrapped Founder Demo</strong> to see a full written content suite (Blog, Social, Newsletter, Quotes) AND ready-to-post 9:16 vertical video clips in seconds.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunDemo}
                  className="w-full py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Demo (Text + Video Clips)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs text-slate-400 hover:text-white"
            >
              Skip to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
