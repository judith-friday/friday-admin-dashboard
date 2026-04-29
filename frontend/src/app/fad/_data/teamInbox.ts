// @demo:data — Team-internal threads — GET /api/inbox/team-threads
// Tag: PROD-DATA-11 — see frontend/DEMO_CRUFT.md

// Team Inbox fixtures — channels + DMs + messages + scheduled calls.
// Phase 1 fixture-only with optimistic local state (T3 wires UI).
// Replaces internal Slack at the FAD level.

export type ChannelKey =
  | 'general'
  | 'ops'
  | 'finance'
  | 'syndic'
  | 'marketing';

export interface TeamChannel {
  id: string;
  key: ChannelKey;
  name: string;
  purpose: string;
  memberIds: string[];
  unread?: number;
}

export const TEAM_CHANNELS: TeamChannel[] = [];

export interface TeamDM {
  id: string;
  participantIds: string[]; // 2 user ids for 1:1, 3+ for group DM
  unread?: number;
}

export const TEAM_DMS: TeamDM[] = [];

export type TeamMessageKind = 'text' | 'system' | 'call_scheduled' | 'task_link' | 'roster_publish' | 'finance_escalation';

/** Tier of a finance-escalation post. T1 = direct ask in #finance,
 *  T2 = phone-call escalation if T1 silent, T3 = fallback to Franny. */
export type FinanceEscalationTier = 't1_inbox' | 't2_phone_3cx' | 't3_fallback';

export interface FinanceEscalationMeta {
  /** Original requestor (e.g. Mathias). */
  requestorId: string;
  /** Who we're asking for approval right now. */
  recipientId: string;
  reservationId?: string;
  amountMinor: number;
  currency: 'MUR' | 'EUR' | 'USD';
  reason: string;
  urgent?: boolean;
  tier: FinanceEscalationTier;
  /** Stable id linking T1 → T2 → T3 messages for the same request. */
  requestId: string;
}

export interface TeamMessage {
  id: string;
  channelKey?: ChannelKey;     // present for channel posts
  dmId?: string;               // present for DMs
  authorId: string;
  text: string;
  ts: string;
  mentions?: string[];         // user ids
  kind?: TeamMessageKind;
  /** for kind: 'task_link' */
  linkedTaskId?: string;
  /** for kind: 'call_scheduled' — fixture Meet URL */
  callMeta?: TeamCallMeta;
  /** for kind: 'finance_escalation' — see FinanceEscalationMeta */
  financeEscalation?: FinanceEscalationMeta;
  attachments?: number;
  threadCount?: number;
}

export interface TeamCallMeta {
  id: string;
  title: string;
  startAt: string; // ISO
  meetUrl: string;
  inviteeIds: string[];
  inviteeEmails?: string[];    // for non-FAD attendees
  organizerId: string;
}

export const TEAM_MESSAGES: TeamMessage[] = [];

/** All scheduled calls extracted for any future "Upcoming calls" surface. */
export const SCHEDULED_CALLS: TeamCallMeta[] = TEAM_MESSAGES
  .filter((m): m is TeamMessage & { callMeta: TeamCallMeta } => !!m.callMeta)
  .map((m) => m.callMeta);
