// @demo:data — Inbox threads, KPIs, calendar — split into multiple endpoints
// Tag: PROD-DATA-1 — see frontend/DEMO_CRUFT.md

export interface InboxMessage {
  from: 'them' | 'us';
  name: string;
  time: string;
  body: string;
}

export type InboxEntity = 'guest' | 'owner' | 'vendor';
export type InboxChannel =
  | 'airbnb'
  | 'booking'
  | 'whatsapp'
  | 'email'
  | 'owner_email'
  | 'owner_whatsapp'
  | 'vendor_breezeway'
  | 'vendor_driver'
  | 'vendor_chef';

/** Stay status — where the guest is in the reservation lifecycle.
 *  Drives Inbox filtering ("Currently staying", "Booked", etc.). */
export type StayStatus = 'inquiry' | 'booked' | 'currently_staying' | 'checked_out' | 'cancelled' | 'na';

/** Internal note attached to a guest/owner/vendor thread. Only visible to the team —
 *  the external party (guest, owner, vendor) never sees these. Supports @mentions. */
export interface InternalNote {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  body: string;
  /** TaskUser ids @mentioned in the note. */
  mentions: string[];
  createdAt: string;
}

export interface InboxThread {
  id: string;
  unread: boolean;
  urgent?: 'red' | 'amber' | 'neutral' | 'accent';
  guest: string;
  subject: string;
  preview: string;
  channel: string;
  entity: InboxEntity;
  channelKey: InboxChannel;
  property: string;
  time: string;
  /** Triage status — used by the Filter sheet (was the All/Unread/Review/Open/Done tabs). */
  triageStatus?: 'unread' | 'review' | 'open' | 'done';
  /** Stay status for guest threads. Owner/vendor threads are 'na'. */
  stayStatus?: StayStatus;
  /** Linked reservation in `_data/reservations.ts:RESERVATIONS`. */
  reservationId?: string;
  /** Whether the current user is @mentioned in this thread. */
  mentionsMe?: boolean;
  messages?: InboxMessage[];
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  language?: 'EN' | 'FR' | 'PT' | 'IT' | 'NL';
  whatsappWindow?: { open: boolean; expiresInMinutes?: number };
}

export const INBOX_THREADS: InboxThread[] = [];

export const INBOX_INTERNAL_NOTES: InternalNote[] = [];

export const INBOX_CHANNEL_TREE = {
  guest: [
    { key: 'airbnb' as InboxChannel, label: 'Airbnb' },
    { key: 'booking' as InboxChannel, label: 'Booking.com' },
    { key: 'whatsapp' as InboxChannel, label: 'WhatsApp' },
    { key: 'email' as InboxChannel, label: 'Email' },
  ],
  owner: [
    { key: 'owner_email' as InboxChannel, label: 'Email' },
    { key: 'owner_whatsapp' as InboxChannel, label: 'WhatsApp' },
  ],
  vendor: [
    { key: 'vendor_breezeway' as InboxChannel, label: 'Breezeway' },
    { key: 'vendor_driver' as InboxChannel, label: 'Driver' },
    { key: 'vendor_chef' as InboxChannel, label: 'Chef' },
  ],
};

export interface Task {
  id: string;
  status: 'todo' | 'progress' | 'done' | 'overdue';
  urgency: 'red' | 'amber' | 'neutral';
  title: string;
  property: string;
  assignee: string;
  due: string;
  source: string;
  done?: boolean;
}

export const TASKS: Task[] = [];

// Legacy `Property` / `PROPERTIES` / `PROP_TABS` removed. Canonical Property
// namespace lives at `_data/properties.ts` (v0.2 LOCKED).

export interface KPI {
  label: string;
  value: string;
  sub: string;
  dir: 'up' | 'down' | null;
}

export const FIN_KPIS: KPI[] = [];

export const FIN_TX: { desc: string; meta: string; amount: string }[] = [];

export const OPS_CLEANS: { prop: string; time: string; status: string; cleaner: string }[] = [];

export const OPS_TICKETS: { prop: string; title: string; urgency: 'red' | 'amber' | 'neutral' }[] = [];

export const LEGAL_CONTRACTS: { kind: string; party: string; status: string; ends: string }[] = [];

export const OWNERS: { name: string; props: number; ytd: string; next: string; status: string }[] = [];

export interface CalEvent {
  /** Day index within the currently-visible window. Assigned at synthesis time. */
  day: number;
  /** Hour 0-23, or -1 if `allDay` is true (event has no specific time). */
  start: number;
  end: number;
  type: 'checkin' | 'checkout' | 'maint' | 'meeting' | 'task';
  title: string;
  /** No specific time — render in the all-day strip / "All day" group. */
  allDay?: boolean;
}

/** Static maintenance + meeting events keyed by absolute date so they survive
 *  calendar navigation. Check-in / check-out come from `_data/reservations.ts:RESERVATIONS`;
 *  task events come from `_data/tasks.ts:TASKS`. */
export interface FixedCalEvent {
  isoDate: string;
  start: number;
  end: number;
  type: 'maint' | 'meeting';
  title: string;
}

export const CAL_EVENTS: FixedCalEvent[] = [];

/* ───── Extended fixtures (tier-2 detail views) ───── */

export interface TaskDetail {
  description: string;
  links: { kind: string; label: string }[];
  comments: { who: string; time: string; body: string }[];
  activity: { time: string; text: string }[];
}

export const TASK_DETAIL: Record<string, TaskDetail> = {
  k1: {
    description:
      'Guest Thibault Marchand arrives Thursday 15:20 at SSR/Plaisance on MK 47 from Paris. Need to confirm driver + early check-in at Villa Azur. Family of 4, 2 young kids.',
    links: [
      { kind: 'Inbox thread', label: 'Marchand · Airbnb' },
      { kind: 'Reservation', label: 'VAZ-APR17' },
    ],
    comments: [
      { who: 'Ishant', time: 'Wed 16:40', body: 'Driver list from Plein Sud — Kamlesh unavailable. Asked Ravi to cover.' },
      { who: 'Bryan', time: 'Wed 17:12', body: 'Ravi confirmed verbally. Need written confirmation before 09:00 tomorrow.' },
    ],
    activity: [
      { time: 'Wed 08:14', text: 'Created from Inbox thread · Marchand' },
      { time: 'Wed 16:40', text: 'Assigned to Bryan · due yesterday' },
      { time: 'Thu 06:00', text: 'Marked overdue' },
    ],
  },
};

export const LEGAL_RENEWALS = [
  { party: 'Blue Bay House · Harrington', kind: 'Management agreement', ends: 'May 2026', action: 'draft renewal' },
  { party: 'Fonseca vendor (groceries)', kind: 'Annual supply', ends: 'Jun 2026', action: 'review T&Cs' },
  { party: 'Beaumont Trust · 2 props', kind: 'Owner agreement', ends: 'Nov 2026', action: 'plan outreach' },
];

export const LEGAL_LICENSES = [
  { name: 'Tourist Authority — classification', holder: 'Friday Retreats Ltd', ends: 'Oct 2026', status: 'active' },
  { name: 'Trade license (Port Louis)', holder: 'Friday Retreats Ltd', ends: 'Jun 2026', status: 'renewal due' },
  { name: 'VAT registration', holder: 'Friday Retreats Ltd', ends: '—', status: 'active' },
  { name: 'Tourism Fund levy registration', holder: 'Friday Retreats Ltd', ends: '—', status: 'active' },
];

export const LEGAL_COMPLIANCE = [
  { item: 'Tourist tax · Apr filing', due: 'May 7', owner: 'Mary', kind: 'Tax', status: 'open' },
  { item: 'Trade license renewal', due: 'Jun 30', owner: 'Mary', kind: 'License', status: 'open' },
  { item: 'MRA VAT return · Q2', due: 'Jul 20', owner: 'Mary', kind: 'Tax', status: 'open' },
  { item: 'PDPA data audit', due: 'Sep 15', owner: 'Ishant', kind: 'Privacy', status: 'scheduled' },
  { item: 'Owner K-1 statements · FY25', due: 'Apr 1', owner: 'Mary', kind: 'Reporting', status: 'done' },
];

export const FIN_PAYOUTS = [
  { id: 'p1', channel: 'Airbnb', period: 'Apr wk 2', amount: 48220, status: 'settled', date: 'Apr 18', ref: 'AXB-8821' },
  { id: 'p2', channel: 'Booking.com', period: 'Apr wk 2', amount: 31504, status: 'settled', date: 'Apr 17', ref: 'BKG-2210' },
  { id: 'p3', channel: 'Airbnb', period: 'Apr wk 3', amount: 38120, status: 'pending', date: 'Apr 25', ref: 'AXB-8822' },
  { id: 'p4', channel: 'Stripe', period: 'Apr wk 3', amount: 12680, status: 'pending', date: 'Apr 23', ref: 'STR-041' },
  { id: 'p5', channel: 'Booking.com', period: 'Apr wk 3', amount: 22840, status: 'pending', date: 'Apr 24', ref: 'BKG-2211' },
  { id: 'p6', channel: 'VRBO', period: 'Apr wk 2', amount: 8450, status: 'settled', date: 'Apr 19', ref: 'VR-334' },
];

export const FIN_REFUNDS = [
  { id: 'r1', guest: 'Fonseca', reason: 'Tourist tax overcharge', amount: 180, date: 'Apr 16', by: 'Mary', status: 'processed' },
  { id: 'r2', guest: 'Nguyen', reason: 'Early checkout — goodwill credit', amount: 1200, date: 'Apr 9', by: 'Mary', status: 'processed' },
  { id: 'r3', guest: 'Ito', reason: 'Cleaning fee adjustment', amount: 500, date: 'Apr 3', by: 'Mary', status: 'processed' },
  { id: 'r4', guest: 'Kalinski', reason: 'Plumbing disruption comp', amount: 320, date: 'Apr 22', by: 'Franny', status: 'pending' },
];

export const TOURIST_TAX = [
  { month: 'Jan', collected: 2860, refunded: 0, owed: 2860, filed: true, filedAt: 'Feb 6' },
  { month: 'Feb', collected: 3210, refunded: 120, owed: 3090, filed: true, filedAt: 'Mar 5' },
  { month: 'Mar', collected: 3480, refunded: 0, owed: 3480, filed: true, filedAt: 'Apr 2' },
  { month: 'Apr', collected: 3320, refunded: 180, owed: 3140, filed: false, filedAt: null },
];

export const OWNER_STATEMENTS = [
  { owner: 'Nitzana Holdings SA', period: 'Apr 2026', gross: 38400, fees: 9960, net: 28440, status: 'ready' },
  { owner: 'Beaumont Family Trust', period: 'Apr 2026', gross: 22100, fees: 5746, net: 16354, status: 'ready' },
  { owner: 'Harrington, D.', period: 'Apr 2026', gross: 14200, fees: 3692, net: 10508, status: 'ready' },
  { owner: 'Chen, Y.', period: 'Apr 2026', gross: 9400, fees: 2444, net: 6956, status: 'draft' },
  { owner: 'Mauritius Coastal Ltd', period: 'Apr 2026', gross: 21300, fees: 5538, net: 15762, status: 'draft' },
];

export const OPS_WEEK = [
  { day: 'Mon', cleans: 3, maint: 1 },
  { day: 'Tue', cleans: 5, maint: 2 },
  { day: 'Wed', cleans: 4, maint: 3 },
  { day: 'Thu', cleans: 5, maint: 1, today: true },
  { day: 'Fri', cleans: 6, maint: 0 },
  { day: 'Sat', cleans: 4, maint: 1 },
  { day: 'Sun', cleans: 2, maint: 0 },
];

export const OPS_ROSTER = [
  { name: 'Priya', role: 'Housekeeping lead', props: ['VAZ', 'LCA'], today: 2, week: 9, status: 'on-duty' },
  { name: 'Renuka', role: 'Housekeeping', props: ['BBH', 'SRT'], today: 1, week: 8, status: 'on-duty' },
  { name: 'Vimla', role: 'Housekeeping', props: ['SBN', 'DMT'], today: 1, week: 7, status: 'on-duty' },
  { name: 'Alex', role: 'Maintenance', props: ['All'], today: 2, week: 6, status: 'on-duty' },
  { name: 'Bryan', role: 'Field ops', props: ['All'], today: 3, week: 14, status: 'on-duty' },
  { name: 'Chef Aarav', role: 'Private chef (on-call)', props: ['BBH', 'VAZ'], today: 0, week: 2, status: 'off' },
  { name: 'Ravi', role: 'Driver (on-call)', props: ['All'], today: 1, week: 4, status: 'on-duty' },
];

export const LEGAL_DOCS = [
  { name: 'Villa Azur · title deed.pdf', kind: 'Title', size: '4.2 MB' },
  { name: 'Nitzana · owner agreement v3.pdf', kind: 'Contract', size: '890 KB' },
  { name: 'Breezeway · MSA 2026.pdf', kind: 'Vendor', size: '320 KB' },
  { name: 'Blue Bay · insurance certificate.pdf', kind: 'Insurance', size: '1.1 MB' },
  { name: 'MRA · VAT registration.pdf', kind: 'License', size: '210 KB' },
  { name: 'Tourism Authority · classification cert.pdf', kind: 'License', size: '480 KB' },
];

/**
 * Calendar week — Mon 2026-04-27 → Sun 2026-05-03. Mon is today.
 * Indices map to `CalEvent.day` (0 = Mon).
 */
export const CAL_DAYS = [
  { label: 'Mon', date: '27', today: true, isoDate: '2026-04-27' },
  { label: 'Tue', date: '28', today: false, isoDate: '2026-04-28' },
  { label: 'Wed', date: '29', today: false, isoDate: '2026-04-29' },
  { label: 'Thu', date: '30', today: false, isoDate: '2026-04-30' },
  { label: 'Fri', date: '01', today: false, isoDate: '2026-05-01' },
  { label: 'Sat', date: '02', today: false, isoDate: '2026-05-02' },
  { label: 'Sun', date: '03', today: false, isoDate: '2026-05-03' },
];
