import { Recording, UserProfile, VideoClipsSuite, BrandKit, VideoClip, TranscriptSegment } from '../types';
import { SAMPLE_RECORDINGS } from '../data/samples';

const STORAGE_KEYS = {
  USER_PROFILE: 'castscribe_user_profile_v2',
  RECORDINGS: 'castscribe_recordings_v2',
};

export const DEFAULT_BRAND_KIT: BrandKit = {
  fontFamily: 'Inter',
  captionStyle: 'bold_highlight',
  captionPosition: 'bottom',
  textColor: '#FFFFFF',
  highlightColor: '#FACC15',
  outlineColor: '#000000',
  fontSize: 32,
  showWatermark: true,
  watermarkText: 'CastScribe AI',
  showHookOverlay: true,
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  niche: 'B2B SaaS & Growth Consulting',
  targetAudience: 'Startup founders, bootstrappers, and digital creators',
  tone: 'authoritative',
  brandVoiceSamples: [
    'We don’t do vanity metrics here. Every tactical framework we test must drive either pipeline velocity or cash retention. If it doesn’t move the needle in 30 days, kill it.',
    'The best founders aren’t necessarily the smartest engineers; they are the ones who shorten time-to-value for their customers ruthlessly.'
  ],
  toneProfile: {
    formality: 'Direct & Tactical',
    cadence: 'Crisp, punchy sentence rhythm with contrarian hooks',
    vocabulary: 'Executive business and SaaS metrics without fluffy jargon',
    humor: 'Dry, pragmatic founder realism',
    keyThemes: ['Time-to-Value', 'Pricing Power', 'Unscalable Outbound', 'Niche Positioning']
  },
  plan: 'free',
  recordingsUsed: 0,
  maxRecordings: 1,
  extraMinutes: 0,
  minutesProcessed: 42,
  isFirstGenerationComplete: true,
  dataRetentionDays: 30,
};

const SEED_CLIPS: VideoClip[] = [
  {
    id: 'clip-seed-1',
    title: 'The $19 Pricing Trap: Why Undercharging Destroys Retention',
    hookText: 'Stop charging $19 a month. It signals low quality, not a bargain.',
    suggestedCaption: 'Why charging $19/mo was nearly fatal for this bootstrapped SaaS founder. What happened when they 10x-ed to $199 on a Monday morning 👇',
    hashtags: ['#saaspricing', '#bootstrapping', '#founderlife', '#b2b'],
    startTime: '[06:05]',
    endTime: '[06:28]',
    startSeconds: 365,
    endSeconds: 388,
    durationSeconds: 23,
    engagementScore: 96,
    scoreReason: 'Contrarian financial hook + emotional relief + decisive 10x price shift',
    transcriptSnippet: "We initially priced it at $19 a month. That was embarrassing. We were burning out. A mentor told me: 'If your software saves an agency 20 hours a month, charging $19 signals low quality, not a bargain.' So on a Monday morning, we 10x-ed our price to $199 a month.",
    status: 'ready',
    renderUrl: '/public_clips/clip_seed_1_rendered.mp4',
    aspectRatio: '9:16',
  },
  {
    id: 'clip-seed-2',
    title: 'Unscalable Outbound: 15 Loom Audits Every Morning',
    hookText: 'Zero ad budget. 15 custom Loom videos every morning.',
    suggestedCaption: 'How to close $45k in contract value with zero ad spend using 3-minute personalized Loom audits. Full playbook:',
    hashtags: ['#coldoutreach', '#agencygrowth', '#salesstrategy', '#outbound'],
    startTime: '[13:10]',
    endTime: '[13:34]',
    startSeconds: 790,
    endSeconds: 814,
    durationSeconds: 24,
    engagementScore: 94,
    scoreReason: 'Actionable step-by-step playbook with tangible $45,000 revenue outcome',
    transcriptSnippet: 'We had zero ad budget. Our playbook was 100% video teardowns. I would personally find boutique agencies on LinkedIn, record a 3-minute Loom video walking through their public onboarding workflow, and show where they were leaking hours. That single tactic generated $45,000 in Annual Contract Value.',
    status: 'ready',
    renderUrl: '/public_clips/clip_seed_2_rendered.mp4',
    aspectRatio: '9:16',
  },
  {
    id: 'clip-seed-3',
    title: 'The 15-Minute Time-to-Value Rule for Churn',
    hookText: 'If your customer doesn’t win in 15 minutes, churn will kill you.',
    suggestedCaption: 'The single most overlooked metric for SaaS retention: Time-to-Value. Here is how OpsFlow hit 93% 90-day retention:',
    hashtags: ['#retention', '#productmanagement', '#growthmetrics', '#ttv'],
    startTime: '[25:00]',
    endTime: '[25:20]',
    startSeconds: 1500,
    endSeconds: 1520,
    durationSeconds: 20,
    engagementScore: 91,
    scoreReason: 'High urgency statement backed by a clean mathematical benchmark (TTV < 15 min)',
    transcriptSnippet: 'Obsess over Time-to-Value (TTV). If a customer doesn\'t experience a clear, measurable win within 15 minutes of signing in, your churn is going to destroy your growth curve. We engineered a 1-click template import that delivered the first client report in 4 minutes.',
    status: 'ready',
    renderUrl: '/public_clips/clip_seed_3_rendered.mp4',
    aspectRatio: '9:16',
  },
  {
    id: 'clip-seed-4',
    title: 'The 2,000 Free Signups Nightmare',
    hookText: 'We had 2,000 signups and only 2 paying customers.',
    suggestedCaption: 'The painful reality of building for "everyone". Why niching down to boutique agencies saved this startup from bankruptcy.',
    hashtags: ['#founders', '#positioning', '#marketingstrategy', '#saas'],
    startTime: '[01:42]',
    endTime: '[02:00]',
    startSeconds: 102,
    endSeconds: 120,
    durationSeconds: 18,
    engagementScore: 89,
    scoreReason: 'Relatable founder pain point with dramatic before/after contrast',
    transcriptSnippet: "We built for everyone. We said OpsFlow was for 'busy knowledge workers'. That meant nobody felt an urgent need to buy it. We had 2,000 free signups and exactly two paid conversions. The turning point was ruthlessly nicheing down specifically to boutique marketing agencies.",
    status: 'ready',
    renderUrl: '/public_clips/clip_seed_4_rendered.mp4',
    aspectRatio: '9:16',
  },
  {
    id: 'clip-seed-5',
    title: 'Specificity Creates Urgency',
    hookText: 'Broad software is a toy. Specific software is a must-have.',
    suggestedCaption: 'Why vague positioning attracts tire-kickers, while specific positioning closes 14% conversion rates:',
    hashtags: ['#nichemarketing', '#b2bsales', '#positioning', '#conversion'],
    startTime: '[05:20]',
    endTime: '[05:39]',
    startSeconds: 320,
    endSeconds: 339,
    durationSeconds: 19,
    engagementScore: 86,
    scoreReason: 'Strong philosophical contrast that reframes how founders think about TAM',
    transcriptSnippet: 'That is a massive lesson. Specificity creates urgency. When nobody feels an urgent need to buy your software, you don\'t have a product; you have a toy.',
    status: 'ready',
    renderUrl: '/public_clips/clip_seed_5_rendered.mp4',
    aspectRatio: '9:16',
  },
  {
    id: 'clip-seed-6',
    title: 'Grandfather Nobody: The High-Ticket Shift',
    hookText: 'High-ticket clients want enterprise accountability, not a bargain.',
    suggestedCaption: 'How to transition your pricing without losing your best customers. Silence is your weapon in pricing negotiations.',
    hashtags: ['#consulting', '#pricingpower', '#highvalue', '#negotiation'],
    startTime: '[06:40]',
    endTime: '[06:54]',
    startSeconds: 400,
    endSeconds: 414,
    durationSeconds: 14,
    engagementScore: 85,
    scoreReason: 'Psychological insight into how enterprise and high-tier buyers perceive pricing',
    transcriptSnippet: 'High-tier clients want accountability and enterprise-grade reliability, not a toy. We grandfathered nobody except our original five loyal users. Sales actually increased that month.',
    status: 'ready',
    renderUrl: '/public_clips/clip_seed_6_rendered.mp4',
    aspectRatio: '9:16',
  },
];

const SEED_SEGMENTS: TranscriptSegment[] = [
  {
    id: 'seg-0',
    speaker: 'Maya Vance',
    start: '[00:00]',
    end: '[00:28]',
    startSeconds: 0,
    endSeconds: 28,
    text: "Welcome back to The Unfunded Journey. Today I'm joined by Liam Carter, co-founder of OpsFlow, who took a simple workflow automation tool from zero to $1.2 million ARR in eighteen months—completely bootstrapped. Liam, welcome to the show!",
  },
  {
    id: 'seg-1',
    speaker: 'Liam Carter',
    start: '[00:28]',
    end: '[01:15]',
    startSeconds: 28,
    endSeconds: 75,
    text: "Thanks Maya, it's so great to be here. Honestly, the first six months felt like screaming into an empty canyon, so it's wild to look back on how the momentum shifted once we changed our positioning.",
  },
  {
    id: 'seg-2',
    speaker: 'Maya Vance',
    start: '[01:15]',
    end: '[01:42]',
    startSeconds: 75,
    endSeconds: 102,
    text: "Let's start right there. When you launched version 1.0, what was the biggest mistake you made that almost killed the company before you got your first ten paying customers?",
  },
  {
    id: 'seg-3',
    speaker: 'Liam Carter',
    start: '[01:42]',
    end: '[05:20]',
    startSeconds: 102,
    endSeconds: 320,
    text: "We built for everyone. We said OpsFlow was for 'busy knowledge workers'. That meant nobody felt an urgent need to buy it. We had 2,000 free signups and exactly two paid conversions. I was working 16 hours a day doing customer support for people paying zero dollars. The turning point was ruthlessly nicheing down specifically to boutique marketing agencies managing more than 15 client accounts. Once we solved their exact headache—client onboarding handoffs—our conversion rate jumped from 0.1% to 14%.",
  },
  {
    id: 'seg-4',
    speaker: 'Maya Vance',
    start: '[05:20]',
    end: '[06:05]',
    startSeconds: 320,
    endSeconds: 365,
    text: "That's a massive lesson. Specificity creates urgency. How did you handle pricing? Most founders severely undercharge when starting out.",
  },
  {
    id: 'seg-5',
    speaker: 'Liam Carter',
    start: '[06:05]',
    end: '[12:30]',
    startSeconds: 365,
    endSeconds: 750,
    text: "We initially priced it at $19 a month. That was embarrassing. We were burning out. A mentor told me: 'If your software saves an agency 20 hours a month, charging $19 signals low quality, not a bargain.' So on a Monday morning, we 10x-ed our price to $199 a month and grandfathered nobody except our original five loyal users. Sales actually increased that month. High-tier clients want accountability and enterprise-grade reliability, not a toy.",
  },
  {
    id: 'seg-6',
    speaker: 'Maya Vance',
    start: '[12:30]',
    end: '[13:10]',
    startSeconds: 750,
    endSeconds: 790,
    text: "What about your customer acquisition channel? Were you running paid search ads or cold outreach?",
  },
  {
    id: 'seg-7',
    speaker: 'Liam Carter',
    start: '[13:10]',
    end: '[24:18]',
    startSeconds: 790,
    endSeconds: 1458,
    text: "We had zero ad budget. Our playbook was 100% video teardowns. I would personally find boutique agencies on LinkedIn, record a 3-minute Loom video walking through their public onboarding workflow, and show where they were leaking hours. I sent 15 bespoke Loom videos every weekday morning. Within 60 days, that single tactic generated $45,000 in Annual Contract Value. It was unscalable at first, but unscalable efforts build the engine that lets you scale later.",
  },
  {
    id: 'seg-8',
    speaker: 'Liam Carter',
    start: '[25:00]',
    end: '[38:40]',
    startSeconds: 1500,
    endSeconds: 2320,
    text: "Obsess over Time-to-Value (TTV). If a customer doesn't experience a clear, measurable win within 15 minutes of signing in, your churn is going to destroy your growth curve. We engineered a 1-click template import that delivered the first client report in 4 minutes. Our 90-day retention skyrocketed to 93%.",
  },
];

export const INITIAL_SEED_RECORDING: Recording = {
  id: 'rec-seed-1',
  title: 'Ep. 42 — Bootstrapping from $0 to $1.2M ARR Without Venture Capital',
  originalFileName: 'unfunded_journey_ep42_final.mp3',
  format: 'MP3 Audio',
  duration: '42:15',
  durationSeconds: 2535,
  fileSizeBytes: 41943040,
  createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  status: 'ready',
  sourceType: 'sample',
  isAudioOnly: false,
  mediaUrl: '/public_clips/clip_seed_1_rendered.mp4',
  transcript: SAMPLE_RECORDINGS[0].transcript,
  segments: SEED_SEGMENTS,
  context: {
    title: 'Ep. 42 — Bootstrapping from $0 to $1.2M ARR',
    speakers: 'Maya Vance (Host), Liam Carter (Founder of OpsFlow)',
    roles: 'Host & SaaS Founder',
    topic: 'Bootstrapping B2B SaaS, Niche Positioning, 10x Pricing, Loom Outbound',
    glossary: 'OpsFlow, TTV, ARR, ACV, Boutique Agencies',
    audience: 'Bootstrapped founders, B2B SaaS builders, consultants',
    sourceLanguage: 'English',
    outputLanguage: 'English',
  },
  validationReport: {
    isValid: true,
    detectedLanguage: 'English (Detected)',
    wordsPerMinute: 152,
    totalWords: 520,
    durationSeconds: 2535,
    speechConfidence: 0.98,
    warnings: [],
  },
  contentPieces: {
    blogPost: {
      title: 'How to Bootstrap a B2B SaaS from $0 to $1.2M ARR (Without Spending a Dime on Ads)',
      readTimeMinutes: 6,
      lengthOption: 'long',
      isVerified: true,
      source_ranges: [{ start: '[01:42]', end: '[25:00]', quote: 'Obsess over Time-to-Value' }],
      content: `# How to Bootstrap a B2B SaaS from $0 to $1.2M ARR (Without Spending a Dime on Ads)

When Liam Carter launched OpsFlow, he committed the classic early-stage mistake: **building for everyone**. 

With a broad positioning statement claiming OpsFlow was for "busy knowledge workers," the company attracted over 2,000 signups—and precisely two paying customers. Liam was clocking 16-hour days fielding customer support tickets for users who were paying zero dollars.

Here is the exact framework Liam used to pivot OpsFlow from near-death into a **$1.2 million ARR bootstrapped engine in eighteen months**.

---

## 1. Ruthless Niche Specialization Beats Broad Utility

Broad software invites casual tire-kickers; hyper-specific software solves urgent bleeding-neck problems. 

Liam made the terrifying decision to stop marketing to generic knowledge workers. Instead, OpsFlow restructured its entire onboarding and feature set exclusively for **boutique marketing agencies managing 15+ client accounts**.

> *"When nobody feels an urgent need to buy your software, you don’t have a product; you have a toy. The moment we targeted agency onboarding handoffs, our conversion rate skyrocketed from 0.1% to 14%."* [01:42]

---

## 2. The $19 Trap: Why Undercharging Destroys Retention

Early in their journey, OpsFlow charged $19 per month. Counterintuitively, this low price point hurt sales rather than boosting them. In high-value B2B ecosystems, **price is a signal of quality**. 

### The 10x Price Shift
On a single Monday morning, Liam took decisive action:
1. Raised the standard price from **$19/mo to $199/mo** (a 10x increase). [06:05]
2. Grandfathered only the original five earliest adopters.
3. Repositioned the tier from a "budget helper" to an "enterprise workflow guarantee."

**The result?** Total customer conversions actually increased that month. Higher prices attracted serious agency owners who valued outcome accountability over cheap software subscriptions.

---

## 3. The Unscalable Acquisition Playbook: 15 Loom Teardowns a Day

With zero budget for Google Search or LinkedIn ads, OpsFlow relied on high-touch organic outbound. Every weekday morning between 7:30 AM and 9:30 AM, Liam found 15 target agencies on LinkedIn. He recorded a personalized 3-minute Loom video for each agency, politely pointing out 2-3 specific friction points in their public client onboarding funnel.

- **Outbound volume:** 15 custom videos / day [13:10]
- **Response rate:** 38%
- **60-Day Closed Revenue:** $45,000 Annual Contract Value

Unscalable manual outreach builds the foundational empathy and proof points that allow you to automate marketing later.

---

## 4. The Golden Metric: Time-to-Value (TTV)

For any founder stuck between $5k and $10k MRR, user churn is usually the silent killer. Liam’s team solved this by obsessing over **Time-to-Value**: deliver a measurable, dopamine-inducing win within 15 minutes of signup. [25:00]`,
    },
    showNotes: {
      episodeSummary:
        'In this tactical session, Liam Carter (founder of OpsFlow) breaks down how he scaled a workflow automation tool from zero to $1.2M ARR in 18 months without outside funding. We explore overcoming the 2,000-signup plateau, the psychology of 10x price increases, and sending 15 video audits every morning.',
      timestamps: [
        { time: '[00:00]', topic: 'Episode Introduction', description: 'Maya Vance introduces Liam Carter and the bootstrapped milestone of OpsFlow.', source_ranges: [{ start: '[00:00]', end: '[00:28]' }] },
        { time: '[01:42]', topic: 'The Broad Positioning Trap', description: 'Why 2,000 signups resulted in only two paying users and how nicheing to boutique agencies saved the company.', source_ranges: [{ start: '[01:42]', end: '[05:20]' }] },
        { time: '[06:05]', topic: 'Escaping the $19/mo Price Trap', description: 'Raising prices from $19 to $199 on a Monday morning and why high prices increase sales.', source_ranges: [{ start: '[06:05]', end: '[12:30]' }] },
        { time: '[13:10]', topic: 'The 15 Loom Audits Outbound Playbook', description: 'Zero ad budget outbound: recording 15 personalized 3-minute video audits every weekday.', source_ranges: [{ start: '[13:10]', end: '[24:18]' }] },
        { time: '[25:00]', topic: 'Time-to-Value (TTV) & 93% Retention', description: 'How delivering a customer win in under 4 minutes boosted 90-day retention to 93%.', source_ranges: [{ start: '[25:00]', end: '[38:40]' }] },
      ],
      keyResources: [
        'OpsFlow (opsflow.io) — Workflow automation for boutique marketing agencies',
        'Loom — Video recording tool used for personalized outbound teardowns',
        'Toggl — Mentioned as an hourly tracking pitfall in services',
      ],
      keyQuotes: [
        'When nobody feels an urgent need to buy it, you don’t have a product; you have a toy.',
        'If your software saves an agency 20 hours a month, charging $19 signals low quality, not a bargain.',
        'Unscalable efforts build the engine that lets you scale later.',
      ],
    },
    socialPosts: {
      linkedin: [
        {
          id: 'li-seed-1',
          hook: 'We had 2,000 signups and exactly two paying customers.',
          isVerified: true,
          source_ranges: [{ start: '[01:42]', end: '[02:30]' }],
          text: `We had 2,000 signups and exactly two paying customers.

I was working 16 hours a day doing customer support for people who paid us zero dollars.

Here's the mistake:
We said OpsFlow was for "busy knowledge workers."

"Everyone" is not a target audience.
When you build for everyone, nobody feels an urgent need to buy.

The turning point?
We ruthlessly niched down exclusively to boutique marketing agencies managing 15+ client accounts.

The result:
• Conversion rate skyrocketed from 0.1% to 14%
• Raised prices from $19/mo to $199/mo
• Scaled to $1.2M ARR in 18 months—100% bootstrapped

Narrowing your focus feels terrifying, but specificity is magnetic.

Who is your hyper-specific target customer right now?`,
        },
        {
          id: 'li-seed-2',
          hook: 'If your software saves an agency 20 hours a month, charging $19 signals low quality, not a bargain.',
          isVerified: true,
          source_ranges: [{ start: '[06:05]', end: '[07:00]' }],
          text: `On a random Monday morning, Liam Carter 10x-ed his SaaS price from $19/month to $199/month.

He grandfathered nobody except his first 5 users.

What happened next blew his mind:
Sales actually increased.

Why?
In B2B, price is a signal of security, reliability, and executive accountability.
When you charge $19, enterprise buyers assume your software will break.

When you charge $199, they view you as a strategic workflow partner.

Stop apologizing for your pricing. Charge for the value of the headache you remove.`,
        },
      ],
      twitter: [
        {
          id: 'tw-seed-1',
          type: 'single',
          isVerified: true,
          source_ranges: [{ start: '[13:10]', end: '[14:00]' }],
          text: 'Zero ad budget playbook that generated $45k in ACV:\n\nSend 15 bespoke 3-minute Loom video audits every weekday morning pointing out specific leaks in client onboarding.\n\nUnscalable efforts build the engine that lets you scale later.',
        },
        {
          id: 'tw-seed-2',
          type: 'single',
          isVerified: true,
          source_ranges: [{ start: '[25:00]', end: '[25:40]' }],
          text: 'The best founders obsess over Time-to-Value (TTV).\n\nIf a user doesn’t experience a clear, measurable win within 15 minutes of signing into your tool, your 90-day churn will devour your growth curve.',
        },
        {
          id: 'tw-seed-3',
          type: 'thread',
          isVerified: true,
          source_ranges: [{ start: '[00:00]', end: '[25:00]' }],
          text: 'How OpsFlow went from 2 paying customers to $1.2M ARR bootstrapped (without spending $1 on ads):\n\nA masterclass in niche positioning and unscalable outbound 🧵👇',
          threadParts: [
            '1/ Stop building for "busy knowledge workers." Broad positioning attracts 2,000 tire-kickers who pay zero. Specific positioning for boutique agencies turned a 0.1% conversion rate into 14%.',
            '2/ Escaping the $19 trap. Low prices attract high churn. OpsFlow 10x-ed their price to $199/month on a Monday morning—and conversions increased.',
            '3/ 15 Loom videos every weekday morning. Zero ad budget. Just 3-minute customized audits sent to agency owners pointing out client onboarding bottlenecks.',
            '4/ Obsess over Time-to-Value (TTV). They cut their first-win time down to 4 minutes with 1-click template imports. 90-day retention hit 93%.',
            '5/ TL;DR:\n• Niche down until it hurts\n• Price for value, not modesty\n• Do the unscalable video outreach\n• Deliver a win in under 15 minutes',
          ],
        },
      ],
      instagram: [
        {
          id: 'ig-seed-1',
          isVerified: true,
          source_ranges: [{ start: '[01:42]', end: '[02:30]' }],
          caption: `Stop trying to build for everyone. 🛑\n\nWhen Liam Carter launched his B2B SaaS OpsFlow, he said it was for "knowledge workers."\nResult? 2,000 signups, exactly 2 paying users, and 16-hour burnout days.\n\nThe game changed when he niched down specifically to boutique agencies:\n✨ Conversion jumped from 0.1% to 14%\n✨ Raised prices from $19 to $199/mo\n✨ Hit $1.2M ARR completely bootstrapped\n\nSpecificity isn't limiting—it's magnetic.\n\nDrop a 🔥 if you needed this reminder to narrow your focus this week.\n\n#bootstrapping #saasgrowth #entrepreneurship #pricingstrategy #foundersjourney #agencygrowth`,
          hashtags: ['#bootstrapping', '#saasgrowth', '#entrepreneurship', '#pricingstrategy'],
        },
      ],
    },
    newsletter: {
      subjectLine: 'Why $19/mo software is harder to sell than $199/mo',
      alternateSubjectLines: [
        { style: 'Curiosity Hook', text: "The Monday morning decision that 10x-ed this founder's SaaS" },
        { style: 'Contrarian Take', text: 'Why being cheap is killing your customer retention' },
        { style: 'Action Oriented', text: 'The 15-minute rule that took OpsFlow to $1.2M ARR' },
      ],
      previewSnippet: 'How Liam Carter stopped building for "everyone" and built a $1.2M ARR powerhouse with zero ad budget.',
      isVerified: true,
      source_ranges: [{ start: '[00:00]', end: '[25:00]' }],
      emailBody: `Hey friend,

If you’ve ever launched something you poured your soul into—only to hear crickets—this story is for you.

Last week, I sat down with Liam Carter, co-founder of OpsFlow.

In his first six months, Liam had 2,000 free signups and exactly two paying customers. He was answering customer support tickets until 2 AM for people paying him zero dollars.

Here’s the turning point:

1. He stopped building for "busy knowledge workers"
"Everyone" is not a target audience. He niched down exclusively to boutique marketing agencies. Conversion rate jumped from 0.1% to 14% overnight.

2. He 10x-ed his price on a Monday morning
He went from $19/month to $199/month. When software is too cheap, serious buyers assume it will break. His sales actually increased.

3. He sent 15 personalized Loom teardowns every single day
Zero ad spend. Just 3-minute videos auditing agency onboarding leaks. That single playbook generated $45k in annual contract value in 60 days.

4. He cut Time-to-Value (TTV) to 4 minutes
If your customer doesn't experience a high-five moment in the first 15 minutes, they won't stick around.

The big question for you this week:
Where in your business are you undercharging or trying to speak to too broad of an audience?

Hit reply and let me know—I read every single response.

Best,
Alex`,
    },
    pullQuotes: [
      {
        id: 'q-seed-1',
        quote: 'When nobody feels an urgent need to buy it, you don’t have a product; you have a toy.',
        speaker: 'Liam Carter',
        timestamp: '[01:42]',
        category: 'Positioning',
        isVerified: true,
        matchScore: 100,
        source_ranges: [{ start: '[01:42]', end: '[02:00]' }],
      },
      {
        id: 'q-seed-2',
        quote: 'If your software saves an agency 20 hours a month, charging $19 signals low quality, not a bargain.',
        speaker: 'Liam Carter',
        timestamp: '[06:05]',
        category: 'Pricing',
        isVerified: true,
        matchScore: 100,
        source_ranges: [{ start: '[06:05]', end: '[06:20]' }],
      },
      {
        id: 'q-seed-3',
        quote: 'Unscalable efforts build the engine that lets you scale later.',
        speaker: 'Liam Carter',
        timestamp: '[13:10]',
        category: 'Outbound Growth',
        isVerified: true,
        matchScore: 100,
        source_ranges: [{ start: '[13:10]', end: '[13:25]' }],
      },
      {
        id: 'q-seed-4',
        quote: 'Obsess over Time-to-Value. If a customer doesn’t experience a clear win within 15 minutes of signing in, churn will destroy your growth curve.',
        speaker: 'Liam Carter',
        timestamp: '[25:00]',
        category: 'Retention',
        isVerified: true,
        matchScore: 100,
        source_ranges: [{ start: '[25:00]', end: '[25:20]' }],
      },
      {
        id: 'q-seed-5',
        quote: 'Specificity creates urgency.',
        speaker: 'Maya Vance',
        timestamp: '[05:20]',
        category: 'Positioning',
        isVerified: true,
        matchScore: 100,
        source_ranges: [{ start: '[05:20]', end: '[05:30]' }],
      },
    ],
    generatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  videoClips: {
    clips: SEED_CLIPS,
    brandKit: DEFAULT_BRAND_KIT,
    isAudioOnly: false,
    generatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    renderEngine: 'server_ffmpeg',
  },
  chatHistory: [
    {
      id: 'chat-seed-1',
      sender: 'assistant',
      text: 'Hello! I am your **Ask This Recording** intelligence partner. I am strictly grounded in this conversation between Maya Vance and Liam Carter. You can ask for exact quotes, timecodes, frameworks, or ask me to draft custom summaries or Twitter threads based only on what was spoken.',
      createdAt: new Date().toISOString(),
    },
  ],
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load user profile from storage', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function loadRecordings(): Recording[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade seed recording if present in cache to ensure loud clear clips
        const upgraded = parsed.map((rec) => {
          if (rec.id === 'rec-seed-1') {
            return {
              ...rec,
              mediaUrl: rec.mediaUrl || '/public_clips/clip_seed_1_rendered.mp4',
              videoClips: {
                ...(rec.videoClips || INITIAL_SEED_RECORDING.videoClips),
                clips: SEED_CLIPS,
              },
            };
          }
          return rec;
        });
        return upgraded;
      }
    }
  } catch (e) {
    console.error('Failed to load recordings from storage', e);
  }
  return [INITIAL_SEED_RECORDING];
}

export function saveRecordings(recordings: Recording[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDINGS, JSON.stringify(recordings));
  } catch (e) {
    console.error('Failed to save recordings', e);
  }
}
