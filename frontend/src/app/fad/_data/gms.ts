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

export const BRAND_VOICE: {
  principles: { title: string; detail: string }[];
  examples: { good: string[]; bad: string[] };
  tones: { situation: string; tone: string }[];
} = {
  principles: [],
  examples: { good: [], bad: [] },
  tones: [],
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

export const LEARNING_SOURCES: LearningSource[] = [];

export const LEARNING_SOURCE_SUMMARY: { origin: string; count: number; teachings: number }[] = [];

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

export const PERFORMANCE_KPI: { label: string; value: string; sub: string }[] = [];

export const AUTOMATIONS: Automation[] = [];
