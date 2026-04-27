// Breezeway fixture-API shim.
// Phase 1: appends/mutates local fixture arrays + fires "would push to Breezeway" toast.
// Phase 2: swap internals to call real Breezeway endpoints. UI surface stays identical.
//
// Every write goes through this shim. Modules MUST NOT mutate fixture arrays directly.

import { TASKS, TASK_USERS, TASK_USER_BY_ID, type Task, type TaskComment, type TaskUser, type ActivityEntry } from './tasks';
import { TIME_OFF_REQUESTS, type TimeOffRequest } from './timeOff';
import { ROSTER_LAST_WEEK, ROSTER_NEXT_WEEK, ROSTER_THIS_WEEK } from './roster';
import { TEAM_MESSAGES, type ChannelKey, type TeamMessage } from './teamInbox';
import {
  RESERVATION_BY_ID,
  RESERVATION_NOTES,
  type Reservation,
  type ReservationNote,
} from './reservations';

type ToastEmitter = (message: string) => void;

let toastSink: ToastEmitter | null = null;

/**
 * Wire a toast callback once at app boot. The shim fires on every write.
 * Phase 2: keep the toast (still useful in dev) but back it with real API responses.
 */
export function registerBreezewayToast(emit: ToastEmitter): void {
  toastSink = emit;
}

function fireToast(message: string): void {
  if (toastSink) toastSink(message);
  // No-op silently if no sink wired yet — useful in tests / SSR.
}

// ───────────────── Helpers ─────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function makeTaskId(): string {
  return `t-${Math.random().toString(36).slice(2, 8)}`;
}

function makeCommentId(): string {
  return `c-${Math.random().toString(36).slice(2, 8)}`;
}

function makeActivityId(): string {
  return `a-${Math.random().toString(36).slice(2, 8)}`;
}

// ───────────────── Task writes ─────────────────

export interface CreateTaskInput {
  title: string;
  description?: string;
  propertyCode: string;
  department: Task['department'];
  subdepartment: Task['subdepartment'];
  priority: Task['priority'];
  source: Task['source'];
  assigneeIds?: string[];
  requesterId?: string;
  dueDate: string;
  dueTime?: string;
  estimatedMinutes?: number;
  reservationId?: string;
  tags?: string[];
  inboxThreadId?: string;
  groupEmailId?: string;
  awaitingHumanApproval?: boolean;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const id = makeTaskId();
  const ts = nowIso();
  const task: Task = {
    id,
    title: input.title,
    description: input.description,
    propertyCode: input.propertyCode,
    department: input.department,
    subdepartment: input.subdepartment,
    priority: input.priority,
    status: 'todo',
    source: input.source,
    visibility: 'all',
    assigneeIds: input.assigneeIds ?? [],
    requesterId: input.requesterId,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    estimatedMinutes: input.estimatedMinutes,
    reservationId: input.reservationId,
    attachmentCount: 0,
    comments: [],
    costs: [],
    tags: input.tags ?? [],
    riskFlags: [],
    aiSuggestions: [],
    activityLog: [
      {
        id: makeActivityId(),
        ts,
        kind: 'created',
        actorId: input.requesterId ?? 'system',
        detail: `Task created from ${input.source}`,
      },
    ],
    createdAt: ts,
    updatedAt: ts,
    inboxThreadId: input.inboxThreadId,
    groupEmailId: input.groupEmailId,
    awaitingHumanApproval: input.awaitingHumanApproval,
  };
  TASKS.push(task);
  fireToast(`Would push to Breezeway: create task "${task.title}" at ${task.propertyCode}`);
  return task;
}

export interface UpdateTaskInput {
  taskId: string;
  patch: Partial<Pick<
    Task,
    | 'title'
    | 'description'
    | 'priority'
    | 'status'
    | 'assigneeIds'
    | 'dueDate'
    | 'dueTime'
    | 'estimatedMinutes'
    | 'spentMinutes'
    | 'tags'
  >>;
  actorId: string;
}

export async function updateTask({ taskId, patch, actorId }: UpdateTaskInput): Promise<Task> {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  Object.assign(task, patch);
  task.updatedAt = nowIso();
  task.activityLog.push({
    id: makeActivityId(),
    ts: task.updatedAt,
    kind: patch.status ? 'status_changed' : 'updated',
    actorId,
    detail: patch.status ? `Status → ${patch.status}` : Object.keys(patch).join(', '),
  });
  if (patch.status === 'completed') task.completedAt = task.updatedAt;
  fireToast(`Would push to Breezeway: update task ${taskId}`);
  return task;
}

// ───────────────── Cost-to-Finance integration ─────────────────

import { FIN_EXPENSES, type FinExpense } from './finance';

export interface AddCostInput {
  taskId: string;
  type: 'labor' | 'material' | 'expense' | 'tax' | 'skilled_labor' | 'unskilled_labor' | 'mileage' | 'markup';
  amount: number;
  currency: 'MUR' | 'EUR';
  description: string;
  ownerCharge: boolean;
  addedBy: string;
}

const FINANCE_THRESHOLD_MINOR = 500_000; // Rs 5,000 — above this triggers Path-A owner approval

/**
 * Add a cost line to a task. If `ownerCharge: true`, also create a Finance
 * expense capture with `sourceTaskId` set, kicking off the Path-A approval
 * flow when the amount crosses threshold.
 */
export async function addCost(input: AddCostInput): Promise<{ costId: string; flowedToFinanceExpenseId?: string }> {
  const task = TASKS.find((t) => t.id === input.taskId);
  if (!task) throw new Error(`Task ${input.taskId} not found`);
  const ts = nowIso();
  const costId = `cs-${Math.random().toString(36).slice(2, 8)}`;

  let flowedToFinanceExpenseId: string | undefined;

  if (input.ownerCharge) {
    // Create a FinExpense capture pointed back at the task.
    const expenseId = `e-${Math.random().toString(36).slice(2, 6)}`;
    const amountMinor = Math.round(input.amount * 100);
    const expense: FinExpense = {
      id: expenseId,
      occurredAt: ts.slice(0, 19).replace('T', ' '),
      enteredAt: ts.slice(0, 19).replace('T', ' '),
      vendorId: '',
      vendorName: 'task-originated',
      vendorUnrecognized: true,
      amountMinor,
      currency: input.currency,
      categoryCode: input.type === 'labor' || input.type === 'skilled_labor' || input.type === 'unskilled_labor' ? 'FR-MAI' : 'FR-REP',
      billTo: 'owner',
      propertyCode: task.propertyCode,
      description: input.description,
      status: amountMinor > FINANCE_THRESHOLD_MINOR ? 'pending_approval' : 'submitted',
      approvalTier: amountMinor > FINANCE_THRESHOLD_MINOR ? 'medium' : 'routine',
      approvalStatus: amountMinor > FINANCE_THRESHOLD_MINOR ? 'pending' : undefined,
      entryMode: 'team_breezeway',
      enteredBy: input.addedBy,
      brzTaskId: task.bzId,
      receipts: 0,
      periodId: 'p-2026-04',
      sourceTaskId: task.id,
    };
    FIN_EXPENSES.push(expense);
    flowedToFinanceExpenseId = expenseId;
    fireToast(`Cost added · flowing to Finance for ${expense.status === 'pending_approval' ? 'owner approval' : 'capture'}`);
  } else {
    fireToast('Cost added · internal (Friday absorbs)');
  }

  task.costs.push({
    id: costId,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    description: input.description,
    addedBy: input.addedBy,
    ownerCharge: input.ownerCharge,
    flowedToFinanceExpenseId,
  });
  if (input.ownerCharge) task.ownerCharge = true;

  task.activityLog.push({
    id: makeActivityId(),
    ts,
    kind: 'cost_added',
    actorId: input.addedBy,
    detail: `${input.amount.toLocaleString()} ${input.currency} · ${input.description}${input.ownerCharge ? ' · owner-billable' : ''}`,
  });
  task.updatedAt = ts;

  return { costId, flowedToFinanceExpenseId };
}

/**
 * Phase 1 heuristic for owner-billable cost suggestion.
 * Phase 2 swaps to LLM evaluation over historical data.
 */
export function suggestOwnerCharge(input: { description: string; type: string; amountMinor: number }): {
  suggested: boolean;
  confidence: number;
  reasoning: string;
} {
  const text = input.description.toLowerCase();
  const isCapex = /\b(replace|replacement|install|installation|compressor|boiler|heater|panel|new unit|capex|major repair|appliance)\b/.test(text);
  const isRoutine = /\b(routine|cleaning|inspection|checkup|tune.up|minor|fluid|service|amenities|stocking)\b/.test(text);

  if (isCapex && !isRoutine) {
    return {
      suggested: true,
      confidence: 0.87,
      reasoning: `${input.description.length > 40 ? input.description.slice(0, 40) + '…' : input.description} — capex-class repair, falls outside routine maintenance covered by management fee.`,
    };
  }
  if (isRoutine && !isCapex) {
    return {
      suggested: false,
      confidence: 0.82,
      reasoning: 'Routine maintenance — typically absorbed by management fee, not owner-billable.',
    };
  }
  if (input.amountMinor > 1_000_000) {
    return {
      suggested: true,
      confidence: 0.71,
      reasoning: 'High-value cost — likely owner-billable, but please review.',
    };
  }
  return {
    suggested: false,
    confidence: 0.55,
    reasoning: 'Unclear — defaulting to internal. Override if this is a passthrough cost.',
  };
}

export async function addComment(input: {
  taskId: string;
  authorId: string;
  text: string;
  mentions?: string[];
}): Promise<TaskComment> {
  const task = TASKS.find((t) => t.id === input.taskId);
  if (!task) throw new Error(`Task ${input.taskId} not found`);
  const ts = nowIso();
  const comment: TaskComment = {
    id: makeCommentId(),
    authorId: input.authorId,
    text: input.text,
    ts,
    mentions: input.mentions,
    syncedToBreezeway: false,
  };
  task.comments.push(comment);
  task.activityLog.push({
    id: makeActivityId(),
    ts,
    kind: 'commented',
    actorId: input.authorId,
    detail: input.text.length > 60 ? input.text.slice(0, 57) + '…' : input.text,
  });
  task.updatedAt = ts;
  fireToast(`Would push to Breezeway: comment on task ${task.id}`);
  return comment;
}

export async function approveAiDraft(taskId: string, actorId: string): Promise<Task> {
  const task = TASKS.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  task.awaitingHumanApproval = false;
  task.updatedAt = nowIso();
  task.activityLog.push({
    id: makeActivityId(),
    ts: task.updatedAt,
    kind: 'approved',
    actorId,
    detail: 'AI draft approved → pushed to Breezeway',
  });
  fireToast(`Would push to Breezeway: approve and create AI-drafted task "${task.title}"`);
  return task;
}

export async function dismissAiDraft(taskId: string, actorId: string): Promise<void> {
  const idx = TASKS.findIndex((t) => t.id === taskId);
  if (idx === -1) return;
  TASKS.splice(idx, 1);
  fireToast(`AI draft dismissed (would NOT push to Breezeway)`);
}

// ───────────────── Reads ─────────────────

export async function fetchTasks(filter?: {
  propertyCode?: string;
  status?: Task['status'];
  assigneeId?: string;
}): Promise<Task[]> {
  let result = [...TASKS];
  if (filter?.propertyCode) result = result.filter((t) => t.propertyCode === filter.propertyCode);
  if (filter?.status) result = result.filter((t) => t.status === filter.status);
  if (filter?.assigneeId) result = result.filter((t) => t.assigneeIds.includes(filter.assigneeId!));
  return result;
}

export async function fetchTask(taskId: string): Promise<Task | undefined> {
  return TASKS.find((t) => t.id === taskId);
}

// ───────────────── Roster sync stub ─────────────────

export async function publishRosterToBreezeway(weekId: string, actorId: string): Promise<void> {
  fireToast(`Would push to Breezeway: publish roster ${weekId} (sets staff availability)`);
}

// ───────────────── HR shim ─────────────────

export type CreateStaffInput = Omit<TaskUser, 'id' | 'initials' | 'avatarColor' | 'active'>;

export async function createStaff(input: CreateStaffInput): Promise<TaskUser> {
  const id = `u-${input.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}-${Math.random().toString(36).slice(2, 5)}`;
  const initials = input.name
    .split(' ')
    .map((n) => n[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
  const palette = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#84cc16', '#ec4899', '#6366f1'];
  const avatarColor = palette[Math.floor(Math.random() * palette.length)];
  const user: TaskUser = {
    ...input,
    id,
    initials,
    avatarColor,
    active: true,
  };
  TASK_USERS.push(user);
  fireToast(`Staff added: ${user.name}`);
  return user;
}

export async function updateStaff(id: string, patch: Partial<TaskUser>): Promise<TaskUser | undefined> {
  const user = TASK_USERS.find((u) => u.id === id);
  if (!user) return undefined;
  Object.assign(user, patch);
  fireToast(`Staff updated: ${user.name}`);
  return user;
}

export interface CreateTimeOffInput {
  userId: string;
  startDate: string;
  endDate: string;
  type: TimeOffRequest['type'];
  reason?: string;
}

export async function createTimeOffRequest(input: CreateTimeOffInput): Promise<TimeOffRequest> {
  const req: TimeOffRequest = {
    id: `to-${Date.now()}`,
    ...input,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  TIME_OFF_REQUESTS.push(req);
  fireToast(`Time-off request submitted (${input.startDate} → ${input.endDate})`);
  return req;
}

export async function decideTimeOff(
  requestId: string,
  decision: 'approved' | 'declined',
  reviewerId: string,
  notes?: string,
): Promise<TimeOffRequest | undefined> {
  const req = TIME_OFF_REQUESTS.find((r) => r.id === requestId);
  if (!req) return undefined;
  req.status = decision;
  req.reviewedBy = reviewerId;
  req.reviewedAt = new Date().toISOString();
  req.reviewNotes = notes;

  if (decision === 'approved') {
    // Auto-flip RosterDay cells overlapping the request window.
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    const weeks = [ROSTER_LAST_WEEK, ROSTER_THIS_WEEK, ROSTER_NEXT_WEEK];
    let touched = 0;
    for (const week of weeks) {
      for (const day of week.days) {
        if (day.userId !== req.userId) continue;
        const dayDate = new Date(day.date);
        if (dayDate >= start && dayDate <= end) {
          day.availability = 'leave';
          day.zone = null;
          day.leaveType = req.type;
          touched++;
        }
      }
    }
    fireToast(`Time-off approved · ${touched} roster day${touched === 1 ? '' : 's'} updated`);
  } else {
    fireToast(`Time-off declined`);
  }

  return req;
}

// ───────────────── Team Inbox shim ─────────────────

/**
 * Append a system message to a Team Inbox channel. Used by the Roster Publish
 * flow (T5) to post to #ops, and any other module that wants to surface state
 * changes inside the team feed.
 */
export function postToTeamChannel(
  channelKey: ChannelKey,
  text: string,
  authorId: string,
  kind: TeamMessage['kind'] = 'text',
): TeamMessage {
  const message: TeamMessage = {
    id: `tm-${Date.now()}`,
    channelKey,
    authorId,
    text,
    ts: new Date().toISOString(),
    kind,
  };
  TEAM_MESSAGES.push(message);
  return message;
}

// Re-export the activity entry type so consumers don't need a second import.
export type { ActivityEntry } from './tasks';

// ───────────────── Reservation writes ─────────────────

function makeNoteId(): string {
  return `rnote-${Math.random().toString(36).slice(2, 8)}`;
}

export function addReservationNote(input: {
  reservationId: string;
  authorId: string;
  body: string;
  mentions: string[];
}): ReservationNote {
  const author = TASK_USER_BY_ID[input.authorId];
  const note: ReservationNote = {
    id: makeNoteId(),
    reservationId: input.reservationId,
    authorId: input.authorId,
    authorName: author?.name ?? 'Unknown',
    body: input.body,
    mentions: input.mentions,
    createdAt: new Date().toISOString(),
  };
  RESERVATION_NOTES.push(note);
  return note;
}

/**
 * Mutate a reservation's check-in / check-out time and queue a Guesty-sync
 * task so the ops manager can manually push the change upstream until we
 * have a real Guesty integration. Returns { reservation, syncTask } so the
 * caller can re-render and toast.
 */
export async function updateReservationTimes(input: {
  reservationId: string;
  checkIn?: string;
  checkOut?: string;
  actorId: string;
}): Promise<{ reservation: Reservation; syncTask: Task }> {
  const rsv = RESERVATION_BY_ID[input.reservationId];
  if (!rsv) throw new Error(`Reservation ${input.reservationId} not found`);

  const changes: string[] = [];
  if (input.checkIn && input.checkIn !== rsv.checkIn) {
    changes.push(`check-in ${formatDt(rsv.checkIn)} → ${formatDt(input.checkIn)}`);
    rsv.checkIn = input.checkIn;
  }
  if (input.checkOut && input.checkOut !== rsv.checkOut) {
    changes.push(`check-out ${formatDt(rsv.checkOut)} → ${formatDt(input.checkOut)}`);
    rsv.checkOut = input.checkOut;
  }
  // Recompute nights from the (possibly updated) window.
  rsv.nights = Math.max(
    1,
    Math.round(
      (new Date(rsv.checkOut).getTime() - new Date(rsv.checkIn).getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );

  // Find the ops_manager(s) — typically one user (Franny). If none in the
  // fixture, fall back to assigning the actor so the task isn't orphaned.
  const opsManagers = TASK_USERS.filter((u) => u.role === 'ops_manager' && u.active).map(
    (u) => u.id,
  );
  const assigneeIds = opsManagers.length > 0 ? opsManagers : [input.actorId];

  const syncTask = await createTask({
    title: `Update Guesty: ${rsv.guestName} ${changes.join(', ')}`,
    description: `Reservation ${rsv.id} (${rsv.propertyCode}) was updated in FAD. Push the new time(s) to Guesty so the channel partners see the same window.`,
    propertyCode: rsv.propertyCode,
    department: 'office',
    subdepartment: 'admin',
    priority: 'high',
    source: 'manual',
    assigneeIds,
    requesterId: input.actorId,
    dueDate: new Date().toISOString().slice(0, 10),
    reservationId: rsv.id,
  });

  return { reservation: rsv, syncTask };
}

function formatDt(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${hh}:${mm}`;
}
