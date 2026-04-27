'use client';

import { useState } from 'react';
import { IconClose, IconSparkle } from './icons';

/** Per-module help content. Keyed by moduleId from `_data/modules.ts`.
 *  Consumers pass `helpKey={'reviews'}` to ModuleHeader; missing keys fall
 *  through to the generic content. Each module gets 3-5 short cards
 *  covering: what is this, common workflows, where things live, who owns it. */
export interface HelpContent {
  /** Used in the drawer header as "Help · {label}". */
  label: string;
  /** Lead paragraph — 1-2 sentences explaining the module. */
  summary: string;
  /** Bulleted "what you can do here" — keep each line under 80 chars. */
  capabilities: string[];
  /** Optional "common workflows" — pairs of (label, steps). */
  workflows?: { label: string; steps: string[] }[];
  /** Who to ask if Ask Friday can't help. */
  ownership?: string;
}

const GENERIC: HelpContent = {
  label: 'Friday Admin Dashboard',
  summary: 'FAD is the operational system Friday uses to run the business — operations, guest services, finance, owners, properties, reviews, HR.',
  capabilities: [
    'Use the sidebar to switch modules; sub-pages live under each module.',
    'Press ⌘K to search across the dashboard or ask Friday a question in plain language.',
    'Every list is filterable; every detail page shows audit trail.',
  ],
  ownership: 'Ask Friday in the top bar handles most "how do I…" questions in context. For anything else, ping Ishant.',
};

const HELP: Record<string, HelpContent> = {
  inbox: {
    label: 'Inbox',
    summary: 'Unified messaging across channels — Airbnb, Booking, WhatsApp, email — for guests, owners, and vendors. Internal team comms also live here (#finance, #ops, #syndic, DMs).',
    capabilities: [
      'Filter by entity (All / Guest / Owner / Vendor / Team) using the chips below the title.',
      'Each thread has linked-stay context, AI summary, and an internal-note composer.',
      'Send replies directly to the channel with Friday-drafted suggestions; switch to internal note from the same composer.',
    ],
    workflows: [
      {
        label: 'Reply to a guest',
        steps: [
          'Tap a thread → reply in the bottom composer.',
          '"Polish with Friday" rewrites your draft on-brand.',
          'Hit Send · Reply or pick "Internal note" from the split-button to leave a team-only comment.',
        ],
      },
    ],
    ownership: 'Mathias owns guest threads, Mary handled owner threads (transitioning to Ishant May 25).',
  },
  operations: {
    label: 'Operations',
    summary: 'Tasks, reported issues, approvals, roster, and insights for the day-to-day running of the property portfolio.',
    capabilities: [
      'All tasks lives under "All tasks" with full filter + sort and a card view on mobile.',
      'Reported Issues triages guest-reported problems into Operations tasks with one click.',
      'Roster shows the week\'s coverage and density per zone × department.',
      'Source filter includes Reviews so review-derived tasks show up alongside everything else.',
    ],
    workflows: [
      {
        label: 'Convert a reported issue into a task',
        steps: [
          'Operations → Reported issues → tap the issue.',
          'Detail panel offers "Convert to task" with department / priority pre-suggested.',
          'Edit if needed, hit Create — task appears in All tasks immediately.',
        ],
      },
    ],
    ownership: 'Franny is the ops manager. Field team: Bryan (north / maintenance), Alex (west / cleaning + inspection).',
  },
  calendar: {
    label: 'Calendar',
    summary: 'Master calendar — reservations as continuous bars, tasks as events. The single source-of-truth Ask Friday uses for "what\'s happening when".',
    capabilities: [
      'Day / Week / Month views (dropdown on mobile).',
      'Click a stay band → popover with financials and quick actions: + Note, + Task, Adjust times.',
      '"Adjust times" mutates the reservation and auto-creates a Guesty-sync task for the ops manager.',
      'Filter chips: Reservations / Tasks / Maintenance / Meetings + Mine only toggle.',
    ],
    ownership: 'Calendar reflects whatever Operations + Reservations have. Updates flow from those modules.',
  },
  reviews: {
    label: 'Reviews',
    summary: 'Aggregate review intelligence pulled from Guesty (per-channel) and joined to Breezeway tasks for staff attribution. No Reva dependency.',
    capabilities: [
      'Overview shows AI anomaly callouts + suggested actions you can convert into Operations tasks one-click.',
      'All Reviews has full filters (rating / channel / cohort / has-reply), reply composer, internal note, and create-task drawer.',
      'Trends has 6 deep-dive views: Cohort summaries (AI narrative), Trending tags, Tags by unit, Low-rated drilldown, Avg by unit, MoM grid.',
      'Staff Performance correlates review sentiment with cleaner/inspector attribution via Breezeway task IDs.',
    ],
    workflows: [
      {
        label: 'Turn a review into an Operations task',
        steps: [
          'Reviews → All reviews → tap a review.',
          'Detail panel → "Create task from review" — drawer pre-fills source = review.',
          'Confirm and the new task lands in Operations All tasks; filter by source = review to see them all.',
        ],
      },
    ],
    ownership: 'Ishant + Claude. Future: Marketing module owns direct-booking review collection.',
  },
  finance: {
    label: 'Finance',
    summary: 'The full finance + accounting stack — capture, classify, reconcile, period-close, FR P&L. Mary leaves May 25; this module replaces her institutional knowledge.',
    capabilities: [
      'Path A captures (team) require a Breezeway task ID; Path B (admin) is direct.',
      'Approvals inbox tracks WhatsApp owner approvals with defence-in-depth response capture.',
      'Period close is an 8-stage wizard. Stage 4 surfaces auto-detected payout discrepancies (resolution-centre refunds, special-offer fare collapses, platform discounts).',
      'Above-cap refund / reconciliation requests post to FAD Inbox #finance with tiered escalation. Configure the chain in Settings → Approval escalation.',
    ],
    workflows: [
      {
        label: 'Resolve an open recon item',
        steps: [
          'Overview → "Open reconciliation items" card → "Resolve in period close" or open Stage 4 directly.',
          'Tap Apply on a row. Below cap → posts the corrective Owner Charge directly. Above cap → posts to #finance for Ishant\'s approval.',
        ],
      },
      {
        label: 'Run period close',
        steps: [
          'Overview → "Resume close" (or click "Close period" in the header).',
          'Walk through 8 stages: Pre-flight / FX rate / Bank recon / Revenue recon (Mathias) / Per-property / Tourist tax / P&L preview / Lock + post.',
          'Stage 4 is Mathias\'s; Stage 5 is the densest (per-property FAD-vs-Guesty divergence review).',
        ],
      },
    ],
    ownership: 'Ishant is the admin. Mathias owns Stage 4 revenue recon. Mary handed off end May.',
  },
  hr: {
    label: 'HR',
    summary: 'Staff records, roster planning, time-off, fairness/coverage stats, and permissions matrix.',
    capabilities: [
      'Stats sub-page now includes review-attributed metrics per cleaner (avg rating, good/bad clean tag counts).',
      'Permissions matrix is editable per role × resource × action; Director-locked rules show as gray.',
      'Roster pulls from the workload preview (desktop) and a day-pager (mobile).',
    ],
    ownership: 'Ishant manages permissions. Franny drafts the weekly roster.',
  },
  training: {
    label: 'Training',
    summary: 'Teaches Friday\'s AI on Friday\'s voice, principles, and operational rules. Powers the AI surfaces across Inbox, Reviews, Operations, Finance.',
    capabilities: [
      'Teachings: rule-style guidance ("for Nitzana properties always confirm pool heating in first reply").',
      'Learning Queue: candidate teachings auto-discovered from approved replies.',
      'Brand voice: principles + good/avoid examples driving Friday\'s polish flow.',
      'Automations: trigger-action rules with confidence scores.',
    ],
    ownership: 'Cross-cutting. Most teachings come from Mathias on guest tone; brand voice is Ishant.',
  },
  settings: {
    label: 'Settings',
    summary: 'FAD-shell preferences: theme, density, sidebar collapse, integrations, and bug reports.',
    capabilities: [
      'Theme + dark mode follows your OS preference by default.',
      'Density "Dense" is good for the Inbox; "Comfy" is better on the calendar / large screens.',
      'Bug reports lists open issues — file new ones via the floating bug button bottom-right.',
    ],
    ownership: 'Self-serve.',
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  helpKey?: string;
}

export function ModuleHelpDrawer({ open, onClose, helpKey }: Props) {
  if (!open) return null;
  const c = (helpKey && HELP[helpKey]) || GENERIC;

  return (
    <>
      <div className="fad-drawer-overlay open" onClick={onClose} />
      <aside className="fad-drawer open" style={{ maxWidth: 480 }}>
        <div className="fad-drawer-header">
          <div className="fad-drawer-title">
            <IconSparkle size={14} /> Help · {c.label}
          </div>
          <button className="fad-util-btn" onClick={onClose} title="Close" style={{ marginLeft: 'auto' }}>
            <IconClose />
          </button>
        </div>
        <div className="fad-drawer-body" style={{ padding: 16 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-text-secondary)', marginTop: 0 }}>
            {c.summary}
          </p>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              What you can do here
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
              {c.capabilities.map((cap, i) => <li key={i} style={{ marginBottom: 4 }}>{cap}</li>)}
            </ul>
          </div>

          {c.workflows && c.workflows.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Common workflows
              </div>
              {c.workflows.map((w, i) => (
                <div key={i} style={{ marginBottom: 12, padding: 10, background: 'var(--color-background-secondary)', borderRadius: 4, borderLeft: '2px solid var(--color-brand-accent)' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{w.label}</div>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                    {w.steps.map((s, j) => <li key={j} style={{ marginBottom: 2 }}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {c.ownership && (
            <div style={{ marginTop: 18, padding: 10, background: 'var(--color-bg-info)', borderRadius: 4, borderLeft: '2px solid var(--color-text-info)' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-info)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 500 }}>
                Who owns this
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {c.ownership}
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, fontSize: 11, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            For anything not covered here, press ⌘K → "Ask Friday" or click the sparkle icon in the sidebar to open the full Friday assistant.
          </div>
        </div>
      </aside>
    </>
  );
}

/** Help button — pairs with `<ModuleHelpDrawer>`. Render in the sidebar of
 *  the ModuleHeader. */
export function ModuleHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="fad-module-help-btn"
      onClick={onClick}
      title="What is this module? How do I use it?"
      aria-label="Module help"
    >
      ?
    </button>
  );
}
