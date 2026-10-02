import React, { useState } from 'react';
import {
  Sparkles,
  Type,
  X,
  Check,
  Loader2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { UserProfile } from '../types';
import { analyzeBrandVoice } from '../services/api';

interface BrandVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export const BrandVoiceModal: React.FC<BrandVoiceModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
}) => {
  const [sample1, setSample1] = useState(userProfile.brandVoiceSamples[0] || '');
  const [sample2, setSample2] = useState(userProfile.brandVoiceSamples[1] || '');
  const [sample3, setSample3] = useState(userProfile.brandVoiceSamples[2] || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(userProfile.toneProfile || null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    const samples = [sample1, sample2, sample3].filter((s) => s.trim().length > 20);
    if (samples.length === 0) return;

    setIsAnalyzing(true);
    try {
      const res = await analyzeBrandVoice(samples);
      setExtractedProfile(res);
      const updated: UserProfile = {
        ...userProfile,
        brandVoiceSamples: samples,
        toneProfile: res,
      };
      onSaveProfile(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Brand Voice Profile</h2>
              <p className="text-xs text-slate-400">
                Paste your authentic newsletters or posts to clone your exact writing style.
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

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Writing Sample #1 (e.g. your best LinkedIn post or newsletter intro)
            </label>
            <textarea
              value={sample1}
              onChange={(e) => setSample1(e.target.value)}
              rows={3}
              placeholder="Paste writing sample here..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Writing Sample #2 (Optional)
            </label>
            <textarea
              value={sample2}
              onChange={(e) => setSample2(e.target.value)}
              rows={3}
              placeholder="Paste second sample..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {extractedProfile && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Extracted Voice Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <strong className="text-indigo-300">Formality:</strong> {extractedProfile.formality}
                </div>
                <div>
                  <strong className="text-indigo-300">Cadence:</strong> {extractedProfile.cadence}
                </div>
                <div>
                  <strong className="text-indigo-300">Vocabulary:</strong> {extractedProfile.vocabulary}
                </div>
                <div>
                  <strong className="text-indigo-300">Humor:</strong> {extractedProfile.humor}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!sample1 && !sample2)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Voice DNA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze & Clone Voice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
