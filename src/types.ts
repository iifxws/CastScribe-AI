export type PreferredTone = 'professional' | 'casual' | 'conversational' | 'energetic' | 'warm' | 'authoritative';
export type PlanTier = 'free' | 'creator' | 'pro';

export interface UserProfile {
  name: string;
  niche: string;
  targetAudience: string;
  tone: PreferredTone;
  brandVoiceSamples: string[];
  toneProfile?: {
    formality: string;
    cadence: string;
    vocabulary: string;
    humor: string;
    keyThemes: string[];
  };
  plan: PlanTier;
  recordingsUsed: number;
  maxRecordings: number;
  extraMinutes: number;
  minutesProcessed: number;
  isFirstGenerationComplete: boolean;
  webhookUrl?: string;
  dataRetentionDays: number;
}

export interface SourceCitation {
  start: string;
  end: string;
  quote?: string;
}

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  start: string;
  end: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  words?: TranscriptWord[];
}

export interface RecordingContext {
  title?: string;
  speakers?: string;
  roles?: string;
  topic?: string;
  glossary?: string;
  audience?: string;
  sourceLanguage?: string;
  outputLanguage?: string;
}

export interface ShowNotesTimestamp {
  time: string;
  topic: string;
  description: string;
  source_ranges?: SourceCitation[];
}

export interface LinkedInPost {
  id: string;
  hook: string;
  text: string;
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface TwitterPost {
  id: string;
  type: 'single' | 'thread';
  text: string;
  threadParts?: string[];
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface InstagramPost {
  id: string;
  caption: string;
  hashtags: string[];
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface SocialPosts {
  linkedin: LinkedInPost[];
  twitter: TwitterPost[];
  instagram: InstagramPost[];
}

export interface SubjectLineOption {
  style: string;
  text: string;
}

export interface Newsletter {
  subjectLine: string;
  alternateSubjectLines: SubjectLineOption[];
  previewSnippet: string;
  emailBody: string;
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface BlogSection {
  heading: string;
  content: string;
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface BlogPost {
  title: string;
  readTimeMinutes: number;
  lengthOption: 'short' | 'long';
  content: string;
  sections?: BlogSection[];
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface ShowNotes {
  episodeSummary: string;
  timestamps: ShowNotesTimestamp[];
  keyResources: string[];
  keyQuotes: string[];
  source_ranges?: SourceCitation[];
  isVerified?: boolean;
}

export interface PullQuote {
  id: string;
  quote: string;
  speaker: string;
  timestamp: string;
  category?: string;
  source_ranges?: SourceCitation[];
  isVerified: boolean;
  matchScore?: number;
}

export interface GeneratedContentSuite {
  blogPost: BlogPost;
  showNotes: ShowNotes;
  socialPosts: SocialPosts;
  newsletter: Newsletter;
  pullQuotes: PullQuote[];
  generatedAt: string;
  isOutdated?: boolean;
}

export type CaptionStyle = 'classic' | 'bold_highlight' | 'minimal' | 'karaoke';
export type CaptionPosition = 'bottom' | 'center' | 'top';

export interface BrandKit {
  fontFamily: 'Inter' | 'Montserrat' | 'Impact' | 'Poppins' | 'Cinzel';
  captionStyle: CaptionStyle;
  captionPosition: CaptionPosition;
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  fontSize: number; // e.g. 28 to 56
  showWatermark: boolean;
  watermarkText: string;
  showHookOverlay: boolean;
}

export interface VideoClip {
  id: string;
  title: string;
  hookText: string;
  suggestedCaption: string;
  hashtags: string[];
  startTime: string; // e.g. "01:15"
  endTime: string; // e.g. "01:58"
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  engagementScore: number; // 0 - 100
  scoreReason: string;
  transcriptSnippet: string;
  status: 'queued' | 'rendering' | 'ready' | 'failed';
  renderUrl?: string;
  cropOffset?: number; // -50 to 50 for horizontal panning
  aspectRatio: '9:16';
  isAudioOnly?: boolean;
  words?: TranscriptWord[];
  sourceMediaUrl?: string;
  sourceRecordingId?: string;
  sourceFileId?: string;
  errorMessage?: string;
}

export interface VideoClipsSuite {
  clips: VideoClip[];
  brandKit: BrandKit;
  isAudioOnly: boolean;
  generatedAt: string;
  renderEngine?: 'server_ffmpeg' | 'browser_canvas' | 'simulated';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: {
    timestamp: string;
    seconds: number;
    quote: string;
  }[];
  createdAt: string;
}

export interface SynthesisProject {
  id: string;
  title: string;
  type: 'master_article' | 'themed_newsletter' | 'best_of_clips';
  recordingIds: string[];
  recordingTitles: string[];
  content: string;
  sources: {
    recordingTitle: string;
    timestamp: string;
    quote: string;
  }[];
  createdAt: string;
}

export interface ValidationReport {
  isValid: boolean;
  detectedLanguage: string;
  wordsPerMinute: number;
  totalWords: number;
  durationSeconds: number;
  speechConfidence: number;
  warnings: string[];
  isRtl?: boolean;
}

export type RecordingStatus =
  | 'uploading'
  | 'queued'
  | 'transcribing'
  | 'transcribed'
  | 'generating_text'
  | 'generating_clips'
  | 'ready'
  | 'error';

export interface Recording {
  id: string;
  title: string;
  originalFileName: string;
  format: string; // e.g. MP3, WAV, MP4, M4A, YouTube, Mic, SRT
  duration: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  createdAt: string;
  status: RecordingStatus;
  transcript: string;
  segments?: TranscriptSegment[];
  sourceType: 'upload' | 'youtube' | 'mic' | 'sample' | 'pasted_transcript';
  mediaUrl?: string; // object URL or audio/video data for playback
  sourceFileId?: string;
  mediaId?: string;
  isAudioOnly?: boolean;
  contentPieces?: GeneratedContentSuite;
  videoClips?: VideoClipsSuite;
  chatHistory?: ChatMessage[];
  context?: RecordingContext;
  validationReport?: ValidationReport;
  error?: string;
}

export interface SampleRecording {
  id: string;
  title: string;
  category: string;
  duration: string;
  speakers: string;
  description: string;
  transcript: string;
  context?: RecordingContext;
  isAudioOnly?: boolean;
  audioUrl?: string;
}
