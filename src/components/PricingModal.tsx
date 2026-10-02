import React, { useState } from 'react';
import {
  Crown,
  Check,
  Zap,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  Flame,
  Film,
  Layers,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, PlanTier } from '../types';
import { updateUserPlanOnServer } from '../services/api';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpgradeSuccess: (plan: PlanTier, extraMinutes?: number) => void;
  reason?: 'limit_reached' | 'generation_completed' | 'manual';
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpgradeSuccess,
  reason = 'manual',
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(
    userProfile.plan === 'pro' ? 'pro' : 'creator'
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayAsYouGo, setShowPayAsYouGo] = useState(false);

  if (!isOpen) return null;

  const handleSimulateCheckout = async (plan: PlanTier, addMinutes = 0) => {
    setIsProcessing(true);
    try {
      await updateUserPlanOnServer(plan, addMinutes);
      setTimeout(() => {
        setIsProcessing(false);
        onUpgradeSuccess(plan, addMinutes);
        onClose();
      }, 700);
    } catch (e) {
      setIsProcessing(false);
      onUpgradeSuccess(plan, addMinutes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Demo Simulation Notice Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-1.5 text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2">
          <span>✨ Simulated Payment Demo — Click any plan to test instant live tier activation.</span>
        </div>

        {/* Modal Header */}
        <div className="px-6 py-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Unified Content Multiplication Platform</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {reason === 'limit_reached'
                ? 'Monthly Free Limit Reached'
                : 'Replace Castmagic + Opus Clip with One Tool'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Other tools charge $29/mo for text plus $29/mo for video clips ($58+/mo). CastScribe delivers verified text AND ready-to-post vertical clips in one unified workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FREE TIER */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              userProfile.plan === 'free'
                ? 'bg-slate-950/70 border-slate-700'
                : 'bg-slate-950/40 border-slate-800/80 opacity-80'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Starter Free
                </span>
                {userProfile.plan === 'free' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Current Plan
                  </span>
                )}
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400"> / forever</span>
              </div>
              <p className="text-xs text-slate-400">
                Ideal for testing transcription accuracy and clip generation.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1 recording / month (up to 30 min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full written content suite (Blog, Social, Notes)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2 video clip previews (watermarked)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ask This Recording chat</span>
                </div>
              </div>
            </div>

            <button
              disabled
              className="mt-5 w-full py-2 rounded-xl text-xs font-semibold text-slate-500 bg-slate-900 border border-slate-800"
            >
              Current Tier
            </button>
          </div>

          {/* CREATOR PRO (Popular) */}
          <div className="relative rounded-2xl p-5 border-2 border-indigo-500 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 flex flex-col justify-between shadow-xl shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" /> Most Popular
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Creator Pro
                </span>
                {userProfile.plan === 'creator' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Active
                  </span>
                )}
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">$29</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <p className="text-xs text-slate-400">
                For solo podcasters, consultants, and creators publishing weekly.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-200 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>10 recordings</strong> / month (up to 90 min each)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited video clips</strong> with NO watermark</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Brand Kit (colors, fonts, captions)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>MP4 + SRT Subtitle downloads & ZIP export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority GPU rendering queue</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSimulateCheckout('creator')}
              disabled={isProcessing}
              className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>{isProcessing ? 'Activating...' : 'Activate Creator Pro ($29)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AGENCY PRO (Highest Tier) */}
          <div className="rounded-2xl p-5 border border-slate-800 bg-slate-950/60 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Agency Pro
                </span>
                {userProfile.plan === 'pro' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    Active
                  </span>
                )}
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">$49</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <p className="text-xs text-slate-400">
                For power creators, agencies, and teams handling high client volume.
              </p>

              <div className="space-y-2 pt-2 text-xs text-slate-300 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>25 recordings</strong> / month (up to 3 hrs each)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Multi-Recording Synthesis</strong> (Articles & Compilations)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited 1080x1920 clips + Audiograms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Buffer / Hootsuite CSV scheduling export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Webhooks integration & fastest queue</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSimulateCheckout('pro')}
              disabled={isProcessing}
              className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isProcessing ? 'Activating...' : 'Activate Agency Pro ($49)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pay-as-you-go add-on banner */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Need extra minutes without upgrading plans?
            </span>
            <span className="text-slate-400">
              Pay-as-you-go: Add 60 audio/video minutes for $10 with no monthly commitment.
            </span>
          </div>
          <button
            onClick={() => handleSimulateCheckout(userProfile.plan, 60)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 shrink-0"
          >
            + Buy 60 Min Pack ($10)
          </button>
        </div>

        {/* Fair Billing Guarantee */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fair Billing: Cancel anytime. Unused minutes roll over on paid plans.</span>
          </div>
          <span>30-Day Cloud Clip Storage</span>
        </div>
      </div>
    </div>
  );
};
