'use client'

import React, { useState } from 'react'
import { PencilSquareIcon, PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import ConsultChat from './ConsultChat'

interface ComposePanelProps {
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
  conversationId?: string
}

export default function ComposePanel({
  composeOpen, setComposeOpen, composeMode, setComposeMode,
  composeText, setComposeText, composeInstruction, setComposeInstruction,
  composeSending, handleCompose, conversationId,
}: ComposePanelProps) {
  const [showConsult, setShowConsult] = useState(false)

  const currentText = composeMode === 'manual' ? composeText : composeInstruction
  const canAskJudith = currentText.trim().length > 0 && !composeSending && conversationId

  return (
    <div data-testid="container-compose-panel" className="flex-shrink-0" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
      {!composeOpen ? (
        /* Collapsed: slim bottom bar */
        <div className="px-3 py-2">
          <button onClick={() => { setComposeOpen(true); setComposeMode('manual'); setComposeText(''); setComposeInstruction('') }}
            className="w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
            style={{background: 'rgba(168,85,247,0.08)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.15)'}}>
            <PencilSquareIcon className="h-3.5 w-3.5" /> Compose
          </button>
        </div>
      ) : (
        /* Expanded: compact compose area */
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button onClick={() => setComposeMode('manual')}
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{background: composeMode === 'manual' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)', color: composeMode === 'manual' ? '#c084fc' : '#94a3b8'}}>
                Write
              </button>
              <button onClick={() => setComposeMode('draft')}
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{background: composeMode === 'draft' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)', color: composeMode === 'draft' ? '#c084fc' : '#94a3b8'}}>
                Judith draft
              </button>
            </div>
            <button onClick={() => { setComposeOpen(false); setShowConsult(false) }} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <XMarkIcon className="h-4 w-4" style={{color: '#64748b'}} />
            </button>
          </div>

          {!showConsult && (
            <>
              <div className="flex gap-2 items-end">
                {composeMode === 'manual' ? (
                  <textarea data-testid="input-compose-message" value={composeText} onChange={e => setComposeText(e.target.value)}
                    onKeyDown={e => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleCompose() }}
                    placeholder="Type your message..."
                    className="flex-1 text-base rounded-lg px-3 py-1.5 outline-none" rows={2}
                    style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', resize: 'vertical', maxHeight: '120px'}} />
                ) : (
                  <textarea value={composeInstruction} onChange={e => setComposeInstruction(e.target.value)}
                    onKeyDown={e => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleCompose() }}
                    placeholder="e.g. Send check-in instructions, Follow up about AC..."
                    className="flex-1 text-base rounded-lg px-3 py-1.5 outline-none" rows={1}
                    style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', resize: 'vertical', maxHeight: '120px'}} />
                )}
                <button onClick={() => setShowConsult(true)} disabled={!canAskJudith}
                  className="flex-shrink-0 p-2 rounded-lg disabled:opacity-50"
                  style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.25)'}}
                  title="Ask Judith">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                </button>
                <button data-testid="btn-compose-send" onClick={handleCompose} disabled={composeSending}
                  className="flex-shrink-0 p-2 rounded-lg"
                  style={{background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', opacity: composeSending ? 0.5 : 1}}
                  title={composeMode === 'manual' ? 'Create Draft (Cmd+Enter)' : 'Ask Judith (Cmd+Enter)'}>
                  <PaperAirplaneIcon className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs block" style={{color: '#475569'}}>
                {composeMode === 'manual' ? 'Creates a draft for review · Cmd+Enter' : 'Judith drafts using property knowledge · Cmd+Enter'}
              </span>
            </>
          )}

          {showConsult && conversationId && (
            <ConsultChat
              conversationId={conversationId}
              context="compose"
              initialInstruction={currentText}
              onConfirm={() => { setShowConsult(false); handleCompose() }}
              onCancel={() => setShowConsult(false)}
              confirmLabel="Send Message"
            />
          )}
        </div>
      )}
    </div>
  )
}
