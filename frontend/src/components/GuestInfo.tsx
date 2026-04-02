'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { ConversationDetail, apiFetch } from './types'
import PendingActionsTab from './PendingActions'

interface GuestInfoProps {
  detail: ConversationDetail
  token: string
  selectedConvId: string
  mobileView: 'list' | 'detail' | 'info'
  setMobileView: (v: 'list' | 'detail' | 'info') => void
  setDetail: (fn: (prev: ConversationDetail | null) => ConversationDetail | null) => void
  handleMarkDone: (convId: string) => void
  handleReopen: (convId: string) => void
  showDoneWarning: boolean
  setShowDoneWarning: (v: boolean) => void
  doneWarningCount: number
  setActiveTab: (tab: 'all' | 'unread' | 'review' | 'open' | 'done' | 'actions') => void
  staffNotes: string
  handleNotesChange: (value: string, convId: string) => void
  notesTimerRef: React.MutableRefObject<NodeJS.Timeout | null>
  draftStateBadge: (state?: string) => React.ReactNode
}

// Collapsible section component — collapsed by default on mobile
function CollapsibleSection({ title, defaultOpen = false, count, children }: {
  title: string; defaultOpen?: boolean; count?: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  // After hydration, force-collapse on mobile regardless of defaultOpen
  useEffect(() => {
    if (window.innerWidth < 640) setOpen(false)
  }, [])
  return (
    <div style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-xs font-semibold"
        style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', minHeight: '44px'}}
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDownIcon className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
          {title}
          {count !== undefined && count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>{count}</span>
          )}
        </span>
      </button>
      {open && children}
    </div>
  )
}

export default function GuestInfo({
  detail, token, selectedConvId, mobileView, setMobileView, setDetail,
  handleMarkDone, handleReopen, showDoneWarning, setShowDoneWarning,
  doneWarningCount, setActiveTab, staffNotes, handleNotesChange,
  notesTimerRef, draftStateBadge,
}: GuestInfoProps) {
  return (
    <div data-testid="section-guest-info" className={`w-72 overflow-y-auto custom-scrollbar ${mobileView === 'info' ? 'fixed inset-0 w-full z-40 md:relative md:w-72' : 'hidden md:block'}`} style={{background: 'rgba(255,255,255,0.05)', borderLeft: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'}}>
      {/* Header with back button on mobile */}
      <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold" style={{color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px"}}>Guest Info</h3>
          <button className="mobile-only text-xs px-2 py-0.5 rounded" style={{background: "rgba(99,149,255,0.15)", color: "#6395ff"}} onClick={() => setMobileView("detail")}>{'\u2190'} Back</button>
        </div>
      </div>

      {/* Compact guest details */}
      <div className="p-3 space-y-1.5 text-xs" style={{color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        {detail.conversation.guest_email && <div>Email: {detail.conversation.guest_email}</div>}
        {detail.conversation.channel && <div>Channel: {detail.conversation.channel}</div>}
        {detail.conversation.check_in_date && <div>Check-in: {format(new Date(detail.conversation.check_in_date), 'MMM d, yyyy')}</div>}
        {detail.conversation.check_out_date && <div>Check-out: {format(new Date(detail.conversation.check_out_date), 'MMM d, yyyy')}</div>}
        {detail.conversation.num_guests && <div>{detail.conversation.num_guests} guest{detail.conversation.num_guests > 1 ? 's' : ''}</div>}
        <div>{detail.conversation.inbound_count || 0} inbound messages</div>
        {detail.conversation.sentiment && detail.conversation.sentiment !== 'neutral' && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: detail.conversation.sentiment === 'upset' ? '#ef4444' : detail.conversation.sentiment === 'frustrated' ? '#f59e0b' : detail.conversation.sentiment === 'positive' ? '#22c55e' : '#64748b'}} />
            <span style={{color: detail.conversation.sentiment === 'upset' ? '#ef4444' : detail.conversation.sentiment === 'frustrated' ? '#f59e0b' : detail.conversation.sentiment === 'positive' ? '#22c55e' : '#94a3b8'}}>
              {detail.conversation.sentiment === 'upset' ? 'Guest is upset' : detail.conversation.sentiment === 'frustrated' ? 'Guest seems frustrated' : detail.conversation.sentiment === 'positive' ? 'Positive sentiment' : detail.conversation.sentiment}
            </span>
          </div>
        )}
      </div>

      {/* Mark as Done / Reopen button */}
      <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        {detail.conversation.status === 'done' ? (
          <button onClick={() => handleReopen(detail.conversation.id)}
            className="w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
            <ArrowPathIcon className="h-4 w-4 mr-1.5" /> Reopen Conversation
          </button>
        ) : (
          <button onClick={() => handleMarkDone(detail.conversation.id)}
            className="w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
            <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Mark as Done
          </button>
        )}
      </div>

      {/* Pending actions warning modal */}
      {showDoneWarning && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}>
          <div className="rounded-xl p-6 max-w-sm mx-4" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center mb-3">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2" style={{color: '#fbbf24'}} />
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>Open Actions</h3>
            </div>
            <p className="text-sm mb-4" style={{color: '#94a3b8'}}>
              This conversation has <strong>{doneWarningCount}</strong> open action{doneWarningCount !== 1 ? 's' : ''}. Complete or dismiss them first.
            </p>
            <div className="flex space-x-2">
              <button onClick={() => { setShowDoneWarning(false); setActiveTab('actions') }}
                className="flex-1 px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)'}}>
                View Actions
              </button>
              <button onClick={() => setShowDoneWarning(false)}
                className="flex-1 px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff notes - always visible */}
      <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <h3 className="text-xs font-semibold mb-1" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Staff Notes</h3>
        <textarea value={staffNotes}
          onChange={e => handleNotesChange(e.target.value, detail.conversation.id)}
          onBlur={async () => {
            if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
            try {
              await apiFetch(`/api/conversations/${detail.conversation.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes: staffNotes }),
              })
            } catch { }
          }}
          placeholder="Add notes for Judith..."
          className="w-full text-xs rounded px-2 py-1.5 resize-none outline-none" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} rows={2} />
      </div>

      {/* Auto-send toggle */}
      <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Auto-send</span>
          <button onClick={async () => {
            const newVal = !detail.conversation.auto_send_enabled
            try {
              await apiFetch(`/api/conversations/${detail.conversation.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ auto_send_enabled: newVal }),
              })
              setDetail(prev => prev ? { ...prev, conversation: { ...prev.conversation, auto_send_enabled: newVal } } : null)
              toast.success(`Auto-send ${newVal ? 'enabled' : 'disabled'}`)
            } catch (err: any) { toast.error(err.message) }
          }} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{background: detail.conversation.auto_send_enabled ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}}>
            <span className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform" style={{background: detail.conversation.auto_send_enabled ? '#4ade80' : '#64748b', transform: detail.conversation.auto_send_enabled ? 'translateX(18px)' : 'translateX(2px)'}} />
          </button>
        </div>
        <p className="text-xs mt-1" style={{color: '#64748b'}}>{detail.conversation.auto_send_enabled ? 'On \u2014 routine replies \u226585% send automatically' : 'Off \u2014 all drafts require review'}</p>
      </div>

      {/* Suggested next steps - collapsible */}
      {detail.conversation.next_steps && (() => { try { const steps = JSON.parse(detail.conversation.next_steps); return steps.length > 0 ? (
        <CollapsibleSection title="Next Steps" defaultOpen={true} count={steps.length}>
          <div className="px-3 pb-3 space-y-1.5">
            {steps.map((s: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#e2e8f0'}}>
                <span>{s.icon || '\uD83D\uDCCB'}</span>
                <span>{s.text}{s.who && <span style={{color: '#6395ff'}}> \u2014 {s.who}</span>}</span>
              </div>
            ))}
            <p className="text-xs mt-1" style={{color: '#475569', fontStyle: 'italic'}}>Judith's suggestions based on conversation context</p>
          </div>
        </CollapsibleSection>
      ) : null; } catch { return null; } })()}

      {/* Pending actions for this conversation - collapsible */}
      <CollapsibleSection title="Pending Actions" defaultOpen={true}>
        <PendingActionsTab token={token} conversationFilter={selectedConvId} />
      </CollapsibleSection>


      {/* Draft history - collapsible, collapsed by default */}
      {detail.drafts.length > 0 && (
        <CollapsibleSection title="Draft History" defaultOpen={false} count={detail.drafts.length}>
          <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {detail.drafts.map(d => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <span style={{color: '#64748b'}}>{format(new Date(d.created_at), 'MMM d HH:mm')}</span>
                {draftStateBadge(d.state)}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

    </div>
  )
}
