'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
  UserIcon,
  CalendarIcon,
  HomeIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LanguageIcon,
  ArrowPathIcon,
  PlusIcon,
  ArchiveBoxIcon,
  EyeSlashIcon,
  QuestionMarkCircleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline'

// Shared types and utilities
import {
  API_BASE, LANG_NAMES, LANG_FLAGS, RTL_LANGS,
  getToken, setToken, clearToken, apiFetch,
  Conversation, ConversationDetail, MessageItem, Draft, PendingAction, InboxStats,
} from '../components/types'

// Extracted components
import { HelpPanel } from '../components/HelpPanel'
import { PendingActionsTab } from '../components/PendingActions'
import { LoginScreen } from '../components/LoginScreen'

export default function MessageDashboard() {
  const [token, setTokenState] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('Dashboard')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [stats, setStats] = useState<InboxStats | null>(null)
  const [pollerStatus, setPollerStatus] = useState<{api_down: boolean, send_queue_length: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'review' | 'open' | 'done' | 'actions'>('all')
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const isEditingRef = useRef(false)
  const [revisionPending, setRevisionPending] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [revisionText, setRevisionText] = useState('')
  const [revisingDraft, setRevisingDraft] = useState<string | null>(null)
  const [showTeachPrompt, setShowTeachPrompt] = useState<string | null>(null)
  const [teachScope, setTeachScope] = useState<'global' | 'property'>('global')
  const [showTeachingsPanel, setShowTeachingsPanel] = useState(false)
  const [teachings, setTeachings] = useState<any[]>([])
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [newTeachingText, setNewTeachingText] = useState('')
  const [propertyCard, setPropertyCard] = useState<{code: string; data: any; loading: boolean} | null>(null)
  const [cardEditing, setCardEditing] = useState(false)
  const [cardEditData, setCardEditData] = useState<string>('')
  const [cardEditHistory, setCardEditHistory] = useState<any[]>([])
  const [cardReviseInput, setCardReviseInput] = useState('')
  const [cardSaving, setCardSaving] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeMode, setComposeMode] = useState<'manual' | 'draft'>('manual')
  const [composeText, setComposeText] = useState('')
  const [composeInstruction, setComposeInstruction] = useState('')
  const [composeSending, setComposeSending] = useState(false)
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [bugWhat, setBugWhat] = useState('')
  const [bugExpect, setBugExpect] = useState('')
  const [bugCopied, setBugCopied] = useState(false)
  const [bugSubmitting, setBugSubmitting] = useState(false)
  const [rejectingDraft, setRejectingDraft] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [sendConfirm, setSendConfirm] = useState<{draftId: string; guestName: string; property: string; channel: string; preview: string} | null>(null)
  const [sendChannel, setSendChannel] = useState<string>('')
  const [undoCountdown, setUndoCountdown] = useState<number>(0)
  const [undoDraftId, setUndoDraftId] = useState<string | null>(null)
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [staffNotes, setStaffNotes] = useState('')
  const [showDoneWarning, setShowDoneWarning] = useState(false)
  const [doneWarningCount, setDoneWarningCount] = useState(0)
  const notesTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sseRef = useRef<EventSource | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail' | 'info'>('list')
  const [isMuted, setIsMuted] = useState(false)
  const [showDraftHistory, setShowDraftHistory] = useState(false)
  const revisionInputRef = useRef<HTMLInputElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Init auth
  useEffect(() => {
    const t = getToken()
    if (t) setTokenState(t)
    const dn = localStorage.getItem('gms_display_name')
    if (dn) setDisplayName(dn)
    else setLoading(false)
    // Init mute state from localStorage
    const muted = localStorage.getItem('gms_muted')
    if (muted === 'true') setIsMuted(true)
  }, [])

  // Toggle mute handler
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      localStorage.setItem('gms_muted', String(next))
      return next
    })
  }, [])

  // Play notification chime using AudioContext (reused ref)
  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      document.removeEventListener('click', initAudio)
    }
    document.addEventListener('click', initAudio)
    return () => document.removeEventListener('click', initAudio)
  }, [])

  const handleLogin = (t: string) => {
    setToken(t)
    setTokenState(t)
    const dn = localStorage.getItem('gms_display_name')
    if (dn) setDisplayName(dn)
  }

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const data = await apiFetch('/api/conversations')
      setConversations(data.conversations || [])
    } catch (err: any) {
      if (err.message === 'Unauthorized') setTokenState(null)
    } finally { setLoading(false) }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch('/api/stats/inbox')
      setStats(data)
      // Fetch poller/system status
      try { const ps = await apiFetch('/api/import/poller-status'); setPollerStatus(ps) } catch {}
    } catch { }
  }, [])

  // Fetch conversation detail
  const fetchDetail = useCallback(async (convId: string) => {
    if (isEditingRef.current) return
    try {
      const data = await apiFetch(`/api/conversations/${convId}`)
      setDetail(data)
      // Mark read
      apiFetch(`/api/conversations/${convId}/read`, { method: 'POST' }).catch(() => { })
    } catch (err: any) {
      toast.error('Failed to load conversation')
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (!token) return
    fetchConversations()
    fetchStats()
  }, [token, fetchConversations, fetchStats])

  // SSE connection
  useEffect(() => {
    if (!token) return
    const es = new EventSource(`${API_BASE}/api/sse/inbox?token=${token}`)
    sseRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_message' || data.type === 'draft_ready' || data.type === 'message_sent' || data.type === 'pending_action_new') {
          fetchConversations()
          fetchStats()
          if (selectedConvId && (data.data?.conversationId === selectedConvId || data.data?.conversation_id === selectedConvId)) {
            if (!isEditingRef.current) {
              if (data.type === 'draft_ready' && revisionPending) {
                fetchDetail(selectedConvId)
                setRevisionPending(false)
              } else if (!revisionPending || data.type !== 'draft_ready') {
                fetchDetail(selectedConvId)
              }
            }
          }
          if (data.type === 'new_message') {
            toast.success('New message received')
            if (!isMuted) playChime()
          }
        }
      } catch { }
    }

    es.onerror = () => {
      console.log('[SSE] Connection error, reconnecting...')
    }

    return () => es.close()
  }, [token, selectedConvId, fetchConversations, fetchStats, fetchDetail, isMuted, playChime, revisionPending])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!token) return
    const iv = setInterval(() => { fetchConversations(); fetchStats() }, 30000)
    return () => clearInterval(iv)
  }, [token, fetchConversations, fetchStats])

  const selectConversation = (conv: Conversation) => {
    setSelectedConvId(conv.id); setMobileView('detail')
    fetchDetail(conv.id)
  }

  // Show confirmation modal before sending
  const requestApproval = (draftId: string) => {
    if (!detail) return
    const draft = detail.drafts.find(d => d.id === draftId)
    if (!draft) return
    // Smart channel default: conversation channel for OTA bookings, whatsapp for direct
    const convChannel = detail?.conversation.channel || ''
    if (convChannel === 'direct' || convChannel === 'manual' || convChannel === 'unknown') {
      setSendChannel('whatsapp')
    } else {
      setSendChannel(convChannel || 'airbnb')
    }
    setSendConfirm({
      draftId,
      guestName: detail.conversation.guest_name,
      property: detail.conversation.property_name || 'Unknown',
      channel: detail.conversation.channel || 'Unknown',
      preview: (draft.draft_body || '').substring(0, 100) + ((draft.draft_body || '').length > 100 ? '...' : ''),
    })
  }

  // Actual send after confirmation + undo countdown
  const executeSend = async (draftId: string) => {
    setSendConfirm(null)
    setUndoDraftId(draftId)
    setUndoCountdown(5)

    // Start countdown
    const interval = setInterval(() => {
      setUndoCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    undoIntervalRef.current = interval

    // Schedule actual send after 5 seconds
    const timer = setTimeout(async () => {
      setUndoDraftId(null)
      setUndoCountdown(0)
      try {
        await apiFetch('/api/drafts/' + draftId + '/approve', {
          method: 'POST',
          body: JSON.stringify({ reviewed_by: displayName, sent_via: sendChannel }),
        })
        toast.success('Draft approved and sent')
        if (selectedConvId) fetchDetail(selectedConvId)
        fetchConversations()
        fetchStats()
      } catch (err: any) {
        toast.error(err.message)
      }
    }, 5000)
    undoTimerRef.current = timer
  }

  // Cancel send during undo window
  const cancelSend = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current)
    setUndoDraftId(null)
    setUndoCountdown(0)
    toast.success('Send cancelled')
  }

  const handleDraftAction = async (draftId: string, action: 'approve' | 'reject', editedBody?: string) => {
    try {
      if (action === 'approve') {
        requestApproval(draftId)
        return
      } else {
        await apiFetch(`/api/drafts/${draftId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: 'Rejected by ' }),
        })
        toast.success('Draft rejected')
      }
      setEditingDraft(null)
      isEditingRef.current = false
      // For reject, refresh immediately. For approve, handled in executeSend.
      if (action === 'reject') {
        if (selectedConvId) fetchDetail(selectedConvId)
        fetchConversations()
        fetchStats()
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRevision = async (draftId: string, mode: 'standard' | 'teach' | 'one_time' = 'standard', tScope?: 'global' | 'property', tPropCode?: string) => {
    if (!revisionText.trim()) return
    setRevisingDraft(draftId)
    try {
      const body: any = { revision_instruction: revisionText.trim(), reviewed_by: displayName, mode }
      if (mode === 'teach') { body.teach_scope = tScope || 'global'; body.teach_property_code = tPropCode || null }
      await apiFetch(`/api/drafts/${draftId}/revise`, { method: 'POST', body: JSON.stringify(body) })
      const msgs: Record<string, string> = { standard: 'Revision requested — new draft coming...', teach: 'Revision + teaching saved 🧠', one_time: 'One-time revision requested...' }
      toast.success(msgs[mode])
      setRevisionText('')
      setShowTeachPrompt(null)
      setRevisionPending(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRevisingDraft(null)
    }
  }

  const fetchTeachings = async () => {
    try {
      const data = await apiFetch('/api/teachings')
      setTeachings(data.teachings || [])
    } catch {}
  }

  const fetchPropertyCard = async (code: string) => {
    setPropertyCard({ code, data: null, loading: true })
    setCardEditHistory([])
    try {
      const data = await apiFetch('/api/properties/' + encodeURIComponent(code) + '/card')
      setPropertyCard({ code, data, loading: false })
      // Load edit history
      try {
        const history = await apiFetch('/api/properties/' + encodeURIComponent(code) + '/card/history')
        setCardEditHistory(Array.isArray(history) ? history : [])
      } catch {}
    } catch {
      setPropertyCard({ code, data: { exists: false }, loading: false })
    }
  }

  const savePropertyCard = async () => {
    if (!propertyCard?.code || !cardEditData) return
    setCardSaving(true)
    try {
      const parsed = JSON.parse(cardEditData)
      await apiFetch('/api/properties/' + encodeURIComponent(propertyCard.code) + '/card', {
        method: 'PUT',
        body: JSON.stringify({ card: parsed, change_summary: 'Edited via dashboard' })
      })
      toast.success('Property card saved')
      setCardEditing(false)
      // Reload the card
      fetchPropertyCard(propertyCard.code)
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        toast.error('Invalid JSON — please fix syntax errors')
      } else {
        toast.error('Failed to save: ' + err.message)
      }
    } finally {
      setCardSaving(false)
    }
  }
  const handleCompose = async () => {
    if (!selectedConvId) return
    setComposeSending(true)
    try {
      if (composeMode === 'manual') {
        if (!composeText.trim()) { toast.error('Please write a message'); setComposeSending(false); return }
        await apiFetch(`/api/conversations/${selectedConvId}/compose`, {
          method: 'POST',
          body: JSON.stringify({ mode: 'manual', body: composeText.trim() })
        })
        toast.success('Draft created - review and approve to send')
        setComposeText('')
        setComposeOpen(false)
      } else {
        if (!composeInstruction.trim()) { toast.error('Please describe what to draft'); setComposeSending(false); return }
        await apiFetch(`/api/conversations/${selectedConvId}/compose`, {
          method: 'POST',
          body: JSON.stringify({ mode: 'draft', instruction: composeInstruction.trim() })
        })
        toast.success('Judith is drafting - will appear for review shortly')
        setComposeInstruction('')
        setComposeOpen(false)
      }
      // Refresh conversation detail to show new draft
      setTimeout(() => { if (selectedConvId) fetchDetail(selectedConvId) }, 2000)
    } catch (err: any) {
      toast.error('Compose failed: ' + err.message)
    } finally {
      setComposeSending(false)
    }
  }


  const handleRevokeTeaching = async (id: string) => {
    try {
      await apiFetch(`/api/teachings/${id}/revoke`, { method: 'PATCH', body: JSON.stringify({ revoked_by: displayName, revoke_reason: revokeReason }) })
      toast.success('Teaching revoked')
      setRevokeId(null)
      setRevokeReason('')
      fetchTeachings()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleAddTeaching = async () => {
    if (!newTeachingText.trim()) return
    try {
      await apiFetch('/api/teachings', { method: 'POST', body: JSON.stringify({ instruction: newTeachingText.trim(), scope: 'global', taught_by: displayName }) })
      toast.success('Teaching added 🧠')
      setNewTeachingText('')
      fetchTeachings()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleRejectWithReason = async (draftId: string) => {
    try {
      await apiFetch(`/api/drafts/${draftId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewed_by: displayName, rejection_reason: rejectReason.trim() || 'Rejected by ' }),
      })
      toast.success('Draft rejected')
      setRejectingDraft(null)
      setRejectReason('')
      if (selectedConvId) fetchDetail(selectedConvId)
      fetchConversations()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleNotesChange = (value: string, convId: string) => {
    setStaffNotes(value)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(async () => {
      try {
        await apiFetch(`/api/conversations/${convId}`, {
          method: 'PATCH',
          body: JSON.stringify({ notes: value }),
        })
      } catch { }
    }, 2000)
  }

  // Mark conversation as done (with pending action guard)
  const handleMarkDone = async (convId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'done' }),
      })
      const data = await res.json()
      if (res.status === 409 && data.error === 'pending_actions_exist') {
        setDoneWarningCount(data.pending_count)
        setShowDoneWarning(true)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      toast.success('Conversation marked as done')
      setDetail(prev => prev ? { ...prev, conversation: { ...prev.conversation, status: 'done' } } : null)
      fetchConversations()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Reopen conversation
  const handleReopen = async (convId: string) => {
    try {
      await apiFetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      })
      toast.success('Conversation reopened')
      setDetail(prev => prev ? { ...prev, conversation: { ...prev.conversation, status: 'active' } } : null)
      fetchConversations()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Mark conversation as unread
  const handleMarkUnread = async (convId: string, e?: React.MouseEvent) => {
    if (e) { e.stopPropagation(); e.preventDefault() }
    try {
      await apiFetch(`/api/conversations/${convId}/unread`, { method: 'POST' })
      toast.success('Marked as unread')
      fetchConversations()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Load staff notes when conversation changes
  useEffect(() => {
    if (detail?.conversation?.notes !== undefined) {
      setStaffNotes(detail.conversation.notes || '')
    }
  }, [detail?.conversation?.id])

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (activeTab === 'unread') return c.is_unread === true
    if (activeTab === 'review') return c.latest_draft_state === 'draft_ready'
    if (activeTab === 'open') return c.status === 'active' && c.latest_draft_state !== 'sent'
    if (activeTab === 'done') return c.status === 'done'
    return true
  })

  const unreadCount = conversations.filter(c => c.is_unread).length

  // Keyboard shortcuts
  useEffect(() => {
    if (!token) return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      
      // Cmd+Enter: approve & send current draft
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (detail?.drafts) {
          const readyDraft = [...detail.drafts].filter(d => ['draft_ready', 'under_review'].includes(d.state)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          if (readyDraft) requestApproval(readyDraft.id)
        }
        return
      }

      // Escape: deselect conversation or close help
      if (e.key === 'Escape') {
        if (showHelp) { setShowHelp(false); return }
        if (isInput) return
        setSelectedConvId(null)
        setDetail(null)
        return
      }

      // Skip other shortcuts when in input
      if (isInput) return

      // /: focus revision input
      if (e.key === '/') {
        e.preventDefault()
        const el = document.querySelector('.revision-input') as HTMLInputElement
        if (el) el.focus()
        return
      }

      // Arrow up/down: navigate conversations
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const list = filteredConversations
        if (list.length === 0) return
        const currentIdx = selectedConvId ? list.findIndex(c => c.id === selectedConvId) : -1
        let nextIdx: number
        if (e.key === 'ArrowUp') {
          nextIdx = currentIdx <= 0 ? list.length - 1 : currentIdx - 1
        } else {
          nextIdx = currentIdx >= list.length - 1 ? 0 : currentIdx + 1
        }
        selectConversation(list[nextIdx])
        return
      }

      // Enter: open selected conversation (already selected via arrows)
      if (e.key === 'Enter' && selectedConvId) {
        // Already open, no-op needed
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [token, selectedConvId, detail, filteredConversations, showHelp])

  const statusBadge = (conv: Conversation) => {
    if (conv.status === 'done') return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(255,255,255,0.06)', color: '#64748b'}}>Done</span>
    if (conv.latest_draft_state === 'draft_ready') return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>Review</span>
    if (conv.latest_draft_state === 'sent') return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>Sent</span>
    return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>Open</span>
  }

  const channelBadge = (ch?: string) => {
    if (!ch) return null
    const channels: Record<string, { label: string; bg: string; color: string }> = {
      airbnb: { label: 'Airbnb', bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
      airbnb2: { label: 'Airbnb', bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
      airbnb_v2: { label: 'Airbnb', bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
      booking: { label: 'Booking', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
      'booking.com': { label: 'Booking', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
      bookingcom: { label: 'Booking', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
      direct: { label: 'Direct', bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
      manual: { label: 'Direct', bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
      website: { label: 'Direct', bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
      whatsapp: { label: 'WhatsApp', bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
      email: { label: 'Email', bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
      vrbo: { label: 'Vrbo', bg: 'rgba(14,165,233,0.15)', color: '#38bdf8' },
    }
    // Show raw value for unknown channels instead of 'Other'
    const c = channels[ch.toLowerCase()] || { label: ch.charAt(0).toUpperCase() + ch.slice(1), bg: 'rgba(255,255,255,0.08)', color: '#94a3b8' }
    return <span className="px-1.5 py-0.5 rounded-full" style={{background: c.bg, color: c.color, fontSize: '10px', fontWeight: 500}}>{c.label}</span>
  }

  const draftStateBadge = (state?: string) => {
    if (!state) return null
    const m: Record<string, { bg: string; text: string; label: string }> = {
      draft_ready: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Needs Review' },
      under_review: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff', label: 'Under Review' },
      approved: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Approved' },
      sending: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff', label: 'Sending...' },
      sent: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Sent' },
      rejected: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', label: 'Rejected' },
      send_failed: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', label: 'Send Failed' },
      send_queued: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: '⏳ Queued' },
      generation_failed: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', label: 'Gen Failed' },
    }
    const s = m[state]
    if (!s) return <span className="text-xs" style={{color: '#64748b'}}>{state}</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: s.bg, color: s.text}}>{s.label}</span>
  }

  const rtColor = (mins?: number) => {
    if (!mins && mins !== 0) return '#64748b'
    if (mins <= 15) return '#4ade80'
    if (mins <= 60) return '#fbbf24'
    return '#f87171'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#0d1117'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{borderBottom: '2px solid #6395ff'}}></div>
          <p className="mt-4" style={{color: '#64748b'}}>Loading Friday GMS...</p>
        </div>
      </div>
    )
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="min-h-screen" style={{background: '#0d1117', color: '#f1f5f9'}}>
      <Toaster position="top-right" />
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />

      
      {/* Teachings panel */}
      {showTeachingsPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" style={{background: 'rgba(0,0,0,0.4)'}} onClick={() => setShowTeachingsPanel(false)} />
          <div className="w-[480px] h-full overflow-y-auto custom-scrollbar" style={{background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.08)'}}>
            <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🧠 Teachings</h2>
                <button onClick={() => setShowTeachingsPanel(false)} className="text-sm" style={{color: '#64748b'}}>✕</button>
              </div>
              <p className="text-xs mt-1" style={{color: '#64748b'}}>Instructions Judith has learned from revisions</p>
            </div>

            {/* Add new teaching */}
            <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
              <div className="flex space-x-2">
                <input type="text" value={newTeachingText} onChange={e => setNewTeachingText(e.target.value)}
                  placeholder="Add a teaching..."
                  className="flex-1 text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTeaching() }} />
                <button onClick={handleAddTeaching} disabled={!newTeachingText.trim()}
                  className="px-3 py-1.5 text-xs rounded disabled:opacity-50" style={{background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)'}}>
                  Add
                </button>
              </div>
            </div>

            {/* Active teachings */}
            <div className="p-4">
              <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Active</h3>
              {teachings.filter(t => t.status === 'active').length === 0 && (
                <p className="text-xs" style={{color: '#64748b'}}>No active teachings yet. Teachings are created from revision patterns or manually.</p>
              )}
              {teachings.filter(t => t.status === 'active').map(t => (
                <div key={t.id} className="p-3 rounded-lg mb-2" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                  <p className="text-sm" style={{color: '#e2e8f0'}}>{t.instruction}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{background: t.scope === 'global' ? 'rgba(99,149,255,0.15)' : 'rgba(245,158,11,0.15)', color: t.scope === 'global' ? '#6395ff' : '#fbbf24'}}>
                        {t.scope === 'global' ? '🌐 Global' : `📍 ${t.property_code}`}
                      </span>
                      <span className="text-xs" style={{color: '#64748b'}}>
                        {t.source === 'auto_pattern' ? '🔄 Auto' : t.source === 'manual' ? '✏️ Manual' : '💬 Direct'}
                      </span>
                      <span className="text-xs" style={{color: '#64748b'}}>
                        {t.taught_by ? `Taught by ${t.taught_by}` : 'Taught by Unknown'}{t.taught_at ? ` · ${format(new Date(t.taught_at), 'MMM d, yyyy')}` : ''}
                      </span>
                    </div>
                    {revokeId === t.id ? (
                      <div className="flex items-center space-x-1">
                        <input type="text" value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                          placeholder="Why?" className="text-xs rounded px-1.5 py-0.5 w-32 outline-none"
                          style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                          onKeyDown={e => { if (e.key === 'Enter') handleRevokeTeaching(t.id) }} />
                        <button onClick={() => handleRevokeTeaching(t.id)} className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171'}}>OK</button>
                        <button onClick={() => setRevokeId(null)} className="text-xs" style={{color: '#64748b'}}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setRevokeId(t.id)} className="text-xs" style={{color: '#f87171'}}>Revoke</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Revoked teachings */}
            {teachings.filter(t => t.status === 'revoked').length > 0 && (
              <div className="p-4" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
                <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Revoked</h3>
                {teachings.filter(t => t.status === 'revoked').map(t => (
                  <div key={t.id} className="p-3 rounded-lg mb-2 opacity-50" style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)'}}>
                    <p className="text-sm line-through" style={{color: '#64748b'}}>{t.instruction}</p>
                    <p className="text-xs mt-1" style={{color: '#475569'}}>{t.taught_by ? `Taught by ${t.taught_by}` : ''}{t.revoked_by ? ` · Revoked by ${t.revoked_by}` : ''}</p>
                    {t.revoke_reason && <p className="text-xs mt-1" style={{color: '#f87171'}}>Reason: {t.revoke_reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property card popup */}
      {propertyCard && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => { setPropertyCard(null); setCardEditing(false); }}>
          <div className="rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[85vh] overflow-y-auto" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>
                <HomeIcon className="h-5 w-5 inline mr-2" style={{color: '#6395ff'}} />
                {propertyCard.code}
              </h3>
              <div className="flex items-center gap-2">
                {propertyCard.data?.exists && !cardEditing && (
                  <button onClick={() => { setCardEditing(true); setCardEditData(JSON.stringify(propertyCard.data.card, null, 2)); }} className="px-3 py-1 rounded-lg text-xs font-medium" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Edit</button>
                )}
                {cardEditing && (
                  <>
                    <button onClick={() => setCardEditing(false)} className="px-3 py-1 rounded-lg text-xs" style={{color: '#94a3b8'}}>Cancel</button>
                    <button onClick={savePropertyCard} disabled={cardSaving} className="px-3 py-1 rounded-lg text-xs font-medium" style={{background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)'}}>{cardSaving ? 'Saving...' : 'Save'}</button>
                  </>
                )}
                <button onClick={() => { setPropertyCard(null); setCardEditing(false); }} className="text-sm" style={{color: '#64748b'}}>\u2715</button>
              </div>
            </div>
            {propertyCard.loading ? (
              <p className="text-sm" style={{color: '#94a3b8'}}>Loading property card...</p>
            ) : cardEditing ? (
              <div className="space-y-3">
                {(() => { try { return Object.entries(JSON.parse(cardEditData) || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-xs font-medium block mb-1" style={{color: '#94a3b8', textTransform: 'capitalize'}}>{key.replace(/_/g, ' ')}</label>
                    {typeof value === 'string' ? (
                      <input type="text" value={value as string} onChange={e => {
                        const parsed = JSON.parse(cardEditData);
                        parsed[key] = e.target.value;
                        setCardEditData(JSON.stringify(parsed, null, 2));
                      }} className="w-full text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                    ) : typeof value === 'object' && value !== null ? (
                      <textarea value={JSON.stringify(value, null, 2)} onChange={e => {
                        try {
                          const parsed = JSON.parse(cardEditData);
                          parsed[key] = JSON.parse(e.target.value);
                          setCardEditData(JSON.stringify(parsed, null, 2));
                        } catch {}
                      }} onKeyDown={e => e.stopPropagation()} className="w-full text-xs font-mono rounded px-2 py-1.5 outline-none" rows={4} style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', resize: 'vertical'}} />
                    ) : (
                      <input type="text" value={String(value)} onChange={e => {
                        const parsed = JSON.parse(cardEditData);
                        const num = Number(e.target.value);
                        parsed[key] = !isNaN(num) && e.target.value.trim() !== '' ? num : e.target.value;
                        setCardEditData(JSON.stringify(parsed, null, 2));
                      }} className="w-full text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                    )}
                  </div>
                )); } catch { return null; } })()}
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer" style={{color: '#64748b'}}>Advanced: Raw JSON</summary>
                  <textarea
                    value={cardEditData}
                    onChange={e => setCardEditData(e.target.value)}
                    onKeyDown={e => e.stopPropagation()}
                    className="w-full rounded-lg p-3 text-xs font-mono mt-2"
                    style={{background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', minHeight: '200px', resize: 'vertical'}}
                    spellCheck={false}
                  />
                </details>
                <p className="text-xs" style={{color: '#64748b'}}>Edit property details above. Nested sections show as JSON for complex fields.</p>
              </div>
            ) : propertyCard.data?.exists && propertyCard.data?.card ? (
              <div className="space-y-4">
                {(() => {
                  const c = propertyCard.data.card;
                  const copyBtn = (text: string, label?: string) => (
                    <button onClick={() => { navigator.clipboard.writeText(text); toast.success((label || 'Copied') + ' copied!') }}
                      className="ml-1.5 px-1.5 py-0.5 rounded text-xs flex-shrink-0" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                      Copy
                    </button>
                  );
                  const section = (title: string, children: any) => (
                    <div>
                      <div className="text-xs font-semibold uppercase mb-1.5 pb-1" style={{color: '#6395ff', letterSpacing: '0.5px', borderBottom: '1px solid rgba(99,149,255,0.15)'}}>{title}</div>
                      <div className="space-y-1">{children}</div>
                    </div>
                  );
                  const row = (label: string, value: any) => value ? (
                    <div className="flex items-start text-sm"><span className="flex-shrink-0" style={{color: '#64748b', minWidth: '100px'}}>{label}:</span><span style={{color: '#e2e8f0'}}>{String(value)}</span></div>
                  ) : null;

                  return (<>
                    {section('Property Overview', <>
                      {c.full_name && <div className="text-sm font-medium mb-1" style={{color: '#f1f5f9'}}>{c.full_name}</div>}
                      {row('Location', c.location)}
                      {row('Type', c.property_type)}
                      {row('Bedrooms', c.bedrooms)}
                      {row('Bathrooms', c.bathrooms)}
                      {row('Capacity', c.guest_capacity ? `${c.guest_capacity} guests` : null)}
                    </>)}

                    {c.quick_responses && section('Access & WiFi', <>
                      {c.quick_responses.wifi && (
                        <div className="p-2 rounded-lg" style={{background: 'rgba(255,255,255,0.04)'}}>
                          <div className="flex items-center text-sm gap-2">
                            <span style={{color: '#64748b', flexShrink: 0}}>WiFi:</span>
                            <span className="font-mono text-xs" style={{color: '#22c55e'}}>{c.quick_responses.wifi.response}</span>
                            {copyBtn(c.quick_responses.wifi.response, 'WiFi info')}
                          </div>
                        </div>
                      )}
                      {c.quick_responses.access && (
                        <div className="p-2 rounded-lg" style={{background: 'rgba(255,255,255,0.04)'}}>
                          <div className="flex items-center text-sm gap-2">
                            <span style={{color: '#64748b', flexShrink: 0}}>Access:</span>
                            <span className="font-mono text-xs" style={{color: '#fbbf24'}}>{c.quick_responses.access.response}</span>
                            {copyBtn(c.quick_responses.access.response, 'Access codes')}
                          </div>
                        </div>
                      )}
                    </>)}

                    {c.property_details && section('Check-in / Check-out', <>
                      {row('Check-in', c.property_details.check_in_time)}
                      {row('Check-out', c.property_details.check_out_time)}
                      {c.quick_responses?.checkout && (
                        <div className="text-xs mt-1 p-2 rounded" style={{background: 'rgba(255,255,255,0.03)', color: '#94a3b8'}}>
                          {c.quick_responses.checkout.response}
                        </div>
                      )}
                    </>)}

                    {c.quick_responses && section('Quick Responses', <>
                      {Object.entries(c.quick_responses as Record<string, any>).filter(([k]) => !['wifi', 'access', 'checkout'].includes(k)).map(([key, qr]: [string, any]) => (
                        <div key={key} className="p-2 rounded-lg" style={{background: 'rgba(255,255,255,0.03)'}}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase" style={{color: '#94a3b8'}}>{key.replace(/_/g, ' ')}</span>
                            {copyBtn(qr.response, key)}
                          </div>
                          <div className="text-xs mt-1" style={{color: '#e2e8f0'}}>{qr.response}</div>
                        </div>
                      ))}
                    </>)}

                    {c.common_issues && c.common_issues.length > 0 && section('Common Issues', <>
                      {(c.common_issues as string[]).map((issue: string, i: number) => (
                        <div key={i} className="text-sm flex items-start gap-2" style={{color: '#e2e8f0'}}>
                          <span style={{color: '#f59e0b'}}>{'•'}</span><span>{issue}</span>
                        </div>
                      ))}
                    </>)}

                    {c.building_intelligence && section('Building Intelligence', <>
                      {c.building_intelligence.building_notes && row('Notes', c.building_intelligence.building_notes)}
                      {c.building_intelligence.area_info && row('Area', c.building_intelligence.area_info)}
                      {c.building_intelligence.common_questions && c.building_intelligence.common_questions.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs" style={{color: '#64748b'}}>Common questions:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(c.building_intelligence.common_questions as string[]).map((q: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{q}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {c.building_intelligence.things_to_avoid && c.building_intelligence.things_to_avoid.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs" style={{color: '#ef4444'}}>Things to avoid:</span>
                          {(c.building_intelligence.things_to_avoid as string[]).map((t: string, i: number) => (
                            <div key={i} className="text-xs mt-0.5" style={{color: '#f87171'}}>{'•'} {t}</div>
                          ))}
                        </div>
                      )}
                    </>)}

                    {c.general_intelligence && section('Operational Intelligence', <>
                      {c.general_intelligence.common_pain_points && c.general_intelligence.common_pain_points.length > 0 && (
                        <div>
                          <span className="text-xs" style={{color: '#64748b'}}>Common pain points:</span>
                          {(c.general_intelligence.common_pain_points as string[]).map((p: string, i: number) => (
                            <div key={i} className="text-xs mt-0.5" style={{color: '#e2e8f0'}}>{'•'} {p}</div>
                          ))}
                        </div>
                      )}
                      {c.general_intelligence.successful_patterns && c.general_intelligence.successful_patterns.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs" style={{color: '#64748b'}}>What works well:</span>
                          {(c.general_intelligence.successful_patterns as string[]).map((p: string, i: number) => (
                            <div key={i} className="text-xs mt-0.5" style={{color: '#22c55e'}}>{'✓'} {p}</div>
                          ))}
                        </div>
                      )}
                      {c.general_intelligence.services_to_mention && c.general_intelligence.services_to_mention.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs" style={{color: '#64748b'}}>Services to mention:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(c.general_intelligence.services_to_mention as string[]).map((s: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{background: 'rgba(34,197,94,0.1)', color: '#4ade80'}}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>)}

                    {c.property_details && section('Property Details', <>
                      {row('Address', c.property_details.address)}
                      {c.property_details.parking && <div className="text-xs mt-1" style={{color: '#94a3b8'}}><span style={{color: '#64748b'}}>Parking: </span>{typeof c.property_details.parking === 'string' ? c.property_details.parking : JSON.stringify(c.property_details.parking)}</div>}
                      {c.property_details.amenities && (
                        <div className="mt-1">
                          <span className="text-xs" style={{color: '#64748b'}}>Amenities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(Array.isArray(c.property_details.amenities) ? c.property_details.amenities : [c.property_details.amenities]).slice(0, 15).map((a: string, i: number) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(255,255,255,0.05)', color: '#94a3b8'}}>{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>)}

                    {c.emergency_contact && section('Emergency', <>
                      <div className="flex items-center text-sm gap-2">
                        <span style={{color: '#64748b'}}>Contact:</span>
                        <span className="font-mono" style={{color: '#ef4444'}}>{c.emergency_contact}</span>
                        {copyBtn(c.emergency_contact, 'Emergency number')}
                      </div>
                    </>)}
                  </>);
                })()}
                {cardEditHistory.length > 0 && (
                  <div className="mt-4 pt-3" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
                    <div className="text-xs font-semibold uppercase mb-2" style={{color: '#64748b'}}>Edit History</div>
                    {cardEditHistory.slice(0, 5).map((edit: any, i: number) => (
                      <div key={i} className="text-xs mb-1" style={{color: '#94a3b8'}}>
                        {edit.change_summary} — {edit.edited_by} \u00b7 {new Date(edit.edited_at).toLocaleDateString('en-MU', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs" style={{color: '#64748b'}}>No knowledge card on file.</p>
                {detail && detail.conversation.property_name === propertyCard.code && (
                  <div className="space-y-2 text-sm" style={{color: '#e2e8f0'}}>
                    {detail.conversation.check_in_date && <div><span style={{color: '#64748b'}}>Check-in:</span> {detail.conversation.check_in_date}</div>}
                    {detail.conversation.check_out_date && <div><span style={{color: '#64748b'}}>Check-out:</span> {detail.conversation.check_out_date}</div>}
                    {detail.conversation.num_guests && <div><span style={{color: '#64748b'}}>Guests:</span> {detail.conversation.num_guests}</div>}
                    {detail.conversation.channel && <div><span style={{color: '#64748b'}}>Channel:</span> {detail.conversation.channel}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating bug report button */}
      <button
        onClick={() => { setBugReportOpen(true); setBugWhat(''); setBugExpect(''); setBugCopied(false); }}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{background: 'rgba(99,149,255,0.15)', border: '1px solid rgba(99,149,255,0.3)', color: '#6395ff', fontSize: '18px'}}
        title="Report a bug"
      >🐛</button>

      {/* Bug report modal */}
      {bugReportOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => setBugReportOpen(false)}>
          <div className="rounded-xl p-6 max-w-md mx-4 w-full" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🐛 Report a Bug</h3>
              <button onClick={() => setBugReportOpen(false)} className="text-sm" style={{color: '#64748b'}}>\u2715</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>What happened? *</label>
                <input type="text" value={bugWhat} onChange={e => setBugWhat(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoComplete="off"
                  placeholder="e.g. Draft didn't generate for new message"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>What did you expect? (optional)</label>
                <input type="text" value={bugExpect} onChange={e => setBugExpect(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoComplete="off"
                  placeholder="e.g. A draft should have appeared in the review panel"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}} />
              </div>
              <div style={{display: bugWhat.length > 0 ? 'block' : 'none'}}>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>Bug Report (copy and paste in #fr-gms-feedback)</label>
                  <textarea readOnly value={[
                    '🐛 BUG REPORT',
                    '─'.repeat(30),
                    'What happened: ' + bugWhat,
                    bugExpect ? 'Expected: ' + bugExpect : '',
                    '─'.repeat(30),
                    'Page: ' + (typeof window !== 'undefined' ? window.location.href : 'unknown'),
                    'User: ' + (displayName || 'unknown'),
                    'Conversation: ' + (selectedConvId || 'none'),
                    'Time: ' + new Date().toISOString(),
                    'Browser: ' + (typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown'),
                  ].filter(Boolean).join('\n')}
                    className="w-full text-xs font-mono rounded-lg p-3" rows={8}
                    style={{background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', resize: 'none'}} />
                  <button onClick={() => {
                    const report = [
                      '🐛 BUG REPORT',
                      '─'.repeat(30),
                      'What happened: ' + bugWhat,
                      bugExpect ? 'Expected: ' + bugExpect : '',
                      '─'.repeat(30),
                      'Page: ' + (typeof window !== 'undefined' ? window.location.href : 'unknown'),
                      'User: ' + (displayName || 'unknown'),
                      'Conversation: ' + (selectedConvId || 'none'),
                      'Time: ' + new Date().toISOString(),
                      'Browser: ' + (typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown'),
                    ].filter(Boolean).join('\n');
                    navigator.clipboard.writeText(report);
                    setBugCopied(true);
                    setTimeout(() => setBugCopied(false), 2000);
                  }} className="mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{background: bugCopied ? 'rgba(34,197,94,0.2)' : 'rgba(99,149,255,0.15)', color: bugCopied ? '#22c55e' : '#6395ff', border: bugCopied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(99,149,255,0.3)'}}>
                    {bugCopied ? '\u2705 Copied! Paste in #fr-gms-feedback' : '📋 Copy to clipboard'}
                  </button>
                  <button disabled={bugSubmitting} onClick={async () => {
                    setBugSubmitting(true);
                    try {
                      await apiFetch('/api/bug-reports', {
                        method: 'POST',
                        body: JSON.stringify({
                          what: bugWhat,
                          expected: bugExpect || null,
                          page: typeof window !== 'undefined' ? window.location.href : 'unknown',
                          conversation_id: selectedConvId || null,
                          browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown',
                        })
                      });
                      toast.success('Bug report sent \u2014 Ishant has been notified');
                      setBugReportOpen(false);
                    } catch (err: any) {
                      toast.error('Failed to submit: ' + err.message);
                    } finally {
                      setBugSubmitting(false);
                    }
                  }} className="mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)', opacity: bugSubmitting ? 0.5 : 1}}>
                    {bugSubmitting ? 'Sending...' : '\ud83d\udce8 Submit & Notify Ishant'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send confirmation modal */}
      {sendConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}>
          <div className="rounded-xl p-6 max-w-md mx-4" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center mb-3">
              <PaperAirplaneIcon className="h-6 w-6 mr-2" style={{color: '#4ade80'}} />
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>Confirm Send</h3>
            </div>
            <p className="text-sm mb-3" style={{color: '#94a3b8'}}>
              Send this reply to <strong style={{color: '#f1f5f9'}}>{sendConfirm.guestName}</strong> at <strong style={{color: '#f1f5f9'}}>{sendConfirm.property}</strong>?
            </p>
            <div className="mb-3">
              <label className="text-xs font-medium block mb-1" style={{color: '#64748b'}}>Send via:</label>
              <select value={sendChannel} onChange={e => setSendChannel(e.target.value)}
                className="w-full text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}>
                <option value="airbnb" style={{background: '#1a1a2e'}}>Airbnb</option>
                <option value="booking" style={{background: '#1a1a2e'}}>Booking.com</option>
                <option value="whatsapp" style={{background: '#1a1a2e'}}>WhatsApp</option>
                <option value="email" style={{background: '#1a1a2e'}}>Email</option>
                <option value="direct" style={{background: '#1a1a2e'}}>Direct</option>
              </select>
              {sendChannel === 'booking' && <p className="text-xs mt-1" style={{color: '#64748b'}}>Booking.com messages delivered via Guesty email integration</p>}
              {sendChannel === 'direct' && <p className="text-xs mt-1" style={{color: '#64748b'}}>Direct booking guests receive message via email</p>}
            </div>
            <div className="p-2 rounded text-xs mb-4" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0'}}>
              {sendConfirm.preview}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => executeSend(sendConfirm.draftId)}
                className="flex-1 px-3 py-2 text-sm rounded-lg font-medium" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                Confirm Send
              </button>
              <button onClick={() => setSendConfirm(null)}
                className="flex-1 px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo send countdown bar */}
      {undoDraftId && undoCountdown > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl flex items-center space-x-4" style={{background: 'rgba(15,25,50,0.95)', border: '1px solid rgba(245,158,11,0.3)', backdropFilter: 'blur(12px)'}}>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3" style={{background: 'rgba(245,158,11,0.2)', color: '#fbbf24'}}>{undoCountdown}</div>
            <span className="text-sm" style={{color: '#f1f5f9'}}>Sending in {undoCountdown}s...</span>
          </div>
          <button onClick={cancelSend}
            className="px-4 py-1.5 text-sm rounded-lg font-medium" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>
            Undo
          </button>
        </div>
      )}

      {/* Header */}
      <header style={{background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{color: '#f1f5f9'}}>Friday GMS</h1>
              <p className="text-xs" style={{color: '#64748b'}}>Guest Messaging System</p>
            </div>

            {stats && (
              <div className="flex space-x-5 items-center flex-wrap gap-y-1">
                <div className="text-center">
                  <div className="text-lg font-bold" style={{color: '#fbbf24'}}>{stats.needs_review_count}</div>
                  <div className="text-xs" style={{color: '#64748b'}}>to review</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{color: stats.avg_response_time_minutes != null ? rtColor(stats.avg_response_time_minutes) : '#64748b'}}>
                    {stats.avg_response_time_minutes != null ? `${stats.avg_response_time_minutes} min` : '—'}
                  </div>
                  <div className="text-xs" style={{color: '#64748b'}}>avg response</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{color: '#6395ff'}}>{stats.messages_today}</div>
                  <div className="text-xs" style={{color: '#64748b'}}>new today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{color: stats.overdue_actions_count > 0 ? '#f87171' : stats.pending_actions_count > 0 ? '#fbbf24' : '#4ade80'}}>
                    {stats.pending_actions_count}
                  </div>
                  <div className="text-xs" style={{color: '#64748b'}}>
                    {stats.pending_actions_count === 1 ? 'action' : 'actions'} {stats.overdue_actions_count > 0 && <span style={{color: '#f87171'}}>({stats.overdue_actions_count} overdue)</span>}
                  </div>
                </div>
                {pollerStatus && pollerStatus.api_down && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}} title="Guesty API is down — messages queued for browser fallback">⚠ API Down</span>
                )}
                {pollerStatus && pollerStatus.send_queue_length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(251,191,36,0.15)', color: '#fbbf24'}} title={`${pollerStatus.send_queue_length} message(s) queued for sending`}>📤 {pollerStatus.send_queue_length} queued</span>
                )}
                <button onClick={() => { clearToken(); setTokenState(null) }}
                  className="text-xs ml-4" style={{color: '#64748b'}}>{displayName} · Logout</button>
                <button onClick={toggleMute} className="ml-2 p-1 rounded" style={{color: '#64748b'}} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                </button>
                <button onClick={() => { setShowTeachingsPanel(!showTeachingsPanel); if (!showTeachingsPanel) fetchTeachings() }} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(168,85,247,0.1)', color: '#c084fc'}} title="Teachings">🧠</button><button onClick={() => setShowHelp(true)} className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>?</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)] relative">
        {/* Left sidebar - conversation list */}
        <div className={`w-80 flex flex-col ${mobileView !== 'list' ? 'hidden md:flex' : 'w-full md:w-80'}`} style={{background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'}}>
          {/* Tabs */}
          <div className="flex text-xs tabs-scroll" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
            {([
              ['all', 'All'],
              ['unread', 'Unread'],
              ['review', 'Review'],
              ['open', 'Open'],
              ['done', 'Done'],
              ['actions', 'Actions'],
            ] as [string, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className="flex-1 py-2 text-center transition-all duration-200 ease-in-out hover:bg-white/5" style={{borderBottom: activeTab === key ? '2px solid #6395ff' : '2px solid transparent', color: activeTab === key ? '#6395ff' : '#64748b', fontWeight: activeTab === key ? 500 : 400}}>
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{background: '#3b82f6', color: 'white'}}>{unreadCount}</span>
                )}
                {key === 'actions' && stats && stats.pending_actions_count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{background: stats.overdue_actions_count > 0 ? '#ef4444' : 'rgba(245,158,11,0.15)', color: stats.overdue_actions_count > 0 ? 'white' : '#fbbf24'}}>
                    {stats.pending_actions_count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'actions' ? (
            <PendingActionsTab token={token} />
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center" style={{color: '#64748b'}}>
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2" style={{color: '#334155'}} />
                  <p>No conversations</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div key={conv.id} onClick={() => selectConversation(conv)}
                    className="group relative p-3 cursor-pointer transition-all duration-200 ease-in-out" style={{borderBottom: '1px solid rgba(255,255,255,0.03)', background: selectedConvId === conv.id ? 'linear-gradient(90deg, rgba(30,58,95,0.4), transparent)' : 'transparent', borderLeft: selectedConvId === conv.id ? '2px solid #6395ff' : '2px solid transparent', fontWeight: conv.is_unread ? 600 : 400}}>
                    {/* Hover action: mark as unread */}
                    {!conv.is_unread && (
                      <button onClick={(e) => handleMarkUnread(conv.id, e)}
                        title="Mark as unread"
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full z-10" style={{background: 'rgba(255,255,255,0.06)'}}>
                        <EyeSlashIcon className="h-3.5 w-3.5" style={{color: '#64748b'}} />
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {conv.is_unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                        <span className="text-sm truncate" style={{color: '#f1f5f9'}}>{conv.guest_name}</span>
                        {conv.sentiment && conv.sentiment !== 'neutral' && (
                          <span title={conv.sentiment === 'upset' ? 'Guest is upset' : conv.sentiment === 'frustrated' ? 'Guest seems frustrated' : conv.sentiment === 'positive' ? 'Positive sentiment' : conv.sentiment} className="flex-shrink-0 inline-block w-2 h-2 rounded-full" style={{marginLeft: '4px', backgroundColor: conv.sentiment === 'upset' ? '#ef4444' : conv.sentiment === 'frustrated' ? '#f59e0b' : conv.sentiment === 'positive' ? '#22c55e' : '#64748b'}} />
                        )}
                        {conv.channel && channelBadge(conv.channel)}
                      </div>
                      {conv.last_message_at && (
                        <span className="text-xs flex-shrink-0 ml-1" style={{color: '#64748b'}}>
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 mb-1">
                      {conv.property_name && (
                        <span className="text-xs" style={{color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px'}} onClick={(e) => { e.stopPropagation(); fetchPropertyCard(conv.property_name); }}>{conv.property_name}</span>
                      )}
                      {statusBadge(conv)}
                      {conv.latest_draft_confidence && (() => {
                        const c = Number(conv.latest_draft_confidence)
                        const cbg = c >= 80 ? 'rgba(34,197,94,0.15)' : c >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
                        const cclr = c >= 80 ? '#4ade80' : c >= 60 ? '#fbbf24' : '#f87171'
                        return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: cbg, color: cclr}}>{c}%</span>
                      })()}
                    </div>
                    {conv.last_message_body && (
                      <p className="text-xs truncate" style={{color: '#64748b'}}>
                        {conv.last_message_direction === 'outbound' ? '> ' : ''}{conv.last_message_body}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 flex">
          {selectedConvId && detail ? (
            <>
              {/* Center - messages + drafts */}
              <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : ''}`}>
                {/* Mobile back button */}
                <div className="mobile-only mobile-nav-back" onClick={() => setMobileView('list')} style={{justifyContent: 'space-between'}}>
                  <span>\u2190 Back to inbox</span>
                  <button onClick={(e) => { e.stopPropagation(); setMobileView('info'); }} className="px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>Info</button>
                  <button onClick={(e) => { e.stopPropagation(); setMobileView('info'); }} className="ml-auto px-2 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>\u2139\uFE0F Info</button>
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
                    <p className="text-xs mt-2 p-2 rounded" style={{color: '#94a3b8', background: 'rgba(255,255,255,0.03)'}}>{detail.conversation.conversation_summary}</p>
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
                        <span><span className="mr-1.5">⏳</span> Queued — Guesty API unavailable. Will retry automatically.</span>
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
                  })()}                </div>

                {/* Responded indicator */}
                {detail.messages.length > 0 && 
                 detail.messages[detail.messages.length - 1].direction === 'outbound' && 
                 detail.drafts.filter(d => ['draft_ready', 'under_review'].includes(d.state)).length === 0 && (
                  <div className="flex-shrink-0 px-4 py-2 text-center" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
                    <span className="text-xs" style={{color: '#4ade80'}}>✓ Responded</span>
                  </div>
                )}

                {/* Compose button */}
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

                {/* Handled indicator */}
                {detail.messages.length > 0 && 
                 detail.messages[detail.messages.length - 1].direction === 'outbound' && 
                 detail.drafts.filter(d => ['draft_ready', 'under_review'].includes(d.state)).length === 0 && (
                  <div className="flex-shrink-0 px-4 py-2 text-center" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
                    <span className="text-xs" style={{color: '#4ade80'}}>✓ Responded</span>
                  </div>
                )}

                {/* Draft review section - pinned to bottom */}
                {revisionPending ? (
                  <div className="rounded-lg p-4 mx-4 mb-2 flex-shrink-0" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)'}}>
                    <div className="flex items-center space-x-2">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" style={{color: '#6395ff'}} />
                      <span className="text-sm" style={{color: '#94a3b8'}}>Judith is revising...</span>
                    </div>
                  </div>
                ) : detail.drafts.filter(d => ['draft_ready', 'under_review'].includes(d.state)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 1).map(draft => (
                    <div key={draft.id} className="rounded-lg p-4 mx-4 mb-2 flex-shrink-0" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)', borderTop: '1px solid rgba(255,255,255,0.06)'}}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium flex items-center" style={{color: '#94a3b8'}}>
                          <GlobeAltIcon className="h-4 w-4 mr-1.5" /> AI Draft
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
                            <button onClick={() => { handleDraftAction(draft.id, 'approve', editBody) }}
                              className="px-3 py-1.5 text-sm rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>Save and Send</button>
                            <button onClick={() => { setEditingDraft(null); isEditingRef.current = false }}
                              className="px-3 py-1.5 text-sm rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="max-h-[30vh] overflow-y-auto custom-scrollbar">
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
                            <button onClick={() => requestApproval(draft.id)}
                              className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" /> Approve & Send
                            </button>
                            <button onClick={() => { setEditingDraft(draft.id); isEditingRef.current = true; setEditBody(draft.draft_body) }}
                              className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                              <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                            </button>
                            <button onClick={() => { setRejectingDraft(rejectingDraft === draft.id ? null : draft.id); setRejectReason('') }}
                              className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'}}>
                              <XMarkIcon className="h-4 w-4 mr-1" /> Reject
                            </button>
                          </div>

                          {/* Rejection reason */}
                          {rejectingDraft === draft.id && (
                            <div className="mt-2 space-y-2">
                              <div className="flex space-x-2">
                                <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                  placeholder="Why? (optional — helps Judith learn)"
                                  className="flex-1 text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                                  onKeyDown={e => { if (e.key === 'Enter') handleRejectWithReason(draft.id) }} />
                                <button onClick={() => handleRejectWithReason(draft.id)}
                                  className="px-3 py-1 text-xs rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>{rejectReason.trim() ? 'Reject with feedback' : 'Dismiss'}</button>
                              </div>
                              <p className="text-xs" style={{color: '#64748b'}}>{rejectReason.trim() ? 'Judith will learn from your feedback' : 'Dismissing without feedback — no learning'}</p>
                            </div>
                          )}

                          {/* Revision input */}
                          <div className="mt-3">
                            <div className="flex space-x-2">
                              <input type="text" value={revisionText} onChange={e => setRevisionText(e.target.value)}
                                placeholder="Ask Judith to adjust... (e.g. 'make it shorter', 'add WiFi password')"
                                className="flex-1 text-sm rounded px-2 py-1.5 outline-none revision-input" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                                disabled={revisingDraft === draft.id}
                                onKeyDown={e => { if (e.key === 'Enter') handleRevision(draft.id, 'standard') }} />
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <button onClick={() => handleRevision(draft.id, 'standard')}
                                disabled={revisingDraft === draft.id || !revisionText.trim()}
                                className="px-3 py-1 text-xs rounded disabled:opacity-50" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>
                                {revisingDraft === draft.id ? 'Revising...' : 'Revise'}
                              </button>
                              <button onClick={() => { if (!revisionText.trim()) return; setShowTeachPrompt(showTeachPrompt === draft.id ? null : draft.id) }}
                                disabled={revisingDraft === draft.id || !revisionText.trim()}
                                className="px-3 py-1 text-xs rounded disabled:opacity-50 flex items-center" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                                <span className="mr-1">🧠</span> Revise & teach
                              </button>
                              <button onClick={() => handleRevision(draft.id, 'one_time')}
                                disabled={revisingDraft === draft.id || !revisionText.trim()}
                                className="text-xs disabled:opacity-50" style={{color: '#64748b'}}>
                                one-time
                              </button>
                            </div>
                            {showTeachPrompt === draft.id && (
                              <div className="mt-2 p-2 rounded" style={{background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)'}}>
                                <div className="text-xs mb-1.5" style={{color: '#c084fc'}}>Save this teaching to:</div>
                                <div className="flex space-x-2">
                                  <button onClick={() => handleRevision(draft.id, 'teach', 'property', detail?.conversation.property_name || undefined)}
                                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                                    📍 {detail?.conversation.property_name || 'This property'} only
                                  </button>
                                  <button onClick={() => handleRevision(draft.id, 'teach', 'global')}
                                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                                    🌐 All properties
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>

              {/* Right sidebar - conversation info + pending actions */}
              <div className={`w-72 overflow-y-auto custom-scrollbar ${mobileView === 'info' ? 'fixed inset-0 w-full z-40 md:relative md:w-72' : 'hidden md:block'}`} style={{background: 'rgba(255,255,255,0.05)', borderLeft: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'}}>
                <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  <div className="flex items-center justify-between"><h3 className="text-xs font-semibold" style={{color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px"}}>Guest Info</h3><button className="mobile-only text-xs px-2 py-0.5 rounded" style={{background: "rgba(99,149,255,0.15)", color: "#6395ff"}} onClick={() => setMobileView("detail")}>← Back</button></div>
                </div>
                <div className="p-3 space-y-2 text-xs" style={{color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  {detail.conversation.guest_email && <div>Email: {detail.conversation.guest_email}</div>}
                  {detail.conversation.channel && <div>Channel: {detail.conversation.channel}</div>}
                  {detail.conversation.check_in_date && <div>Check-in: {format(new Date(detail.conversation.check_in_date), 'MMM d, yyyy')}</div>}
                  {detail.conversation.check_out_date && <div>Check-out: {format(new Date(detail.conversation.check_out_date), 'MMM d, yyyy')}</div>}
                  {detail.conversation.num_guests && <div>{detail.conversation.num_guests} guest{detail.conversation.num_guests > 1 ? 's' : ''}</div>}
                  <div>{detail.conversation.inbound_count || 0} inbound messages</div>
                  {detail.conversation.sentiment && detail.conversation.sentiment !== 'neutral' && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: detail.conversation.sentiment === 'upset' ? '#ef4444' : detail.conversation.sentiment === 'frustrated' ? '#f59e0b' : detail.conversation.sentiment === 'positive' ? '#22c55e' : '#64748b'}} />
                      <span style={{color: detail.conversation.sentiment === 'upset' ? '#ef4444' : detail.conversation.sentiment === 'frustrated' ? '#f59e0b' : detail.conversation.sentiment === 'positive' ? '#22c55e' : '#94a3b8'}}>
                        {detail.conversation.sentiment === 'upset' ? 'Guest is upset' : detail.conversation.sentiment === 'frustrated' ? 'Guest seems frustrated' : detail.conversation.sentiment === 'positive' ? 'Positive sentiment' : detail.conversation.sentiment}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mark as Done / Reopen button */}
                <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  {detail.conversation.status === 'done' ? (
                    <button onClick={() => handleReopen(detail.conversation.id)}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                      <ArrowPathIcon className="h-4 w-4 mr-1.5" /> Reopen Conversation
                    </button>
                  ) : (
                    <button onClick={() => handleMarkDone(detail.conversation.id)}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                      <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Mark as Done
                    </button>
                  )}
                </div>

                {/* Pending actions warning modal */}
                {showDoneWarning && (
                  <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}>
                    <div className="rounded-xl p-6 max-w-sm mx-4" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}}>
                      <div className="flex items-center mb-3">
                        <ExclamationTriangleIcon className="h-6 w-6 mr-2" style={{color: '#fbbf24'}} />
                        <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>Open Actions</h3>
                      </div>
                      <p className="text-sm mb-4" style={{color: '#94a3b8'}}>
                        This conversation has <strong>{doneWarningCount}</strong> open action{doneWarningCount !== 1 ? 's' : ''}. Complete or dismiss them first.
                      </p>
                      <div className="flex space-x-2">
                        <button onClick={() => { setShowDoneWarning(false); setActiveTab('actions') }}
                          className="flex-1 px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)'}}>
                          View Actions
                        </button>
                        <button onClick={() => setShowDoneWarning(false)}
                          className="flex-1 px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-send toggle */}
                <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Auto-send</span>
                    <button onClick={async () => {
                      const newVal = !detail.conversation.auto_send_enabled
                      try {
                        await apiFetch(`/api/conversations/${detail.conversation.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ auto_send_enabled: newVal }),
                        })
                        setDetail(prev => prev ? { ...prev, conversation: { ...prev.conversation, auto_send_enabled: newVal } } : null)
                        toast.success(`Auto-send ${newVal ? 'enabled' : 'disabled'}`)
                      } catch (err: any) { toast.error(err.message) }
                    }} className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors" style={{background: detail.conversation.auto_send_enabled ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}}>
                      <span className="inline-block h-3.5 w-3.5 transform rounded-full transition-transform" style={{background: detail.conversation.auto_send_enabled ? '#4ade80' : '#64748b', transform: detail.conversation.auto_send_enabled ? 'translateX(18px)' : 'translateX(2px)'}} />
                    </button>
                  </div>
                  <p className="text-xs mt-1" style={{color: '#64748b'}}>{detail.conversation.auto_send_enabled ? 'On — routine replies ≥85% send automatically' : 'Off — all drafts require review'}</p>
                </div>

                {/* Staff notes */}
                <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  <h3 className="text-xs font-semibold mb-1" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Staff Notes</h3>
                  <textarea value={staffNotes}
                    onChange={e => handleNotesChange(e.target.value, detail.conversation.id)}
                    onBlur={async () => {
                      if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
                      try {
                        await apiFetch(`/api/conversations/${detail.conversation.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ notes: staffNotes }),
                        })
                      } catch { }
                    }}
                    placeholder="Add notes for Judith..."
                    className="w-full text-xs rounded px-2 py-1.5 resize-none outline-none" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} rows={3} />
                </div>

                {/* Suggested next steps */}
                {detail.conversation.next_steps && (() => { try { const steps = JSON.parse(detail.conversation.next_steps); return steps.length > 0 ? (
                  <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                    <h3 className="text-xs font-semibold mb-2" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Suggested Next Steps</h3>
                    <div className="space-y-1.5">
                      {steps.map((s: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#e2e8f0'}}>
                          <span>{s.icon || '📋'}</span>
                          <span>{s.text}{s.who && <span style={{color: '#6395ff'}}> — {s.who}</span>}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{color: '#475569', fontStyle: 'italic'}}>Judith's suggestions based on conversation context</p>
                  </div>
                ) : null; } catch { return null; } })()}

                {/* Draft history */}
                {detail.drafts.length > 0 && (
                  <div style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                    <div className="p-3 pb-1">
                      <h3 className="text-xs font-semibold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Draft History</h3>
                    </div>
                    <div className="p-3 pt-1 space-y-1.5">
                      {detail.drafts.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                          <span style={{color: '#64748b'}}>{format(new Date(d.created_at), 'MMM d HH:mm')}</span>
                          {draftStateBadge(d.state)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending actions for this conversation */}
                <div>
                  <div className="p-3 pb-1">
                    <h3 className="text-xs font-semibold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Pending Actions</h3>
                  </div>
                  <PendingActionsTab token={token} conversationFilter={selectedConvId} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{background: 'rgba(255,255,255,0.01)'}}>
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-20 w-20 mx-auto mb-4" style={{color: '#1e293b'}} />
                <h3 className="text-lg font-medium mb-2" style={{color: '#f1f5f9'}}>Friday GMS</h3>
                <p className="text-sm max-w-md" style={{color: '#64748b'}}>Select a conversation to view messages, review AI drafts, and manage guest communication.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
