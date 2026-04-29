// @demo:data — HR staff + time-off — GET /api/hr/*
// Tag: PROD-DATA-5 — see frontend/DEMO_CRUFT.md

export interface Review {
  id: string;
  guest: string;
  initials: string;
  rating: number;
  channel: string;
  property: string;
  date: string;
  stay: string;
  status: 'replied' | 'needs-reply' | 'responded';
  sentiment: 'positive' | 'mixed' | 'negative';
  urgent?: boolean;
  title: string;
  body: string;
  reply: string | null;
}

export const REVIEWS: Review[] = [];

export const REVIEWS_KPI: { label: string; value: string; sub: string; warn: boolean }[] = [];

export const REVIEWS_BY_PROPERTY: { property: string; score: number; n: number; trend: string }[] = [];

export interface Guest {
  id: string;
  name: string;
  initials: string;
  country: string;
  stays: number;
  lifetime: string;
  last: string;
  lang: string;
  props: string[];
  tier: 'vip' | 'returning' | 'new';
  notes: string;
}

export const GUESTS: Guest[] = [];

export const GUESTS_KPI: { label: string; value: string; sub: string }[] = [];

export const CAMPAIGNS: any[] = [];

export const CHANNEL_MIX: { channel: string; share: number; revenue: string; color: string }[] = [];

export const MKT_KPI: { label: string; value: string; sub: string }[] = [];

export const LIFECYCLE_EMAILS: any[] = [];

export type LeadPipeline = 'guest' | 'owner' | 'syndic' | 'interior' | 'agency';

export interface Lead {
  id: string;
  name: string;
  source: string;
  contact: string;
  type: string;
  value: string;
  stage: 'inquiry' | 'qualifying' | 'meeting' | 'proposal' | 'won' | 'lost';
  pipeline: LeadPipeline;
  nextStep: string;
  owner: string;
  age: string;
}

export const LEADS: Lead[] = [];

export const LEAD_STAGES = [
  { id: 'inquiry', label: 'Inquiry', description: 'Fresh, not yet qualified' },
  { id: 'qualifying', label: 'Qualifying', description: 'Research + intro call' },
  { id: 'meeting', label: 'Meeting', description: 'Discovery in progress' },
  { id: 'proposal', label: 'Proposal', description: 'Terms out, awaiting' },
  { id: 'won', label: 'Won', description: 'Closed this quarter' },
  { id: 'lost', label: 'Lost', description: 'Closed lost' },
];

export const LEAD_PIPELINES: { id: LeadPipeline; label: string; description: string }[] = [
  { id: 'guest', label: 'Guest', description: 'Booking inquiries pre-confirmation' },
  { id: 'owner', label: 'Owner', description: 'Property owners wanting Friday management' },
  { id: 'syndic', label: 'Syndic', description: 'Building HOAs wanting Friday as syndic' },
  { id: 'interior', label: 'Interior', description: 'Friday-managed owners wanting fit-out' },
  { id: 'agency', label: 'Agency', description: 'Real estate — sales + buyer mandates' },
];

export const LEAD_KPI: { label: string; value: string; sub: string }[] = [];

export const INTEL_OCCUPANCY: { month: string; occ: number }[] = [];

export const INTEL_REVPAR: { month: string; val: number }[] = [];

export const INTEL_KPI: { label: string; value: string; sub: string }[] = [];

export const INTEL_PROPS: { property: string; occ: number; adr: number; revpar: number; sat: number }[] = [];

export const INTEL_DIGEST: { tag: string; text: string }[] = [];

export type IntelInsightKind = 'anomaly' | 'pattern' | 'opportunity' | 'risk';
export interface IntelInsight {
  id: string;
  kind: IntelInsightKind;
  title: string;
  body: string;
  evidence: string;
  module: string;
  age: string;
  confidence: number;
  actions: string[];
}

export const INTEL_INSIGHTS: IntelInsight[] = [];

export const INTEL_PROMPT_LIBRARY: { category: string; prompts: string[] }[] = [];

export const INTEL_WEEKLY_PULSE = { period: "", summary: "", highlights: [], concerns: [] };
