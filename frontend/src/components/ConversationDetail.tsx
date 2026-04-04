'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { LanguageIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { ConversationDetail as ConversationDetailType, Draft, apiFetch, LANG_FLAGS, LANG_NAMES } from './types'
import { toast } from 'react-hot-toast'
import ComposePanel from './ComposePanel'
import DraftPanel from './DraftPanel'

interface ConversationDetailProps {
  detail: ConversationDetailType
  mobileView: 'list' | 'detail' | 'info'
  setMobileView: (v: 'list' | 'detail' | 'info') => void
  fetchPropertyCard: (code: string | undefined) => void
  channelBadge: (ch?: string) => React.ReactNode
  displayName: string
  selectedConvId: string
  fetchDetail: (id: string) => void
  fetchConversations: () => void
  showDraftHistory: boolean
  setShowDraftHistory: (v: boolean) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  rtColor: (mins?: number) => string
  // ComposePanel props
  composeOpen: boolean
  setComposeOpen: (v: boolean) => void
  composeText: string
  setComposeText: (v: string) => void
  composeSending: boolean
  handleComposeSend: () => void
  handleComposeFix: () => void
  composeFix: boolean
  // DraftPanel props
  revisionPending: boolean
  editingDraft: string | null
  setEditingDraft: (v: string | null) => void
  isEditingRef: React.MutableRefObject<boolean>
  editBody: string
  setEditBody: (v: string) => void
  revisionText: string
  setRevisionText: (v: string) => void
  revisingDraft: string | null
  rejectingDraft: string | null
  setRejectingDraft: (v: string | null) => void
  rejectReason: string
  setRejectReason: (v: string) => void
  showTeachPrompt: string | null
  setShowTeachPrompt: (v: string | null) => void
  requestApproval: (draftId: string) => void
  handleDraftAction: (draftId: string, action: 'approve' | 'reject', editedBody?: string) => void
  handleRevision: (draftId: string, mode: 'standard' | 'teach' | 'one_time', tScope?: 'global' | 'property', tPropCode?: string) => void
  handleRejectWithReason: (draftId: string) => void
  draftStateBadge: (state?: string) => React.ReactNode
}

export default function ConversationDetail({
  detail, mobileView, setMobileView, fetchPropertyCard, channelBadge,
  displayName, selectedConvId, fetchDetail, fetchConversations,
  showDraftHistory, setShowDraftHistory, messagesEndRef, rtColor,
  composeOpen, setComposeOpen,
  composeText, setComposeText,
  composeSending, handleComposeSend, handleComposeFix, composeFix,
  revisionPending, editingDraft, setEditingDraft, isEditingRef,
  editBody, setEditBody, revisionText, setRevisionText, revisingDraft,
  rejectingDraft, setRejectingDraft, rejectReason, setRejectReason,
  showTeachPrompt, setShowTeachPrompt,
  requestApproval, handleDraftAction, handleRevision, handleRejectWithReason,
  draftStateBadge,
}: ConversationDetailProps) {
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  // Track which sent drafts show translated version (by draft id)
  const [showTranslated, setShowTranslated] = useState<Record<string, boolean>>({})
  // Track which outbound messages show original language (by message id)
  const [showMsgOriginal, setShowMsgOriginal] = useState<Record<string, boolean>>({})

  // Format timestamp: relative for recent, absolute for older
  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    const time = format(date, 'h:mm a')

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24 && date.getDate() === now.getDate()) return `${diffHours}h ago · ${time}`
    if (diffDays === 1 || (diffDays < 2 && date.getDate() === now.getDate() - 1)) return `yesterday · ${time}`
    return format(date, 'MMM d, h:mm a')
  }

  // Get date label for separators
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return format(date, 'MMMM d')
  }

  const sentimentDot = (sentiment?: string) => {
    if (!sentiment || sentiment === 'neutral') return null
    const color = sentiment === 'upset' ? '#ef4444' : sentiment === 'frustrated' ? '#f59e0b' : sentiment === 'positive' ? '#22c55e' : '#64748b'
    return <span className="inline-block w-2 h-2 rounded-full ml-1.5" style={{ backgroundColor: color }} title={sentiment} />
  }

  return (
    <div data-testid="container-conversation-detail" className={`flex-1 flex flex-col min-w-0 h-full overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : ''}`}>
      {/* Mobile back button */}
      <div data-testid="nav-back-button" className="mobile-only mobile-nav-back" onClick={() => setMobileView('list')} style={{justifyContent: 'space-between', position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden'}}>
        <span>{'\u2190'} Back to inbox</span>
        <button onClick={(e) => { e.stopPropagation(); setMobileView('info'); }} className="ml-auto px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>{'\u2139\uFE0F'} Info</button>
      </div>

      {/* Compact conversation header with inline guest info */}
      <div className="flex-shrink-0 px-3 py-2" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-base font-semibold truncate" style={{color: '#f1f5f9'}}>{detail.conversation.guest_name}</h2>
            {sentimentDot(detail.conversation.sentiment)}
            {detail.conversation.property_name && (
              <span className="text-xs flex-shrink-0" onClick={() => fetchPropertyCard(detail.conversation.property_name)} style={{cursor: 'pointer', color: '#64748b', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px'}}>{detail.conversation.property_name}</span>
            )}
            {detail.conversation.channel && channelBadge(detail.conversation.channel)}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-xs" style={{color: '#64748b'}}>
            {detail.conversation.check_in_date && detail.conversation.check_out_date && (
              <span className="hidden sm:inline">{format(new Date(detail.conversation.check_in_date), 'MMM d')} - {format(new Date(detail.conversation.check_out_date), 'MMM d')}</span>
            )}
            {detail.conversation.num_guests && <span className="hidden sm:inline">{detail.conversation.num_guests}p</span>}
            {detail.conversation.avg_response_minutes != null && (
              <span className="font-medium" title="Average response time across all message exchanges in this conversation" style={{color: rtColor(detail.conversation.avg_response_minutes)}}>
                Avg RT: {Math.round(detail.conversation.avg_response_minutes)}m
              </span>
            )}
            {detail.conversation.avg_response_minutes == null && detail.conversation.first_response_minutes != null && (
              <span className="font-medium" style={{color: rtColor(detail.conversation.first_response_minutes)}}>
                RT: {detail.conversation.first_response_minutes}m
              </span>
            )}
            {detail.messages.length > 0 && detail.messages[detail.messages.length - 1].direction === 'outbound' && !detail.drafts.some(d => ['draft_ready', 'under_review'].includes(d.state)) && (
              <span style={{color: '#4ade80'}}>{'\u2713'}</span>
            )}
          </div>
        </div>

        {/* Collapsible summary — collapsed by default, one-line truncated */}
        {detail.conversation.conversation_summary && (
          <button
            data-testid="section-summary"
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="flex items-start gap-1 text-xs w-full text-left mt-1"
            style={{color: '#94a3b8', minHeight: 0, paddingTop: summaryExpanded ? '0.5rem' : '0.125rem', paddingBottom: summaryExpanded ? '0.5rem' : '0.125rem', lineHeight: summaryExpanded ? undefined : '1.25rem'}}
          >
            {summaryExpanded ? <ChevronUpIcon className="h-3 w-3 flex-shrink-0 mt-0.5" /> : <ChevronDownIcon className="h-3 w-3 flex-shrink-0 mt-0.5" />}
            <span className={summaryExpanded ? '' : 'truncate'} style={summaryExpanded ? undefined : {display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxHeight: '1.25rem'}}>{detail.conversation.conversation_summary.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}</span>
          </button>
        )}
      </div>

      {/* Messages - dominant element */}
      <div data-testid="section-messages" className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 custom-scrollbar min-h-0 min-w-0" style={{background: 'rgba(255,255,255,0.01)'}}>
        {(() => {
          // Build set of bodies from sent drafts to avoid showing duplicate outbound messages
          // (sent drafts are rendered separately with approval info and translation toggle)
          const sentDraftBodies = new Set<string>()
          detail.drafts.filter(d => d.state === 'sent').forEach(d => {
            if (d.draft_body) sentDraftBodies.add(d.draft_body.trim())
            if (d.translated_content) sentDraftBodies.add(d.translated_content.trim())
          })
          const seen = new Set<string>()
          const dedupedMessages = detail.messages.filter(msg => {
            if (seen.has(msg.id)) return false
            seen.add(msg.id)
            // Hide outbound messages already shown as sent draft cards
            if (msg.direction === 'outbound' && sentDraftBodies.has((msg.body || '').trim())) return false
            return true
          })
          // Defensive sort: ensure messages are ordered by created_at even if API returns inconsistent order
          dedupedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

          // Build unified timeline: interleave messages and sent drafts chronologically
          type TimelineItem = { type: 'message'; data: typeof dedupedMessages[0]; time: number } | { type: 'sent_draft'; data: Draft; time: number }
          const timeline: TimelineItem[] = []

          // Add messages to timeline
          for (const msg of dedupedMessages) {
            timeline.push({ type: 'message', data: msg, time: new Date(msg.created_at).getTime() })
          }

          // Add sent drafts to timeline (using sent_at or updated_at for positioning)
          for (const draft of detail.drafts.filter(d => d.state === 'sent')) {
            const time = draft.sent_at ? new Date(draft.sent_at).getTime() : new Date(draft.updated_at).getTime()
            timeline.push({ type: 'sent_draft', data: draft, time })
          }

          // Sort chronologically — oldest first (guard against NaN timestamps)
          timeline.sort((a, b) => (a.time || 0) - (b.time || 0))
          return timeline
        })().map((item, idx, arr) => {
          // Date separator logic
          const itemDate = new Date(item.type === 'sent_draft' ? ((item.data as Draft).sent_at || (item.data as Draft).updated_at) : (item.data as typeof detail.messages[0]).created_at)
          const itemDateKey = `${itemDate.getFullYear()}-${itemDate.getMonth()}-${itemDate.getDate()}`
          let showDateSeparator = false
          if (idx === 0) {
            showDateSeparator = true
          } else {
            const prevItem = arr[idx - 1]
            const prevDate = new Date(prevItem.type === 'sent_draft' ? ((prevItem.data as Draft).sent_at || (prevItem.data as Draft).updated_at) : (prevItem.data as typeof detail.messages[0]).created_at)
            const prevDateKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}-${prevDate.getDate()}`
            showDateSeparator = itemDateKey !== prevDateKey
          }
          const dateSeparator = showDateSeparator ? (
            <div key={`date-${itemDateKey}`} className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px" style={{background: 'rgba(255,255,255,0.06)'}} />
              <span className="text-xs font-medium flex-shrink-0" style={{color: '#64748b'}}>{getDateLabel(itemDate.toISOString())}</span>
              <div className="flex-1 h-px" style={{background: 'rgba(255,255,255,0.06)'}} />
            </div>
          ) : null
          if (item.type === 'sent_draft') {
            const draft = item.data as Draft
            const isShowingTranslated = showTranslated[draft.id] && draft.translated_content
            const hasTranslation = draft.translated_content && draft.sent_language && draft.sent_language !== 'en'
            return (
              <React.Fragment key={`sent-${draft.id}`}>
              {dateSeparator}
              <div className="rounded-lg p-3" style={{
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.1)',
              }}>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span style={{color: '#4ade80'}}>
                    {isShowingTranslated
                      ? `Sent in ${LANG_FLAGS[draft.sent_language!] || ''} ${LANG_NAMES[draft.sent_language!] || draft.sent_language}`
                      : 'Sent'}
                    {hasTranslation && !isShowingTranslated && (
                      <span style={{color: '#64748b', fontWeight: 400}}> (in {LANG_FLAGS[draft.sent_language!] || ''} {LANG_NAMES[draft.sent_language!] || draft.sent_language})</span>
                    )}
                  </span>
                  {hasTranslation && (
                    <button
                      onClick={() => setShowTranslated(prev => ({ ...prev, [draft.id]: !prev[draft.id] }))}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                      style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}
                    >
                      <LanguageIcon className="h-3 w-3" />
                      {isShowingTranslated ? 'Show English' : `Show ${LANG_NAMES[draft.sent_language!] || draft.sent_language}`}
                    </button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{color: '#e2e8f0', overflowWrap: 'break-word', wordBreak: 'break-word'}} dir="auto">
                  {isShowingTranslated ? draft.translated_content : draft.draft_body}
                </p>
                <div className="text-xs mt-2 pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.1)', color: '#64748b'}}>
                  {draft.reviewed_by === 'auto-send' ? 'Auto-sent by Judith' : `Approved by ${draft.reviewed_by || 'unknown'}`}{draft.revision_number && draft.revision_number > 1 ? ` (v${draft.revision_number})` : ''} · {draft.sent_at ? format(new Date(draft.sent_at), 'MMM d HH:mm') : format(new Date(draft.updated_at), 'MMM d HH:mm')}
                </div>
              </div>
              </React.Fragment>
            )
          }

          const msg = item.data as typeof detail.messages[0]
          const isOutbound = msg.direction === 'outbound'
          const isSystem = msg.direction === 'system'
          const hasTranslation = msg.translated_body && msg.translated_body !== msg.body
          const isNonEnglish = msg.original_language && msg.original_language !== 'en'
          const showingOriginal = showMsgOriginal[msg.id]

          // System notifications: muted centered style
          if (isSystem) {
            return (
              <React.Fragment key={msg.id}>
              {dateSeparator}
              <div className="flex justify-center">
                <div className="max-w-lg px-4 py-2 rounded-lg text-center" style={{
                  background: 'rgba(100,116,139,0.08)',
                  border: '1px solid rgba(100,116,139,0.12)',
                  color: '#64748b',
                }}>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium mb-0.5" style={{color: '#94a3b8'}}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    System
                  </div>
                  <p className="text-xs whitespace-pre-wrap" style={{color: '#94a3b8'}}>{msg.body}</p>
                  <div className="text-xs mt-1" style={{color: '#475569'}}>
                    {formatTimestamp(msg.created_at)}
                  </div>
                </div>
              </div>
              </React.Fragment>
            )
          }

          // For messages with translation: default to English
          // Outbound: body = guest language, translated_body = English original
          // Inbound: body = original language, translated_body = English translation
          let displayBody = msg.body
          if (isOutbound && hasTranslation && !showingOriginal) {
            displayBody = msg.translated_body!
          }
          if (!isOutbound && hasTranslation && !showingOriginal) {
            displayBody = msg.translated_body!
          }

          return (
            <React.Fragment key={msg.id}>
            {dateSeparator}
            <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xl px-4 py-2.5 rounded-lg" style={{
                background: isOutbound ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.06)',
                border: isOutbound ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                overflowX: 'hidden',
                minWidth: 0,
              }}>
                <p className="text-sm whitespace-pre-wrap" dir="auto">{displayBody}</p>

                {/* Outbound with translation: "Sent in [language]" label + swap button */}
                {isOutbound && hasTranslation && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs" style={{color: '#64748b'}}>
                      {showingOriginal
                        ? `Original (${LANG_FLAGS[msg.original_language!] || ''} ${LANG_NAMES[msg.original_language!] || msg.original_language})`
                        : `Sent in ${LANG_FLAGS[msg.original_language!] || ''} ${LANG_NAMES[msg.original_language!] || msg.original_language}`
                      }
                    </span>
                    <button
                      onClick={() => setShowMsgOriginal(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}
                    >
                      <LanguageIcon className="h-3 w-3 inline mr-0.5" />
                      {showingOriginal ? 'English' : 'Original'}
                    </button>
                  </div>
                )}

                {/* Inbound with translation: toggle between English and original */}
                {!isOutbound && hasTranslation && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs" style={{color: '#64748b'}}>
                      {showingOriginal
                        ? `Original (${LANG_FLAGS[msg.original_language!] || ''} ${LANG_NAMES[msg.original_language!] || msg.original_language})`
                        : `Translated from ${LANG_FLAGS[msg.original_language!] || ''} ${LANG_NAMES[msg.original_language!] || msg.original_language}`
                      }
                    </span>
                    <button
                      onClick={() => setShowMsgOriginal(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}
                    >
                      <LanguageIcon className="h-3 w-3 inline mr-0.5" />
                      {showingOriginal ? 'English' : 'Original'}
                    </button>
                  </div>
                )}

                <div className="text-xs mt-1" style={{color: '#64748b'}}>
                  {formatTimestamp(msg.created_at)} {msg.sender_name && `· ${msg.sender_name.toLowerCase() === 'hook' ? 'Automated message' : msg.sender_name}`}
                  {!isOutbound && isNonEnglish && (
                    <span className="ml-1">{LANG_FLAGS[msg.original_language!] || ''} {LANG_NAMES[msg.original_language!] || msg.original_language}</span>
                  )}
                </div>
              </div>
            </div>
            </React.Fragment>
          )
        })}

        {/* Queued drafts - awaiting retry */}
        {detail.drafts.filter(d => d.state === "send_queued").map(draft => (
          <div key={draft.id} className="rounded-lg p-3 mt-2" style={{background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)"}}>
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{color: "#fbbf24"}}>
              <span><span className="mr-1.5">{'\u23F3'}</span> Queued — Guesty API unavailable. Will retry automatically.</span>
              <div className="flex space-x-1">
                <button onClick={async () => { try { await apiFetch('/api/drafts/' + draft.id + '/retry', { method: 'POST', body: JSON.stringify({ reviewed_by: displayName }) }); toast.success('Retry successful — message sent!'); if (selectedConvId) fetchDetail(selectedConvId); fetchConversations(); } catch (e: any) { toast.error('Retry failed: ' + e.message); } }}
                  className="px-2 py-0.5 rounded text-xs font-semibold" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                  Retry Now
                </button>
                <button onClick={async () => { try { await apiFetch('/api/drafts/' + draft.id + '/fail', { method: 'POST' }); toast('Marked as failed'); if (selectedConvId) fetchDetail(selectedConvId); } catch {} }}
                  className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'}}>
                  Mark Failed
                </button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{color: "#e2e8f0", overflowWrap: 'break-word', wordBreak: 'break-word'}}>{draft.draft_body}</p>
          </div>
        ))}

        {/* Draft history toggle (rejected + revision drafts) */}
        {(() => {
          const rejectedDrafts = detail.drafts.filter(d => d.state === 'rejected')
          const revisionDrafts = detail.drafts.filter(d => d.state === 'revision_requested')
          const hiddenCount = rejectedDrafts.length + revisionDrafts.length

          if (hiddenCount === 0) return null
          return (<>
            <button onClick={() => { setShowDraftHistory(!showDraftHistory); if (!showDraftHistory) { setTimeout(() => { const el = document.getElementById('draft-history-section'); el?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 100) } }} className="text-xs px-2 py-1 rounded mx-4 mt-1" style={{color: '#64748b'}}>
              {showDraftHistory ? 'Hide' : 'Show'} draft history ({hiddenCount} older)
            </button>
            {showDraftHistory && revisionDrafts.map((draft, idx) => (
              <div key={`revision-${draft.id}`} id={idx === 0 ? 'draft-history-section' : undefined} className="rounded-lg p-3 mt-2" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)'}}>
                <div className="text-xs font-medium mb-1" style={{color: '#6395ff'}}>Revision #{draft.revision_number || '?'}:</div>
                <p className="text-sm mb-2 whitespace-pre-wrap" style={{color: '#e2e8f0', overflowWrap: 'break-word', wordBreak: 'break-word'}}>{draft.draft_body}</p>
                <div className="text-xs pt-2" style={{borderTop: '1px solid rgba(99,149,255,0.1)', color: '#64748b'}}>
                  {draft.reviewed_by ? `Revised by ${draft.reviewed_by}` : 'System revision'}{draft.revision_instruction ? ` — "${draft.revision_instruction}"` : ''} · {format(new Date(draft.updated_at), 'MMM d HH:mm')}
                </div>
              </div>
            ))}
            {showDraftHistory && rejectedDrafts.map((draft, idx) => (
              <div key={`rejected-${draft.id}`} id={idx === 0 && revisionDrafts.length === 0 ? 'draft-history-section' : undefined} className="rounded-lg p-3 mt-2" style={{background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)'}}>
                <div className="text-xs font-medium mb-1" style={{color: '#f87171'}}>Rejected:</div>
                <p className="text-sm mb-2 whitespace-pre-wrap" style={{color: '#e2e8f0', overflowWrap: 'break-word', wordBreak: 'break-word'}}>{draft.draft_body}</p>
                <div className="text-xs pt-2" style={{borderTop: '1px solid rgba(239,68,68,0.1)', color: '#f87171'}}>Rejected by {draft.reviewed_by || 'unknown'} · {draft.rejection_reason}</div>
              </div>
            ))}
          </>)
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* Show DraftPanel when there is a pending AI draft, otherwise show ComposePanel */}
      <div className="flex-shrink-0">
      {revisionPending || detail.drafts.some(d => ['draft_ready', 'under_review'].includes(d.state)) ? (
        <DraftPanel
          drafts={detail.drafts} revisionPending={revisionPending}
          editingDraft={editingDraft} setEditingDraft={setEditingDraft}
          isEditingRef={isEditingRef} editBody={editBody} setEditBody={setEditBody}
          revisionText={revisionText} setRevisionText={setRevisionText}
          revisingDraft={revisingDraft}
          rejectingDraft={rejectingDraft} setRejectingDraft={setRejectingDraft}
          rejectReason={rejectReason} setRejectReason={setRejectReason}
          showTeachPrompt={showTeachPrompt} setShowTeachPrompt={setShowTeachPrompt}
          requestApproval={requestApproval} handleDraftAction={handleDraftAction}
          handleRevision={handleRevision} handleRejectWithReason={handleRejectWithReason}
          draftStateBadge={draftStateBadge}
          propertyName={detail.conversation.property_name}
          conversationId={selectedConvId}
        >
          <ComposePanel
            composeOpen={composeOpen} setComposeOpen={setComposeOpen}
            composeText={composeText} setComposeText={setComposeText}
            composeSending={composeSending} handleComposeSend={handleComposeSend}
            handleComposeFix={handleComposeFix} composeFix={composeFix}
            conversationId={selectedConvId}
          />
        </DraftPanel>
      ) : (
        <ComposePanel
          composeOpen={composeOpen} setComposeOpen={setComposeOpen}
          composeText={composeText} setComposeText={setComposeText}
          composeSending={composeSending} handleComposeSend={handleComposeSend}
          handleComposeFix={handleComposeFix} composeFix={composeFix}
          conversationId={selectedConvId}
        />
      )}
      </div>
    </div>
  )
}
