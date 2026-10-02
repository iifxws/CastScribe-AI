import JSZip from 'jszip';
import {
  GeneratedContentSuite,
  UserProfile,
  VideoClip,
  BrandKit,
  Recording,
  RecordingContext,
  ChatMessage,
  ValidationReport,
} from '../types';

export interface TranscribeRequest {
  audioBase64?: string;
  mimeType?: string;
  youtubeUrl?: string;
  sampleId?: string;
  title?: string;
  pastedTranscript?: string;
  srtText?: string;
  context?: RecordingContext;
}

export interface TranscribeResponse {
  transcript: string;
  segments?: any[];
  estimatedDuration: string;
  durationSeconds?: number;
  validationReport?: ValidationReport;
  sourceType: string;
}

export async function transcribeAudio(payload: TranscribeRequest): Promise<TranscribeResponse> {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Transcription failed with status ${response.status}`);
  }

  return response.json();
}

export interface GenerateContentRequest {
  transcript: string;
  recordingTitle: string;
  userProfile: UserProfile;
  context?: RecordingContext;
  options?: {
    blogLength?: 'short' | 'long';
  };
}

export async function generateContentSuite(payload: GenerateContentRequest): Promise<GeneratedContentSuite> {
  const response = await fetch('/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Content generation failed with status ${response.status}`);
  }

  return response.json();
}

export interface DiscoverClipsRequest {
  transcript: string;
  recordingTitle: string;
  excludeRanges?: string[];
}

export async function discoverVideoClips(payload: DiscoverClipsRequest): Promise<{ clips: VideoClip[] }> {
  const response = await fetch('/api/discover-clips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Clip discovery failed with status ${response.status}`);
  }

  return response.json();
}

export interface RenderClipRequest {
  clip: VideoClip;
  audioBase64?: string;
  sourceMediaUrl?: string;
  sourceRecordingId?: string;
  sourceFileId?: string;
  recordingTitle?: string;
  sourceVideoUrl?: string;
  mediaUrl?: string;
  isAudioOnly?: boolean;
  brandKit?: BrandKit;
  userPlan?: string;
}

export async function renderVideoClip(payload: RenderClipRequest): Promise<any> {
  const response = await fetch('/api/render-clip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Clip rendering failed with status ${response.status}`);
  }

  return response.json();
}

export async function chatWithRecording(payload: {
  transcript: string;
  question: string;
  history?: any[];
}): Promise<{ answer: string; citations?: { timestamp: string; quote: string }[] }> {
  const response = await fetch('/api/chat-recording', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Chat request failed with status ${response.status}`);
  }

  return response.json();
}

export async function analyzeBrandVoice(samples: string[]): Promise<any> {
  const response = await fetch('/api/analyze-tone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samples }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Brand voice analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function synthesizeRecordings(payload: {
  recordings: Recording[];
  synthesisType: 'master_article' | 'themed_newsletter' | 'best_of_clips';
  customTitle?: string;
}): Promise<any> {
  const response = await fetch('/api/synthesize-recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Synthesis failed with status ${response.status}`);
  }

  return response.json();
}

export interface RegeneratePieceRequest {
  pieceType: 'blogPost' | 'showNotes' | 'socialPosts' | 'newsletter' | 'pullQuotes';
  transcript: string;
  userProfile: UserProfile;
  instructions: string;
  recordingTitle?: string;
  options?: {
    blogLength?: 'short' | 'long';
  };
}

export async function regeneratePiece(payload: RegeneratePieceRequest): Promise<any> {
  const response = await fetch('/api/regenerate-piece', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Regeneration failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

export async function fetchAdminMetrics(): Promise<any> {
  const response = await fetch('/api/admin/metrics');
  if (!response.ok) throw new Error('Failed to fetch admin metrics');
  return response.json();
}

export async function updateUserPlanOnServer(plan: string, extraMinutes = 0): Promise<any> {
  const response = await fetch('/api/usage/update-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, extraMinutes }),
  });
  return response.json();
}

/**
 * Compiles the entire content suite into a single well-structured Markdown document for download
 */
export function buildExportMarkdown(
  title: string,
  suite: GeneratedContentSuite,
  transcript?: string,
  clips?: VideoClip[]
): string {
  const divider = '\n\n' + '='.repeat(60) + '\n\n';

  let doc = `# ${title} — Unified Content Suite (Text + Video Clips)\n`;
  doc += `Generated on: ${new Date(suite.generatedAt).toLocaleString()}\n`;
  doc += `Created via CastScribe AI (Unified Content Multiplication Platform)\n`;
  doc += divider;

  // 1. Blog Post
  doc += `## 1. BLOG POST DRAFT\n`;
  doc += `**Article Title:** ${suite.blogPost.title}\n`;
  doc += `**Estimated Read Time:** ~${suite.blogPost.readTimeMinutes} minutes | **Target Length:** ${suite.blogPost.lengthOption.toUpperCase()}\n\n`;
  doc += suite.blogPost.content;
  doc += divider;

  // 2. Show Notes
  doc += `## 2. EPISODE SHOW NOTES & SUMMARY\n\n`;
  doc += `### Episode Summary\n${suite.showNotes.episodeSummary}\n\n`;
  doc += `### Key Timestamps\n`;
  suite.showNotes.timestamps.forEach((t) => {
    doc += `- **${t.time}** — ${t.topic}: ${t.description}\n`;
  });
  doc += `\n### Notable Resources & Mentions\n`;
  suite.showNotes.keyResources.forEach((r) => {
    doc += `- ${r}\n`;
  });
  doc += `\n### Memorable Quotes from the Session\n`;
  suite.showNotes.keyQuotes.forEach((q) => {
    doc += `> ${q}\n\n`;
  });
  doc += divider;

  // 3. Social Media Posts
  doc += `## 3. SOCIAL MEDIA POSTS\n\n`;
  doc += `### LinkedIn Posts\n\n`;
  suite.socialPosts.linkedin.forEach((post, i) => {
    doc += `#### LinkedIn Post #${i + 1} (${post.hook})\n`;
    doc += `\`\`\`text\n${post.text}\n\`\`\`\n\n`;
  });

  doc += `### X / Twitter Posts\n\n`;
  suite.socialPosts.twitter.forEach((post, i) => {
    if (post.type === 'thread' && post.threadParts) {
      doc += `#### Twitter Thread #${i + 1}\n`;
      post.threadParts.forEach((part, pi) => {
        doc += `[Tweet ${pi + 1}]:\n${part}\n\n`;
      });
    } else {
      doc += `#### Single Tweet #${i + 1}\n\`\`\`text\n${post.text}\n\`\`\`\n\n`;
    }
  });

  doc += `### Instagram & Facebook Captions\n\n`;
  suite.socialPosts.instagram.forEach((post, i) => {
    doc += `#### Caption #${i + 1}\n\`\`\`text\n${post.caption}\n\`\`\`\n\n`;
  });
  doc += divider;

  // 4. Newsletter
  doc += `## 4. EMAIL NEWSLETTER DRAFT\n\n`;
  doc += `**Primary Subject Line:** ${suite.newsletter.subjectLine}\n\n`;
  doc += `**Alternative Subject Lines:**\n`;
  suite.newsletter.alternateSubjectLines.forEach((s) => {
    doc += `- [${s.style}] ${s.text}\n`;
  });
  doc += `\n**Inbox Preview Snippet:** ${suite.newsletter.previewSnippet}\n\n`;
  doc += `### Email Body\n\`\`\`text\n${suite.newsletter.emailBody}\n\`\`\`\n`;
  doc += divider;

  // 5. Pull Quotes
  doc += `## 5. STANDOUT PULL QUOTES (VERIFIED)\n\n`;
  suite.pullQuotes.forEach((q, i) => {
    doc += `${i + 1}. "${q.quote}"\n   — ${q.speaker}${q.timestamp ? ` (${q.timestamp})` : ''} ${q.isVerified ? '[VERIFIED AGAINST AUDIO]' : '[NEEDS REVIEW]'}\n\n`;
  });

  // 6. Video Clips Summary
  if (clips && clips.length > 0) {
    doc += divider;
    doc += `## 6. SHORT-FORM VIDEO CLIPS (${clips.length} Vertical Cuts)\n\n`;
    clips.forEach((c, i) => {
      doc += `### Clip #${i + 1}: ${c.title}\n`;
      doc += `- **Time Range:** ${c.startTime} - ${c.endTime} (${c.durationSeconds}s)\n`;
      doc += `- **Engagement Score:** ${c.engagementScore}/100 (${c.scoreReason})\n`;
      doc += `- **First 2s Hook Overlay:** "${c.hookText}"\n`;
      doc += `- **Ready-to-Post Caption:** ${c.suggestedCaption}\n`;
      doc += `- **Hashtags:** ${c.hashtags.join(' ')}\n\n`;
    });
  }

  if (transcript) {
    doc += divider;
    doc += `## 7. RAW TIME-CODED TRANSCRIPT\n\n`;
    doc += transcript;
  }

  return doc;
}

/**
 * Builds CSV for scheduling tools (Buffer, Hootsuite, Notion, Airtable)
 */
export function buildSocialPostsCSV(suite: GeneratedContentSuite, title: string): string {
  const rows: string[][] = [
    ['Platform', 'Type', 'Hook / Title', 'Content', 'Hashtags / Notes'],
  ];

  suite.socialPosts.linkedin.forEach((li) => {
    rows.push(['LinkedIn', 'Article / Story', li.hook, `"${li.text.replace(/"/g, '""')}"`, 'Professional / B2B']);
  });

  suite.socialPosts.twitter.forEach((tw) => {
    if (tw.type === 'thread') {
      rows.push(['Twitter / X', 'Thread', 'Thread Hook', `"${(tw.threadParts || []).join('\n---\n').replace(/"/g, '""')}"`, 'Thread']);
    } else {
      rows.push(['Twitter / X', 'Single Post', 'Tweet', `"${tw.text.replace(/"/g, '""')}"`, 'Insight']);
    }
  });

  suite.socialPosts.instagram.forEach((ig) => {
    rows.push(['Instagram', 'Reel / Carousel', 'Caption', `"${ig.caption.replace(/"/g, '""')}"`, ig.hashtags.join(' ')]);
  });

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Exports complete package (Markdown, Subtitles, CSV, Video Clips) as a ZIP file using JSZip
 */
export async function exportAllAsZip(recording: Recording): Promise<Blob> {
  const zip = new JSZip();
  const safeName = recording.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  // 1. Full content suite markdown
  if (recording.contentPieces) {
    const md = buildExportMarkdown(
      recording.title,
      recording.contentPieces,
      recording.transcript,
      recording.videoClips?.clips
    );
    zip.file(`${safeName}_content_suite.md`, md);
    zip.file(`${safeName}_social_schedule.csv`, buildSocialPostsCSV(recording.contentPieces, recording.title));
  }

  // 2. Transcript
  zip.file(`${safeName}_raw_transcript.txt`, recording.transcript);

  // 3. Subtitles folder with .srt files for each clip
  const srtFolder = zip.folder('clip_subtitles');
  if (recording.videoClips?.clips && srtFolder) {
    recording.videoClips.clips.forEach((clip, idx) => {
      let srt = `1\n00:00:00,000 --> 00:00:03,000\n${clip.hookText || clip.title}\n\n`;
      srt += `2\n00:00:03,000 --> 00:00:${clip.durationSeconds.toString().padStart(2, '0')},000\n${clip.transcriptSnippet}\n`;
      srtFolder.file(`${idx + 1}_${clip.title.replace(/[^a-z0-9]/gi, '_')}.srt`, srt);
    });
  }

  // 4. Instructions & metadata file
  const meta = {
    title: recording.title,
    duration: recording.duration,
    format: recording.format,
    generatedAt: new Date().toISOString(),
    clipsCount: recording.videoClips?.clips?.length || 0,
    platform: 'CastScribe AI',
  };
  zip.file('manifest.json', JSON.stringify(meta, null, 2));

  return zip.generateAsync({ type: 'blob' });
}

export function downloadFile(filename: string, content: string | Blob, mimeType = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
