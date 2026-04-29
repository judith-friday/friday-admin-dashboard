// @demo:data — Operations tasks — GET /api/operations/tasks
// Tag: PROD-DATA-2 — see frontend/DEMO_CRUFT.md

// Tasks module fixtures — Phase 1 (Breezeway-API-shaped, fixture-backed).
// Today: 2026-04-27 Monday. Week: 2026-04-27 → 2026-05-03.
//
// Source brief: fad-tasks-build-brief-v3.md (§4.1, §5.1, §7.2, §7.4)
// Writes go through breezeway.ts shim, never mutate TASKS directly.

// ───────────────── Type definitions ─────────────────

export type Department = 'cleaning' | 'inspection' | 'maintenance' | 'office';

export type Subdepartment =
  | 'standard_clean'
  | 'deep_clean'
  | 'linen'
  | 'pre_arrival'
  | 'post_clean'
  | 'plumbing'
  | 'electrical'
  | 'carpentry'
  | 'aircon'
  | 'pool'
  | 'garden'
  | 'amenities'
  | 'admin'
  | 'guest_services';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'paused'
  | 'reported'
  | 'awaiting_approval'
  | 'completed'
  | 'cancelled';

export type TaskPriority = 'lowest' | 'low' | 'medium' | 'high' | 'urgent';

export type TaskSource =
  | 'manual'
  | 'breezeway'
  | 'inbox_ai'
  | 'guesty'
  | 'recurring'
  | 'reservation_trigger'
  | 'group_email'
  | 'friday'
  | 'reported_issue'
  | 'personal'
  | 'review';

export type TaskVisibility = 'all' | 'team' | 'self';

export type RiskFlag =
  | 'overdue'
  | 'no_progress'
  | 'blocked_access'
  | 'over_time'
  | 'unassigned'
  | 'reservation_imminent';

export type ActivityKind =
  | 'created'
  | 'assigned'
  | 'unassigned'
  | 'status_changed'
  | 'priority_changed'
  | 'commented'
  | 'cost_added'
  | 'risk_flagged'
  | 'ai_suggested'
  | 'approved'
  | 'rejected'
  | 'reassigned'
  | 'rescheduled'
  | 'updated';

// ───────────────── Users (staff) ─────────────────

export interface TaskUser {
  id: string;
  name: string;
  initials: string;
  email?: string;
  role: 'director' | 'commercial_marketing' | 'ops_manager' | 'field' | 'external';
  homeZone?: 'north' | 'west' | null;
  skills?: string[];
  weeklyConstraints?: {
    neverWorks?: ('saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[];
  };
  notificationChannel: 'fad_inbox' | 'slack' | 'whatsapp' | 'email' | 'print_only';
  startDate: string;
  endDate?: string;
  active: boolean;
  avatarColor: string;
}

export const TASK_USERS: TaskUser[] = [
  {
    id: 'u-judith',
    name: 'Judith Friday',
    initials: 'JF',
    email: 'judith@friday.mu',
    role: 'director',
    notificationChannel: 'fad_inbox',
    startDate: '2024-01-01',
    active: true,
    avatarColor: '#7c3aed',
  },
  {
    id: 'u-ishant',
    name: 'Ishant Ayadassen',
    initials: 'IA',
    email: 'ishant@friday.mu',
    role: 'director',
    notificationChannel: 'fad_inbox',
    startDate: '2024-01-01',
    active: true,
    avatarColor: '#10b981',
  },
  {
    id: 'u-mathias',
    name: 'Mathias David',
    initials: 'MD',
    email: 'mathias@friday.mu',
    role: 'commercial_marketing',
    skills: ['marketing', 'guest_services', 'maintenance'],
    weeklyConstraints: {
      neverWorks: ['saturday', 'sunday'],
    },
    notificationChannel: 'fad_inbox',
    startDate: '2024-03-15',
    active: true,
    avatarColor: '#84cc16',
  },
  {
    id: 'u-franny',
    name: 'Franny Henri',
    initials: 'FH',
    email: 'franny@friday.mu',
    role: 'ops_manager',
    skills: ['cleaning', 'inspection', 'guest_services'],
    notificationChannel: 'fad_inbox',
    startDate: '2024-02-01',
    active: true,
    avatarColor: '#0ea5e9',
  },
  {
    id: 'u-mary',
    name: 'Mary Cluthwise',
    initials: 'MC',
    email: 'mary@friday.mu',
    role: 'field',
    skills: ['admin', 'cleaning'],
    notificationChannel: 'whatsapp',
    startDate: '2024-04-01',
    endDate: '2026-05-31', // departure announced
    active: true,
    avatarColor: '#ec4899',
  },
  {
    id: 'u-bryan',
    name: 'Bryan Henri',
    initials: 'BH',
    email: 'bryan@friday.mu',
    role: 'field',
    homeZone: 'north',
    skills: ['maintenance', 'plumbing', 'electrical', 'carpentry'],
    notificationChannel: 'whatsapp',
    startDate: '2024-05-15',
    active: true,
    avatarColor: '#ef4444',
  },
  {
    id: 'u-alex',
    name: 'Alex Legentil',
    initials: 'AL',
    email: 'alex@friday.mu',
    role: 'field',
    homeZone: 'west',
    skills: ['cleaning', 'inspection', 'amenities'],
    notificationChannel: 'whatsapp',
    startDate: '2024-06-01',
    active: true,
    avatarColor: '#f59e0b',
  },
  {
    id: 'u-catherine',
    name: 'Catherine Henri',
    initials: 'CH',
    email: 'catherine@friday.mu',
    role: 'field',
    homeZone: 'north',
    skills: ['cleaning', 'inspection'],
    weeklyConstraints: {
      neverWorks: ['sunday'],
    },
    notificationChannel: 'whatsapp',
    startDate: '2024-09-15',
    active: true,
    avatarColor: '#6366f1',
  },
  {
    id: 'u-oracle',
    name: 'Oracle Cleaning Co.',
    initials: 'OC',
    role: 'external',
    notificationChannel: 'email',
    startDate: '2024-01-01',
    active: true,
    avatarColor: '#64748b',
  },
];

// ───────────────── Properties ─────────────────

// PropertyZone + TaskProperty + TASK_PROPERTIES retained as back-compat shims.
// Canonical source moved to `_data/properties.ts` (v0.2 LOCKED). Will be
// removed in commit 4 of the Properties rebuild — consumers should update
// imports to read `Property` from `_data/properties.ts` directly.
import { TASK_PROPERTIES_SHIM } from './properties';
export type { PropertyZone } from './properties';

export interface TaskProperty {
  code: string;
  name: string;
  zone: import('./properties').PropertyZone;
  tier: 'small' | 'medium' | 'big';
}

export const TASK_PROPERTIES: TaskProperty[] = TASK_PROPERTIES_SHIM;

// ───────────────── Constants ─────────────────

export const SUBDEPT_LABEL: Record<Subdepartment, string> = {
  standard_clean: 'Standard clean',
  deep_clean: 'Deep clean',
  linen: 'Linen service',
  pre_arrival: 'Pre-arrival',
  post_clean: 'Post-clean inspection',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  carpentry: 'Carpentry',
  aircon: 'A/C',
  pool: 'Pool',
  garden: 'Garden',
  amenities: 'Amenities',
  admin: 'Admin',
  guest_services: 'Guest services',
};

export const SUBDEPT_BY_DEPT: Record<Department, Subdepartment[]> = {
  cleaning: ['standard_clean', 'deep_clean', 'linen', 'pre_arrival', 'amenities'],
  inspection: ['post_clean', 'pre_arrival'],
  maintenance: ['plumbing', 'electrical', 'carpentry', 'aircon', 'pool', 'garden'],
  office: ['admin', 'guest_services'],
};

// ───────────────── Inner shapes ─────────────────

export interface AISuggestion {
  kind:
    | 'urgency_bump'
    | 'route'
    | 'assign'
    | 'risk'
    | 'thread_summary'
    | 'duplicate'
    | 'reservation_aware'
    | 'owner_charge'
    | 'next_action'
    | 'similar_past';
  confidence: number;
  message: string;
  /** suggested value depending on kind: assignee id, department, etc. */
  value?: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  text: string;
  ts: string;
  mentions?: string[];
  syncedToBreezeway?: boolean;
}

export interface TaskCost {
  id: string;
  type: 'labor' | 'material' | 'expense' | 'tax' | 'skilled_labor' | 'unskilled_labor' | 'mileage' | 'markup';
  amount: number;
  currency: 'MUR' | 'EUR';
  description: string;
  addedBy: string;
  /** Owner-billable line — flows to Finance as Path-A passthrough capture (T8). */
  ownerCharge?: boolean;
  /** Set by the integration when the line has flowed to a Finance expense. */
  flowedToFinanceExpenseId?: string;
}

export interface ActivityEntry {
  id: string;
  ts: string;
  kind: ActivityKind;
  actorId: string;
  detail?: string;
}

// ───────────────── Task ─────────────────

export interface Task {
  id: string;
  bzId?: string;
  title: string;
  description?: string;
  propertyCode: string;
  department: Department;
  subdepartment: Subdepartment;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  visibility: TaskVisibility;
  assigneeIds: string[];
  requesterId?: string;
  dueDate: string;
  dueTime?: string;
  estimatedMinutes?: number;
  spentMinutes?: number;
  reservationId?: string;
  /** Convenience rollup — true when any cost line has ownerCharge=true. */
  ownerCharge?: boolean;
  attachmentCount: number;
  comments: TaskComment[];
  costs: TaskCost[];
  isRecurring?: boolean;
  template?: string;
  tags: string[];
  riskFlags: RiskFlag[];
  aiSuggestions: AISuggestion[];
  activityLog: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  /** AI-drafted, needs human green-light before push to Breezeway */
  awaitingHumanApproval?: boolean;
  inboxThreadId?: string;
  groupEmailId?: string;
}

// ───────────────── Date helpers (today = 2026-04-27 Mon) ─────────────────

// @demo:logic — Tag: PROD-LOGIC-7 — see frontend/DEMO_CRUFT.md. Replace with real Date.now() / server now().
const today = '2026-04-27';
const tomorrow = '2026-04-28';
const wed = '2026-04-29';
const thu = '2026-04-30';
const fri = '2026-05-01';
const sat = '2026-05-02';
const yesterday = '2026-04-26';

// ───────────────── Tasks (existing 25 + 6 new = 31 total) ─────────────────

export const TASKS: Task[] = [];

// ───────────────── Reported Issues ─────────────────

export interface ReportedIssue {
  id: string;
  bzId?: string;
  reporterId: string;
  reporterLabel?: string;
  propertyCode: string;
  title: string;
  description: string;
  photos: number;
  reportedAt: string;
  source: 'field_pm' | 'guesty_message' | 'inbox' | 'guest_chat' | 'inspection' | 'group_email';
  status: 'new' | 'triaged' | 'converted' | 'dismissed';
  aiSuggestedDepartment?: Department;
  aiSuggestedSubdepartment?: Subdepartment;
  aiSuggestedAssignee?: string;
  aiSuggestedPriority?: TaskPriority;
  aiConfidence?: number;
  aiReason?: string;
  convertedTaskId?: string;
  inboxThreadId?: string;
  groupEmailId?: string;
}

export const REPORTED_ISSUES: ReportedIssue[] = [];

// ───────────────── Approval Requests (FAD-native shape per brief §7.1) ─────────────────

export type ApprovalType = 'spend' | 'vendor' | 'scope_change' | 'other';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'countered';
export type ApprovalThresholdTier = 'small' | 'medium' | 'large';

export interface ApprovalRequest {
  id: string;
  linkedTaskId?: string;
  requesterId: string;
  propertyCode: string;
  type: ApprovalType;
  amount?: number;
  currency?: 'MUR' | 'EUR';
  vendor?: string;
  justification: string;
  attachments: string[];
  thresholdTier?: ApprovalThresholdTier;
  requestedAt: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  counterAmount?: number;
}

export const APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'ar-001',
    linkedTaskId: 't-007',
    requesterId: 'u-alex',
    propertyCode: 'LB-2',
    type: 'spend',
    amount: 8200,
    currency: 'MUR',
    vendor: 'Verre Express',
    justification: 'Replace shattered outdoor table glass at LB-2. Guest checks in 28 Apr 14:00. Got 3 quotes: Verre Express 8,200, Glass Plus 9,500, Vitrerie Mr 8,800. Verre Express has 24h delivery.',
    attachments: ['quote-verre-express.pdf', 'quote-glass-plus.pdf', 'quote-vitrerie.pdf'],
    thresholdTier: 'small',
    requestedAt: '2026-04-26T16:00:00',
    status: 'pending',
  },
  {
    id: 'ar-002',
    linkedTaskId: 't-006',
    requesterId: 'u-mathias',
    propertyCode: 'LB-2',
    type: 'spend',
    amount: 4800,
    currency: 'MUR',
    vendor: 'Coolbreeze',
    justification: 'Compressor parts for LB-2 living room split. Guest in-stay, A/C not cooling since 22:15 last night. Coolbreeze has parts ready, can fix by 16:00 today. No alternative supplier with same-day stock.',
    attachments: ['coolbreeze-quote.pdf'],
    thresholdTier: 'small',
    requestedAt: '2026-04-27T09:20:00',
    status: 'pending',
  },
  {
    id: 'ar-003',
    linkedTaskId: 't-019',
    requesterId: 'u-mathias',
    propertyCode: 'SD-10',
    type: 'other',
    justification: 'Pool pump showing intermittent fault — need 2 extra hours diagnostic before deciding repair vs replace. Standard chemistry test fine, but pump cycles erratically. Want to get baseline electrical readings before quoting.',
    attachments: [],
    requestedAt: '2026-04-27T08:00:00',
    status: 'pending',
  },
  {
    id: 'ar-004',
    linkedTaskId: 't-008',
    requesterId: 'u-mathias',
    propertyCode: 'BCN-A',
    type: 'vendor',
    vendor: 'Ariston (replaces Atlantic)',
    justification: 'Switch water heater from Atlantic to Ariston (better warranty, similar price). Atlantic 100L stock-out 3 weeks. Ariston 100L same price (Rs 18,500), 5yr vs 3yr warranty, in stock at Brico Center.',
    attachments: ['ariston-spec.pdf'],
    thresholdTier: 'medium',
    requestedAt: '2026-04-25T14:00:00',
    status: 'approved',
    reviewedBy: 'u-judith',
    reviewedAt: '2026-04-25T15:30:00',
    reviewNotes: 'Approved. Better warranty wins.',
  },
  {
    id: 'ar-005',
    linkedTaskId: 't-005',
    requesterId: 'u-bryan',
    propertyCode: 'BL-12',
    type: 'scope_change',
    amount: 600,
    currency: 'MUR',
    justification: 'Add fridge defrost-deep-clean to BL-12 deep clean (originally not in scope). Found mold in fridge seal during pre-clean. Will add ~45 min and Rs 600 in cleaning supplies.',
    attachments: ['fridge-mold.jpg'],
    thresholdTier: 'small',
    requestedAt: '2026-04-26T11:00:00',
    status: 'countered',
    reviewedBy: 'u-franny',
    reviewedAt: '2026-04-26T11:30:00',
    counterAmount: 400,
    reviewNotes: 'Approved scope, but cap supplies at Rs 400 — use existing stock first.',
  },
];

// ───────────────── Insights aggregations (precomputed for fixtures) ─────────────────

export const TASK_INSIGHTS = {
  weeklyCompleted: 47,
  weeklyCreated: 52,
  avgCompletionMinutes: 73,
  topAssignees: [
    { userId: 'u-alex', completed: 12, avgMinutes: 65 },
    { userId: 'u-bryan', completed: 11, avgMinutes: 78 },
    { userId: 'u-mathias', completed: 9, avgMinutes: 105 },
    { userId: 'u-mary', completed: 8, avgMinutes: 52 },
    { userId: 'u-catherine', completed: 7, avgMinutes: 41 },
  ],
  byDepartment: [
    { dept: 'cleaning' as const, count: 21, avgMinutes: 145 },
    { dept: 'inspection' as const, count: 14, avgMinutes: 38 },
    { dept: 'maintenance' as const, count: 9, avgMinutes: 92 },
    { dept: 'office' as const, count: 8, avgMinutes: 45 },
  ],
  topPropertiesByIssues: [
    { code: 'LB-2', issues: 4 },
    { code: 'LV-10', issues: 3 },
    { code: 'KS-5', issues: 2 },
    { code: 'GBH-C3', issues: 2 },
    { code: 'RC-15', issues: 2 },
  ],
  escalationTrend: [3, 5, 4, 7, 6, 8, 5], // last 7 days
  completedTrend: [6, 8, 7, 5, 9, 6, 6],  // last 7 days
  /** AI accuracy — populated by telemetry hooks in Phase 2; canned for Phase 1. */
  aiAccuracy: {
    autoTriageAccept: 0.78,
    nlParseAccept: 0.84,
    riskFlagAccept: 0.91,
    sampleSize: 138,
  },
};

// ───────────────── Helpers ─────────────────

/** Subset of TASKS that are AI-drafted and waiting on human green-light. */
export const AI_TASK_DRAFTS = TASKS.filter((t) => t.awaitingHumanApproval);

export const TASK_USER_BY_ID: Record<string, TaskUser> = TASK_USERS.reduce(
  (acc, u) => {
    acc[u.id] = u;
    return acc;
  },
  {} as Record<string, TaskUser>,
);

export const TASK_PROPERTY_BY_CODE: Record<string, TaskProperty> = TASK_PROPERTIES.reduce(
  (acc, p) => {
    acc[p.code] = p;
    return acc;
  },
  {} as Record<string, TaskProperty>,
);
