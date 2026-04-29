// @demo:data — Expenses, payouts, refunds — GET /api/finance/*
// Tag: PROD-DATA-3 — see frontend/DEMO_CRUFT.md

// Finance fixtures — match schema v1 from finance brief (section 7).
// Static seed data for Phase 1 surfaces: Overview, Transactions, Capture, Approvals.

export type Entity = 'FR' | 'FI' | 'S';
export type BillTo = 'owner' | 'internal_fr' | 'internal_fi' | 'internal_s';
export type ExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'posted';
export type ApprovalStatus =
  | 'pending'
  | 'explicitly_approved'
  | 'deemed_approved'
  | 'rejected'
  | 'needs_human_review'
  | 'partial_proposed';
export type PeriodStatus = 'open' | 'closing' | 'closed' | 'reopened';
export type AccountSource = 'mcb_csv' | 'mcb_pdf' | 'maubank_pdf';
export type Currency = 'MUR' | 'EUR' | 'USD';
export type TxnKind =
  | 'expense_candidate'
  | 'intercompany_topup'
  | 'platform_payout'
  | 'bank_fee'
  | 'unclassified';
export type EntryMode = 'team_breezeway' | 'admin_direct';
export type ApprovalTier = 'routine' | 'medium' | 'urgent_override' | 'major';

// ───────────────── Properties + Owners ─────────────────

// FinProperty + FIN_PROPERTIES retained as back-compat shims.
// Canonical source moved to `_data/properties.ts` (v0.2 LOCKED). Will be
// removed in commit 4 of the Properties rebuild — consumers should update
// imports to read `Property` from `_data/properties.ts` directly.
import { FIN_PROPERTIES_SHIM } from './properties';

export interface FinProperty {
  code: string;
  name: string;
  ownerId: string;
}

export const FIN_PROPERTIES: FinProperty[] = FIN_PROPERTIES_SHIM;

export interface FinOwner {
  id: string;
  name: string;
  language: 'en' | 'fr';
  whatsapp: string;
}

// @demo:data — Tag: PROD-DATA-21 — see frontend/DEMO_CRUFT.md
// Hardcoded owner records. Replace with: GET /api/finance/owners.
// Originally treated as static config in first audit, but contains
// demo-specific names (Smith Family, Marchand SCI, etc.).
export const FIN_OWNERS: FinOwner[] = [];

// ───────────────── Categories + Bill-to defaults ─────────────────

export interface FinCategory {
  code: string;
  name: string;
  defaultBillTo: BillTo;
  receiptRequired: 'always' | 'optional' | 'above_1000';
  /** restricts to admin (Path B) entry */
  adminOnly?: boolean;
  internalLabour?: boolean;
}

// @demo:data — Tag: PROD-DATA-22 — see frontend/DEMO_CRUFT.md
// Hardcoded expense categories. Replace with: GET /api/finance/categories.
export const FIN_CATEGORIES: FinCategory[] = [];

// ───────────────── Vendors ─────────────────

export interface FinVendor {
  id: string;
  name: string;
  altNames: string[];
  defaultCategory?: string;
  ytdSpendMUR: number;
}

// @demo:data — Tag: PROD-DATA-23 — see frontend/DEMO_CRUFT.md
// Hardcoded vendor records. Replace with: GET /api/finance/vendors.
export const FIN_VENDORS: FinVendor[] = [];

// ───────────────── Accounts ─────────────────

export interface FinAccount {
  id: string;
  name: string;
  bank: 'MCB' | 'MauBank';
  currency: Currency;
  source: AccountSource;
  lastImportedDate: string;
}

export type AccountRole = 'main_pm' | 'field_pm' | 'fx' | 'syndic' | 'interior' | 'clearance' | 'admin';

export const FIN_ACCOUNTS: (FinAccount & {
  role: AccountRole;
  cardHolder?: string;
  description?: string;
  approxBalanceMinor?: number;
  dormant?: boolean;
})[] = [];

// ───────────────── Period ─────────────────

export interface FinPeriod {
  id: string;
  label: string;
  status: PeriodStatus;
  startDate: string;
  endDate: string;
  warRateEurMur?: number;
  warRateUsdMur?: number;
  closeStage?: number;
  lockedBy?: string;
  lockedAt?: string;
}

// @demo:data — Tag: PROD-DATA-24 — see frontend/DEMO_CRUFT.md
// Hardcoded fiscal periods. Replace with: GET /api/finance/periods.
export const FIN_PERIODS: FinPeriod[] = [];

// PREVIEW guard: when FIN_PERIODS is empty, fall back to a non-null stub
// so every `CURRENT_PERIOD.field` access in the codebase doesn't crash.
// Real backend will return a real FinPeriod via GET /api/finance/periods/current.
const FIN_PERIOD_FALLBACK: FinPeriod = {
  id: '', label: '—', status: 'open', startDate: '', endDate: '',
  warRateEurMur: 0, warRateUsdMur: 0,
};
export const CURRENT_PERIOD: FinPeriod = FIN_PERIODS[0] ?? FIN_PERIOD_FALLBACK;

// ───────────────── Expenses ─────────────────

export interface FinExpense {
  id: string;
  occurredAt: string;
  enteredAt: string;
  vendorId: string;
  vendorName: string;
  /** for vendor_unrecognized=true free-text captures */
  vendorUnrecognized?: boolean;
  amountMinor: number;
  currency: Currency;
  categoryCode: string;
  billTo: BillTo;
  billToOverridden?: boolean;
  propertyCode?: string;
  description: string;
  status: ExpenseStatus;
  approvalTier?: ApprovalTier;
  approvalStatus?: ApprovalStatus;
  entryMode: EntryMode;
  enteredBy: string;
  brzTaskId?: string;
  reservationId?: string;
  receipts: number;
  exceededUserCap?: boolean;
  internalLabourHours?: number;
  recurring?: boolean;
  /** period id this expense will post into */
  periodId: string;
  /** FAD task that originated this expense (T8 cost-to-Finance integration). */
  sourceTaskId?: string;
}

export const FIN_EXPENSES: FinExpense[] = [];

// ───────────────── Payouts (Airbnb / BDC / Direct) ─────────────────

export interface FinPayout {
  id: string;
  platform: 'Airbnb' | 'Booking.com' | 'Direct';
  ref: string;
  settledAt: string;
  amountMinor: number;
  currency: Currency;
  reservationCount: number;
  periodId: string;
}

export const FIN_PAYOUTS_NEW: FinPayout[] = [];

// ───────────────── Bank lines (sample) ─────────────────

export interface FinBankLine {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amountMinor: number;
  currency: Currency;
  kind: TxnKind;
  status: 'matched' | 'proposed' | 'unmatched' | 'classified_topup' | 'classified_fee';
  matchedExpenseId?: string;
  matchedPayoutId?: string;
}

export const FIN_BANK_LINES: FinBankLine[] = [];

// ───────────────── Tourist tax (current period, summary) ─────────────────

export interface FinTouristTaxRow {
  monthLabel: string;
  collectedEur: number;
  correctEur: number;
  refundedEur: number;
  netOwedEur: number;
  filed: boolean;
}

export const FIN_TOURIST_TAX: FinTouristTaxRow[] = [];

// ───────────────── KPIs (computed roll-up) ─────────────────

export const FIN_OVERVIEW_KPIS = {
  periodLabel: CURRENT_PERIOD?.label ?? '',
  payoutsThisPeriodMinor: FIN_PAYOUTS_NEW
    .filter((p) => p.periodId === CURRENT_PERIOD?.id)
    .reduce((s, p) => s + p.amountMinor, 0),
  payoutsCurrency: 'EUR' as Currency,
  expensesPostedThisPeriodMUR: FIN_EXPENSES
    .filter((e) => e.periodId === CURRENT_PERIOD?.id && e.status === 'posted' && e.currency === 'MUR')
    .reduce((s, e) => s + e.amountMinor, 0),
  pendingApprovalsCount: FIN_EXPENSES.filter((e) => e.status === 'pending_approval').length,
  pendingApprovalsMUR: FIN_EXPENSES
    .filter((e) => e.status === 'pending_approval' && e.currency === 'MUR')
    .reduce((s, e) => s + e.amountMinor, 0),
  unreconciledBankLines: FIN_BANK_LINES.filter((b) => b.status === 'unmatched' || b.status === 'proposed').length,
  touristTaxOwedEur: FIN_TOURIST_TAX.filter((m) => !m.filed).reduce((s, m) => s + m.netOwedEur, 0),
};

// ───────────────── Approvals (WhatsApp delivery state) ─────────────────

export interface FinApprovalRecord {
  expenseId: string;
  token: string;
  sentAt?: string;
  channel: 'whatsapp';
  language: 'en' | 'fr';
  linkClicks: number;
  status: ApprovalStatus;
  expiresAt?: string;
  ownerReplyExcerpt?: string;
  partialProposedMinor?: number;
}

export const FIN_APPROVALS: FinApprovalRecord[] = [];

// ───────────────── Owner statements (waterfall per property/period) ─────────────────

export interface FinWaterfallStep {
  label: string;
  amountMinor: number;
  /** negative = subtraction from running total */
  isDeduction?: boolean;
  /** highlighted intermediate total */
  isSubtotal?: boolean;
  detail?: string;
}

export interface FinOwnerStatement {
  propertyCode: string;
  ownerId: string;
  periodId: string;
  guestyCheckMatches: boolean;
  guestyDiffMinor?: number;
  steps: FinWaterfallStep[];
  /** final owner revenue MUR */
  ownerRevenueMUR: number;
  /** in EUR after WAR */
  ownerRevenueEUR: number;
}

export const FIN_OWNER_STATEMENTS: FinOwnerStatement[] = [];

// ───────────────── Tourist tax overcharge detection (per reservation) ─────────────────

export interface FinTouristOvercharge {
  reservationId: string;
  guestName: string;
  propertyCode: string;
  checkin: string;
  nights: number;
  numAdults: number;
  numChildren: number;
  guestCountry: string;
  chargedEur: number;
  correctEur: number;
  overchargeEur: number;
  reason: 'mauritian_resident' | 'children_excluded' | 'both';
  refundIssued: boolean;
}

export const FIN_TOURIST_OVERCHARGES: FinTouristOvercharge[] = [];

/** Computed roll-up across all months for the unremitted-liability hero block */
export const FIN_TOURIST_TOTALS = {
  unremittedEur: FIN_TOURIST_TAX.filter((m) => !m.filed).reduce((s, m) => s + m.netOwedEur, 0),
  unfiledMonths: FIN_TOURIST_TAX.filter((m) => !m.filed).length,
  ownerOverRefundDueEur: 0,
  ownerOverRefundReservationsCount: 0,
};

// ───────────────── Float ledger (per field-PM account) ─────────────────

export interface FinFloatEntry {
  id: string;
  date: string;
  type: 'topup' | 'expense' | 'transfer_out' | 'opening';
  description: string;
  amountMinor: number;
  runningBalanceMinor: number;
  /** linked expense or top-up reference */
  refId?: string;
}

export interface FinFloatAccount {
  accountId: string;
  cardHolder: string;
  targetFloatMinor: number;
  currentBalanceMinor: number;
  monthSpendMinor: number;
  monthTopupMinor: number;
  entries: FinFloatEntry[];
}

export const FIN_FLOAT_ACCOUNTS: FinFloatAccount[] = [];

// ───────────────── Bank financing reports ─────────────────

export interface FinReportBundle {
  id: string;
  label: string;
  description: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  lastGenerated?: string;
  recipients?: string[];
  /** sample preview metric */
  metric?: { label: string; value: string };
}

export const FIN_REPORTS: FinReportBundle[] = [];

// ───────────────── Slack fallback config + Classification rules ─────────────────

export interface FinSlackChannel {
  id: string;
  name: string;
  purpose: string;
  ingestEnabled: boolean;
  lastIngest?: string;
  countMTD: number;
}

export const FIN_SLACK_CHANNELS: FinSlackChannel[] = [];

export interface FinClassificationRule {
  id: string;
  matchType: 'vendor_pattern' | 'amount_range' | 'description_keyword' | 'account_source';
  matchValue: string;
  thenCategory: string;
  thenBillTo: BillTo;
  priority: number;
  hits90d: number;
  enabled: boolean;
}

export const FIN_CLASSIFICATION_RULES: FinClassificationRule[] = [];

// ───────────────── QuickBooks Online sync state (Phase 2 surface) ─────────────────

export interface FinQboMapping {
  finCategory: string;
  qboAccount: string;
  qboCode: string;
  lastSyncedAt?: string;
  status: 'synced' | 'pending' | 'errored' | 'not_mapped';
}

export const FIN_QBO_MAPPINGS: FinQboMapping[] = [];

// ───────────────── Period close · documents required ─────────────────
// Used by Stage 1 doc-centric panel — every doc the team must drop in to close the period.

export type FinDocKind = 'bank_statement' | 'payout_report';
export type FinDocStatus = 'received' | 'missing' | 'partial';

export interface FinPeriodDocRequirement {
  id: string;
  kind: FinDocKind;
  /** label shown in the panel */
  label: string;
  /** sub-text (account ID for bank, platform name for payouts) */
  source: string;
  status: FinDocStatus;
  /** date through which we have coverage (for status=received or partial) */
  coverageThrough?: string;
  /** for status=partial, what's missing */
  gap?: string;
  format: 'CSV' | 'PDF' | 'XLSX';
  /** for bank: linked accountId. for payout: platform name. */
  refId: string;
}

export const FIN_PERIOD_DOCS: FinPeriodDocRequirement[] = [];

// ───────────────── Friday AI insights (Phase 4 mocked-as-active) ─────────────────

export type FridayInsightSeverity = 'urgent' | 'notice' | 'info';
export type FridayInsightKind =
  | 'anomaly' | 'forecast' | 'refund_risk' | 'compliance'
  | 'approval_urgency' | 'vendor_health' | 'cashflow';

export interface FridayInsight {
  id: string;
  severity: FridayInsightSeverity;
  kind: FridayInsightKind;
  title: string;
  body: string;
  /** sub-page id to deep-link into */
  openSub?: string;
  /** scope string passed to Friday drawer */
  fridayScope: string;
}

export const FRIDAY_FINANCE_INSIGHTS: FridayInsight[] = [];

/** Per-vendor health hint surfaced in Vendor drawer header. */
export const FRIDAY_VENDOR_HINTS: Record<string, { tone: 'good' | 'notice' | 'warn'; text: string }> = {
  v1: { tone: 'notice', text: '6 captures in 14 days · 40% above baseline · driver: April storm' },
  v2: { tone: 'good', text: 'Cadence typical · 3 captures/mo, recent invoice within ±5% of last 90d avg' },
  v3: { tone: 'good', text: 'Cadence typical · plumbing call-outs cluster post-storm but amounts in line' },
  v4: { tone: 'notice', text: 'Quarterly bulk linen rotation due — last rotation Apr 24 · next: Jul' },
  v5: { tone: 'good', text: 'Field fuel · cadence + amounts within van-mileage baseline' },
  v9: { tone: 'good', text: 'Cleaning vendor · per-turnover cost within ±8% of property type baseline' },
  v10: { tone: 'good', text: 'Garden cadence quarterly · prices stable YoY' },
};

/** Per-guest refund-pattern flag surfaced in Approvals detail. */
export const FRIDAY_GUEST_FLAGS: Record<string, { severity: 'low' | 'medium' | 'high'; text: string }> = {
  // keyed by reservationId / guest reference for demo
  'r-2026-1192': { severity: 'medium', text: '2 prior refund attempts this year · pattern matches abuse-likely cohort' },
};

// ───────────────── Helpers ─────────────────

export const formatMUR = (minor: number) => 'Rs ' + (minor / 100).toLocaleString('en-MU', { maximumFractionDigits: 0 });
export const formatEUR = (minor: number) => '€ ' + (minor / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 });
export const formatUSD = (minor: number) => '$ ' + (minor / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
export const formatCurrency = (minor: number, ccy: Currency) =>
  ccy === 'EUR' ? formatEUR(minor) : ccy === 'USD' ? formatUSD(minor) : formatMUR(minor);

export const billToLabel = (b: BillTo): string =>
  b === 'owner' ? 'Owner' : b === 'internal_fr' ? 'FR' : b === 'internal_fi' ? 'FI' : 'S';

export const billToColor = (b: BillTo): 'green' | 'blue' | 'amber' =>
  b === 'owner' ? 'green' : b === 'internal_fr' ? 'blue' : 'amber';

export const tierColor = (t: ApprovalTier): 'green' | 'amber' | 'red' =>
  t === 'routine' ? 'green' : t === 'major' ? 'red' : 'amber';

export const tierLabel = (t: ApprovalTier): string =>
  t === 'routine' ? 'Auto-approved' :
  t === 'medium' ? 'Owner approval, 24h auto' :
  t === 'urgent_override' ? 'Urgent override' :
  'Owner pre-approval required';

// ───────────────── Internal escalation chain (Mathias additions · Item C) ─────────────────
//
// Replaces the originally-locked Slack-DM-Ishant flow per running decisions
// log §3.1 (Internal team comms live in FAD Inbox, not Slack). The chain
// runs when a refund / reconciliation request exceeds the requestor's
// authority cap — it walks the tiers below until someone responds.

export type EscalationRecipient = 'u-ishant' | 'u-mathias' | 'u-franny';

export interface FinEscalationChain {
  /** Where the request lands first. */
  tier1: {
    recipientId: EscalationRecipient;
    /** Posts to this team channel. Default: '#finance'. */
    channelKey: 'finance';
    /** Minutes of silence before escalating to tier 2 (urgent flag only). */
    silentTimeoutMins: number;
  };
  /** Phone-call escalation when tier 1 is silent + urgent. */
  tier2: {
    recipientId: EscalationRecipient;
    /** Stub for now; real impl wires 3CX click-to-dial. */
    via: '3cx_phone';
    /** Minutes of further silence before escalating to tier 3. */
    silentTimeoutMins: number;
  };
  /** Final fallback — Mathias can approve up to this MUR cap if tier 1 + 2
   *  fail. If amount exceeds this cap, the chain escalates to Franny. */
  tier3: {
    recipientId: EscalationRecipient;
    /** Mathias's fallback approval cap when Ishant unavailable, MUR minor. */
    fallbackApprovalCapMinor: number;
    /** Last-resort recipient if amount > tier3 cap. */
    finalFallbackRecipientId: EscalationRecipient;
  };
}

export const FIN_ESCALATION_CHAIN: FinEscalationChain = {
  tier1: { recipientId: 'u-ishant', channelKey: 'finance', silentTimeoutMins: 30 },
  tier2: { recipientId: 'u-ishant', via: '3cx_phone', silentTimeoutMins: 15 },
  tier3: {
    recipientId: 'u-mathias',
    fallbackApprovalCapMinor: 20_000_00,
    finalFallbackRecipientId: 'u-franny',
  },
};
