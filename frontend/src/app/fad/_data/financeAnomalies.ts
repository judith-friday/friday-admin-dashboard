/**
 * Finance reconciliation engine — Mathias additions (Items A + B).
 *
 * Surfaces auto-detected per-reservation discrepancies that need a
 * corrective Owner Charge or fare-line split. Phase 1 = fixture; Phase 2
 * the detector calls real Airbnb host-report + Guesty channel-actual
 * payout endpoints (Wave 1 dependency).
 *
 * Where this is used:
 *  - PCStage4 of period close — Mathias's monthly recon surface
 *  - FinanceOverview "Open recon items" card — continuous visibility
 *  - FinanceTransactions row chip — one-glance flag per linked expense
 *
 * Brief: ~/Desktop/FAD Modules Scoping/finance_mathias_additions_brief.md
 */

import { TASK_USER_BY_ID } from './tasks';
import { FIN_EXPENSES, type Currency, type FinExpense } from './finance';

export type DiscrepancyKind =
  /** Airbnb resolution-centre refund silently pulled from a settled payout —
   *  Guesty still shows full payment. Owner Charge needed. */
  | 'resolution_centre'
  /** Airbnb special-offer collapsed cleaning fee into accommodation fare.
   *  cleaning_fee = 0 with anomalous accom_fare. Line-split fix. */
  | 'special_offer_collapse'
  /** Reservation change refund (same Guesty string as resolution-centre but
   *  via the booking-change mechanism). Disambiguated by Airbnb host-report
   *  in Phase 2; Phase 1 we surface as best-effort. */
  | 'reservation_change'
  /** Length-of-stay / coupon discount applied at platform level — Guesty
   *  doesn't reflect the absorbed amount. */
  | 'platform_discount';

export type DiscrepancySeverity = 'info' | 'warn' | 'high';

export interface PayoutDiscrepancy {
  id: string;
  reservationId: string;
  /** Property the reservation belongs to — for surfacing + Owner Charge. */
  propertyCode: string;
  guestName: string;
  /** Channel the reservation came through. */
  channel: 'airbnb' | 'booking' | 'vrbo' | 'direct';
  kind: DiscrepancyKind;
  /** What Guesty reported was paid. */
  guestyAmountMinor: number;
  /** What the channel actually settled (Airbnb host report). */
  actualAmountMinor: number;
  /** Currency for both numbers (always same). */
  currency: Currency;
  /** Diff = guestyAmount - actualAmount. Positive = Guesty over-reports
   *  (typical for resolution-centre refund pulls). */
  diffMinor: number;
  /** Suggested corrective amount in MUR (for Owner Charge). */
  suggestedOwnerChargeMinor: number;
  /** Short human-readable summary of the issue. */
  summary: string;
  /** Why the engine flagged it — diagnostic detail Mathias can reason about. */
  detectorReason: string;
  severity: DiscrepancySeverity;
  /** ISO timestamp the engine first detected this. */
  detectedAt: string;
  /** ISO timestamp the underlying payout settled, if known. */
  settledAt?: string;
  /** Reservation-period id this rolls into. */
  periodId: string;
  /** Once Mathias hits Apply, this links to the corrective FinExpense. */
  resolvedExpenseId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ───────────────── Fixture ─────────────────
// 6 seeded discrepancies across the typical pattern set. Mix of channels,
// severities, and resolution states so the surfaces have real-looking data.

export const FIN_PAYOUT_DISCREPANCIES: PayoutDiscrepancy[] = [];

// ───────────────── Helpers ─────────────────

export const DISCREPANCY_KIND_LABEL: Record<DiscrepancyKind, string> = {
  resolution_centre: 'Resolution-centre sync',
  special_offer_collapse: 'Special-offer fare collapse',
  reservation_change: 'Reservation change refund',
  platform_discount: 'Platform discount absorbed',
};

/** All currently-open discrepancies (not yet resolved). */
export function openDiscrepancies(): PayoutDiscrepancy[] {
  return FIN_PAYOUT_DISCREPANCIES.filter((d) => !d.resolvedAt).sort(
    (a, b) => b.detectedAt.localeCompare(a.detectedAt),
  );
}

/** Open discrepancies for a specific period. */
export function openDiscrepanciesForPeriod(periodId: string): PayoutDiscrepancy[] {
  return openDiscrepancies().filter((d) => d.periodId === periodId);
}

/** Discrepancy linked to a specific reservation (used by FinanceTransactions
 *  to render an anomaly chip on rows whose `reservationId` matches). */
export function discrepancyForReservation(reservationId: string): PayoutDiscrepancy | undefined {
  return FIN_PAYOUT_DISCREPANCIES.find((d) => d.reservationId === reservationId);
}

/** Discrepancy linked to a specific expense (after Apply lands an Owner
 *  Charge — the new expense.reservationId points back to a discrepancy). */
export function discrepancyForExpense(expense: FinExpense): PayoutDiscrepancy | undefined {
  if (!expense.reservationId) return undefined;
  return discrepancyForReservation(expense.reservationId);
}

/**
 * Phase 1: returns the seeded fixture verbatim. Phase 2: actually compares
 * Airbnb-host-report against Guesty payouts and the seasonal-baseline
 * accom_fare to produce live discrepancies. UI surfaces don't need to know
 * the difference.
 */
export function detectAllAnomalies(): PayoutDiscrepancy[] {
  return openDiscrepancies();
}

/** Shape for the "Apply" action's preview — what the corrective expense
 *  will look like. Doesn't write anything; just builds the row. */
export interface OwnerChargeProposal {
  description: string;
  propertyCode: string;
  reservationId: string;
  amountMinor: number;
  currency: Currency;
  category: string;
  reasoning: string;
}

export function proposeOwnerCharge(d: PayoutDiscrepancy): OwnerChargeProposal {
  return {
    description: d.summary + ` · ${d.guestName} (${d.reservationId})`,
    propertyCode: d.propertyCode,
    reservationId: d.reservationId,
    amountMinor: d.suggestedOwnerChargeMinor,
    currency: d.currency,
    category: 'FR-REC', // Reconciliation-Owner-Charge category — owner-billable
    reasoning: d.detectorReason,
  };
}

/** Shape for the "Apply" action of a special-offer collapse — describes
 *  the fare-line split that gets pushed to the reservation record. */
export interface FareCollapseSplit {
  reservationId: string;
  propertyCode: string;
  /** New accommodation fare (lower than Guesty current). */
  newAccomFareMinor: number;
  /** Cleaning fee re-instated as its own line. */
  newCleaningFeeMinor: number;
  /** Original (incorrect) fare we're correcting from. */
  originalAccomFareMinor: number;
}

export function proposeFareSplit(d: PayoutDiscrepancy): FareCollapseSplit {
  // Phase 1: hard-coded suggestion for the seeded fixtures. Phase 2 the
  // engine reads cleaning_fee_baseline from the property profile.
  const cleaningFeeMinor = d.id === 'fpd-002' ? 5_000_00 : 4_500_00;
  return {
    reservationId: d.reservationId,
    propertyCode: d.propertyCode,
    newAccomFareMinor: d.guestyAmountMinor - cleaningFeeMinor,
    newCleaningFeeMinor: cleaningFeeMinor,
    originalAccomFareMinor: d.guestyAmountMinor,
  };
}

/** Total Owner-Charge value across open discrepancies, MUR. Used by the
 *  Overview "Open recon items" card. */
export function openReconValueMinor(): number {
  return openDiscrepancies().reduce((s, d) => s + d.suggestedOwnerChargeMinor, 0);
}

/** Breakdown by kind — for severity-based grouping in the Overview card. */
export function openReconCountsByKind(): Record<DiscrepancyKind, number> {
  const out: Record<DiscrepancyKind, number> = {
    resolution_centre: 0, special_offer_collapse: 0, reservation_change: 0, platform_discount: 0,
  };
  for (const d of openDiscrepancies()) out[d.kind]++;
  return out;
}

/** Friendly assignee label for a resolved discrepancy. */
export function resolverLabel(d: PayoutDiscrepancy): string {
  if (!d.resolvedBy) return '—';
  return TASK_USER_BY_ID[d.resolvedBy]?.name ?? d.resolvedBy;
}
