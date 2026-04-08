'use client'

import React, { useState, useMemo, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Data: every help section as a flat object for search & render
// ---------------------------------------------------------------------------
interface HelpEntry {
  id: string
  title: string
  group: string          // rendered as a divider before first item in group
  content: string        // plain-text version for search matching
  keywords: string[]
  render: (hl: (text: string) => React.ReactNode) => React.ReactNode
}

const HELP_DATA: HelpEntry[] = [
  // ── Ask Friday ──────────────────────────────────────────────────────────
  {
    id: 'ask-friday-overview',
    title: 'Ask Friday (AI Assistant)',
    group: 'Ask Friday',
    keywords: ['ask', 'friday', 'chat', 'ai', 'assistant', 'button', 'chip', 'draft', 'compose', 'revision', 'mobile', 'desktop'],
    content: 'Ask Friday is your AI assistant for guest communication. Open it by clicking the Ask Friday button in conversation detail. Use chip buttons for quick actions like revise tone, add info, or suggest response. Friday writes and revises drafts that appear directly in the compose editor not in the chat. Works on both desktop and mobile.',
    render: (hl) => (
      <div className="space-y-3">
        <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>{hl('Your AI assistant for guest communication.')}</p>
        <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Open:</span> {hl('Click the "Ask Friday" button in conversation detail')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Chip buttons:</span> {hl('Quick actions for common requests (revise tone, add info, suggest response)')}</div>
          <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Draft revision:</span> {hl('Friday writes/revises drafts that appear directly in the compose editor')}</div>
          <div>• {hl("Friday doesn't show the draft in her chat \u2014 it goes directly to the compose surface")}</div>
          <div>• {hl('Works on both desktop and mobile')}</div>
        </div>
      </div>
    ),
  },

  // ── Compose & Draft ─────────────────────────────────────────────────────
  {
    id: 'compose-draft',
    title: 'Compose & Draft',
    group: 'Compose & Draft',
    keywords: ['compose', 'draft', 'ai', 'generated', 'review', 'approve', 'revise', 'send', 'editor', 'incoming', 'message'],
    content: 'AI-generated drafts appear automatically for incoming messages. Review approve or revise drafts before sending. Use the compose panel to write new messages from scratch.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('AI-generated drafts appear automatically for incoming messages')}</div>
        <div>• {hl('Review, approve, or revise drafts before sending')}</div>
        <div>• {hl('Compose panel for writing new messages from scratch')}</div>
      </div>
    ),
  },
  {
    id: 'mobile-panels',
    title: 'Mobile Panels',
    group: 'Compose & Draft',
    keywords: ['mobile', 'collapsible', 'panel', 'minimize', 'tap', 'expand', 'collapse', 'bar'],
    content: 'On mobile panels are collapsible. Tap the minimize bar to collapse a panel. Tap again to expand. Keeps the screen uncluttered on smaller devices.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('On mobile: panels are collapsible')}</div>
        <div>• {hl('Tap the minimize bar to collapse, tap again to expand')}</div>
        <div>• {hl('Keeps the screen uncluttered on smaller devices')}</div>
      </div>
    ),
  },
  {
    id: 'channels',
    title: 'Channels',
    group: 'Compose & Draft',
    keywords: ['channel', 'airbnb', 'booking', 'whatsapp', 'email', 'send'],
    content: 'Supported channels: Airbnb, Booking.com, WhatsApp, Email. Channel is auto-detected from the guest conversation. You can change it before sending.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <p>{hl('Supported channels:')}</p>
        <div className="flex flex-wrap gap-2">
          {['Airbnb', 'Booking.com', 'WhatsApp', 'Email'].map(ch => (
            <span key={ch} className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{ch}</span>
          ))}
        </div>
        <div>• {hl('Channel auto-detected from conversation. Change before sending if needed.')}</div>
      </div>
    ),
  },

  // ── Knowledge & Rules ───────────────────────────────────────────────────
  {
    id: 'teaching-panel',
    title: 'Knowledge & Rules (Teaching Panel)',
    group: 'Knowledge & Rules',
    keywords: ['knowledge', 'rules', 'teaching', 'panel', 'brain', 'header', 'active', 'review', 'queue', 'metrics', 'corrections'],
    content: 'Open the Teaching Panel via the brain button in the header. 4 tabs: Active Rules, Review Queue, Metrics, Corrections. Manage what Friday knows and how she responds.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Open:</span> {hl('Click the \ud83e\udde0 button in the header')}</div>
        <div className="space-y-1.5 mt-2">
          <p className="font-semibold" style={{color: '#e2e8f0'}}>4 tabs:</p>
          {[
            ['Active Rules', 'View, edit, pause/resume, or revoke existing rules'],
            ['Review Queue', 'Approve or reject AI-detected teaching candidates'],
            ['Metrics', 'Bulk AI review via "Analyze All"'],
            ['Corrections', 'History of team corrections and revisions'],
          ].map(([tab, desc]) => (
            <div key={tab} className="flex items-start gap-2">
              <span className="px-2 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{tab}</span>
              <span>{hl(desc)}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'managing-rules',
    title: 'Managing Rules',
    group: 'Knowledge & Rules',
    keywords: ['add', 'edit', 'pause', 'resume', 'revoke', 'rule', 'manual', 'teaching'],
    content: 'Add rules manually from the Active Rules tab. Edit existing rules via the Edit button. Pause and resume rules without deleting them. Revoke rules that are no longer needed. Review Queue lets you approve or reject AI-detected teaching candidates.',
    render: (hl) => (
      <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Add rules manually from the Active Rules tab')}</div>
        <div>• {hl('Edit existing rules via the Edit button')}</div>
        <div>• {hl('Pause/resume rules without deleting them')}</div>
        <div>• {hl('Revoke rules that are no longer needed')}</div>
        <div>• <span style={{fontWeight: 500, color: '#fbbf24'}}>Review Queue:</span> {hl('approve or reject AI-detected teaching candidates')}</div>
        <div>• <span style={{fontWeight: 500, color: '#e2e8f0'}}>Analyze All:</span> {hl('bulk AI review available in the Metrics tab')}</div>
      </div>
    ),
  },

  // ── Pending Actions & Next Steps ────────────────────────────────────────
  {
    id: 'pending-actions',
    title: 'Pending Actions & Next Steps',
    group: 'Pending Actions',
    keywords: ['action', 'pending', 'next', 'steps', 'due', 'date', 'check-in', 'check-out', 'done', 'dismiss', 'edit', 'reservation'],
    content: 'The system detects required actions from conversations automatically. Due dates are based on reservation check-in and check-out dates. Mark actions as Done when completed. Dismiss actions that are no longer relevant. Edit action text or due date if needed.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('System detects required actions from conversations automatically')}</div>
        <div>• {hl('Due dates based on reservation check-in/check-out')}</div>
        <div className="space-y-1.5 mt-2">
          {[
            ['Done', 'Mark when the action is completed', '#4ade80'],
            ['Dismiss', 'Remove if no longer relevant', '#fbbf24'],
            ['Edit', 'Adjust action text or due date', '#6395ff'],
          ].map(([label, desc, color]) => (
            <div key={label}>
              <span style={{fontWeight: 500, color: color as string}}>{label}</span>{' \u2014 '}
              {hl(desc)}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>on time</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>due soon</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>overdue</span>
        </div>
      </div>
    ),
  },

  // ── Analytics ───────────────────────────────────────────────────────────
  {
    id: 'analytics-developer',
    title: 'Developer Analytics',
    group: 'Analytics',
    keywords: ['analytics', 'developer', 'token', 'cost', 'error', 'draft', 'quality', 'trends'],
    content: 'Developer tab shows token usage trends, API costs, error rates, and draft quality metrics over time.',
    render: (hl) => (
      <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Token usage trends over time')}</div>
        <div>• {hl('API costs breakdown')}</div>
        <div>• {hl('Error rates and failures')}</div>
        <div>• {hl('Draft quality metrics')}</div>
      </div>
    ),
  },
  {
    id: 'analytics-team',
    title: 'Team Analytics',
    group: 'Analytics',
    keywords: ['analytics', 'team', 'messages', 'response', 'time', 'usage', 'ask friday', 'workload'],
    content: 'Team tab shows messages per user, response times, and Ask Friday usage. Helps track team performance and workload distribution.',
    render: (hl) => (
      <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Messages per user')}</div>
        <div>• {hl('Response times by team member')}</div>
        <div>• {hl('Ask Friday usage stats')}</div>
        <div>• {hl('Workload distribution across the team')}</div>
      </div>
    ),
  },
  {
    id: 'analytics-insights',
    title: 'Automated Insights',
    group: 'Analytics',
    keywords: ['insights', 'alerts', 'stale', 'conversations', 'workload', 'imbalance', 'issues'],
    content: 'Insights tab surfaces automated alerts for issues: stale conversations that need attention, workload imbalance across team members, and other operational issues.',
    render: (hl) => (
      <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Automated alerts for operational issues')}</div>
        <div>• {hl('Stale conversations that need attention')}</div>
        <div>• {hl('Workload imbalance detection')}</div>
        <div>• {hl('Actionable recommendations')}</div>
      </div>
    ),
  },

  // ── Quick Tips ──────────────────────────────────────────────────────────
  {
    id: 'routing-display',
    title: 'Routing Display',
    group: 'Quick Tips',
    keywords: ['routing', 'name', 'via', 'friday', 'channel', 'sent', 'who'],
    content: 'Message routing shows "Name via Friday on Channel" so you can see who sent what and through which platform at a glance.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
          <span style={{color: '#e2e8f0'}}>{hl('"Mathias via Friday on Airbnb"')}</span>
        </div>
        <div>• {hl('Shows who sent the message, through Friday, on which channel')}</div>
      </div>
    ),
  },
  {
    id: 'sentiment-badges',
    title: 'Sentiment Badges',
    group: 'Quick Tips',
    keywords: ['sentiment', 'badge', 'happy', 'neutral', 'upset', 'angry', 'conversation'],
    content: 'Conversations display sentiment badges showing the guest mood. Green for positive, amber for neutral, red for negative or upset guests.',
    render: (hl) => (
      <div className="space-y-2 text-xs" style={{color: '#94a3b8'}}>
        <div>{hl('Sentiment badges on conversations show guest mood:')}</div>
        <div className="flex gap-2 mt-1">
          <span className="px-2 py-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>positive</span>
          <span className="px-2 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>neutral</span>
          <span className="px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>negative</span>
        </div>
      </div>
    ),
  },
  {
    id: 'missing-knowledge',
    title: 'Missing Knowledge Indicator',
    group: 'Quick Tips',
    keywords: ['missing', 'knowledge', 'property', 'data', 'incomplete', 'indicator', 'warning'],
    content: 'A missing knowledge indicator appears when property data is incomplete. This means Friday may not have enough context for accurate drafts. Update the property card to improve draft quality.',
    render: (hl) => (
      <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
        <div>• {hl('Indicator appears when property data is incomplete')}</div>
        <div>• {hl('Means Friday may lack context for accurate drafts')}</div>
        <div>• {hl('Update the property card to improve draft quality')}</div>
      </div>
    ),
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    group: 'Quick Tips',
    keywords: ['shortcut', 'keyboard', 'navigate', 'enter', 'escape', 'hotkey'],
    content: 'Navigate conversations up down. Open conversation enter. Focus Ask Friday slash. Approve and send command enter. Deselect escape.',
    render: () => (
      <div className="space-y-1.5">
        {[
          ['Navigate conversations', ['\u2191', '\u2193']],
          ['Open conversation', ['Enter']],
          ['Focus "Ask Friday"', ['/']],
          ['Approve & send', ['\u2318', '\u21b5']],
          ['Deselect', ['Esc']],
        ].map(([label, keys]) => (
          <div key={label as string} className="flex items-center justify-between text-xs">
            <span style={{color: '#94a3b8'}}>{label as string}</span>
            <div className="flex gap-1">
              {(keys as string[]).map(k => (
                <span key={k} className="px-2 py-0.5 rounded text-xs font-mono" style={{background: 'rgba(255,255,255,0.08)', color: '#e2e8f0'}}>{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
]

// Group order for rendering
const GROUP_ORDER = [
  'Ask Friday',
  'Compose & Draft',
  'Knowledge & Rules',
  'Pending Actions',
  'Analytics',
  'Quick Tips',
]

// Groups that get a divider header
const DIVIDER_GROUPS = new Set(['Knowledge & Rules', 'Pending Actions', 'Analytics', 'Quick Tips'])

// ---------------------------------------------------------------------------
// Highlight helper: wraps substring matches in <mark>
// ---------------------------------------------------------------------------
function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let last = 0
  let idx = lower.indexOf(q, last)
  while (idx !== -1) {
    if (idx > last) parts.push(text.slice(last, idx))
    parts.push(
      <mark key={idx} style={{ background: 'rgba(99,149,255,0.2)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
    )
    last = idx + q.length
    idx = lower.indexOf(q, last)
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? <>{parts}</> : text
}

// ---------------------------------------------------------------------------
// ExpandableSection (data-driven, search-aware)
// ---------------------------------------------------------------------------
function ExpandableSection({ title, forceOpen, children }: { title: string; forceOpen?: boolean; children: React.ReactNode }) {
  const [userOpen, setUserOpen] = useState(false)
  const isOpen = forceOpen || userOpen
  return (
    <section>
      <button onClick={() => setUserOpen(o => !o)} className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#6395ff' }}>
        <span>{title}</span>
        <span style={{ color: '#64748b' }}>{isOpen ? '\u25bc' : '\u25b6'}</span>
      </button>
      {isOpen && <div className="mt-2 text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{children}</div>}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HelpPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('')

  const matches = useCallback((entry: HelpEntry, q: string) => {
    const lower = q.toLowerCase()
    return (
      entry.title.toLowerCase().includes(lower) ||
      entry.content.toLowerCase().includes(lower) ||
      entry.keywords.some(k => k.toLowerCase().includes(lower))
    )
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return HELP_DATA
    return HELP_DATA.filter(e => matches(e, search.trim()))
  }, [search, matches])

  const hl = useCallback(
    (text: string) => highlightText(text, search.trim()),
    [search],
  )

  if (!isOpen) return null

  // Group entries for rendering
  const grouped: { group: string; entries: HelpEntry[] }[] = []
  let lastGroup = ''
  for (const entry of filtered) {
    if (entry.group !== lastGroup) {
      grouped.push({ group: entry.group, entries: [entry] })
      lastGroup = entry.group
    } else {
      grouped[grouped.length - 1].entries.push(entry)
    }
  }
  // Reorder groups by GROUP_ORDER
  const orderedGroups = GROUP_ORDER.map(g => grouped.find(gr => gr.group === g)).filter(Boolean) as typeof grouped

  const isSearching = search.trim().length > 0

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" data-testid="modal-help-panel" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />
      <div className="relative w-full md:w-[340px] h-full overflow-y-auto slide-in-right custom-scrollbar"
           style={{ background: 'rgba(15,25,50,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-5 pb-3" style={{ background: 'rgba(15,25,50,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-bold" style={{ color: '#f1f5f9' }}>Friday Admin</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Quick guide</div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" data-testid="btn-close-help" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{'\u2715'}</button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help\u2026"
              className="w-full pl-8 pr-8 py-1.5 rounded-md text-base outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
              autoComplete="off"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#64748b' }}>{'\u2715'}</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm" style={{ color: '#64748b' }}>No results for &ldquo;{search}&rdquo;</div>
              <button onClick={() => setSearch('')} className="text-xs mt-2 underline" style={{ color: '#6395ff' }}>Clear search</button>
            </div>
          )}

          {orderedGroups.map(({ group, entries }) => (
            <React.Fragment key={group}>
              {DIVIDER_GROUPS.has(group) && (
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>{group}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>
              )}
              {entries.map(entry => (
                <ExpandableSection key={entry.id} title={entry.title} forceOpen={isSearching}>
                  {entry.render(hl)}
                </ExpandableSection>
              ))}
            </React.Fragment>
          ))}

          {/* Footer */}
          {!isSearching && (
            <>
              <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Need help? Tag <span style={{ color: '#6395ff', fontWeight: 500 }}>@Ishant</span> in Slack</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>or message Friday directly</div>
              </div>

              <a href="https://slack.com/app_redirect?channel=fr-gms-feedback" target="_blank" rel="noopener noreferrer"
                 className="block w-full text-center py-2 rounded-lg text-xs mt-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                Report issue
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
