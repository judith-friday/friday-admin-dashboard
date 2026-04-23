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
  messages?: InboxMessage[];
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  language?: 'EN' | 'FR' | 'PT' | 'IT' | 'NL';
  whatsappWindow?: { open: boolean; expiresInMinutes?: number };
}

export const INBOX_THREADS: InboxThread[] = [
  {
    id: 't1', unread: true, urgent: 'amber', entity: 'guest', channelKey: 'airbnb',
    guest: 'Thibault Marchand', subject: 'Arrival transfer from Plaisance — pls confirm',
    preview: 'Hi Friday team, our flight lands at 15:20 on Thursday. Can you confirm the driver will meet us at…',
    channel: 'Airbnb', time: '08:14', property: 'Villa Azur · Bel Ombre',
    language: 'FR',
    summary: 'Guest arriving Thu 15:20 on MK 47 · confirms driver and requests early check-in 14:30 · kids under 5.',
    sentiment: 'neutral',
    messages: [
      { from: 'them', name: 'Thibault', time: 'Thu 08:14', body: "Hi Friday team — our flight lands at 15:20 on Thursday (MK 47 from Paris). Can you confirm the driver will meet us at arrivals? Also, any chance of an earlier check-in around 14:30? We'll be with two young kids, so anything helps." },
    ],
  },
  {
    id: 't2', unread: true, entity: 'guest', channelKey: 'whatsapp',
    guest: 'Sophia Linde', subject: 'Question about the chef for Saturday night',
    preview: "Hi! We booked the chef service add-on for Saturday. Do we pick the menu or does the chef suggest?…",
    channel: 'WhatsApp', time: '07:52', property: 'Blue Bay House · Blue Bay',
    language: 'EN',
    summary: 'Guest asks whether chef proposes menu or they choose · 6-guest party · dietary shellfish-free.',
    sentiment: 'positive',
    whatsappWindow: { open: true, expiresInMinutes: 222 },
  },
  {
    id: 't3', unread: false, entity: 'guest', channelKey: 'booking',
    guest: 'James Okonkwo', subject: 'Re: welcome pack',
    preview: 'Brilliant — thank you. See you Friday.', channel: 'Booking', time: 'Wed',
    property: 'Sable Noir Retreat · Tamarin',
    language: 'EN',
    sentiment: 'positive',
  },
  {
    id: 't4', unread: false, entity: 'guest', channelKey: 'email',
    guest: 'Marianne Beaumont', subject: 'Invoice for pre-arrival groceries',
    preview: 'Could you share the receipt? My employer needs it for reimbursement.', channel: 'Email', time: 'Tue',
    property: 'Villa Azur · Bel Ombre',
    language: 'FR',
    sentiment: 'neutral',
  },
  {
    id: 't5', unread: true, urgent: 'red', entity: 'guest', channelKey: 'whatsapp',
    guest: 'Henrik Solheim', subject: 'AC not working — hot tonight',
    preview: 'The AC in the master bedroom stopped 20 min ago. Kids can\'t sleep. Please help urgently.',
    channel: 'WhatsApp', time: '23:18', property: 'Coral Reef Bungalow',
    language: 'EN',
    summary: 'AC failure master bedroom · active guest complaint · kids impacted · needs urgent dispatch.',
    sentiment: 'urgent',
    whatsappWindow: { open: true, expiresInMinutes: 38 },
  },
  {
    id: 'o1', unread: true, entity: 'owner', channelKey: 'owner_email',
    guest: 'David Cohen (Nitzana)', subject: 'May calendar — which units open when?',
    preview: 'Bonjour, could you send the final May opening schedule for Orchidée / Jacaranda / Dauphin?',
    channel: 'Owner email', time: '09:40', property: 'Nitzana · Orchidée + 2 more',
    language: 'FR',
    summary: 'Owner asks for final May calendar for 3 Nitzana villas · soft-launch sequence decision needed.',
    sentiment: 'neutral',
  },
  {
    id: 'o2', unread: false, entity: 'owner', channelKey: 'owner_whatsapp',
    guest: 'Anouk Harrington', subject: 'Quick question on the April statement',
    preview: 'Got the statement — can you explain the Breezeway line please?',
    channel: 'Owner WhatsApp', time: 'Wed', property: 'Blue Bay House',
    language: 'EN',
    sentiment: 'neutral',
    whatsappWindow: { open: false },
  },
  {
    id: 'v1', unread: true, entity: 'vendor', channelKey: 'vendor_breezeway',
    guest: 'Priya · Breezeway', subject: 'Tomorrow\'s Villa Azur turnover — team short',
    preview: 'Renuka out sick tomorrow. I can cover VAZ solo but will be 90min late starting BBH. OK?',
    channel: 'Breezeway', time: '22:05', property: 'Villa Azur · Blue Bay House',
    language: 'EN',
    sentiment: 'neutral',
    summary: 'Housekeeping understaffed Thu · proposes solo coverage with 90min delay on 2nd property.',
  },
  {
    id: 'v2', unread: false, entity: 'vendor', channelKey: 'vendor_driver',
    guest: 'Ravi (driver)', subject: 'MK 47 arrival — I\'m at SSR',
    preview: 'Just confirming I\'ve got the Friday sign ready. Will text when they clear customs.',
    channel: 'Driver', time: '14:55', property: 'Villa Azur · Marchand',
    language: 'EN',
    sentiment: 'positive',
  },
  {
    id: 'v3', unread: false, entity: 'vendor', channelKey: 'vendor_chef',
    guest: 'Chef Aarav', subject: 'Saturday menu for Linde party',
    preview: 'Proposed 4-course tasting attached — pescatarian alt for guest 3. €85pp × 6.',
    channel: 'Chef', time: 'Wed', property: 'Blue Bay House',
    language: 'EN',
    sentiment: 'neutral',
  },
];

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

export const TASKS: Task[] = [
  { id: 'k1', status: 'overdue', urgency: 'red', title: 'Confirm transfer driver for Marchand arrival Thu 15:20', property: 'Villa Azur', assignee: 'Bryan', due: 'Yesterday', source: 'Inbox' },
  { id: 'k2', status: 'progress', urgency: 'amber', title: 'Refund €180 tourist tax overcharge — Fonseca booking', property: 'Sable Noir', assignee: 'Mary', due: 'Today', source: 'Finance' },
  { id: 'k3', status: 'todo', urgency: 'amber', title: 'Pool pump replacement — parts arriving Wed', property: 'Blue Bay House', assignee: 'Alex', due: 'Today', source: 'Breezeway' },
  { id: 'k4', status: 'todo', urgency: 'neutral', title: 'Draft Airbnb reply for Linde chef menu question', property: 'Blue Bay House', assignee: 'Franny', due: 'Today', source: 'Inbox' },
  { id: 'k5', status: 'progress', urgency: 'neutral', title: 'Update owner statement template — May run', property: 'All', assignee: 'Mary', due: 'Tomorrow', source: 'Finance' },
  { id: 'k6', status: 'todo', urgency: 'neutral', title: 'Quarterly Breezeway cleaner rate review', property: 'All', assignee: 'Franny', due: 'Fri', source: 'Ops' },
  { id: 'k7', status: 'todo', urgency: 'neutral', title: 'Nitzana onboarding — collect property docs', property: 'Nitzana', assignee: 'Ishant', due: 'Mon', source: 'CRM' },
  { id: 'k8', status: 'done', urgency: 'neutral', title: 'Welcome pack delivered to Okonkwo party', property: 'Sable Noir', assignee: 'Bryan', due: 'Wed', source: 'Inbox', done: true },
  { id: 'k9', status: 'todo', urgency: 'neutral', title: 'Review Q1 occupancy report with Mathias', property: '—', assignee: 'Ishant', due: 'Next wk', source: 'Intel' },
];

export interface Property {
  code: string;
  name: string;
  area: string;
  occ: number;
  adr: number;
  rating: number;
}

export const PROPERTIES: Property[] = [
  { code: 'VAZ', name: 'Villa Azur', area: 'Bel Ombre · South', occ: 0.82, adr: 420, rating: 4.86 },
  { code: 'SBN', name: 'Sable Noir', area: 'Tamarin · West', occ: 0.78, adr: 385, rating: 4.78 },
  { code: 'BBH', name: 'Blue Bay House', area: 'Blue Bay · South-East', occ: 0.91, adr: 510, rating: 4.92 },
  { code: 'LCA', name: 'La Casa Palm', area: 'Grand Baie · North', occ: 0.68, adr: 295, rating: 4.55 },
  { code: 'DMT', name: 'Domaine Tamassa', area: 'Bel Ombre · South', occ: 0.74, adr: 610, rating: 4.81 },
  { code: 'COR', name: 'Coral Reef Bungalow', area: 'Trou aux Biches · North', occ: 0.88, adr: 260, rating: 4.72 },
  { code: 'SRT', name: 'Serenity Point', area: 'Black River · West', occ: 0.81, adr: 450, rating: 4.84 },
  { code: 'OCT', name: 'Ocean Terrace', area: 'Grand Baie · North', occ: 0.72, adr: 330, rating: 4.61 },
  { code: 'NIT', name: 'Nitzana Estate', area: 'Bel Ombre · South', occ: 0.45, adr: 890, rating: 4.95 },
];

export const PROP_TABS = ['All', 'North', 'West', 'Nitzana', 'Owners'];

export interface KPI {
  label: string;
  value: string;
  sub: string;
  dir: 'up' | 'down' | null;
}

export const FIN_KPIS: KPI[] = [
  { label: 'Revenue MTD', value: '€ 184,220', sub: '+12% vs Apr LM', dir: 'up' },
  { label: 'Outstanding payouts', value: '€ 42,960', sub: '6 owners', dir: null },
  { label: 'Tourist tax owed', value: '€ 3,140', sub: 'Apr filing due May 7', dir: null },
  { label: 'Refunds processed', value: '€ 1,880', sub: '3 this month', dir: null },
];

export const FIN_TX = [
  { desc: 'Airbnb payout — Mar batch 2', meta: 'settled Apr 18 · ref AXB-8821', amount: '+€ 48,220' },
  { desc: 'Booking.com payout — Apr wk 2', meta: 'settled Apr 17 · ref BKG-2210', amount: '+€ 31,504' },
  { desc: 'Refund — Fonseca tourist tax overcharge', meta: 'processed Apr 16 · Mary', amount: '−€ 180' },
  { desc: 'Breezeway — April cleaner run', meta: 'due Apr 25 · invoice 4421', amount: '−€ 4,320' },
  { desc: 'Owner statement — Nitzana Estate', meta: 'pending release May 3', amount: '−€ 28,440' },
  { desc: 'Direct booking — Marchand (Thu)', meta: 'captured Apr 15 · VAZ', amount: '+€ 2,850' },
];

export const OPS_CLEANS = [
  { prop: 'Villa Azur', time: '10:00', status: 'in-progress', cleaner: 'Priya · Breezeway' },
  { prop: 'Blue Bay House', time: '11:30', status: 'scheduled', cleaner: 'Renuka · Breezeway' },
  { prop: 'Sable Noir', time: '12:00', status: 'scheduled', cleaner: 'Vimla · Breezeway' },
  { prop: 'La Casa Palm', time: '14:00', status: 'scheduled', cleaner: 'Priya · Breezeway' },
  { prop: 'Coral Reef Bungalow', time: '15:30', status: 'scheduled', cleaner: 'TBD' },
];

export const OPS_TICKETS = [
  { prop: 'Blue Bay House', title: 'Pool pump intermittent — parts arriving Wed', urgency: 'red' as const },
  { prop: 'Villa Azur', title: 'Guest reports AC noisy in master bedroom', urgency: 'amber' as const },
  { prop: 'Serenity Point', title: 'Replace entry mat — worn', urgency: 'neutral' as const },
  { prop: 'Domaine Tamassa', title: 'Schedule gardener — monthly', urgency: 'neutral' as const },
];

export const LEGAL_CONTRACTS = [
  { kind: 'Owner agreement', party: 'Nitzana Holdings SA', status: 'active', ends: 'Mar 2028' },
  { kind: 'Owner agreement', party: 'Beaumont Family Trust', status: 'active', ends: 'Nov 2026' },
  { kind: 'Property management', party: 'Blue Bay House · Harrington', status: 'renewal due', ends: 'May 2026' },
  { kind: 'Vendor — Breezeway', party: 'Breezeway Housekeeping Ltd', status: 'active', ends: 'Dec 2026' },
  { kind: 'Vendor — PM Grocery', party: 'Plein Sud Épicerie', status: 'draft', ends: '—' },
];

export const OWNERS = [
  { name: 'Nitzana Holdings SA', props: 1, ytd: '€ 142,500', next: 'May 3', status: 'current' },
  { name: 'Beaumont Family Trust', props: 2, ytd: '€ 88,200', next: 'May 3', status: 'current' },
  { name: 'Harrington, D.', props: 1, ytd: '€ 51,600', next: 'May 3', status: 'renewal' },
  { name: 'Chen, Y.', props: 1, ytd: '€ 34,100', next: 'May 3', status: 'current' },
  { name: 'Mauritius Coastal Ltd', props: 2, ytd: '€ 77,900', next: 'May 3', status: 'current' },
];

export interface CalEvent {
  day: number;
  start: number;
  end: number;
  type: 'checkin' | 'checkout' | 'maint' | 'meeting';
  title: string;
}

export const CAL_EVENTS: CalEvent[] = [
  { day: 0, start: 10, end: 12, type: 'checkout', title: 'Dubois checkout · VAZ' },
  { day: 0, start: 15, end: 17, type: 'checkin', title: 'Marchand in · VAZ' },
  { day: 0, start: 11, end: 12, type: 'maint', title: 'Pool service · BBH' },
  { day: 1, start: 9, end: 10, type: 'meeting', title: 'Ops stand-up' },
  { day: 1, start: 14, end: 16, type: 'checkin', title: 'Linde in · BBH' },
  { day: 2, start: 10, end: 11, type: 'maint', title: 'Pump parts install · BBH' },
  { day: 2, start: 13, end: 15, type: 'checkout', title: 'Okonkwo out · SBN' },
  { day: 2, start: 16, end: 17, type: 'meeting', title: 'Mary handover' },
  { day: 3, start: 11, end: 13, type: 'checkin', title: 'Beaumont in · SBN' },
  { day: 3, start: 15, end: 16, type: 'maint', title: 'Gardener · DMT' },
  { day: 4, start: 10, end: 12, type: 'checkout', title: 'Linde out · BBH' },
  { day: 4, start: 14, end: 15, type: 'meeting', title: 'Owner call · Nitzana' },
  { day: 5, start: 12, end: 14, type: 'checkin', title: 'Chen in · LCA' },
  { day: 6, start: 11, end: 12, type: 'maint', title: 'Deep clean · OCT' },
];

/* ───── Reservations ───── */

export interface Reservation {
  id: string;
  guest: string;
  property: string;
  propCode: string;
  channel: 'Airbnb' | 'Booking' | 'Direct' | 'VRBO' | 'Email';
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  total: number;
  touristTax: number;
  payoutStatus: 'captured' | 'pending' | 'settled' | 'refunded';
  status: 'confirmed' | 'hold' | 'checked-in' | 'checked-out' | 'cancelled';
  notes?: string;
}

export const RESERVATIONS: Reservation[] = [
  { id: 'R-24018', guest: 'Thibault Marchand', property: 'Villa Azur', propCode: 'VAZ', channel: 'Airbnb', checkIn: 'Apr 17', checkOut: 'Apr 24', nights: 7, adults: 2, children: 2, total: 2940, touristTax: 126, payoutStatus: 'captured', status: 'confirmed', notes: 'Returning guest · early check-in 14:30 approved · driver Ravi' },
  { id: 'R-24017', guest: 'Sophia Linde', property: 'Blue Bay House', propCode: 'BBH', channel: 'Direct', checkIn: 'Apr 15', checkOut: 'Apr 22', nights: 7, adults: 2, children: 0, total: 3570, touristTax: 126, payoutStatus: 'captured', status: 'checked-in', notes: 'Chef evening Sat · dietary: no shellfish' },
  { id: 'R-24016', guest: 'James Okonkwo', property: 'Sable Noir', propCode: 'SBN', channel: 'Booking', checkIn: 'Apr 14', checkOut: 'Apr 16', nights: 2, adults: 4, children: 0, total: 770, touristTax: 36, payoutStatus: 'settled', status: 'checked-out' },
  { id: 'R-24015', guest: 'Isabella Fonseca', property: 'Sable Noir', propCode: 'SBN', channel: 'Booking', checkIn: 'Apr 9', checkOut: 'Apr 13', nights: 4, adults: 2, children: 0, total: 1540, touristTax: 72, payoutStatus: 'refunded', status: 'checked-out', notes: 'Hot water incident · €180 refund issued' },
  { id: 'R-24014', guest: 'Priya Iyer', property: 'Villa Azur', propCode: 'VAZ', channel: 'Direct', checkIn: 'Apr 1', checkOut: 'Apr 7', nights: 6, adults: 2, children: 0, total: 2520, touristTax: 108, payoutStatus: 'settled', status: 'checked-out', notes: 'VIP · gluten-free · champagne on arrival' },
  { id: 'R-24013', guest: 'Amélie Dubois', property: 'Villa Azur', propCode: 'VAZ', channel: 'Airbnb', checkIn: 'Apr 8', checkOut: 'Apr 10', nights: 2, adults: 1, children: 0, total: 840, touristTax: 36, payoutStatus: 'settled', status: 'checked-out' },
  { id: 'R-24019', guest: 'Marianne Beaumont', property: 'Villa Azur', propCode: 'VAZ', channel: 'Email', checkIn: 'Apr 28', checkOut: 'May 2', nights: 4, adults: 2, children: 2, total: 1680, touristTax: 72, payoutStatus: 'pending', status: 'confirmed' },
  { id: 'R-24020', guest: 'Yun Chen', property: 'La Casa Palm', propCode: 'LCA', channel: 'Airbnb', checkIn: 'Apr 19', checkOut: 'Apr 25', nights: 6, adults: 2, children: 1, total: 1770, touristTax: 108, payoutStatus: 'pending', status: 'confirmed' },
  { id: 'R-24021', guest: 'Sofia Mendes', property: 'Nitzana · Jacaranda', propCode: 'NIT', channel: 'Direct', checkIn: 'May 2', checkOut: 'May 7', nights: 5, adults: 2, children: 0, total: 4450, touristTax: 90, payoutStatus: 'pending', status: 'hold', notes: 'Awaiting deposit confirmation' },
  { id: 'R-24022', guest: 'Marco Ricci', property: 'Ocean Terrace', propCode: 'OCT', channel: 'VRBO', checkIn: 'May 12', checkOut: 'May 20', nights: 8, adults: 4, children: 0, total: 2640, touristTax: 144, payoutStatus: 'captured', status: 'confirmed' },
];

export const RESERVATION_KPI = [
  { label: 'In-house today', value: '3', sub: 'VAZ · BBH · DMT' },
  { label: 'Arriving this week', value: '5', sub: 'incl. 1 returning' },
  { label: 'Booking value MTD', value: '€ 22,710', sub: '10 reservations' },
  { label: 'Avg stay length', value: '5.1 nts', sub: '+0.3 vs Mar' },
];

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

export const CAL_DAYS = [
  { label: 'Mon', date: '14', today: false },
  { label: 'Tue', date: '15', today: false },
  { label: 'Wed', date: '16', today: false },
  { label: 'Thu', date: '17', today: true },
  { label: 'Fri', date: '18', today: false },
  { label: 'Sat', date: '19', today: false },
  { label: 'Sun', date: '20', today: false },
];
