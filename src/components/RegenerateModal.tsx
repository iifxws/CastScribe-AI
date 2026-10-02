import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, ArrowRight, Lightbulb } from 'lucide-react';
import { UserProfile } from '../types';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieceType: 'blogPost' | 'showNotes' | 'socialPosts' | 'newsletter' | 'pullQuotes';
  pieceTitle: string;
  userProfile: UserProfile;
  onConfirmRegenerate: (instructions: string, options?: { blogLength?: 'short' | 'long' }) => void;
  isRegenerating: boolean;
}

const INSTRUCTION_PRESETS: Record<string, string[]> = {
  blogPost: [
    'Make it more actionable with numbered step-by-step checklists.',
    'Adopt a more provocative, contrarian angle on the industry standard.',
    'Shorten the article to ~500 words for a punchy read.',
    'Expand into a comprehensive 1,200+ word masterclass with deeper tactical details.',
  ],
  showNotes: [
    'Make the episode summary more curiosity-driven to boost listen rates.',
    'Add more specific time markers and bullet points.',
    'Highlight the tools and frameworks mentioned in greater detail.',
  ],
  socialPosts: [
    'Write more personal, vulnerable storytelling hooks for LinkedIn.',
    'Make the tweets sharper, punchier, and under 200 characters each.',
    'Turn the main framework into an 8-tweet mega breakdown thread.',
    'Add stronger engagement questions at the end of each post.',
  ],
  newsletter: [
    'Write in a more personal, behind-the-scenes founder voice.',
    'Structure with exactly 3 high-impact bulleted takeaways.',
    'Give me more aggressive curiosity-gap subject lines.',
  ],
  pullQuotes: [
    'Find quotes that challenge conventional wisdom.',
    'Extract only the shortest, punchiest one-liners under 20 words.',
    'Focus on the pricing and monetization advice.',
  ],
};

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  isOpen,
  onClose,
  pieceType,
  pieceTitle,
  userProfile,
  onConfirmRegenerate,
  isRegenerating,
}) => {
  const [instructions, setInstructions] = useState('');
  const [blogLength, setBlogLength] = useState<'short' | 'long'>('long');

  if (!isOpen) return null;

  const presets = INSTRUCTION_PRESETS[pieceType] || [];

  const handleApplyPreset = (preset: string) => {
    setInstructions(preset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmRegenerate(instructions, { blogLength });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Regenerate: {pieceTitle}</h2>
              <p className="text-xs text-slate-400">
                Fine-tune this specific piece without modifying your other generated content.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {pieceType === 'blogPost' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Article Length Preference
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setBlogLength('short')}
                  className={`p-2.5 rounded-xl border font-medium text-center transition-all ${
                    blogLength === 'short'
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Short (~500 words)
                </button>
                <button
                  type="button"
                  onClick={() => setBlogLength('long')}
                  className={`p-2.5 rounded-xl border font-medium text-center transition-all ${
                    blogLength === 'long'
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Comprehensive (~1200 words)
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Instructions or Desired Angle (Optional)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Make the hook more contrarian, add more bullet points, or focus specifically on the pricing breakdown..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder:text-slate-600 outline-none resize-none"
            />
          </div>

          {/* Quick presets */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Or click a quick prompt direction:</span>
            </div>
            <div className="space-y-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full text-left text-xs p-2 rounded-lg bg-slate-950/60 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition-colors"
                >
                  "{preset}"
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isRegenerating}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Regenerating...' : 'Regenerate This Piece'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
