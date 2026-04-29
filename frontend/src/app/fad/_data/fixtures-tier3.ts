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

export const REVIEWS_KPI = [
  { label: 'Avg rating', value: '4.6', sub: '+0.1 vs Mar', warn: false },
  { label: 'Needs reply', value: '3', sub: '1 urgent', warn: true },
  { label: 'SLA median', value: '2h 14m', sub: 'target <6h', warn: false },
  { label: 'Response rate', value: '94%', sub: '30-day', warn: false },
];

export const REVIEWS_BY_PROPERTY = [
  { property: 'Villa Azur', score: 4.9, n: 42, trend: '+0.1' },
  { property: 'Blue Bay House', score: 4.8, n: 38, trend: '+0.0' },
  { property: 'Ocean Terrace', score: 4.9, n: 29, trend: '+0.2' },
  { property: 'Coral Reef', score: 4.3, n: 31, trend: '−0.1' },
  { property: 'Sable Noir', score: 4.2, n: 27, trend: '−0.2' },
  { property: 'Nitzana · Orchidée', score: 4.8, n: 8, trend: '—' },
];

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

export const GUESTS_KPI = [
  { label: 'Active guests', value: '184', sub: 'past 90 days' },
  { label: 'Returning rate', value: '38%', sub: '+4pp vs Mar' },
  { label: 'Avg LTV', value: '€ 11,420', sub: 'top 20% · €28k' },
  { label: 'VIP guests', value: '21', sub: '11% of active' },
];

export const CAMPAIGNS: any[] = [];

export const CHANNEL_MIX = [
  { channel: 'Airbnb', share: 0.44, revenue: 'YTD €184k', color: '#2B4A93' },
  { channel: 'Booking.com', share: 0.22, revenue: 'YTD €92k', color: '#4A6BB8' },
  { channel: 'Direct', share: 0.22, revenue: 'YTD €94k', color: '#6B8DDC' },
  { channel: 'Referral', share: 0.08, revenue: 'YTD €34k', color: '#8FAEE8' },
  { channel: 'Agent', share: 0.04, revenue: 'YTD €18k', color: '#B5CAF0' },
];

export const MKT_KPI = [
  { label: 'Direct share', value: '22%', sub: 'goal 25% · +2pp QoQ' },
  { label: 'Email opens', value: '41%', sub: 'industry avg 22%' },
  { label: 'Campaign ROI', value: '4.1×', sub: '30-day attributed' },
  { label: 'Cost per acq.', value: '€ 142', sub: '−€18 vs Mar' },
];

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

export const LEAD_KPI = [
  { label: 'Active pipeline', value: '19', sub: '15 open · 3 closed · 1 lost' },
  { label: 'Weighted value', value: '€ 3.3M', sub: 'next 12 months incl. guest' },
  { label: 'Win rate · 90d', value: '41%', sub: '+6pp vs Q4' },
  { label: 'Avg time to close', value: '34d', sub: 'median · owners' },
];

export const INTEL_OCCUPANCY = [
  { month: 'Nov', occ: 0.62 }, { month: 'Dec', occ: 0.88 }, { month: 'Jan', occ: 0.81 },
  { month: 'Feb', occ: 0.74 }, { month: 'Mar', occ: 0.79 }, { month: 'Apr', occ: 0.83 },
];

export const INTEL_REVPAR = [
  { month: 'Nov', val: 168 }, { month: 'Dec', val: 241 }, { month: 'Jan', val: 212 },
  { month: 'Feb', val: 198 }, { month: 'Mar', val: 219 }, { month: 'Apr', val: 234 },
];

export const INTEL_KPI = [
  { label: 'Occupancy · 90d', value: '79%', sub: '+3pp vs LY' },
  { label: 'ADR', value: '€ 312', sub: '+€14 vs LY' },
  { label: 'RevPAR', value: '€ 246', sub: '+6% vs LY' },
  { label: 'Guest sat', value: '4.6 / 5', sub: '+0.1 vs Q1' },
];

export const INTEL_PROPS = [
  { property: 'Villa Azur', occ: 0.91, adr: 380, revpar: 346, sat: 4.9 },
  { property: 'Blue Bay House', occ: 0.88, adr: 395, revpar: 348, sat: 4.8 },
  { property: 'Ocean Terrace', occ: 0.85, adr: 340, revpar: 289, sat: 4.9 },
  { property: 'Sable Noir', occ: 0.76, adr: 310, revpar: 236, sat: 4.2 },
  { property: 'Coral Reef', occ: 0.72, adr: 280, revpar: 202, sat: 4.3 },
  { property: 'Nitzana · Orchidée', occ: 0.68, adr: 420, revpar: 286, sat: 4.8 },
  { property: 'Nitzana · Jacaranda', occ: 0.64, adr: 430, revpar: 275, sat: 4.6 },
  { property: 'Dauphin Lodge', occ: 0.58, adr: 240, revpar: 139, sat: 4.4 },
];

export const INTEL_DIGEST = [
  { tag: 'Revenue', text: "April pacing +9% vs April '25. Direct-book share holding at 22%; Airbnb share slipping 2pp on Sable Noir only." },
  { tag: 'Ops', text: "Coral Reef wifi complaints doubled in Apr (2 → 4). Router replacement scheduled this week — recommend keeping the ticket open until post-review signal confirms fix." },
  { tag: 'Pipeline', text: "Nitzana Phase 2 contract now in redlines. If closed by May 15, Q2 weighted pipeline rises to €2.7M and Ops should plan onboarding 6 villas before July peak." },
];

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

export const INTEL_INSIGHTS: IntelInsight[] = [
  {
    id: 'i1',
    kind: 'anomaly',
    title: 'Sable Noir rating dropped 0.2 in 30 days',
    body: '4.4 → 4.2 average. Three reviews mention "hot water issue" — maintenance records show a heater replacement Apr 14 but signal hasn\'t recovered yet.',
    evidence: '3 reviews · Coral Reef vs Sable Noir divergence · sentiment dip confirmed',
    module: 'reviews',
    age: '2h ago',
    confidence: 0.91,
    actions: ['Open review thread', 'Draft owner note', 'Link to Ops ticket'],
  },
  {
    id: 'i2',
    kind: 'opportunity',
    title: 'Nitzana pacing ahead of soft-launch plan',
    body: '45% occupancy in April vs 25% projected for soft-launch. Direct-book channel at 40% (vs 22% portfolio avg). Suggest tightening rates 8–12% for May-June.',
    evidence: 'Reservation count +180% vs plan · direct-book overperforming · no negative signal yet',
    module: 'properties',
    age: '1d ago',
    confidence: 0.84,
    actions: ['Simulate rate change', 'Open Analytics · Occupancy', 'Draft owner update to Nitzana'],
  },
  {
    id: 'i3',
    kind: 'risk',
    title: 'First-draft acceptance dropped 4pp this week',
    body: 'Mathias and Franny both dipped. Pattern: 6 of 12 rejected drafts were early check-in requests — current Friday template may be missing driver-name specificity rule.',
    evidence: '12 rejected drafts · both managers affected · teaching t3 appears under-applied',
    module: 'training',
    age: '4h ago',
    confidence: 0.78,
    actions: ['Review teaching t3', 'Open sample rejections', 'Retrain pattern'],
  },
  {
    id: 'i4',
    kind: 'pattern',
    title: 'Weekend check-ins take 2.3× longer to reply to',
    body: 'Saturday/Sunday guest messages averaging 18m response time vs 8m on weekdays. Most of this is WhatsApp window-closed replies waiting for template pick.',
    evidence: '84 threads · response-time correlation to day-of-week confirmed',
    module: 'inbox',
    age: '2d ago',
    confidence: 0.88,
    actions: ['Set up weekend template suggestions', 'Open Automations'],
  },
  {
    id: 'i5',
    kind: 'anomaly',
    title: 'Mary\'s handover: 2 items at risk',
    body: 'Mary is off after May 15. Tourist tax filing (due May 7) is on track. Apr statement run hasn\'t been started yet (target May 3). At current pace, could slip.',
    evidence: 'Task progress · historical run time · no assignee backup scheduled',
    module: 'tasks',
    age: '6h ago',
    confidence: 0.86,
    actions: ['Assign backup', 'Message Mary', 'Block calendar'],
  },
];

export const INTEL_PROMPT_LIBRARY = [
  {
    category: 'This morning',
    prompts: [
      'What needs my attention today?',
      "Any urgent maintenance I haven't seen?",
      'What did Friday do overnight?',
    ],
  },
  {
    category: 'Revenue & pricing',
    prompts: [
      'Why is April pacing lower than March?',
      'Where is our biggest margin opportunity?',
      'Should we raise Nitzana rates?',
      'Which properties are priced below market?',
    ],
  },
  {
    category: 'Guests & reviews',
    prompts: [
      'What drove the April rating change?',
      'Any returning guests arriving this week?',
      'Which property has the most negative sentiment?',
      'Summarize the last 20 reviews',
    ],
  },
  {
    category: 'Operations',
    prompts: [
      'What\'s slowing us down this month?',
      'Where are we over-capacity?',
      'Which vendor has the most open tickets?',
      "Compare housekeeping SLA property by property",
    ],
  },
  {
    category: 'Team & performance',
    prompts: [
      'How is each teammate performing?',
      'Which teachings are underperforming?',
      'Where is Friday drafting being rejected most?',
    ],
  },
];

export const INTEL_WEEKLY_PULSE = {
  period: 'Apr 14 — Apr 20',
  summary:
    'Strong operational week despite two urgent incidents. Revenue pacing holds +9% vs last year; guest satisfaction ticked up 0.1 on warmer reviews from Villa Azur and Blue Bay. The single drag is Sable Noir — rating dipped 0.2 after a hot-water incident that\'s now been resolved, but sentiment hasn\'t recovered yet.',
  highlights: [
    'Nitzana soft-launch exceeded plan · 45% occupancy',
    '12 check-ins handled · 1 returning guest (Marchand)',
    'Tourist tax filing on track for May 7',
    '4 review replies drafted · 3 approved as-is',
  ],
  concerns: [
    'Sable Noir rating dip · sentiment lag after fix',
    'Mary handover · statement run not yet started',
    'WhatsApp window-closed backlog on weekends',
  ],
};
