'use client'

import React, { useState } from 'react'
import { PencilSquareIcon, PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import ConsultChat from './ConsultChat'

interface ComposePanelProps {
  composeOpen: boolean
  setComposeOpen: (v: boolean) => void
  composeText: string
  setComposeText: (v: string) => void
  composeSending: boolean
  handleComposeSend: () => void
  handleComposeFix: () => void
  composeFix: boolean
  conversationId?: string
  onTeachingCreated?: (teaching: { id: string; instruction: string; scope: string }) => void
}

export default function ComposePanel({
  composeOpen, setComposeOpen,
  composeText, setComposeText,
  composeSending, handleComposeSend, handleComposeFix, composeFix,
  conversationId, onTeachingCreated,
}: ComposePanelProps) {
  const [showConsult, setShowConsult] = useState(false)

  const canSend = composeText.trim().length > 0 && !composeSending && !composeFix
  const canFix = composeText.trim().length > 0 && !composeSending && !composeFix
  const canAskFriday = !composeSending && conversationId

  return (
    <div data-testid="container-compose-panel" className="flex-shrink-0" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
      {!composeOpen ? (
        /* Collapsed: slim bottom bar */
        <div className="px-3 py-2">
          <button onClick={() => { setComposeOpen(true) }}
            className="w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
            style={{background: 'rgba(168,85,247,0.08)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.15)'}}>
            <PencilSquareIcon className="h-3.5 w-3.5" /> Compose
          </button>
        </div>
      ) : (
        /* Expanded: unified compose area */
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{color: '#94a3b8'}}>Compose</span>
            <button onClick={() => { setComposeOpen(false); setShowConsult(false) }} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <XMarkIcon className="h-4 w-4" style={{color: '#64748b'}} />
            </button>
          </div>

          <textarea data-testid="input-compose-message" value={composeText} onChange={e => setComposeText(e.target.value)}
            onKeyDown={e => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) handleComposeSend() }}
            placeholder="Type your message to the guest..."
            className="w-full text-base rounded-lg px-3 py-1.5 outline-none" rows={3}
            style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', resize: 'none', minHeight: '72px', maxHeight: '160px', overflowY: 'auto'}} />

          <div className="flex gap-2">
            {/* Fix button */}
            <button onClick={handleComposeFix} disabled={!canFix}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)'}}
              title="Polish message with AI">
              <SparklesIcon className="h-3.5 w-3.5" />
              {composeFix ? 'Fixing...' : 'Fix'}
            </button>

            {/* Ask Friday button */}
            <button onClick={() => setShowConsult(!showConsult)} disabled={!canAskFriday}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
              style={{
                background: showConsult ? 'rgba(99,149,255,0.2)' : 'rgba(99,149,255,0.12)',
                color: '#6395ff',
                border: `1px solid rgba(99,149,255,${showConsult ? '0.35' : '0.25'})`,
              }}
              title={showConsult ? 'Close Friday' : 'Ask Friday for help'}>
              <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
              {showConsult ? 'Close Friday' : 'Ask Friday'}
            </button>

            {/* Send button */}
            <button data-testid="btn-compose-send" onClick={handleComposeSend} disabled={!canSend}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ml-auto disabled:opacity-40"
              style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)'}}
              title="Send (Cmd+Enter)">
              <PaperAirplaneIcon className="h-3.5 w-3.5" />
              {composeSending ? 'Sending...' : 'Send'}
            </button>
          </div>
          <span className="text-xs hidden md:block" style={{color: '#475569'}}>Cmd+Enter to send</span>

          {conversationId && (
            <ConsultChat
              key={conversationId}
              active={showConsult}
              conversationId={conversationId}
              context="compose"
              initialInstruction={composeText || 'Help me compose a message to this guest.'}
              onConfirm={() => { setShowConsult(false) }}
              onCancel={() => setShowConsult(false)}
              confirmLabel="Done"
              onDraftUpdate={(content) => {
                setComposeText(content)
              }}
              chips={[
                { label: '✍️ Write it for me', instruction: 'Write a complete message to the guest based on the conversation context. Use appropriate tone for the channel.' },
                { label: '✨ Polish', instruction: 'Improve the tone, grammar, and professionalism of this message. Apply brand voice and teachings.' },
                { label: '✂️ Shorter', instruction: 'Make this message shorter and more concise.' },
                { label: '📋 Check rules', instruction: 'Check this message against active teachings and platform rules. Flag any issues.' },
              ]}
              onTeachingCreated={onTeachingCreated}
            />
          )}
        </div>
      )}
    </div>
  )
}
