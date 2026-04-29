// @demo:data — GMS conversations — verify mock vs. real GMS backend
// Tag: PROD-DATA-8 — see frontend/DEMO_CRUFT.md

export interface Teaching {
  id: string;
  instruction: string;
  scope: { kind: 'global' | 'property' | 'property_group'; targets?: string[] };
  channel: 'any' | 'airbnb' | 'booking' | 'whatsapp' | 'email';
  source: 'manual' | 'auto_pattern' | 'approved_reply';
  status: 'active' | 'draft' | 'retired';
  taughtBy: string;
  age: string;
  applications: number;
}

export const TEACHINGS: Teaching[] = [];

export interface LearningCandidate {
  id: string;
  summary: string;
  evidence: { thread: string; edit: string }[];
  confidence: number;
  proposedBy: 'system';
  age: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const LEARNING_QUEUE: LearningCandidate[] = [];

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: 'Property' | 'Policy' | 'Brand' | 'Vendor' | 'Legal';
  body: string;
  lastUpdated: string;
  maintainer: string;
}

export const KNOWLEDGE: KnowledgeEntry[] = [];

export const BRAND_VOICE = {
  principles: [
    { title: 'Warm, not corporate', detail: 'Guests are at a villa on vacation. Drop the formal ladders. Use their first name.' },
    { title: 'Specific, not generic', detail: 'Don\'t say "the team will be in touch". Say "Ravi will meet you at 15:20 with a Friday sign".' },
    { title: 'One action per message', detail: 'Every reply closes with exactly one next step — not a menu of three options.' },
    { title: 'Voice follows language', detail: 'FR: open with "Bonjour". EN: open with first name only. Never mix.' },
  ],
  examples: {
    good: [
      'Bonjour Thibault — all set for Thursday. Ravi will meet you at SSR arrivals at 15:20 with a Friday sign. Anything else you\'d like waiting?',
      'Linde, the chef will prep a 4-course tasting for Saturday night at 19:30. Shall I lock that in?',
    ],
    bad: [
      'Dear valued guest, we have received your inquiry and our team will be in touch shortly with more information.',
      'Thank you for contacting Friday Retreats. We offer a variety of options for your stay. Please review the attached and let us know which works best.',
    ],
  },
  tones: [
    { situation: 'Confirmation / upbeat', tone: 'Warm and specific' },
    { situation: 'Apology / service recovery', tone: 'Own it, action it, move on' },
    { situation: 'Upsell (chef, boat, spa)', tone: 'Confident, one-line, easy yes/no' },
    { situation: 'Owner update', tone: 'Factual, numbered, no filler' },
  ],
};

export interface Automation {
  id: string;
  trigger: string;
  action: string;
  tier: 'auto' | 'internal' | 'external';
  confidence: number;
  active: boolean;
  lastFired: string;
  fires30d: number;
}

export interface LearningSource {
  id: string;
  time: string;
  origin: 'Inbox' | 'Tasks' | 'Owners' | 'Reviews' | 'Guests' | 'Finance' | 'Calendar' | 'System';
  action: string;
  teachingCreated?: string;
  teachingId?: string;
  staff?: string;
}

export const LEARNING_SOURCES: LearningSource[] = [
  { id: 'ls1', time: '14m ago', origin: 'Inbox', action: 'Franny approved reply to Marchand with French greeting', teachingCreated: 'Open FR guest replies with "Bonjour"', teachingId: 't2', staff: 'Franny' },
  { id: 'ls2', time: '42m ago', origin: 'Inbox', action: 'Mathias rephrased compensation message, Friday noted pattern', staff: 'Mathias' },
  { id: 'ls3', time: '2h ago', origin: 'Tasks', action: 'Ishant tagged 4 similar tasks as "Breezeway-priority" consecutively', teachingCreated: 'Draft · Breezeway priority tag auto-applies to safety-issue tasks', staff: 'Ishant' },
  { id: 'ls4', time: '4h ago', origin: 'Owners', action: 'Mary added "statement questions" tag to Harrington thread', staff: 'Mary' },
  { id: 'ls5', time: '1d ago', origin: 'Reviews', action: 'Franny drafted 3 similar apology openings for service recovery', teachingCreated: 'Draft · Start apology replies with specific issue acknowledgment', staff: 'Franny' },
  { id: 'ls6', time: '1d ago', origin: 'Inbox', action: 'System detected 5 early-check-in confirmations all follow same structure', teachingCreated: 'Always state driver name + meet-point in early-check-in confirmations', teachingId: 't3', staff: 'system' },
  { id: 'ls7', time: '2d ago', origin: 'Tasks', action: 'Mathias created manual rule · Nitzana rate ceiling', teachingCreated: 'Never quote Nitzana rates over €850/night without approval', teachingId: 't6', staff: 'Mathias' },
  { id: 'ls8', time: '3d ago', origin: 'Guests', action: 'Friday detected VIP returning-guest pattern in Marchand preferences', staff: 'system' },
  { id: 'ls9', time: '5d ago', origin: 'System', action: 'Weekly pattern synthesis: WhatsApp outside-hours replies are terser', teachingCreated: 'WhatsApp outside-hours replies jump straight to substance', teachingId: 't4', staff: 'system' },
];

export const LEARNING_SOURCE_SUMMARY = [
  { origin: 'Inbox', count: 4, teachings: 2 },
  { origin: 'Tasks', count: 2, teachings: 1 },
  { origin: 'Reviews', count: 1, teachings: 1 },
  { origin: 'Owners', count: 1, teachings: 0 },
  { origin: 'Guests', count: 1, teachings: 0 },
  { origin: 'System', count: 1, teachings: 1 },
];

export interface StaffPerformance {
  name: string;
  role: string;
  conversations: number;
  firstDraftAcceptance: number;
  teachingsContributed: number;
  avgResponseTime: string;
  creditSpend: number;
}

export const STAFF_PERFORMANCE: StaffPerformance[] = [];

export const PERFORMANCE_KPI = [
  { label: 'Avg first-draft acceptance', value: '79%', sub: '+4pp vs Mar · target 85%' },
  { label: 'Teachings applied · 30d', value: '412', sub: 'across 9 properties' },
  { label: 'Active teachings', value: '12', sub: '2 drafts · 1 retired' },
  { label: 'Credits spent · 30d', value: '€ 48.20', sub: '€0.004 / conversation' },
];

export const AUTOMATIONS: Automation[] = [];
