'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { LanguageIcon } from '@heroicons/react/24/outline'
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
  composeMode: 'manual' | 'draft'
  setComposeMode: (v: 'manual' | 'draft') => void
  composeText: string
  setComposeText: (v: string) => void
  composeInstruction: string
  setComposeInstruction: (v: string) => void
  composeSending: boolean
  handleCompose: () => void
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
  composeOpen, setComposeOpen, composeMode, setComposeMode,
  composeText, setComposeText, composeInstruction, setComposeInstruction,
  composeSending, handleCompose,
  revisionPending, editingDraft, setEditingDraft, isEditingRef,
  editBody, setEditBody, revisionText, setRevisionText, revisingDraft,
  rejectingDraft, setRejectingDraft, rejectReason, setRejectReason,
  showTeachPrompt, setShowTeachPrompt,
  requestApproval, handleDraftAction, handleRevision, handleRejectWithReason,
  draftStateBadge,
}: ConversationDetailProps) {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [translatedDrafts, setTranslatedDrafts] = useState<Set<string>>(new Set())
  return (
    <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : ''}`}>
      {/* Mobile back button */}
      <div className="mobile-only mobile-nav-back" onClick={() => setMobileView('list')} style={{justifyContent: 'space-between'}}>
        <span>{'\u2190'} Back to inbox</span>
        <button onClick={(e) => { e.stopPropagation(); setMobileView('info'); }} className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>Info</button>
        <button onClick={(e) => { e.stopPropagation(); setMobileView('info'); }} className="ml-auto px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>{'\u2139\uFE0F'} Info</button>
      </div>
      {/* Conversation header */}
      <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>{detail.conversation.guest_name}</h2>
            <div className="flex items-center space-x-3 text-xs mt-1" style={{color: '#64748b'}}>
              {detail.conversation.property_name && <span onClick={() => fetchPropertyCard(detail.conversation.property_name)} style={{cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px'}}>{detail.conversation.property_name}</span>}
              {detail.conversation.channel && channelBadge(detail.conversation.channel)}
              {detail.conversation.check_in_date && detail.conversation.check_out_date && (
                <span>{format(new Date(detail.conversation.check_in_date), 'MMM d')} - {format(new Date(detail.conversation.check_out_date), 'MMM d')}</span>
              )}
              {detail.conversation.num_guests && <span>{detail.conversation.num_guests} guests</span>}
            </div>
          </div>
          {detail.conversation.first_response_minutes !== null && detail.conversation.first_response_minutes !== undefined && (
            <span className="text-xs font-medium" style={{color: rtColor(detail.conversation.first_response_minutes)}}>
              RT: {detail.conversation.first_response_minutes}m
            </span>
          )}
        </div>
        {detail.conversation.conversation_summary && (
          <div className="mt-1">
            <button onClick={() => setSummaryOpen(!summaryOpen)} className="flex items-center text-xs" style={{color: '#64748b'}}>
              <span style={{transform: summaryOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block', marginRight: '4px'}}>\u25B6</span>
              {summaryOpen ? 'Summary' : detail.conversation.conversation_summary.substring(0, 80) + (detail.conversation.conversation_summary.length > 80 ? '...' : '')}
            </button>
            {summaryOpen && (
              <p className="text-xs mt-1 p-2 rounded" style={{color: '#94a3b8', background: 'rgba(255,255,255,0.03)'}}>{detail.conversation.conversation_summary}</p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" style={{background: 'rgba(255,255,255,0.01)'}}>
        {detail.messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xl px-4 py-2.5 rounded-lg" style={{
              background: msg.direction === 'outbound' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.06)',
              border: msg.direction === 'outbound' ? '1px solid rgba(34,197,94,0.15)' : '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0'
            }}>
              <p className="text-sm whitespace-pre-wrap" dir="auto">{msg.body}</p>
              {msg.translated_body && msg.translated_body !== msg.body && (
                <div className="text-xs mt-2 pt-2" style={{borderTop: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8'}}>
                  <LanguageIcon className="h-3 w-3 inline mr-1" /> <span dir="auto">{msg.translated_body}</span>
                </div>
              )}
              <div className="text-xs mt-1" style={{color: '#64748b'}}>
                {format(new Date(msg.created_at), 'HH:mm')} {msg.sender_name && `- ${msg.sender_name}`}
                {msg.direction === 'inbound' && msg.original_language && msg.original_language !== 'en' && (
                  <span className="ml-1">{LANG_FLAGS[msg.original_language] || ''} {LANG_NAMES[msg.original_language] || msg.original_language}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Queued drafts - awaiting retry */}
        {detail.drafts.filter(d => d.state === "send_queued").map(draft => (
          <div key={draft.id} className="rounded-lg p-3 mt-2" style={{background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)"}}>
            <div className="flex items-center justify-between text-xs font-medium mb-1" style={{color: "#fbbf24"}}>
              <span><span className="mr-1.5">{'\u23F3'}</span> Queued — Guesty API unavailable. Will retry automatically.</span>
              <div className="flex space-x-1">
                <button onClick={async () => { try { await apiFetch('/api/drafts/' + draft.id + '/retry', { method: 'POST', body: JSON.stringify({ reviewed_by: displayName }) }); toast.success('Retry successful — message sent!'); if (selectedConvId) fetchDetail(selectedConvId); fetchConversations(); } catch (e: any) { toast.error('Retry failed: ' + e.message); } }}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                  Retry Now
                </button>
                <button onClick={async () => { try { await apiFetch('/api/drafts/' + draft.id + '/fail', { method: 'POST' }); toast('Marked as failed'); if (selectedConvId) fetchDetail(selectedConvId); } catch {} }}
                  className="px-2 py-0.5 rounded text-[10px]" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'}}>
                  Mark Failed
                </button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{color: "#e2e8f0"}}>{draft.draft_body}</p>
          </div>
        ))}

        {/* Latest sent draft only */}
        {(() => {
          const sentDrafts = detail.drafts.filter(d => d.state === 'sent').sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          const latestSent = sentDrafts[0]
          const olderSent = sentDrafts.slice(1)
          const rejectedDrafts = detail.drafts.filter(d => d.state === 'rejected')
          const hiddenCount = olderSent.length + rejectedDrafts.length
          return (<>
            {latestSent && (
              <div key={`sent-${latestSent.id}`} className="rounded-lg p-3 mt-2" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
                <div className="text-xs font-medium mb-1" style={{color: '#4ade80'}}>{latestSent.translated_content ? 'Approved English draft:' : 'Sent:'}</div>
                <p className="text-sm mb-2 whitespace-pre-wrap" style={{color: '#e2e8f0'}}>{latestSent.draft_body}</p>
                {latestSent.translated_content && latestSent.sent_language && (
                  <div className="pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.1)'}}>
                    <div className="text-xs font-medium mb-1" style={{color: '#4ade80'}}>Sent in {LANG_FLAGS[latestSent.sent_language] || ''} {LANG_NAMES[latestSent.sent_language] || latestSent.sent_language}:</div>
                    <p className="text-sm whitespace-pre-wrap" style={{color: '#94a3b8'}}>{latestSent.translated_content}</p>
                  </div>
                )}
                <div className="text-xs mt-2 pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.1)', color: '#64748b'}}>Approved by {latestSent.reviewed_by} · {latestSent.sent_at ? format(new Date(latestSent.sent_at), 'MMM d HH:mm') : format(new Date(latestSent.updated_at), 'MMM d HH:mm')}</div>
              </div>
            )}
            {hiddenCount > 0 && (
              <button onClick={() => setShowDraftHistory(!showDraftHistory)} className="text-xs px-2 py-1 rounded mx-4 mt-1" style={{color: '#64748b'}}>
                {showDraftHistory ? 'Hide' : 'Show'} draft history ({hiddenCount} older)
              </button>
            )}
            {showDraftHistory && olderSent.map(draft => (
              <div key={`sent-old-${draft.id}`} className="rounded-lg p-3 mt-2" style={{background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.08)'}}>
                <div className="text-xs font-medium mb-1" style={{color: '#4ade80', opacity: 0.7}}>{draft.translated_content ? 'Approved English draft:' : 'Sent:'}</div>
                <p className="text-sm whitespace-pre-wrap" style={{color: '#e2e8f0', opacity: 0.7}}>{draft.draft_body}</p>
                <div className="text-xs mt-2 pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.08)', color: '#64748b'}}>Approved by {draft.reviewed_by} · {draft.sent_at ? format(new Date(draft.sent_at), 'MMM d HH:mm') : format(new Date(draft.updated_at), 'MMM d HH:mm')}</div>
              </div>
            ))}
            {showDraftHistory && rejectedDrafts.map(draft => (
              <div key={`rejected-${draft.id}`} className="rounded-lg p-3 mt-2" style={{background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)'}}>
                <div className="text-xs font-medium mb-1" style={{color: '#f87171'}}>Rejected:</div>
                <p className="text-sm mb-2 whitespace-pre-wrap" style={{color: '#e2e8f0'}}>{draft.draft_body}</p>
                <div className="text-xs pt-2" style={{borderTop: '1px solid rgba(239,68,68,0.1)', color: '#f87171'}}>Rejected by {draft.reviewed_by} · {draft.rejection_reason}</div>
              </div>
            ))}
          </>)
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* Responded indicator */}
      {detail.messages.length > 0 &&
       detail.messages[detail.messages.length - 1].direction === 'outbound' &&
       detail.drafts.filter(d => ['draft_ready', 'under_review'].includes(d.state)).length === 0 && (
        <div className="flex-shrink-0 px-4 py-2 text-center" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
          <span className="text-xs" style={{color: '#4ade80'}}>{'\u2713'} Responded</span>
        </div>
      )}

      {/* Compose */}
      <ComposePanel
        composeOpen={composeOpen} setComposeOpen={setComposeOpen}
        composeMode={composeMode} setComposeMode={setComposeMode}
        composeText={composeText} setComposeText={setComposeText}
        composeInstruction={composeInstruction} setComposeInstruction={setComposeInstruction}
        composeSending={composeSending} handleCompose={handleCompose}
      />

      {/* Draft review */}
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
      />
    </div>
  )
}
