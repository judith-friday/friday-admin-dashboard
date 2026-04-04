'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'
import { trackEvent } from '../lib/analytics'

interface ConsultChatProps {
  conversationId?: string
  context: 'revision' | 'compose' | 'draft_review' | 'pending_action' | 'next_step' | 'teaching' | 'learning_candidate'
  initialInstruction: string
  draftBody?: string
  contextData?: Record<string, any>
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
  propertyCode?: string
}

function extractAndSaveTeaching(text: string, propertyCode?: string): string {
  const match = text.match(/\[TEACH\]([\s\S]*?)\[\/TEACH\]/)
  if (!match) return text
  const instruction = match[1].trim()
  // Fire and forget — save teaching
  apiFetch('/api/teachings', {
    method: 'POST',
    body: JSON.stringify({
      instruction,
      scope: propertyCode ? 'property' : 'global',
      property_code: propertyCode || null,
      taught_by: 'consult_chat',
    }),
  }).then(() => {
    console.log('[ConsultChat] Teaching saved:', instruction.substring(0, 60))
  }).catch((err: any) => {
    console.warn('[ConsultChat] Failed to save teaching:', err.message)
  })
  // Strip the [TEACH] tags from displayed text, add a confirmation note
  return text.replace(/\[TEACH\][\s\S]*?\[\/TEACH\]/, '\u2705 Learned for future drafts.').trim()
}

function parseZones(text: string): { reasoning: string | null; draft: string | null } {
  const reasoningMatch = text.match(/\[REASONING\]([\s\S]*?)\[\/REASONING\]/)
  const draftMatch = text.match(/\[DRAFT\]([\s\S]*?)\[\/DRAFT\]/)

  // If no tags found, treat entire response as reasoning (backward compatibility)
  if (!reasoningMatch && !draftMatch) {
    return { reasoning: text, draft: null }
  }

  return {
    reasoning: reasoningMatch ? reasoningMatch[1].trim() : null,
    draft: draftMatch ? draftMatch[1].trim() : null,
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ConsultChat({
  conversationId, context, initialInstruction, draftBody, contextData,
  onConfirm, onCancel, confirmLabel, propertyCode,
}: ConsultChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    setStarted(true)
    const userMsg: ChatMessage = { role: 'user', content: initialInstruction }
    setMessages([userMsg])
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiFetch('/api/ai/consult', {
          method: 'POST',
          body: JSON.stringify({
            instruction: initialInstruction,
            ...(conversationId ? { conversationId } : {}),
            context,
            ...(draftBody ? { draftBody } : {}),
            ...(contextData ? { contextData } : {}),
          }),
        })
        const rawResponse = data.response as string
        if (rawResponse) {
          const response = extractAndSaveTeaching(rawResponse, propertyCode)
          setMessages([userMsg, { role: 'assistant', content: response }])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to consult')
      } finally {
        setLoading(false)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sendConsult = async (instruction: string, history: ChatMessage[]) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/api/ai/consult', {
        method: 'POST',
        body: JSON.stringify({
          instruction,
          ...(conversationId ? { conversationId } : {}),
          context,
          ...(draftBody ? { draftBody } : {}),
          ...(contextData ? { contextData } : {}),
          ...(history.length > 0 ? { history } : {}),
        }),
      })
      return data.response as string
    } catch (err: any) {
      setError(err.message || 'Failed to consult')
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    trackEvent('ask_judith_message_sent', { context, messageLength: replyText.trim().length })
    const userMsg: ChatMessage = { role: 'user', content: replyText.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setReplyText('')
    const rawResponse = await sendConsult(replyText.trim(), newMessages)
    if (rawResponse) {
      const response = extractAndSaveTeaching(rawResponse, propertyCode)
      setMessages([...newMessages, { role: 'assistant', content: response }])
    }
  }

  if (!started || (loading && messages.length <= 1)) {
    return (
      <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)' }}>
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" style={{ color: '#6395ff' }} />
          <span className="text-xs" style={{ color: '#94a3b8' }}>Asking Judith...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-lg" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)' }}>
      {/* Chat messages */}
      <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '40vh' }}>
        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{
                  background: 'rgba(168,85,247,0.1)',
                  color: '#c084fc',
                  border: '1px solid rgba(168,85,247,0.2)',
                }}>
                  {msg.content}
                </div>
              </div>
            )
          }

          const { reasoning, draft } = parseZones(msg.content)
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] space-y-2">
                {reasoning && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>
                      Judith&apos;s Reasoning
                    </div>
                    <div className="px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{
                      background: 'rgba(30,41,59,0.5)',
                      color: '#94a3b8',
                      border: '1px solid rgba(99,149,255,0.1)',
                    }}>
                      {reasoning}
                    </div>
                  </div>
                )}
                {draft && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6395ff' }}>
                      Draft Message
                    </div>
                    <div className="px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{
                      background: 'rgba(51,65,85,0.7)',
                      color: '#f1f5f9',
                      border: '1px solid rgba(99,149,255,0.3)',
                    }}>
                      {draft}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(99,149,255,0.1)', border: '1px solid rgba(99,149,255,0.2)' }}>
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" style={{ color: '#6395ff' }} />
            </div>
          </div>
        )}
        {error && (
          <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>
        )}
      </div>

      {/* Reply input */}
      {!loading && messages.length >= 2 && (
        <div className="px-3 pb-2">
          <div className="flex gap-2">
            <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="Reply to Judith..."
              className="flex-1 text-sm rounded px-2 py-1.5 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
              onKeyDown={e => { if (e.key === 'Enter') handleReply() }} />
            <button onClick={handleReply} disabled={!replyText.trim()}
              className="px-2 py-1 text-xs rounded disabled:opacity-50"
              style={{ background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!loading && (
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={onConfirm}
            className="px-3 py-1.5 text-sm rounded"
            style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded flex items-center"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
            <XMarkIcon className="h-3.5 w-3.5 mr-1" /> Cancel
          </button>
        </div>
      )}
    </div>
  )
}
