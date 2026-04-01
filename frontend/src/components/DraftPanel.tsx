'use client'

import React from 'react'
import {
  PaperAirplaneIcon,
  XMarkIcon,
  PencilSquareIcon,
  GlobeAltIcon,
  LanguageIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { Draft } from './types'

interface DraftPanelProps {
  drafts: Draft[]
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
  propertyName?: string
}

export default function DraftPanel({
  drafts, revisionPending, editingDraft, setEditingDraft, isEditingRef,
  editBody, setEditBody, revisionText, setRevisionText, revisingDraft,
  rejectingDraft, setRejectingDraft, rejectReason, setRejectReason,
  showTeachPrompt, setShowTeachPrompt,
  requestApproval, handleDraftAction, handleRevision, handleRejectWithReason,
  draftStateBadge, propertyName,
}: DraftPanelProps) {
  if (revisionPending) {
    return (
      <div className="rounded-lg p-3 mx-3 mb-1 flex-shrink-0" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)'}}>
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" style={{color: '#6395ff'}} />
          <span className="text-xs" style={{color: '#94a3b8'}}>Judith is revising...</span>
        </div>
      </div>
    )
  }

  const readyDrafts = drafts
    .filter(d => ['draft_ready', 'under_review'].includes(d.state))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 1)

  if (readyDrafts.length === 0) return null

  return (
    <>
      {readyDrafts.map(draft => (
        <div key={draft.id} data-testid="container-draft-panel" className="rounded-lg p-3 mx-3 mb-1 flex-shrink-0" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)', borderTop: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-medium flex items-center" style={{color: '#94a3b8'}}>
              <GlobeAltIcon className="h-3.5 w-3.5 mr-1" /> AI Draft
              {draft.confidence != null && (() => {
                const c = Number(draft.confidence)
                const dbg = c >= 80 ? 'rgba(34,197,94,0.15)' : c >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
                const dclr = c >= 80 ? '#4ade80' : c >= 60 ? '#fbbf24' : '#f87171'
                return <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: dbg, color: dclr}}>{c}%</span>
              })()}
            </h4>
            {draftStateBadge(draft.state)}
          </div>

          {editingDraft === draft.id ? (
            <div className="space-y-2">
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} rows={4} />
              <div className="flex space-x-2">
                <button data-testid={`btn-save-send-${draft.id}`} onClick={() => { handleDraftAction(draft.id, 'approve', editBody) }}
                  className="px-3 py-1.5 text-sm rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>Save and Send</button>
                <button data-testid={`btn-cancel-edit-${draft.id}`} onClick={() => { setEditingDraft(null); isEditingRef.current = false }}
                  className="px-3 py-1.5 text-sm rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="max-h-[20vh] overflow-y-auto custom-scrollbar">
              <div className="p-3 rounded text-sm mb-2 whitespace-pre-wrap" dir="auto" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0'}}>{draft.draft_body}</div>
              {draft.draft_translated && draft.draft_translated !== draft.draft_body && (
                <div className="p-3 rounded text-sm mb-2" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)'}}>
                  <LanguageIcon className="h-3 w-3 inline mr-1" style={{color: '#6395ff'}} />
                  <span className="text-xs font-medium" style={{color: '#6395ff'}}>Translated:</span>
                  <p className="mt-1 whitespace-pre-wrap" dir="auto">{draft.draft_translated}</p>
                </div>
              )}
              </div>
              <div className="flex space-x-2">
                <button data-testid={`btn-approve-${draft.id}`} onClick={() => requestApproval(draft.id)}
                  className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                  <PaperAirplaneIcon className="h-4 w-4 mr-1" /> Approve & Send
                </button>
                <button data-testid={`btn-edit-${draft.id}`} onClick={() => { setEditingDraft(draft.id); isEditingRef.current = true; setEditBody(draft.draft_body) }}
                  className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                  <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                </button>
                <button data-testid={`btn-reject-${draft.id}`} onClick={() => { setRejectingDraft(rejectingDraft === draft.id ? null : draft.id); setRejectReason('') }}
                  className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'}}>
                  <XMarkIcon className="h-4 w-4 mr-1" /> Reject
                </button>
              </div>

              {/* Rejection reason */}
              {rejectingDraft === draft.id && (
                <div className="mt-2 space-y-2">
                  <div className="flex space-x-2">
                    <input data-testid="input-reject-reason" type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Why? (optional \u2014 helps Judith learn)"
                      className="flex-1 text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                      onKeyDown={e => { if (e.key === 'Enter') handleRejectWithReason(draft.id) }} />
                    <button onClick={() => handleRejectWithReason(draft.id)}
                      className="px-3 py-1 text-xs rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>{rejectReason.trim() ? 'Reject with feedback' : 'Dismiss'}</button>
                  </div>
                  <p className="text-xs" style={{color: '#64748b'}}>{rejectReason.trim() ? 'Judith will learn from your feedback' : 'Dismissing without feedback \u2014 no learning'}</p>
                </div>
              )}

              {/* Revision input */}
              <div className="mt-3">
                <div className="flex space-x-2">
                  <input data-testid="input-revision-text" type="text" value={revisionText} onChange={e => setRevisionText(e.target.value)}
                    placeholder="Ask Judith to adjust... (e.g. 'make it shorter', 'add WiFi password')"
                    className="flex-1 text-sm rounded px-2 py-1.5 outline-none revision-input" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                    disabled={revisingDraft === draft.id}
                    onKeyDown={e => { if (e.key === 'Enter') handleRevision(draft.id, 'standard') }} />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <button data-testid={`btn-revise-standard-${draft.id}`} onClick={() => handleRevision(draft.id, 'standard')}
                    disabled={revisingDraft === draft.id || !revisionText.trim()}
                    className="px-3 py-1 text-xs rounded disabled:opacity-50" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>
                    {revisingDraft === draft.id ? 'Revising...' : 'Revise'}
                  </button>
                  <button data-testid={`btn-revise-teach-${draft.id}`} onClick={() => { if (!revisionText.trim()) return; setShowTeachPrompt(showTeachPrompt === draft.id ? null : draft.id) }}
                    disabled={revisingDraft === draft.id || !revisionText.trim()}
                    className="px-3 py-1 text-xs rounded disabled:opacity-50 flex items-center" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                    <span className="mr-1">{'\uD83E\uDDE0'}</span> Revise & teach
                  </button>
                  <button data-testid={`btn-revise-one-time-${draft.id}`} onClick={() => handleRevision(draft.id, 'one_time')}
                    disabled={revisingDraft === draft.id || !revisionText.trim()}
                    className="text-xs disabled:opacity-50" style={{color: '#64748b'}}>
                    one-time
                  </button>
                </div>
                {showTeachPrompt === draft.id && (
                  <div className="mt-2 p-2 rounded" style={{background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)'}}>
                    <div className="text-xs mb-1.5" style={{color: '#c084fc'}}>Save this teaching to:</div>
                    <div className="flex space-x-2">
                      <button data-testid={`btn-teach-property-${draft.id}`} onClick={() => handleRevision(draft.id, 'teach', 'property', propertyName || undefined)}
                        className="px-2 py-1 text-xs rounded" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                        {'\uD83D\uDCCD'} {propertyName || 'This property'} only
                      </button>
                      <button data-testid={`btn-teach-global-${draft.id}`} onClick={() => handleRevision(draft.id, 'teach', 'global')}
                        className="px-2 py-1 text-xs rounded" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                        {'\uD83C\uDF10'} All properties
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </>
  )
}
