'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'
import { trackEvent } from '../lib/analytics'

interface ConsultChatProps {
  conversationId?: string
  context: 'revision' | 'compose' | 'draft_review' | 'pending_action' | 'next_step' | 'teaching' | 'learning_candidate'
  initialInstruction: string
  draftBody?: string
  contextData?: Record<string, any>
  onConfirm?: () => void
  onCancel: () => void
  confirmLabel?: string
  propertyCode?: string
  active?: boolean
  onDraftUpdate?: (content: string) => void
  chips?: Array<{label: string, instruction: string}>
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

function stripZoneTags(text: string): string {
  return text.replace(/\[REASONING\]/g, '').replace(/\[\/REASONING\]/g, '').replace(/\[DRAFT\]/g, '').replace(/\[\/DRAFT\]/g, '').trim()
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ConsultChat({
  conversationId, context, initialInstruction, draftBody, contextData,
  onConfirm, onCancel, confirmLabel, propertyCode, active = true,
  onDraftUpdate, chips,
}: ConsultChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftUpdated, setDraftUpdated] = useState(false)

  const startedRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || startedRef.current) return
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
        const draftUpdateContent = data.draft_update as string | undefined
        if (rawResponse) {
          const response = stripZoneTags(extractAndSaveTeaching(rawResponse, propertyCode))
          setMessages([userMsg, { role: 'assistant', content: response }])
        }
        if (draftUpdateContent && onDraftUpdate) {
          onDraftUpdate(draftUpdateContent)
          setDraftUpdated(true)
          setTimeout(() => setDraftUpdated(false), 3000)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to consult')
      } finally {
        setLoading(false)
      }
    })()
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, active])

  const adjustTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  const sendConsult = async (instruction: string, history: ChatMessage[]): Promise<{response: string | null, draftUpdate?: string}> => {
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
      return { response: data.response as string, draftUpdate: data.draft_update as string | undefined }
    } catch (err: any) {
      throw err
    }
  }

  const sendAndProcess = async (instruction: string) => {
    const userMsg: ChatMessage = { role: 'user', content: instruction }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    setError(null)
    try {
      const result = await sendConsult(instruction, newMessages)
      if (result.response) {
        const response = stripZoneTags(extractAndSaveTeaching(result.response, propertyCode))
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
      }
      if (result.draftUpdate && onDraftUpdate) {
        onDraftUpdate(result.draftUpdate)
        setDraftUpdated(true)
        setTimeout(() => setDraftUpdated(false), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to consult')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    trackEvent('ask_judith_message_sent', { context, messageLength: replyText.trim().length })
    await sendAndProcess(replyText.trim())
    setReplyText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  if (!started && !active) return null

  if (!started || (loading && messages.length <= 1)) {
    return (
      <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)', ...(active ? {} : { display: 'none' as const }) }}>
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" style={{ color: '#6395ff' }} />
          <span className="text-xs" style={{ color: '#94a3b8' }}>Asking Judith...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-lg" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)', ...(active ? {} : { display: 'none' as const }) }}>
      {/* Header with close button */}
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-xs font-medium" style={{ color: '#6395ff' }}>Ask Judith</span>
        <button onClick={onCancel} className="p-0.5 rounded hover:bg-white/10" style={{ color: '#64748b' }}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      {/* Chat messages */}
      <div className="p-3 pt-1 space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '40vh' }}>
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

          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{
                background: 'rgba(30,41,59,0.5)',
                color: '#e2e8f0',
                border: '1px solid rgba(99,149,255,0.1)',
              }}>
                {msg.content}
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
        <div ref={messagesEndRef} />
      </div>

      {draftUpdated && (
        <div className="mx-3 mb-1 px-2 py-1 rounded text-xs flex items-center gap-1.5" style={{background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)'}}>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          Draft updated
        </div>
      )}

      {/* Quick action chips */}
      {chips && chips.length > 0 && !loading && (
        <div className="px-3 pb-1 flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <button key={i}
              onClick={() => sendAndProcess(chip.instruction)}
              className="px-2 py-1 text-xs rounded-full"
              style={{background: 'rgba(99,149,255,0.08)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.15)'}}>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Reply input */}
      {!loading && messages.length >= 2 && (
        <div className="px-3 pb-2">
          <div className="flex gap-2">
            <textarea ref={textareaRef} value={replyText} onChange={e => { setReplyText(e.target.value); setTimeout(adjustTextareaHeight, 0) }}
              placeholder="Reply to Judith..."
              className="flex-1 text-base rounded px-2 py-1.5 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', minHeight: '36px', maxHeight: '96px' }}
              rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }} />
            <button onClick={handleReply} disabled={!replyText.trim()}
              className="px-2 py-1 text-xs rounded disabled:opacity-50"
              style={{ background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!loading && onConfirm && confirmLabel && (
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={onConfirm}
            className="px-3 py-1.5 text-sm rounded"
            style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
            {confirmLabel}
          </button>
        </div>
      )}
    </div>
  )
}
