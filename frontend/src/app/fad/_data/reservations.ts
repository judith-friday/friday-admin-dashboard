// @demo:data — Bookings — GET /api/reservations
// Tag: PROD-DATA-6 — see frontend/DEMO_CRUFT.md

/**
 * Canonical Reservations data. Consumed by Reservations module (primary key),
 * Tasks (`Task.reservationId`), Inbox (`InboxThread.reservationId`), Calendar,
 * and Reviews. Phase 1 fixtures; Phase 2 wires real Guesty pull.
 */

export type ReservationStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'hold';

/** Reservations channel taxonomy — `owner` denotes an owner-stay block;
 *  distinct from Reviews taxonomy because owner stays don't generate reviews. */
export type ReservationChannel = 'airbnb' | 'booking' | 'direct' | 'vrbo' | 'email' | 'owner';

export type PayoutStatus = 'pending' | 'captured' | 'settled' | 'refunded';

/** Owner stay only. Drives task-template selection (see decisions log §7
 *  Operations redesign — wired when that lands). Phase 1: surfaces as a chip. */
export type CleaningArrangement = 'friday_cleans' | 'owner_cleans';

export type SpecialRequestCategory =
  | 'crib'
  | 'high_chair'
  | 'late_checkout'
  | 'dietary'
  | 'mobility'
  | 'transport'
  | 'other';

export interface SpecialRequests {
  categories: SpecialRequestCategory[];
  notes: string;
}

export interface Reservation {
  id: string;
  /** OTA-style 8-char identifier shown to staff and guest. Unique per tenant. */
  confirmationCode: string;
  propertyCode: string;
  guestName: string;
  /** ISO datetime — local Mauritius time */
  checkIn: string;
  /** ISO datetime — local Mauritius time */
  checkOut: string;
  nights: number;
  channel: ReservationChannel;
  partySize: { adults: number; children: number; infants?: number };
  status: ReservationStatus;
  /** Total booking amount, gross. */
  totalAmount: number;
  currency: 'MUR' | 'EUR' | 'USD';
  /** Tourist tax owed to MRA — included in totalAmount. */
  touristTax: number;
  payoutStatus: PayoutStatus;
  /** Outstanding balance owed by guest, same currency. 0 = paid in full. */
  balanceDue: number;
  /** Owner-stay only — null/undefined for guest stays. */
  cleaningArrangement?: CleaningArrangement;
  /** Hybrid schema: enum categories + freeform notes (per scoping pack §12). */
  specialRequests?: SpecialRequests;
  /** ISO datetime guest actually arrived (if recorded). */
  actualArrival?: string;
  actualDeparture?: string;
  /** Operational urgent-strip flags. */
  accessInfoSentAt?: string;
  driverAssigneeId?: string;
  reviewRequestedAt?: string;
  /** Refund issued (e.g. for service issue), gross. */
  refundAmount?: number;
  notes?: string;
  /** Reservation creation source (manual / guesty_pull / extension). Audit-only. */
  createdAt?: string;
  /** "Extension of [linked reservation]" — source reservation ID for BDC extensions per scoping pack §8. */
  extensionOf?: string;
}

export const RESERVATIONS: Reservation[] = [];

export const RESERVATION_BY_ID: Record<string, Reservation> = Object.fromEntries(
  RESERVATIONS.map((r) => [r.id, r]),
);

/** Internal note attached to a reservation. Only visible to the team —
 *  guests never see these. Mirrors the InternalNote shape used by Inbox.
 *  Append-only via `breezeway.ts:addReservationNote`. */
export interface ReservationNote {
  id: string;
  reservationId: string;
  authorId: string;
  authorName: string;
  body: string;
  /** TaskUser ids @mentioned in the note. */
  mentions: string[];
  createdAt: string;
}

export const RESERVATION_NOTES: ReservationNote[] = [];

export function notesForReservation(reservationId: string): ReservationNote[] {
  return RESERVATION_NOTES.filter((n) => n.reservationId === reservationId).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
}

export const CHANNEL_LABEL: Record<ReservationChannel, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  direct: 'Direct',
  vrbo: 'VRBO',
  email: 'Email',
  owner: 'Owner',
};

export const SPECIAL_REQUEST_LABEL: Record<SpecialRequestCategory, string> = {
  crib: 'Crib',
  high_chair: 'High chair',
  late_checkout: 'Late checkout',
  dietary: 'Dietary',
  mobility: 'Mobility',
  transport: 'Transport',
  other: 'Other',
};

export const CLEANING_ARRANGEMENT_LABEL: Record<CleaningArrangement, string> = {
  friday_cleans: 'Friday cleans',
  owner_cleans: 'Owner cleans',
};

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
  hold: 'Hold',
};

export const PAYOUT_LABEL: Record<PayoutStatus, string> = {
  pending: 'Pending',
  captured: 'Captured',
  settled: 'Settled',
  refunded: 'Refunded',
};

const CURRENCY_SYMBOL: Record<Reservation['currency'], string> = {
  EUR: '€',
  MUR: 'Rs',
  USD: '$',
};

export function formatMoney(amount: number, currency: Reservation['currency']): string {
  const sym = CURRENCY_SYMBOL[currency];
  const formatted = amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `${sym} ${formatted}`;
}

/** Format a reservation's check-in/out window for display, e.g. "Apr 27, 14:00 → May 4, 11:00 · 7 nts". */
export function formatStayWindow(r: Reservation): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${month} ${day}, ${time}`;
  };
  return `${fmt(r.checkIn)} → ${fmt(r.checkOut)} · ${r.nights} nt${r.nights === 1 ? '' : 's'}`;
}

/* ───── Activity log (audit trail per reservation) ───── */

export type ReservationActivityKind =
  | 'created'
  | 'status_changed'
  | 'planned_arrival_updated'
  | 'planned_departure_updated'
  | 'money_updated'
  | 'note_added'
  | 'access_info_sent'
  | 'driver_assigned'
  | 'review_requested'
  | 'cancelled'
  | 'special_request_added';

export interface ReservationActivity {
  id: string;
  reservationId: string;
  ts: string;
  kind: ReservationActivityKind;
  /** Brief human-readable description shown verbatim in the Activity Log tab. */
  detail: string;
  /** TaskUser id when an action was performed by a teammate; absent for system events. */
  actorId?: string;
}

export const RESERVATION_ACTIVITY: ReservationActivity[] = [];

export function activityForReservation(reservationId: string): ReservationActivity[] {
  return RESERVATION_ACTIVITY.filter((a) => a.reservationId === reservationId).sort(
    (a, b) => b.ts.localeCompare(a.ts),
  );
}

/* ───── Inquiries (pre-reservation; converted ones link to a Reservation) ───── */

export type InquiryStatus = 'pending_quote' | 'quote_sent' | 'guest_reviewing' | 'converted' | 'abandoned';

export interface Inquiry {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  /** Inbound channel — 'email' for direct email, 'whatsapp' for guest message, etc. */
  source: 'email' | 'whatsapp' | 'website' | 'phone' | 'referral';
  /** Multi-property quote candidates (ordered by Mathias's preference). */
  propertyCodes: string[];
  /** Window of interest. */
  checkIn: string;
  checkOut: string;
  partySize: { adults: number; children: number; infants?: number };
  status: InquiryStatus;
  /** friday.mu link generated from Guesty quote builder (Phase 2 wires real generation). */
  quoteLink?: string;
  /** Total quote value if quote sent (gross). */
  quoteAmount?: number;
  currency: 'MUR' | 'EUR' | 'USD';
  /** When converted, links to the created reservation. */
  convertedToReservationId?: string;
  notes?: string;
  /** Reason flagged abandoned — abandoned status only. */
  abandonReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const INQUIRIES: Inquiry[] = [];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  pending_quote: 'Pending quote',
  quote_sent: 'Quote sent',
  guest_reviewing: 'Guest reviewing',
  converted: 'Converted',
  abandoned: 'Abandoned',
};

/* ───── Guest profiles (Phase 1: per-guest-name lookup; Phase 2 normalises into Guests module) ───── */

export interface GuestProfile {
  email?: string;
  phone?: string;
  language: 'EN' | 'FR' | 'PT' | 'IT' | 'NL';
  /** Primary channel we know this guest from. */
  primaryChannel: ReservationChannel;
  airbnbVerified?: boolean;
  bookingVerified?: boolean;
  /** Direct-comms marketing consent (GDPR-style). */
  marketingConsent: boolean;
  notes?: string;
}

/** Keyed by guest display name. Phase 1 simplification — Phase 2 uses a stable guest ID. */
export const GUEST_PROFILES: Record<string, GuestProfile> = {
  'Thomas Kanarski': {
    email: 'thomas.kanarski@kanarski.io',
    phone: '+49 30 123456',
    language: 'EN',
    primaryChannel: 'airbnb',
    airbnbVerified: true,
    marketingConsent: true,
    notes: 'Returning guest · second stay · prefers RC-15 cluster',
  },
  'Hannah Becker': {
    email: 'h.becker@example.de',
    phone: '+49 89 7766554',
    language: 'EN',
    primaryChannel: 'booking',
    bookingVerified: true,
    marketingConsent: false,
  },
  'Lucas Moreau': {
    email: 'lucas.moreau@gmail.com',
    phone: '+33 6 12 34 56 78',
    language: 'FR',
    primaryChannel: 'direct',
    marketingConsent: true,
    notes: 'Family with two young kids · prefers French comms',
  },
  'Wei Chen': {
    email: 'wei.chen@booking-internal',
    language: 'EN',
    primaryChannel: 'booking',
    bookingVerified: true,
    marketingConsent: false,
  },
  'Thibault Marchand': {
    email: 'thibault.marchand@protonmail.com',
    phone: '+33 6 87 65 43 21',
    language: 'FR',
    primaryChannel: 'airbnb',
    airbnbVerified: true,
    marketingConsent: true,
    notes: 'Repeat guest · always books VAZ · driver service preferred',
  },
  'Sophia Linde': {
    email: 'sophia@lindefamily.se',
    phone: '+46 70 555 0199',
    language: 'EN',
    primaryChannel: 'direct',
    marketingConsent: true,
    notes: 'Direct booker · chef service often added · no shellfish',
  },
  'James Okonkwo': {
    email: 'james.o@booking-internal',
    language: 'EN',
    primaryChannel: 'booking',
    bookingVerified: true,
    marketingConsent: false,
  },
  'Marianne Beaumont': {
    email: 'marianne.beaumont@cabinet-bp.fr',
    phone: '+33 1 45 67 89 12',
    language: 'FR',
    primaryChannel: 'email',
    marketingConsent: true,
    notes: 'Email-channel inquiry · receipt + invoice always required',
  },
  'Henrik Solheim': {
    email: 'henrik@solheim.no',
    phone: '+47 900 12 345',
    language: 'EN',
    primaryChannel: 'direct',
    marketingConsent: true,
  },
  'Yuki Sato': {
    email: 'yuki.sato@example.jp',
    language: 'EN',
    primaryChannel: 'airbnb',
    airbnbVerified: true,
    marketingConsent: false,
    notes: 'Cancelled stay · family emergency · refund issued per moderate policy',
  },
  'Owner — Marie Lambert': {
    email: 'marie.lambert@vaz-owner',
    phone: '+230 5912 3456',
    language: 'FR',
    primaryChannel: 'owner',
    marketingConsent: false,
    notes: 'Owner of VAZ · uses property 2-3 times per year',
  },
  'Anna Fischer': {
    email: 'anna.fischer@gmx.de',
    phone: '+49 171 9988776',
    language: 'EN',
    primaryChannel: 'airbnb',
    airbnbVerified: true,
    marketingConsent: false,
    notes: 'Late arrival · transport pickup booked',
  },
  'Catherine Walters': {
    email: 'cwalters@example.co.uk',
    phone: '+44 7700 901234',
    language: 'EN',
    primaryChannel: 'booking',
    bookingVerified: true,
    marketingConsent: false,
    notes: 'Severe nut allergy · documented in special requests',
  },
  'Owner — David Patel': {
    email: 'david.patel@cor-owner',
    phone: '+230 5923 4567',
    language: 'EN',
    primaryChannel: 'owner',
    marketingConsent: false,
    notes: 'Owner of COR · cleans own stays',
  },
};

export function priorReservationsForGuest(guestName: string, currentReservationId: string): Reservation[] {
  return RESERVATIONS
    .filter((r) => r.guestName === guestName && r.id !== currentReservationId)
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
}

/* ───── Payment records ───── */

export type PaymentMethod = 'channel_payout' | 'bank_transfer' | 'card' | 'cash' | 'manual_adjustment';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  channel_payout: 'Channel payout',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  manual_adjustment: 'Manual adjustment',
};

export interface ReservationPayment {
  id: string;
  reservationId: string;
  ts: string;
  amount: number;
  currency: 'MUR' | 'EUR' | 'USD';
  method: PaymentMethod;
  status: 'pending' | 'received' | 'refunded';
  reference?: string;
  notes?: string;
}

export const RESERVATION_PAYMENTS: ReservationPayment[] = [
  // rsv-rc15-thomas — captured Airbnb payout
  {
    id: 'pay-001',
    reservationId: 'rsv-rc15-thomas',
    ts: '2026-04-25T03:00:00',
    amount: 3290,
    currency: 'EUR',
    method: 'channel_payout',
    status: 'received',
    reference: 'AB-PAYOUT-HMTHK4P9R8',
  },
  // rsv-gbh-c8-out — Booking payout
  {
    id: 'pay-002',
    reservationId: 'rsv-gbh-c8-out',
    ts: '2026-04-20T08:00:00',
    amount: 1925,
    currency: 'EUR',
    method: 'channel_payout',
    status: 'received',
    reference: 'BDC-PAYOUT-8842117',
  },
  // rsv-vaz-marchand — Airbnb captured
  {
    id: 'pay-003',
    reservationId: 'rsv-vaz-marchand',
    ts: '2026-04-28T03:00:00',
    amount: 2940,
    currency: 'EUR',
    method: 'channel_payout',
    status: 'received',
    reference: 'AB-PAYOUT-HMVAZM7K3X',
  },
  // rsv-bbh-linde — direct deposit + final
  {
    id: 'pay-004',
    reservationId: 'rsv-bbh-linde',
    ts: '2026-03-12T10:00:00',
    amount: 1500,
    currency: 'EUR',
    method: 'bank_transfer',
    status: 'received',
    reference: 'TRF-LINDE-DEP',
    notes: '50% deposit on booking',
  },
  {
    id: 'pay-005',
    reservationId: 'rsv-bbh-linde',
    ts: '2026-04-22T09:00:00',
    amount: 2070,
    currency: 'EUR',
    method: 'bank_transfer',
    status: 'received',
    reference: 'TRF-LINDE-FINAL',
    notes: 'Final balance pre-arrival',
  },
  // rsv-vaz-beaumont — partial deposit, balance due
  {
    id: 'pay-006',
    reservationId: 'rsv-vaz-beaumont',
    ts: '2026-04-15T10:00:00',
    amount: 840,
    currency: 'EUR',
    method: 'bank_transfer',
    status: 'received',
    reference: 'TRF-BEAUMONT-50',
    notes: '50% deposit · balance due 7 days before check-in',
  },
  // rsv-pt3-walters-may — partial deposit, balance due
  {
    id: 'pay-007',
    reservationId: 'rsv-pt3-walters-may',
    ts: '2026-04-19T11:00:00',
    amount: 1330,
    currency: 'EUR',
    method: 'bank_transfer',
    status: 'received',
    reference: 'TRF-WALTERS-50',
    notes: '50% deposit · balance due 7 days before check-in',
  },
  // rsv-sbn-okonkwo — settled
  {
    id: 'pay-008',
    reservationId: 'rsv-sbn-okonkwo',
    ts: '2026-04-21T08:00:00',
    amount: 770,
    currency: 'EUR',
    method: 'channel_payout',
    status: 'received',
    reference: 'BDC-PAYOUT-8801203',
  },
  // rsv-cor-solheim
  {
    id: 'pay-009',
    reservationId: 'rsv-cor-solheim',
    ts: '2026-03-25T09:00:00',
    amount: 1300,
    currency: 'EUR',
    method: 'bank_transfer',
    status: 'received',
    reference: 'TRF-SOLHEIM-FULL',
  },
  // rsv-sbn-sato-cancelled — refund
  {
    id: 'pay-010',
    reservationId: 'rsv-sbn-sato-cancelled',
    ts: '2026-03-15T14:30:00',
    amount: 2695,
    currency: 'EUR',
    method: 'channel_payout',
    status: 'refunded',
    reference: 'AB-REFUND-HMSATO9P2K',
    notes: 'Full refund per Airbnb moderate policy',
  },
];

export function paymentsForReservation(reservationId: string): ReservationPayment[] {
  return RESERVATION_PAYMENTS
    .filter((p) => p.reservationId === reservationId)
    .sort((a, b) => b.ts.localeCompare(a.ts));
}

/* ───── Folio lines (Phase 1: editable line-item view of the reservation) ───── */

export type FolioLineKind =
  | 'accommodation'
  | 'cleaning_fee'
  | 'tourist_tax'
  | 'extra'
  | 'discount'
  | 'channel_fee'
  | 'manual_adjustment';

export const FOLIO_LINE_KIND_LABEL: Record<FolioLineKind, string> = {
  accommodation: 'Accommodation',
  cleaning_fee: 'Cleaning fee',
  tourist_tax: 'Tourist tax',
  extra: 'Extra',
  discount: 'Discount',
  channel_fee: 'Channel fee',
  manual_adjustment: 'Manual adjustment',
};

export interface FolioLine {
  id: string;
  reservationId: string;
  kind: FolioLineKind;
  label: string;
  /** Positive for charges, negative for discounts/refunds. */
  amount: number;
  currency: 'MUR' | 'EUR' | 'USD';
  /** Whether this line is part of guest-facing total (vs. internal split / channel fee). */
  guestFacing: boolean;
  addedAt: string;
  addedByUserId?: string;
  notes?: string;
}

/**
 * Per-reservation custom folio lines override the default derived view.
 * Empty by default — populated when staff edit / add lines.
 */
export const RESERVATION_FOLIO_LINES: FolioLine[] = [];

export function folioLinesForReservation(reservationId: string): FolioLine[] {
  return RESERVATION_FOLIO_LINES
    .filter((l) => l.reservationId === reservationId)
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
}

export function addFolioLine(input: {
  reservationId: string;
  kind: FolioLineKind;
  label: string;
  amount: number;
  currency: 'MUR' | 'EUR' | 'USD';
  guestFacing: boolean;
  addedByUserId?: string;
  notes?: string;
}): FolioLine {
  const line: FolioLine = {
    id: `fol-${Math.random().toString(36).slice(2, 8)}`,
    reservationId: input.reservationId,
    kind: input.kind,
    label: input.label,
    amount: input.amount,
    currency: input.currency,
    guestFacing: input.guestFacing,
    addedAt: new Date().toISOString(),
    addedByUserId: input.addedByUserId,
    notes: input.notes,
  };
  RESERVATION_FOLIO_LINES.push(line);
  return line;
}

export function updateFolioLine(id: string, patch: Partial<Pick<FolioLine, 'label' | 'amount' | 'notes'>>): void {
  const line = RESERVATION_FOLIO_LINES.find((l) => l.id === id);
  if (line) Object.assign(line, patch);
}

export function removeFolioLine(id: string): void {
  const idx = RESERVATION_FOLIO_LINES.findIndex((l) => l.id === id);
  if (idx >= 0) RESERVATION_FOLIO_LINES.splice(idx, 1);
}

export function recordManualPayment(input: {
  reservationId: string;
  amount: number;
  currency: 'MUR' | 'EUR' | 'USD';
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}): ReservationPayment {
  const payment: ReservationPayment = {
    id: `pay-${Math.random().toString(36).slice(2, 8)}`,
    reservationId: input.reservationId,
    ts: new Date().toISOString(),
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    status: 'received',
    reference: input.reference,
    notes: input.notes,
  };
  RESERVATION_PAYMENTS.push(payment);
  // Reduce balanceDue on the reservation.
  const rsv = RESERVATION_BY_ID[input.reservationId];
  if (rsv) {
    rsv.balanceDue = Math.max(0, rsv.balanceDue - input.amount);
    if (rsv.balanceDue === 0 && rsv.payoutStatus === 'pending') {
      rsv.payoutStatus = 'captured';
    }
  }
  return payment;
}
