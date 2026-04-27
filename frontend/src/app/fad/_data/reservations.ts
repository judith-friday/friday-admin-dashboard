/**
 * FAD-side reservation fixture. Linked to from `Task.reservationId` (in tasks.ts)
 * and `InboxThread.reservationId` (in fixtures.ts) so Task detail and Inbox thread
 * surfaces can show the underlying stay.
 *
 * Distinct from the legacy `_data/fixtures.ts:RESERVATIONS` array, which serves the
 * standalone ReservationsModule and uses an older property-code namespace
 * (VAZ/BBH/SBN). Tasks and the new modules use task-style codes (RC-15/GBH-C8/etc.)
 * — unifying the two namespaces is a separate IA change.
 */

export type ReservationStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'hold';

export type ReservationChannel = 'airbnb' | 'booking' | 'direct' | 'vrbo' | 'email';

export type PayoutStatus = 'pending' | 'captured' | 'settled' | 'refunded';

export interface Reservation {
  id: string;
  propertyCode: string;
  guestName: string;
  /** ISO datetime — local Mauritius time */
  checkIn: string;
  /** ISO datetime — local Mauritius time */
  checkOut: string;
  nights: number;
  channel: ReservationChannel;
  partySize: { adults: number; children: number };
  status: ReservationStatus;
  /** Total booking amount, gross. */
  totalAmount: number;
  currency: 'MUR' | 'EUR' | 'USD';
  /** Tourist tax owed to MRA — included in totalAmount. */
  touristTax: number;
  payoutStatus: PayoutStatus;
  /** Refund issued (e.g. for service issue), gross. */
  refundAmount?: number;
  notes?: string;
}

export const RESERVATIONS: Reservation[] = [
  // ───── Referenced by tasks ─────
  {
    id: 'rsv-rc15-thomas',
    propertyCode: 'RC-15',
    guestName: 'Thomas Kanarski',
    checkIn: '2026-04-27T14:00:00',
    checkOut: '2026-05-04T11:00:00',
    nights: 7,
    channel: 'airbnb',
    partySize: { adults: 2, children: 2 },
    status: 'confirmed',
    totalAmount: 3290,
    currency: 'EUR',
    touristTax: 126,
    payoutStatus: 'captured',
    notes: 'Returning guest · welcome basket requested · driver booked',
  },
  {
    id: 'rsv-gbh-c8-out',
    propertyCode: 'GBH-C8',
    guestName: 'Hannah Becker',
    checkIn: '2026-04-22T14:00:00',
    checkOut: '2026-04-27T11:00:00',
    nights: 5,
    channel: 'booking',
    partySize: { adults: 2, children: 0 },
    status: 'checked_in',
    totalAmount: 1925,
    currency: 'EUR',
    touristTax: 90,
    payoutStatus: 'captured',
    notes: 'Departure today · turnover before 13:00 incoming guest',
  },
  {
    id: 'rsv-pt3-out-apr30',
    propertyCode: 'PT-3',
    guestName: 'Lucas Moreau',
    checkIn: '2026-04-24T14:00:00',
    checkOut: '2026-04-30T11:00:00',
    nights: 6,
    channel: 'direct',
    partySize: { adults: 2, children: 2 },
    status: 'checked_in',
    totalAmount: 2520,
    currency: 'EUR',
    touristTax: 108,
    payoutStatus: 'captured',
  },
  {
    id: 'rsv-ks5-in-may2',
    propertyCode: 'KS-5',
    guestName: 'Wei Chen',
    checkIn: '2026-05-02T14:00:00',
    checkOut: '2026-05-07T11:00:00',
    nights: 5,
    channel: 'booking',
    partySize: { adults: 2, children: 0 },
    status: 'confirmed',
    totalAmount: 1475,
    currency: 'EUR',
    touristTax: 90,
    payoutStatus: 'pending',
    notes: 'Property empty 4 days prior · pre-arrival inspection scheduled',
  },

  // ───── Linked from Inbox guest threads ─────
  {
    id: 'rsv-vaz-marchand',
    propertyCode: 'VAZ',
    guestName: 'Thibault Marchand',
    checkIn: '2026-04-30T15:20:00',
    checkOut: '2026-05-07T11:00:00',
    nights: 7,
    channel: 'airbnb',
    partySize: { adults: 2, children: 2 },
    status: 'confirmed',
    totalAmount: 2940,
    currency: 'EUR',
    touristTax: 126,
    payoutStatus: 'captured',
    notes: 'MK 47 from Paris · early check-in 14:30 approved · driver Ravi',
  },
  {
    id: 'rsv-bbh-linde',
    propertyCode: 'BBH',
    guestName: 'Sophia Linde',
    checkIn: '2026-04-25T14:00:00',
    checkOut: '2026-05-02T11:00:00',
    nights: 7,
    channel: 'direct',
    partySize: { adults: 2, children: 0 },
    status: 'checked_in',
    totalAmount: 3570,
    currency: 'EUR',
    touristTax: 126,
    payoutStatus: 'captured',
    notes: 'Chef booked Saturday · dietary: no shellfish',
  },
  {
    id: 'rsv-sbn-okonkwo',
    propertyCode: 'SBN',
    guestName: 'James Okonkwo',
    checkIn: '2026-04-23T14:00:00',
    checkOut: '2026-04-25T11:00:00',
    nights: 2,
    channel: 'booking',
    partySize: { adults: 4, children: 0 },
    status: 'checked_out',
    totalAmount: 770,
    currency: 'EUR',
    touristTax: 36,
    payoutStatus: 'settled',
  },
  {
    id: 'rsv-vaz-beaumont',
    propertyCode: 'VAZ',
    guestName: 'Marianne Beaumont',
    checkIn: '2026-04-28T14:00:00',
    checkOut: '2026-05-02T11:00:00',
    nights: 4,
    channel: 'email',
    partySize: { adults: 2, children: 2 },
    status: 'confirmed',
    totalAmount: 1680,
    currency: 'EUR',
    touristTax: 72,
    payoutStatus: 'pending',
    notes: 'Pre-arrival groceries via Plein Sud · receipt requested for reimbursement',
  },
  {
    id: 'rsv-cor-solheim',
    propertyCode: 'COR',
    guestName: 'Henrik Solheim',
    checkIn: '2026-04-24T14:00:00',
    checkOut: '2026-04-29T11:00:00',
    nights: 5,
    channel: 'direct',
    partySize: { adults: 2, children: 2 },
    status: 'checked_in',
    totalAmount: 1300,
    currency: 'EUR',
    touristTax: 90,
    payoutStatus: 'captured',
    notes: 'AC complaint open · master bedroom unit',
  },
  {
    id: 'rsv-sbn-sato-cancelled',
    propertyCode: 'SBN',
    guestName: 'Yuki Sato',
    checkIn: '2026-06-14T14:00:00',
    checkOut: '2026-06-21T11:00:00',
    nights: 7,
    channel: 'airbnb',
    partySize: { adults: 2, children: 0 },
    status: 'cancelled',
    totalAmount: 2695,
    currency: 'EUR',
    touristTax: 126,
    payoutStatus: 'refunded',
    refundAmount: 2695,
    notes: 'Cancelled · family emergency · refund per Airbnb moderate policy',
  },
];

export const RESERVATION_BY_ID: Record<string, Reservation> = Object.fromEntries(
  RESERVATIONS.map((r) => [r.id, r]),
);

export const CHANNEL_LABEL: Record<ReservationChannel, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  direct: 'Direct',
  vrbo: 'VRBO',
  email: 'Email',
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
