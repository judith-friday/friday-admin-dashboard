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
  ChatBubbleLeftRightIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ConversationDetail, NextStep, apiFetch } from './types'
import PendingActionsTab from './PendingActions'
import ConsultChat from './ConsultChat'
import { trackEvent } from '../lib/analytics'

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

// Format time string (HH:MM or ISO) to 12-hour AM/PM
function formatTime12h(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const timeStr = raw.includes('T') ? raw.slice(11, 16) : raw;
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    return ` (${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'})`;
  } catch { return ''; }
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
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>{count}</span>
          )}
        </span>
      </button>
      {open && children}
    </div>
  )
}

// Detect AI-generated observation markers in notes
const AI_NOTE_PATTERN = /\[Judith'?s? observation\]/i

function splitNotes(raw: string): { aiNotes: string[]; manualNotes: string } {
  if (!raw) return { aiNotes: [], manualNotes: '' }
  const lines = raw.split('\n')
  const ai: string[] = []
  const manual: string[] = []
  for (const line of lines) {
    if (AI_NOTE_PATTERN.test(line)) {
      ai.push(line.replace(AI_NOTE_PATTERN, '').trim())
    } else {
      manual.push(line)
    }
  }
  return { aiNotes: ai, manualNotes: manual.join('\n').trim() }
}

export default function GuestInfo({
  detail, token, selectedConvId, mobileView, setMobileView, setDetail,
  handleMarkDone, handleReopen, showDoneWarning, setShowDoneWarning,
  doneWarningCount, setActiveTab, staffNotes, handleNotesChange,
  notesTimerRef, draftStateBadge,
}: GuestInfoProps) {
  const [consultStepIdx, setConsultStepIdx] = useState<number | null>(null)
  const [nextSteps, setNextSteps] = useState<NextStep[]>([])
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editStepText, setEditStepText] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [editNotesValue, setEditNotesValue] = useState('')

  // Fetch next steps from dedicated API
  useEffect(() => {
    if (!selectedConvId) return
    let cancelled = false
    apiFetch(`/api/conversations/${selectedConvId}/next-steps`)
      .then(data => { if (!cancelled) setNextSteps(data.next_steps || []) })
      .catch(() => { if (!cancelled) setNextSteps([]) })
    return () => { cancelled = true }
  }, [selectedConvId, detail])

  const handleStepAction = async (stepId: string, status: 'completed' | 'dismissed') => {
    try {
      const updated = await apiFetch(`/api/next-steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNextSteps(prev => prev.map(s => s.id === stepId ? updated : s))
      trackEvent(status === 'completed' ? 'next_step_completed' : 'next_step_dismissed', { stepId, conversationId: selectedConvId })
      toast.success(status === 'completed' ? 'Step done' : 'Step dismissed')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleStepEdit = async (stepId: string) => {
    try {
      const updated = await apiFetch(`/api/next-steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: editStepText }),
      })
      setNextSteps(prev => prev.map(s => s.id === stepId ? updated : s))
      setEditingStepId(null)
      trackEvent('next_step_edited', { stepId, conversationId: selectedConvId })
      toast.success('Step updated')
    } catch (err: any) { toast.error(err.message) }
  }

  const activeSteps = nextSteps.filter(s => s.status === 'active')
  const resolvedSteps = nextSteps.filter(s => s.status !== 'active')

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {mobileView === 'info' && (
        <div className="fixed inset-0 z-40 md:hidden" style={{background: 'rgba(0,0,0,0.5)'}} onClick={() => setMobileView('detail')} />
      )}
    <div data-testid="section-guest-info" className={`w-72 overflow-y-auto custom-scrollbar ${mobileView === 'info' ? 'fixed inset-0 w-full z-50 md:relative md:w-72' : 'hidden md:block'}`} style={{background: mobileView === 'info' ? '#0d1117' : 'rgba(255,255,255,0.05)', borderLeft: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', ...(mobileView === 'info' ? {paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)'} : {})}}>
      {/* Header with close button on mobile */}
      <div className="p-3 sticky top-0 z-10" style={{borderBottom: '1px solid rgba(255,255,255,0.06)', background: mobileView === 'info' ? '#0d1117' : 'transparent'}}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold" style={{color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px"}}>Guest Info</h3>
          <button className="mobile-only text-sm px-3 py-1.5 rounded-lg flex items-center gap-1" style={{background: "rgba(99,149,255,0.15)", color: "#6395ff", border: '1px solid rgba(99,149,255,0.2)'}} onClick={() => setMobileView("detail")}>{'\u2190'} Back to conversation</button>
        </div>
      </div>

      {/* Compact guest details */}
      <div className="p-3 space-y-1.5 text-xs" style={{color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        {detail.conversation.guest_email && <div>Email: {detail.conversation.guest_email}</div>}
        {detail.conversation.channel && <div>Channel: {detail.conversation.channel}</div>}
        {detail.conversation.check_in_date && <div>Check-in: {format(new Date(detail.conversation.check_in_date), 'MMM d, yyyy')}{formatTime12h(detail.reservation?.planned_arrival || detail.conversation.check_in_time)}</div>}
        {detail.conversation.check_out_date && <div>Check-out: {format(new Date(detail.conversation.check_out_date), 'MMM d, yyyy')}{formatTime12h(detail.reservation?.planned_departure || detail.conversation.check_out_time)}</div>}
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

      {/* Financial info */}
      {detail.reservation && (detail.reservation.nightly_rate || detail.reservation.total_price || detail.reservation.host_payout || detail.reservation.cleaning_fee) && (() => {
        const r = detail.reservation
        const currency = r.currency || 'EUR'
        const sym = currency === 'EUR' ? '\u20AC' : currency === 'USD' ? '$' : currency === 'GBP' ? '\u00A3' : currency === 'MUR' ? 'Rs' : currency + ' '
        const fmt = (v: number | string) => {
          const n = typeof v === 'string' ? parseFloat(v) : v
          return Number.isInteger(n) ? n.toString() : n.toFixed(2)
        }
        const nights = r.number_of_nights || null
        const nightlyRate = r.nightly_rate ? parseFloat(r.nightly_rate) : null
        const cleaningFee = r.cleaning_fee ? parseFloat(r.cleaning_fee) : null
        const totalPaid = r.total_price ? parseFloat(r.total_price) : null
        const hostPayout = r.host_payout ? parseFloat(r.host_payout) : null

        return (
          <div className="p-3 space-y-1 text-xs" style={{color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-xs font-semibold mb-1.5" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Financial</h3>
            {nightlyRate && nights ? (
              <div>{sym}{fmt(nightlyRate)}/night {'\u00D7'} {nights} night{nights !== 1 ? 's' : ''}</div>
            ) : nightlyRate ? (
              <div>Nightly rate: {sym}{fmt(nightlyRate)}</div>
            ) : null}
            {cleaningFee ? <div>Cleaning: {sym}{fmt(cleaningFee)}</div> : null}
            {totalPaid ? <div className="font-medium" style={{color: '#e2e8f0'}}>Total: {sym}{fmt(totalPaid)} ({currency})</div> : null}
            {hostPayout ? <div>Host payout: {sym}{fmt(hostPayout)}</div> : null}
          </div>
        )
      })()}

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
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-semibold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Staff Notes</h3>
          {!editingNotes && staffNotes.trim() && (
            <button onClick={() => { setEditingNotes(true); setEditNotesValue(staffNotes) }}
              className="p-1 rounded" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
              <PencilIcon className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* AI-generated observations — read-only */}
        {(() => {
          const { aiNotes, manualNotes } = splitNotes(staffNotes)
          return (
            <>
              {aiNotes.length > 0 && !editingNotes && (
                <div className="space-y-1.5 mb-2">
                  {aiNotes.map((note, i) => (
                    <div key={i} className="rounded px-2 py-1.5 text-xs" style={{background: 'rgba(251,191,36,0.08)', borderLeft: '2px solid #fbbf24', color: '#e2e8f0'}}>
                      <span className="block text-xs mb-0.5" style={{color: '#fbbf24', fontSize: '10px', fontWeight: 600}}>🤖 Judith's observation</span>
                      {note}
                    </div>
                  ))}
                </div>
              )}

              {/* Manual notes — read-only display */}
              {manualNotes && !editingNotes && (
                <div className="text-xs rounded px-2 py-1.5 mb-2 whitespace-pre-wrap" style={{background: 'rgba(255,255,255,0.04)', color: '#e2e8f0'}}>
                  {manualNotes}
                </div>
              )}
            </>
          )
        })()}

        {/* Edit mode */}
        {editingNotes && (
          <div>
            <textarea value={editNotesValue} onChange={e => setEditNotesValue(e.target.value)}
              className="w-full text-base rounded px-2 py-1.5 outline-none"
              style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,149,255,0.3)', color: '#f1f5f9', resize: 'vertical', minHeight: '72px'}}
              rows={3} autoFocus />
            <div className="flex gap-1.5 mt-1.5">
              <button onClick={async () => {
                handleNotesChange(editNotesValue, detail.conversation.id)
                if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
                try {
                  await apiFetch(`/api/conversations/${detail.conversation.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ notes: editNotesValue }),
                  })
                } catch { }
                setEditingNotes(false)
              }} className="flex items-center gap-1 px-2 py-1 text-xs rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                <CheckIcon className="h-3 w-3" /> Save
              </button>
              <button onClick={() => setEditingNotes(false)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                <XMarkIcon className="h-3 w-3" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add new notes — only when not editing */}
        {!editingNotes && (
          <textarea value="" onChange={e => {
            const val = e.target.value
            const updated = staffNotes ? staffNotes + '\n' + val : val
            handleNotesChange(updated, detail.conversation.id)
            setEditingNotes(true)
            setEditNotesValue(updated)
          }}
            placeholder="Add notes for Judith..."
            className="w-full text-base rounded px-2 py-1.5 outline-none"
            style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', resize: 'vertical', minHeight: '48px'}}
            rows={2} />
        )}
      </div>

      {/* Suggested next steps - collapsible */}
      {nextSteps.length > 0 && (
        <CollapsibleSection title="Next Steps" defaultOpen={true} count={activeSteps.length}>
          <div className="px-3 pb-3 space-y-1.5">
            {activeSteps.map((s, i) => (
              <div key={s.id}>
                {editingStepId === s.id ? (
                  <div className="flex items-start gap-1.5">
                    <textarea value={editStepText} onChange={e => setEditStepText(e.target.value)}
                      className="flex-1 text-base rounded px-2 py-1 resize-none outline-none"
                      style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,149,255,0.3)', color: '#f1f5f9'}} rows={2} autoFocus />
                    <button onClick={() => handleStepEdit(s.id)}
                      className="shrink-0 p-1 rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                      <CheckIcon className="h-3 w-3" />
                    </button>
                    <button onClick={() => setEditingStepId(null)}
                      className="shrink-0 p-1 rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-xs" style={{color: '#e2e8f0'}}>
                      <div className="flex items-start gap-2">
                        <span>{s.icon || '\uD83D\uDCCB'}</span>
                        <span>{s.text}{s.who && <span style={{color: '#6395ff'}}> {'\u2014'} {s.who}</span>}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 ml-6">
                        <button onClick={() => handleStepAction(s.id, 'completed')} title="Done"
                          className="p-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)'}}>
                          <CheckIcon className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleStepAction(s.id, 'dismissed')} title="Dismiss"
                          className="p-0.5 rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                        <button onClick={() => { setEditingStepId(s.id); setEditStepText(s.text) }} title="Edit"
                          className="p-0.5 rounded" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button onClick={() => { const opening = consultStepIdx !== i; setConsultStepIdx(opening ? i : null); if (opening) trackEvent('ask_judith_opened', { context: 'next_step', stepId: s.id, conversationId: selectedConvId }) }}
                          className="px-1.5 py-0.5 rounded flex items-center" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)', fontSize: '10px'}}>
                          <ChatBubbleLeftRightIcon className="h-3 w-3 mr-0.5" />Ask
                        </button>
                      </div>
                    </div>
                    {consultStepIdx === i && (
                      <ConsultChat
                        conversationId={selectedConvId}
                        context="next_step"
                        initialInstruction={`Why did you suggest this next step? "${s.text}"`}
                        contextData={{
                          stepText: s.text,
                          who: s.who,
                          guestName: detail.conversation.guest_name,
                        }}
                        onConfirm={() => setConsultStepIdx(null)}
                        onCancel={() => setConsultStepIdx(null)}
                        confirmLabel="Got it"
                      />
                    )}
                  </>
                )}
              </div>
            ))}
            {resolvedSteps.length > 0 && (
              <div className="mt-2 space-y-1">
                {resolvedSteps.map(s => (
                  <div key={s.id} className="flex items-start gap-2 text-xs" style={{color: '#475569', textDecoration: 'line-through', opacity: 0.6}}>
                    <span>{s.icon || '\uD83D\uDCCB'}</span>
                    <span className="flex-1">{s.text}</span>
                    <span className="shrink-0 text-xs" style={{fontSize: '10px'}}>{s.status === 'completed' ? 'Done' : 'Dismissed'}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs mt-1" style={{color: '#475569', fontStyle: 'italic'}}>Judith's suggestions based on conversation context</p>
          </div>
        </CollapsibleSection>
      )}

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

      {/* Auto-send toggle — rarely changed, keep at bottom */}
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

    </div>
    </>
  )
}
