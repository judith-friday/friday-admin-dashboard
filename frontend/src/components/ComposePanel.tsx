'use client'

import React from 'react'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

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
}

export default function ComposePanel({
  composeOpen, setComposeOpen, composeMode, setComposeMode,
  composeText, setComposeText, composeInstruction, setComposeInstruction,
  composeSending, handleCompose,
}: ComposePanelProps) {
  return (
    <div className="flex-shrink-0 px-4 py-2" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
      {!composeOpen ? (
        <button onClick={() => { setComposeOpen(true); setComposeMode('manual'); setComposeText(''); setComposeInstruction('') }}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
          style={{background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)'}}>
          <PencilSquareIcon className="h-4 w-4" /> Compose Message
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button onClick={() => setComposeMode('manual')}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{background: composeMode === 'manual' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)', color: composeMode === 'manual' ? '#c084fc' : '#94a3b8'}}>
                Write manually
              </button>
              <button onClick={() => setComposeMode('draft')}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{background: composeMode === 'draft' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.06)', color: composeMode === 'draft' ? '#c084fc' : '#94a3b8'}}>
                Ask Judith to draft
              </button>
            </div>
            <button onClick={() => setComposeOpen(false)} className="text-xs" style={{color: '#64748b'}}>Cancel</button>
          </div>
          {composeMode === 'manual' ? (
            <textarea value={composeText} onChange={e => setComposeText(e.target.value)}
              onKeyDown={e => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleCompose() }}
              placeholder="Type your message to the guest..."
              className="w-full text-sm rounded-lg px-3 py-2 outline-none" rows={3}
              style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', resize: 'vertical'}} />
          ) : (
            <textarea value={composeInstruction} onChange={e => setComposeInstruction(e.target.value)}
              onKeyDown={e => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleCompose() }}
              placeholder="e.g. Send check-in instructions for tomorrow, Follow up about the AC repair, Ask for flight details..."
              className="w-full text-sm rounded-lg px-3 py-2 outline-none" rows={2}
              style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', resize: 'vertical'}} />
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{color: '#64748b'}}>
              {composeMode === 'manual' ? 'Creates a draft for review before sending' : 'Judith will draft using property knowledge + conversation history'}
            </span>
            <button onClick={handleCompose} disabled={composeSending}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', opacity: composeSending ? 0.5 : 1}}>
              {composeSending ? 'Sending...' : composeMode === 'manual' ? 'Create Draft' : 'Ask Judith'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
