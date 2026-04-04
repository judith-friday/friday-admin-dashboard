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
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ConsultChat({
  conversationId, context, initialInstruction, draftBody, contextData,
  onConfirm, onCancel, confirmLabel,
}: ConsultChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startedRef = useRef(false)
  const exchangeCount = messages.filter(m => m.role === 'user').length

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
        const response = data.response as string
        if (response) {
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
    if (!replyText.trim() || exchangeCount >= 3) return
    trackEvent('ask_judith_message_sent', { context, messageLength: replyText.trim().length })
    const userMsg: ChatMessage = { role: 'user', content: replyText.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setReplyText('')
    const response = await sendConsult(replyText.trim(), newMessages)
    if (response) {
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
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{
              background: msg.role === 'user' ? 'rgba(168,85,247,0.1)' : 'rgba(99,149,255,0.1)',
              color: msg.role === 'user' ? '#c084fc' : '#6395ff',
              border: `1px solid ${msg.role === 'user' ? 'rgba(168,85,247,0.2)' : 'rgba(99,149,255,0.2)'}`,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
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
      {!loading && exchangeCount < 3 && messages.length >= 2 && (
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
          <span className="text-xs mt-1 block" style={{ color: '#475569' }}>{3 - exchangeCount} replies remaining</span>
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
