'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

// Shared types and utilities
import {
  API_BASE, LANG_NAMES, LANG_FLAGS,
  getToken, setToken, clearToken, apiFetch,
  Conversation, ConversationDetail, MessageItem, Draft, PendingAction, InboxStats,
} from '../components/types'

// Extracted components
import HelpPanel from '../components/HelpPanel'
import PendingActionsTab from '../components/PendingActions'
import LoginScreen from '../components/LoginScreen'
import BugReport from '../components/BugReport'
import PropertyCard from '../components/PropertyCard'
import SendConfirmModal from '../components/SendConfirmModal'
import TeachingsPanel from '../components/TeachingsPanel'
import DashboardStats from '../components/DashboardStats'
import ConversationList from '../components/ConversationList'
import ConversationDetailView from '../components/ConversationDetail'
import GuestInfo from '../components/GuestInfo'

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

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

      <TeachingsPanel
        showTeachingsPanel={showTeachingsPanel}
        setShowTeachingsPanel={setShowTeachingsPanel}
        teachings={teachings}
        newTeachingText={newTeachingText}
        setNewTeachingText={setNewTeachingText}
        handleAddTeaching={handleAddTeaching}
        revokeId={revokeId}
        setRevokeId={setRevokeId}
        revokeReason={revokeReason}
        setRevokeReason={setRevokeReason}
        handleRevokeTeaching={handleRevokeTeaching}
      />

      {propertyCard && (
        <PropertyCard
          propertyCard={propertyCard}
          setPropertyCard={setPropertyCard}
          cardEditing={cardEditing}
          setCardEditing={setCardEditing}
          cardEditData={cardEditData}
          setCardEditData={setCardEditData}
          cardEditHistory={cardEditHistory}
          cardSaving={cardSaving}
          savePropertyCard={savePropertyCard}
          fetchPropertyCard={fetchPropertyCard}
          detail={detail}
        />
      )}

      <BugReport selectedConvId={selectedConvId} displayName={displayName} />

      <SendConfirmModal
        sendConfirm={sendConfirm}
        setSendConfirm={setSendConfirm}
        sendChannel={sendChannel}
        setSendChannel={setSendChannel}
        executeSend={executeSend}
        undoDraftId={undoDraftId}
        undoCountdown={undoCountdown}
        cancelSend={cancelSend}
      />

      <DashboardStats
        stats={stats}
        pollerStatus={pollerStatus}
        displayName={displayName}
        setTokenState={setTokenState}
        toggleMute={toggleMute}
        isMuted={isMuted}
        showTeachingsPanel={showTeachingsPanel}
        setShowTeachingsPanel={setShowTeachingsPanel}
        fetchTeachings={fetchTeachings}
        setShowHelp={setShowHelp}
      />

      <div className="flex h-[calc(100vh-72px)] relative" data-testid="nav-conversation-list">
        <ConversationList
          conversations={conversations}
          filteredConversations={filteredConversations}
          selectedConvId={selectedConvId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadCount={unreadCount}
          stats={stats}
          token={token}
          mobileView={mobileView}
          selectConversation={selectConversation}
          handleMarkUnread={handleMarkUnread}
          fetchPropertyCard={fetchPropertyCard}
          statusBadge={statusBadge}
          channelBadge={channelBadge}
        />

        {/* Main content area */}
        <div className="flex-1 flex">
          {selectedConvId && detail ? (
            <>
              <ConversationDetailView
                detail={detail}
                mobileView={mobileView}
                setMobileView={setMobileView}
                fetchPropertyCard={fetchPropertyCard}
                channelBadge={channelBadge}
                displayName={displayName}
                selectedConvId={selectedConvId}
                fetchDetail={fetchDetail}
                fetchConversations={fetchConversations}
                showDraftHistory={showDraftHistory}
                setShowDraftHistory={setShowDraftHistory}
                messagesEndRef={messagesEndRef}
                rtColor={rtColor}
                composeOpen={composeOpen}
                setComposeOpen={setComposeOpen}
                composeMode={composeMode}
                setComposeMode={setComposeMode}
                composeText={composeText}
                setComposeText={setComposeText}
                composeInstruction={composeInstruction}
                setComposeInstruction={setComposeInstruction}
                composeSending={composeSending}
                handleCompose={handleCompose}
                revisionPending={revisionPending}
                editingDraft={editingDraft}
                setEditingDraft={setEditingDraft}
                isEditingRef={isEditingRef}
                editBody={editBody}
                setEditBody={setEditBody}
                revisionText={revisionText}
                setRevisionText={setRevisionText}
                revisingDraft={revisingDraft}
                rejectingDraft={rejectingDraft}
                setRejectingDraft={setRejectingDraft}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                showTeachPrompt={showTeachPrompt}
                setShowTeachPrompt={setShowTeachPrompt}
                requestApproval={requestApproval}
                handleDraftAction={handleDraftAction}
                handleRevision={handleRevision}
                handleRejectWithReason={handleRejectWithReason}
                draftStateBadge={draftStateBadge}
              />

              <GuestInfo
                detail={detail}
                token={token}
                selectedConvId={selectedConvId}
                mobileView={mobileView}
                setMobileView={setMobileView}
                setDetail={setDetail}
                handleMarkDone={handleMarkDone}
                handleReopen={handleReopen}
                showDoneWarning={showDoneWarning}
                setShowDoneWarning={setShowDoneWarning}
                doneWarningCount={doneWarningCount}
                setActiveTab={setActiveTab}
                staffNotes={staffNotes}
                handleNotesChange={handleNotesChange}
                notesTimerRef={notesTimerRef}
                draftStateBadge={draftStateBadge}
              />
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
