// @demo:data — AI inference context — depends on AI integration shape
// Tag: PROD-DATA-15 — see frontend/DEMO_CRUFT.md

// AI fixture pools — Phase 1 stand-in for LLM responses.
// Each surface has a pool of 3-5 responses; selection is deterministic-but-varied
// by hour-of-day so reloads in the same hour show the same response, next hour
// shows different one. Phase 2 swaps these pools for real LLM calls.

export const DAILY_BRIEF_POOL: string[] = [];

export const RISK_FLAG_EXPLANATIONS: Record<string, string[]> = {
  overdue: [
    'Task due Apr 25, no progress logged since Apr 23. Last activity: Bryan set status to In Progress on Apr 23. Recommend: ping Bryan or reassign.',
    'Past due date by 5 days. Mathias on leave Mon-Tue per roster, suggest reassigning to Bryan who has north-zone capacity Wed.',
    'Task created Apr 15, due Apr 22, now 5 days late. Open scope change request on file — possibly blocking. Review approval queue.',
  ],
  no_progress: [
    'Task in "in_progress" status since Apr 23 with no comments or activity. Suggests blockage. Consider 1:1 sync with assignee.',
    'Status changed to paused 32 minutes ago without explanation. Likely waiting on external input (vendor quote, owner approval, etc.).',
  ],
  blocked_access: [
    'Comment thread mentions "no access code received" on Apr 26. Property profile shows no access code set. Recommend: contact owner before re-attempting.',
    'Field PM noted gate keypad battery dead. Replacement scheduled, but task currently un-actionable until fix complete.',
  ],
  over_time: [
    'Spent 144 min vs estimated 30 min — 4.8× over estimate. Likely a chase scenario (e.g., collecting payment, vendor follow-up). Consider adding @Judith for escalation.',
    'Time-tracking shows 220 min on a task budgeted at 90. Worth reviewing requirements list — scope may have grown silently.',
  ],
  unassigned: [
    'AI-drafted task awaiting human assignment. Default suggested assignee not available this week — please pick replacement.',
    'No one currently assigned. Inbox source thread suggests guest is awaiting reply — recommend immediate triage.',
  ],
  reservation_imminent: [
    'Linked reservation checks in within 4h. Cleaning task must close by 60 min before check-in. If at risk, escalate or pull in standby staff.',
    'Guest arrival in < 24h. Pre-arrival inspection blocking. If not started by EOD, reservation team will need to pivot.',
  ],
};

export const ROSTER_DRAFT_RATIONALES: string[] = [];

/** Hour-of-day deterministic pool selector. Same hour → same pick. */
export function pickFromPool<T>(pool: T[], seed?: number): T {
  if (pool.length === 0) throw new Error('Empty AI fixture pool');
  const s = seed ?? new Date().getHours();
  return pool[s % pool.length];
}

/** Pick a random *different* index from the previously shown one. Used by Regenerate. */
export function pickDifferent<T>(pool: T[], previousIndex: number): { value: T; index: number } {
  if (pool.length <= 1) return { value: pool[0], index: 0 };
  let next = previousIndex;
  while (next === previousIndex) {
    next = Math.floor(Math.random() * pool.length);
  }
  return { value: pool[next], index: next };
}
