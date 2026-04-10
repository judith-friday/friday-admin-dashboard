'use client'

import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { apiFetch, stripProtocolTags } from './types'
import { trackEvent } from '../lib/analytics'
import TeachingCard from './TeachingCard'
import ConflictBanner from './ConflictBanner'

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
  chips?: Array<{label: string, instruction?: string, onClick?: () => void}>
  onTeachingCreated?: (teaching: { id: string; instruction: string; scope: string }) => void
}


interface TeachingActionData {
  action: 'create' | 'update' | 'flag_conflict'
  instruction: string
  scope?: string
  propertyCode?: string
  reason?: string
  existingTeachingId?: string
  conflictingTeachingId?: string
  conflictingTeachingIndex?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sender?: string
}

export default function ConsultChat({
  conversationId, context, initialInstruction, draftBody, contextData,
  onConfirm, onCancel, confirmLabel, propertyCode, active = true,
  onDraftUpdate, chips, onTeachingCreated,
}: ConsultChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [started, setStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftUpdated, setDraftUpdated] = useState(false)
  const [teachingAction, setTeachingAction] = useState<TeachingActionData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [compactionNotice, setCompactionNotice] = useState(false)
  const [missingKnowledge, setMissingKnowledge] = useState(false)
  const [draftRefreshNotice, setDraftRefreshNotice] = useState(false)

  const [autoChips, setAutoChips] = useState<Array<{label: string, text: string}>>([])

  const startedRef = useRef(false)
  const prevConversationIdRef = useRef(conversationId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Detect questions in the last assistant message and generate quick-reply chips
  const detectQuestionChips = (text: string): Array<{label: string, text: string}> => {
    if (!text) return []
    const lower = text.toLowerCase()
    const hasQuestion = text.includes('?') || /\b(would you like|should i|want me to|do you want|shall i|can i|may i)\b/i.test(text)
    if (!hasQuestion) return []
    // Draft-related questions
    if (/\b(send|draft|message|reply)\b/i.test(lower) && /\b(want|like|should|ready|approve)\b/i.test(lower)) {
      return [{ label: 'Send it', text: 'Send it' }, { label: 'Polish more', text: 'Polish more' }, { label: 'Start over', text: 'Start over' }]
    }
    // Action/improvement suggestions
    if (/\b(incorporate|apply|implement|update|change|improve|add)\b/i.test(lower)) {
      return [{ label: 'Yes, do it', text: 'Yes, do it' }, { label: 'No thanks', text: 'No thanks' }, { label: 'Learn this', text: 'Learn this as a teaching' }]
    }
    // Generic yes/no
    return [{ label: 'Yes', text: 'Yes' }, { label: 'No', text: 'No' }]
  }

  const resetState = () => {
    startedRef.current = false
    setMessages([])
    setSessionId(null)
    setStarted(false)
    setLoading(false)
    setError(null)
    setReplyText('')
    setDraftUpdated(false)
    setTeachingAction(null)
    setCompactionNotice(false)
    setMissingKnowledge(false)
    setDraftRefreshNotice(false)
  }

  const initSession = async () => {
    if (startedRef.current) return
    startedRef.current = true
    setStarted(true)
    setLoading(true)
    setError(null)
    try {
      // Try to restore an existing active session
      if (conversationId) {
        try {
          const existing = await apiFetch(`/api/ai/consult/session/active?conversationId=${encodeURIComponent(conversationId)}`)
          if (existing.draftChanged) {
            // New draft arrived — show refresh notice, start fresh session
            setDraftRefreshNotice(true)
            setTimeout(() => setDraftRefreshNotice(false), 5000)
          } else if (existing.session && existing.session.history?.length > 0) {
            setSessionId(existing.session.sessionId)
            setMessages(existing.session.history.map((msg: ChatMessage) =>
              msg.role === 'assistant' ? { ...msg, content: stripProtocolTags(msg.content) } : msg
            ))
            setLoading(false)
            return
          }
        } catch (_) { /* no active session, proceed to start new */ }
      }
      // No existing session — start new consultation
      const senderName = localStorage.getItem('gms_display_name') || 'Team member'
      const userMsg: ChatMessage = { role: 'user', content: initialInstruction, sender: senderName }
      setMessages([userMsg])
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
      if (data.sessionId) {
        setSessionId(data.sessionId)
      }
      const rawResponse = data.response as string
      const draftUpdateContent = data.draft_update as string | undefined
      if (rawResponse) {
        const response = stripProtocolTags(rawResponse)
        setMessages([userMsg, { role: 'assistant', content: response }])
      }
      if (draftUpdateContent && onDraftUpdate) {
        onDraftUpdate(draftUpdateContent)
        setDraftUpdated(true)
        setTimeout(() => setDraftUpdated(false), 3000)
      }
      if (data.teaching_action) {
        setTeachingAction(data.teaching_action as TeachingActionData)
      }
      if (data.missingKnowledge) {
        setMissingKnowledge(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to consult')
    } finally {
      setLoading(false)
    }
  }

  // Handle conversationId changes — end old session and reset for new conversation
  useEffect(() => {
    if (prevConversationIdRef.current !== conversationId) {
      const oldSessionId = sessionId
      if (oldSessionId) {
        apiFetch('/api/ai/consult/session/end', {
          method: 'POST',
          body: JSON.stringify({ sessionId: oldSessionId, history: messages }),
        }).catch(() => {})
      }
      resetState()
      prevConversationIdRef.current = conversationId
    }
  }, [conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return
    initSession()
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading, active])

  // Auto-detect question chips when messages change
  useEffect(() => {
    if (messages.length < 2) { setAutoChips([]); return }
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === 'assistant') {
      setAutoChips(detectQuestionChips(lastMsg.content))
    } else {
      setAutoChips([])
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  const adjustTextareaHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const isMobile = (window.visualViewport?.width ?? window.innerWidth) < 768
    const maxH = isMobile ? 72 : 96
    const newH = Math.min(el.scrollHeight, maxH)
    el.style.height = newH + 'px'
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
  }

  // Stabilize input on mobile PWA: prevent keyboard from causing scroll jitter / layout shift
  useEffect(() => {
    const el = textareaRef.current
    if (!el || !active) return
    const handleFocus = () => {
      // Use visualViewport resize to wait for keyboard, then scroll
      if (window.visualViewport) {
        const onResize = () => {
          requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          })
          window.visualViewport!.removeEventListener('resize', onResize)
        }
        window.visualViewport.addEventListener('resize', onResize, { once: true })
        // Fallback if keyboard doesn't trigger resize (e.g. already open)
        setTimeout(() => {
          window.visualViewport!.removeEventListener('resize', onResize)
          requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
        }, 400)
      } else {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
      }
    }
    el.addEventListener('focus', handleFocus)
    return () => el.removeEventListener('focus', handleFocus)
  }, [active, started])

  const sendConsult = async (instruction: string, history: ChatMessage[]): Promise<{response: string | null, draftUpdate?: string, teachingAction?: TeachingActionData, sessionId?: string, compacted?: boolean, missingKnowledge?: boolean}> => {
    const data = await apiFetch('/api/ai/consult', {
      method: 'POST',
      body: JSON.stringify({
        instruction,
        ...(conversationId ? { conversationId } : {}),
        context,
        ...(draftBody ? { draftBody } : {}),
        ...(contextData ? { contextData } : {}),
        ...(history.length > 0 ? { history } : {}),
        ...(sessionId ? { sessionId } : {}),
      }),
    })
    return { response: data.response as string, draftUpdate: data.draft_update as string | undefined, teachingAction: data.teaching_action as TeachingActionData | undefined, sessionId: data.sessionId, compacted: data.compacted, missingKnowledge: data.missingKnowledge }
  }

  const sendAndProcess = async (instruction: string) => {
    const senderName = localStorage.getItem('gms_display_name') || 'Team member'
    const userMsg: ChatMessage = { role: 'user', content: instruction, sender: senderName }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    setError(null)
    try {
      const result = await sendConsult(instruction, newMessages)
      if (result.sessionId && !sessionId) {
        setSessionId(result.sessionId)
      }
      if (result.response) {
        const response = stripProtocolTags(result.response)
        setMessages(prev => [...prev, { role: 'assistant', content: response }])
      }
      if (result.compacted) {
        setMessages([{
          role: 'assistant',
          content: 'Session condensed for efficiency. I still have context from our conversation. How can I help?'
        }])
        setCompactionNotice(true)
        setTimeout(() => setCompactionNotice(false), 5000)
      }
      if (result.draftUpdate && onDraftUpdate) {
        onDraftUpdate(result.draftUpdate)
        setDraftUpdated(true)
        setTimeout(() => setDraftUpdated(false), 3000)
      }
      if (result.teachingAction) {
        setTeachingAction(result.teachingAction)
      }
      if (result.missingKnowledge) {
        setMissingKnowledge(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to consult')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setAutoChips([])
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
          <span className="text-xs" style={{ color: '#94a3b8' }}>Asking Friday...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-lg" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)', overflowAnchor: 'none', ...(active ? {} : { display: 'none' as const }) }}>
      {/* Header with close and new conversation buttons */}
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-xs font-medium" style={{ color: '#6395ff' }}>Ask Friday</span>
        <div className="flex items-center gap-1">
          <button onClick={async () => {
            if (sessionId) {
              await apiFetch('/api/ai/consult/session/end', {
                method: 'POST',
                body: JSON.stringify({ sessionId, history: messages }),
              }).catch(() => {})
            }
            resetState()
            // Re-initialize fresh session after state clears
            setTimeout(() => initSession(), 0)
          }} className="p-0.5 rounded hover:bg-white/10" style={{ color: '#64748b' }} title="New conversation">
            <ArrowPathIcon className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onCancel()} className="p-0.5 rounded hover:bg-white/10" style={{ color: '#64748b' }} title="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      {/* Draft refresh notice */}
      {draftRefreshNotice && (
        <div className="mx-3 mt-1 px-2 py-1 rounded text-xs" style={{background: 'rgba(99,149,255,0.08)', color: '#93c5fd', border: '1px solid rgba(99,149,255,0.15)'}}>
          New draft available — context refreshed
        </div>
      )}
      {/* Missing knowledge indicator */}
      {missingKnowledge && (
        <div className="mx-3 mt-1 px-2 py-1 rounded text-xs" style={{background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)'}}>
          No property knowledge file found — responses may be less accurate
        </div>
      )}
      {/* Chat messages */}
      <div className="p-3 pt-1 space-y-2 overflow-y-auto custom-scrollbar consult-chat-messages" style={{ maxHeight: '40vh', overflowAnchor: 'none' }}>
        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="flex flex-col items-end">
                  {msg.sender && (
                    <span className="text-[10px] mb-0.5 mr-1" style={{ color: '#64748b' }}>
                      {msg.sender}
                    </span>
                  )}
                  <div className="max-w-full px-3 py-2 rounded-lg text-sm whitespace-pre-wrap" style={{
                    background: 'rgba(168,85,247,0.1)',
                    color: '#c084fc',
                    border: '1px solid rgba(168,85,247,0.2)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] px-3 py-2 rounded-lg text-sm friday-markdown" style={{
                background: 'rgba(30,41,59,0.5)',
                color: '#e2e8f0',
                border: '1px solid rgba(99,149,255,0.1)',
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
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

      {compactionNotice && (
        <div className="mx-3 mb-1 px-2 py-1 rounded text-xs text-center" style={{background: 'rgba(99,149,255,0.1)', color: '#93c5fd', border: '1px solid rgba(99,149,255,0.15)'}}>
          Session condensed for efficiency
        </div>
      )}

      {/* Teaching action cards */}
      {teachingAction && teachingAction.action === 'create' && (
        <TeachingCard
          instruction={teachingAction.instruction}
          suggestedScope={(teachingAction.scope as 'global' | 'property') || 'global'}
          propertyCode={teachingAction.propertyCode || propertyCode}
          onConfirm={() => setTeachingAction(null)}
          onDismiss={() => setTeachingAction(null)}
          onTeachingCreated={onTeachingCreated}
        />
      )}
      {teachingAction && teachingAction.action === 'update' && (
        <TeachingCard
          instruction={teachingAction.instruction}
          suggestedScope="global"
          propertyCode={teachingAction.propertyCode || propertyCode}
          onConfirm={async () => {
            if (teachingAction.existingTeachingId) {
              await apiFetch(`/api/teachings/${teachingAction.existingTeachingId}/revoke`, {
                method: 'PATCH',
                body: JSON.stringify({ revoke_reason: 'Updated via Ask Friday' }),
              })
            }
            setTeachingAction(null)
          }}
          onDismiss={() => setTeachingAction(null)}
          onTeachingCreated={onTeachingCreated}
        />
      )}
      {teachingAction && teachingAction.action === 'flag_conflict' && (
        <ConflictBanner
          message={teachingAction.reason || 'This conflicts with an existing teaching.'}
          existingTeaching={teachingAction.conflictingTeachingIndex || undefined}
          onUpdateTeaching={async () => {
            if (teachingAction.conflictingTeachingId) {
              await apiFetch(`/api/teachings/${teachingAction.conflictingTeachingId}/revoke`, {
                method: 'PATCH',
                body: JSON.stringify({ revoke_reason: 'Updated via Ask Friday conflict resolution' }),
              })
            }
            const result = await apiFetch('/api/teachings', {
              method: 'POST',
              body: JSON.stringify({
                instruction: teachingAction.instruction,
                scope: 'global',
                source: 'direct',
                taught_by: 'team',
              }),
            })
            const teachingId = result?.id || result?.teaching?.id
            if (teachingId && onTeachingCreated) {
              onTeachingCreated({ id: teachingId, instruction: teachingAction.instruction, scope: 'global' })
            }
            setTeachingAction(null)
          }}
          onException={() => setTeachingAction(null)}
          onDismiss={() => setTeachingAction(null)}
        />
      )}

      {/* Auto-detected question chips */}
      {autoChips.length > 0 && !loading && (
        <div className="px-3 pb-1 flex flex-wrap gap-1 action-chips-row">
          {autoChips.map((chip, i) => (
            <button key={i}
              onClick={() => { setAutoChips([]); sendAndProcess(chip.text) }}
              className="px-2.5 py-1 text-xs rounded-full transition-colors hover:opacity-80"
              style={{background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)', fontSize: '11px', lineHeight: '1.4'}}>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Quick action chips */}
      {chips && chips.length > 0 && !loading && (
        <div className="px-3 pb-1 flex flex-wrap gap-1 action-chips-row">
          {chips.map((chip, i) => (
            <button key={i}
              onClick={() => chip.onClick ? chip.onClick() : chip.instruction ? sendAndProcess(chip.instruction) : null}
              className="px-2 py-0.5 text-xs rounded-full"
              style={{background: 'rgba(99,149,255,0.08)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.15)', fontSize: '11px', lineHeight: '1.4'}}>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Reply input */}
      {!loading && messages.length >= 2 && (
        <div className="px-3 pb-2 consult-chat-reply">
          <div className="flex gap-2">
            <textarea ref={textareaRef} inputMode="text" value={replyText} onChange={e => { setReplyText(e.target.value); setTimeout(adjustTextareaHeight, 0) }}
              placeholder="Reply to Friday..."
              className="flex-1 text-base rounded px-2 py-1.5 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', minHeight: '36px', maxHeight: '96px', overflowY: 'auto', transition: 'height 0.1s ease' }}
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
