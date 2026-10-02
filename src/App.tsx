import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { UploadModal } from './components/UploadModal';
import { TranscriptReviewModal } from './components/TranscriptReviewModal';
import { ContentSuiteViewer } from './components/ContentSuiteViewer';
import { RegenerateModal } from './components/RegenerateModal';
import { OnboardingModal } from './components/OnboardingModal';
import { PricingModal } from './components/PricingModal';
import { BrandVoiceModal } from './components/BrandVoiceModal';
import { AdminMetricsModal } from './components/AdminMetricsModal';
import { MultiRecordingSynthesisModal } from './components/MultiRecordingSynthesisModal';
import {
  Recording,
  UserProfile,
  GeneratedContentSuite,
  VideoClip,
  PlanTier,
  SynthesisProject,
  RecordingContext,
  ValidationReport,
} from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadRecordings,
  saveRecordings,
  DEFAULT_BRAND_KIT,
} from './services/storage';
import {
  generateContentSuite,
  discoverVideoClips,
  regeneratePiece,
} from './services/api';
import confetti from 'canvas-confetti';
import { Loader2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';

export default function App() {
  // 1. Persistent State
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [recordings, setRecordings] = useState<Recording[]>(loadRecordings);
  const [synthesisProjects, setSynthesisProjects] = useState<SynthesisProject[]>([]);

  // 2. Navigation & Modal Controls
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBrandVoiceOpen, setIsBrandVoiceOpen] = useState(false);
  const [isAdminMetricsOpen, setIsAdminMetricsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSynthesisOpen, setIsSynthesisOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [pricingReason, setPricingReason] = useState<
    'limit_reached' | 'generation_completed' | 'manual'
  >('manual');

  // 3. Pending Review State
  const [pendingReview, setPendingReview] = useState<{
    id: string;
    title: string;
    originalFileName: string;
    format: string;
    duration: string;
    durationSeconds?: number;
    transcript: string;
    segments?: any[];
    sourceType: 'upload' | 'youtube' | 'mic' | 'sample' | 'pasted_transcript';
    mediaUrl?: string;
    sourceFileId?: string;
    isAudioOnly?: boolean;
    fileSizeBytes?: number;
    context?: RecordingContext;
    validationReport?: ValidationReport;
  } | null>(null);

  // 4. Regeneration state
  const [regenerateTarget, setRegenerateTarget] = useState<{
    pieceType: 'blogPost' | 'showNotes' | 'socialPosts' | 'newsletter' | 'pullQuotes';
    pieceTitle: string;
  } | null>(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveRecordings(recordings);
  }, [recordings]);

  // Selected recording object
  const activeRecording = recordings.find((r) => r.id === selectedRecordingId) || null;

  // Handler: Save updated user profile
  const handleSaveProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    showToast('Brand voice & tone settings saved!');
  };

  // Handler: Upgrade Plan
  const handleUpgradeSuccess = (plan: PlanTier, extraMinutes = 0) => {
    setUserProfile((prev) => ({
      ...prev,
      plan,
      maxRecordings: plan === 'pro' ? 25 : plan === 'creator' ? 10 : 1,
      extraMinutes: prev.extraMinutes + extraMinutes,
    }));
    showToast(
      plan === 'pro'
        ? 'Agency Pro activated! Multi-recording synthesis unlocked.'
        : plan === 'creator'
        ? 'Creator Pro activated! 10 recordings & watermark-free clips unlocked.'
        : 'Minutes added successfully!',
      'success'
    );
  };

  // Handler: Successful Audio/Video Transcription
  const handleTranscriptionSuccess = (data: {
    title: string;
    originalFileName: string;
    format: string;
    duration: string;
    durationSeconds?: number;
    transcript: string;
    segments?: any[];
    sourceType: 'upload' | 'youtube' | 'mic' | 'sample' | 'pasted_transcript';
    mediaUrl?: string;
    sourceFileId?: string;
    isAudioOnly?: boolean;
    fileSizeBytes?: number;
    context?: RecordingContext;
    validationReport?: ValidationReport;
  }) => {
    const tempId = `rec-${Date.now()}`;
    setPendingReview({
      id: tempId,
      ...data,
    });
  };

  // Handler: Start Full Generation (Written Suite + Video Clips)
  const handleStartGeneration = async (
    editedTranscript: string,
    options: { blogLength: 'short' | 'long' }
  ) => {
    if (!pendingReview) return;

    // Check free limit
    if (userProfile.plan === 'free' && userProfile.recordingsUsed >= userProfile.maxRecordings) {
      setPricingReason('limit_reached');
      setIsPricingOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Synthesizing speech themes and topic transitions...');

    try {
      // 1. Generate Written Content Suite
      setGenerationStep('Writing long-form blog post, show notes & newsletter...');
      const suite = await generateContentSuite({
        transcript: editedTranscript,
        recordingTitle: pendingReview.title,
        userProfile,
        context: pendingReview.context,
        options,
      });

      // 2. Discover Short-Form Video Clips
      setGenerationStep('Identifying 6-12 viral moments for 9:16 vertical video clips...');
      let discoveredClips: VideoClip[] = [];
      try {
        const clipsRes = await discoverVideoClips({
          transcript: editedTranscript,
          recordingTitle: pendingReview.title,
        });
        discoveredClips = clipsRes.clips || [];
      } catch (clipErr) {
        console.warn('Clip discovery warning:', clipErr);
      }

      const isVideo = pendingReview.isAudioOnly === false ||
        pendingReview.format.toLowerCase().includes('mp4') ||
        pendingReview.format.toLowerCase().includes('mov') ||
        pendingReview.format.toLowerCase().includes('webm') ||
        Boolean(pendingReview.originalFileName?.match(/\.(mp4|mov|webm)$/i));

      const newRecording: Recording = {
        id: pendingReview.id,
        title: pendingReview.title,
        originalFileName: pendingReview.originalFileName,
        format: pendingReview.format,
        duration: pendingReview.duration,
        durationSeconds: pendingReview.durationSeconds,
        fileSizeBytes: pendingReview.fileSizeBytes,
        createdAt: new Date().toISOString(),
        status: 'ready',
        sourceType: pendingReview.sourceType,
        mediaUrl: pendingReview.mediaUrl,
        sourceFileId: pendingReview.sourceFileId,
        isAudioOnly: !isVideo,
        transcript: editedTranscript,
        segments: pendingReview.segments,
        contentPieces: suite,
        videoClips: {
          clips: discoveredClips.map((c) => ({
            ...c,
            sourceMediaUrl: pendingReview.mediaUrl,
            sourceRecordingId: pendingReview.id,
            sourceFileId: pendingReview.sourceFileId,
            renderUrl: undefined,
            isAudioOnly: !isVideo,
          })),
          brandKit: DEFAULT_BRAND_KIT,
          isAudioOnly: !isVideo,
          generatedAt: new Date().toISOString(),
        },
        context: pendingReview.context,
        validationReport: pendingReview.validationReport,
      };

      setRecordings((prev) => [newRecording, ...prev]);
      setSelectedRecordingId(newRecording.id);
      setPendingReview(null);
      setIsGenerating(false);

      // Increment usage
      const newUsed = userProfile.recordingsUsed + 1;
      const isFirst = !userProfile.isFirstGenerationComplete;
      setUserProfile((prev) => ({
        ...prev,
        recordingsUsed: newUsed,
        isFirstGenerationComplete: true,
      }));

      // Fire celebratory confetti!
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });

      showToast(`Content suite & ${discoveredClips.length} video clips ready!`, 'success');

      if (isFirst && userProfile.plan === 'free') {
        setTimeout(() => {
          setPricingReason('generation_completed');
          setIsPricingOpen(true);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setIsGenerating(false);
      showToast(err.message || 'Generation failed. Please try again.', 'error');
    }
  };

  // Handler: Confirm Single Piece Regeneration
  const handleConfirmRegenerate = async (
    instructions: string,
    options?: { blogLength?: 'short' | 'long' }
  ) => {
    if (!activeRecording || !activeRecording.contentPieces || !regenerateTarget) return;

    setIsRegenerating(true);
    try {
      const updatedPiece = await regeneratePiece({
        pieceType: regenerateTarget.pieceType,
        transcript: activeRecording.transcript,
        userProfile,
        instructions,
        recordingTitle: activeRecording.title,
        options,
      });

      const updatedPieces: GeneratedContentSuite = {
        ...activeRecording.contentPieces,
        [regenerateTarget.pieceType]: updatedPiece[regenerateTarget.pieceType] || updatedPiece,
        isOutdated: false,
      };

      const updatedRecording: Recording = {
        ...activeRecording,
        contentPieces: updatedPieces,
      };

      setRecordings((prev) =>
        prev.map((r) => (r.id === updatedRecording.id ? updatedRecording : r))
      );
      setRegenerateTarget(null);
      setIsRegenerating(false);
      showToast(`${regenerateTarget.pieceTitle} regenerated successfully!`, 'success');
    } catch (err: any) {
      console.error(err);
      setIsRegenerating(false);
      showToast(err.message || 'Regeneration failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Global Navigation Bar */}
      <Navbar
        userProfile={userProfile}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBrandVoice={() => setIsBrandVoiceOpen(true)}
        onOpenAdminMetrics={() => setIsAdminMetricsOpen(true)}
        onOpenPricing={() => {
          setPricingReason('manual');
          setIsPricingOpen(true);
        }}
        onGoHome={() => setSelectedRecordingId(null)}
      />

      {/* Main App Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {selectedRecordingId && activeRecording ? (
          <ContentSuiteViewer
            recording={activeRecording}
            userProfile={userProfile}
            onBack={() => setSelectedRecordingId(null)}
            onUpdateRecording={(updated) =>
              setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
            }
            onOpenRegenerateModal={(pieceType, pieceTitle) =>
              setRegenerateTarget({ pieceType, pieceTitle })
            }
            onOpenPricing={() => {
              setPricingReason('manual');
              setIsPricingOpen(true);
            }}
          />
        ) : (
          <Dashboard
            recordings={recordings}
            userProfile={userProfile}
            synthesisProjects={synthesisProjects}
            onSelectRecording={(r) => setSelectedRecordingId(r.id)}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenPricing={() => {
              setPricingReason('manual');
              setIsPricingOpen(true);
            }}
            onOpenSynthesis={() => setIsSynthesisOpen(true)}
            onDeleteRecording={(id) => {
              setRecordings((prev) => prev.filter((r) => r.id !== id));
              showToast('Recording deleted from library.');
            }}
            onRenameRecording={(id, newTitle) => {
              setRecordings((prev) =>
                prev.map((r) => (r.id === id ? { ...r, title: newTitle } : r))
              );
              showToast('Recording renamed.');
            }}
          />
        )}
      </main>

      {/* Upload & Audio Transcription Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTranscriptionSuccess={handleTranscriptionSuccess}
      />

      {/* Transcript Review & Verification Modal */}
      {pendingReview && (
        <TranscriptReviewModal
          isOpen={Boolean(pendingReview)}
          onClose={() => setPendingReview(null)}
          recordingTitle={pendingReview.title}
          duration={pendingReview.duration}
          transcript={pendingReview.transcript}
          userProfile={userProfile}
          context={pendingReview.context}
          validationReport={pendingReview.validationReport}
          onStartGeneration={handleStartGeneration}
          isGenerating={isGenerating}
          generationStep={generationStep}
        />
      )}

      {/* Regeneration Modal for individual content pieces */}
      {regenerateTarget && (
        <RegenerateModal
          isOpen={Boolean(regenerateTarget)}
          onClose={() => setRegenerateTarget(null)}
          pieceType={regenerateTarget.pieceType}
          pieceTitle={regenerateTarget.pieceTitle}
          userProfile={userProfile}
          onConfirmRegenerate={handleConfirmRegenerate}
          isRegenerating={isRegenerating}
        />
      )}

      {/* Onboarding & Voice Tone Modal */}
      <OnboardingModal
        isOpen={isSettingsOpen || isOnboardingOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setIsOnboardingOpen(false);
        }}
        userProfile={userProfile}
        onSave={handleSaveProfile}
        onLaunchDemo={() => {
          setIsOnboardingOpen(false);
          if (recordings.length > 0) {
            setSelectedRecordingId(recordings[0].id);
          }
        }}
      />

      {/* Brand Voice Tone Profile Extractor */}
      <BrandVoiceModal
        isOpen={isBrandVoiceOpen}
        onClose={() => setIsBrandVoiceOpen(false)}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Admin & Cost Telemetry Modal */}
      <AdminMetricsModal
        isOpen={isAdminMetricsOpen}
        onClose={() => setIsAdminMetricsOpen(false)}
      />

      {/* Multi-Recording Synthesis Modal */}
      <MultiRecordingSynthesisModal
        isOpen={isSynthesisOpen}
        onClose={() => setIsSynthesisOpen(false)}
        recordings={recordings}
        onSynthesisSuccess={(newProject) => {
          setSynthesisProjects((prev) => [newProject, ...prev]);
          showToast(`Multi-recording synthesis "${newProject.title}" created!`, 'success');
        }}
      />

      {/* Pricing & Upgrade Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        userProfile={userProfile}
        onUpgradeSuccess={handleUpgradeSuccess}
        reason={pricingReason}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : toast.type === 'info'
                ? 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-2 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
