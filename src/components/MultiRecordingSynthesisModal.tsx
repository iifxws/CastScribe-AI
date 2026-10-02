import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  X,
  Check,
  Clock,
  ArrowRight,
  FileText,
  Mail,
  Film,
  Download,
  Copy,
  Loader2,
} from 'lucide-react';
import { Recording, SynthesisProject } from '../types';
import { synthesizeRecordings, downloadFile } from '../services/api';

interface MultiRecordingSynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: Recording[];
  onSynthesisSuccess: (project: SynthesisProject) => void;
}

export const MultiRecordingSynthesisModal: React.FC<MultiRecordingSynthesisModalProps> = ({
  isOpen,
  onClose,
  recordings,
  onSynthesisSuccess,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    recordings.slice(0, 2).map((r) => r.id)
  );
  const [synthesisType, setSynthesisType] = useState<
    'master_article' | 'themed_newsletter' | 'best_of_clips'
  >('master_article');
  const [customTitle, setCustomTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSynthesize = async () => {
    if (selectedIds.length < 2) {
      setErrorMsg('Please select at least 2 recordings to synthesize.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const selectedRecordings = recordings.filter((r) => selectedIds.includes(r.id));

    try {
      const res = await synthesizeRecordings({
        recordings: selectedRecordings,
        synthesisType,
        customTitle: customTitle.trim() || undefined,
      });

      const newProject: SynthesisProject = {
        id: `synth-${Date.now()}`,
        title: res.title || customTitle || 'Synthesized Master Document',
        type: synthesisType,
        recordingIds: selectedIds,
        recordingTitles: selectedRecordings.map((r) => r.title),
        content: res.content,
        sources: res.sources || [],
        createdAt: new Date().toISOString(),
      };

      onSynthesisSuccess(newProject);
      onClose();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Synthesis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Multi-Recording Synthesis</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Pro Feature
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synthesize multiple episodes or coaching calls into one master asset with source citations.
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Select Output Format */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">
              Select Synthesis Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSynthesisType('master_article')}
                className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                  synthesisType === 'master_article'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <div className="font-bold text-xs">Master Article</div>
                <div className="text-[10px] text-slate-400">Deep-dive article</div>
              </button>

              <button
                type="button"
                onClick={() => setSynthesisType('themed_newsletter')}
                className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                  synthesisType === 'themed_newsletter'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <div className="font-bold text-xs">Themed Newsletter</div>
                <div className="text-[10px] text-slate-400">Cross-topic recap</div>
              </button>

              <button
                type="button"
                onClick={() => setSynthesisType('best_of_clips')}
                className={`p-3 rounded-2xl border text-left space-y-1 transition-all ${
                  synthesisType === 'best_of_clips'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Film className="w-4 h-4 text-indigo-400" />
                <div className="font-bold text-xs">Best-Of Compilation</div>
                <div className="text-[10px] text-slate-400">Top takeaways list</div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom Asset Title (Optional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Master Playbook: Scaling B2B Retainers & Positioning"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          {/* Select Recordings list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Choose Recordings ({selectedIds.length} Selected):
              </span>
              <span>Min. 2 recordings</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2">
              {recordings.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleSelect(r.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/60'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white truncate max-w-md">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {r.duration} • {r.format}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isProcessing || selectedIds.length < 2}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-lg shadow-indigo-600/30"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing cross-recording insights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Synthesis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
