'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

const API_BASE = ''  // Relative — nginx proxies /api/

// ── Types ──

interface Conversation {
  id: string
  guest_name: string | null
  guest_email: string | null
  property_name: string | null
  channel: string | null
  status: string
  auto_send_enabled: boolean
  last_message_at: string | null
  check_in_date: string | null
  check_out_date: string | null
  num_guests: number | null
  notes: string | null
  conversation_summary: string | null
  first_response_minutes: number | null
  is_unread: boolean
  latest_draft_state: string | null
  latest_draft_id: string | null
  latest_draft_confidence: number | null
  last_message_body: string | null
  last_message_direction: string | null
  inbound_count: number
}

interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string
  original_language: string | null
  translated_body: string | null
  sender_name: string | null
  created_at: string
}

interface Draft {
  id: string
  message_id: string
  conversation_id: string
  draft_body: string
  draft_translated: string | null
  confidence: number | null
  revision_number: number
  state: string
  reviewed_by: string | null
  created_at: string
}

interface PendingAction {
  id: string
  conversation_id: string
  guest_name: string
  property_code: string | null
  action_text: string
  status: string
  detected_at: string
  due_by: string | null
  age_minutes: number
  channel: string | null
}

interface Stats {
  total_conversations: number
  needs_review_count: number
  avg_response_time_minutes: number | null
  messages_today: number
  pending_actions_count: number
  overdue_actions_count: number
}

// ── Notification Sound (base64 encoded short chime) ──
const CHIME_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVQGAACAgICAgICAgICAgICAgICAgICAgICAgICAgICBgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/v///////v79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYCAgICAgICAgICAgICAgICAgICAgICAgIB/f35+fX18fHt7enp5eXh4eHd3d3Z2dnZ2dnV1dXV1dXV1dXV1dXV1dXV1dXZ2dnZ2dnd3d3h4eHl5eXp6e3t8fH19fn5/f4CAgICBgYKCg4OEhIWFhoaHh4iIiYmKiouLjIyNjY6Oj4+QkJGRkpKTk5SVlZaWl5eYmJmZmpqbm5ybnJucm5ybm5ubm5qamZmYmJeXlpaVlZSUk5OSkpGRkJCPj46OjY2MjIuLioqJiYiIh4eGhoWFhISDg4KCgYGAgICAf39/fn5+fX19fHx8e3t7e3p6enp6enp6enp6enp6enp6e3t7e3t8fHx8fX19fn5+f3+AgICAgYGBgoKDg4OEhISFhYaGhoeHiIiIiYmJiYqKioqKiouLi4uLi4uLi4uLi4uLi4uKioqKioqJiYmJiIiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgYCAgIB/f39/fn5+fn19fX19fHx8fHx8fHx8fHx8fHx8fHx8fH19fX19fX5+fn5+f39/f4CAgICAgYGBgYKCgoKDg4ODhISEhIWFhYWGhoaGhoaHh4eHh4eHh4eHh4eHh4eHh4eHh4aGhoaGhoWFhYWFhISEhIODg4OCgoKCgYGBgYCAgICAf39/f35+fn5+fX19fX19fHx8fHx8fHx8fHx8fHx8fHx8fH19fX19fX5+fn5+f39/f4CAgICAgYGBgoKCgoODg4OEhISEhISFhYWFhYWFhYWFhQA='

function playChime() {
  try {
    const audio = new Audio(CHIME_BASE64)
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch {}
}

// ── Auth Helpers ──

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('gms_token') : null
}

function setToken(token: string) {
  localStorage.setItem('gms_token', token)
}

function clearToken() {
  localStorage.removeItem('gms_token')
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('Unauthorized')
  }
  return res
}

// ── Channel Badge ──

function ChannelBadge({ channel }: { channel: string | null }) {
  const map: Record<string, { label: string; color: string }> = {
    'airbnb': { label: 'Airbnb', color: 'bg-rose-100 text-rose-700' },
    'booking': { label: 'Booking', color: 'bg-blue-100 text-blue-700' },
    'booking.com': { label: 'Booking', color: 'bg-blue-100 text-blue-700' },
    'direct': { label: 'Direct', color: 'bg-emerald-100 text-emerald-700' },
    'vrbo': { label: 'VRBO', color: 'bg-purple-100 text-purple-700' },
  }
  const ch = (channel || 'other').toLowerCase()
  const info = map[ch] || { label: channel || 'Other', color: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${info.color}`}>{info.label}</span>
}

// ── Confidence Badge ──

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence == null) return null
  const color = confidence >= 80 ? 'bg-green-100 text-green-700' : confidence >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const emoji = confidence >= 80 ? '🟢' : confidence >= 60 ? '🟡' : '🔴'
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>{emoji} {confidence}%</span>
}

// ── Age Badge ──

function AgeBadge({ minutes }: { minutes: number }) {
  const hours = minutes / 60
  const color = hours < 2 ? 'bg-green-100 text-green-700' : hours < 6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const label = hours < 1 ? `${Math.round(minutes)}m` : `${Math.round(hours * 10) / 10}h`
  return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>{label}</span>
}

// ── Help Panel ──

function HelpPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#1a2332] text-gray-200 overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Friday GMS -- Quick Guide</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <Section title="How it works">
            <p>When a guest sends a message, Judith (our AI) automatically:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
              <li>Detects the language and translates if needed</li>
              <li>Summarizes the conversation</li>
              <li>Drafts a reply with a confidence score</li>
              <li>Queues it for your review</li>
            </ol>
          </Section>

          <Section title="Confidence scores">
            <div className="space-y-2 text-sm">
              <p>🟢 <strong>Green (80-98%)</strong> -- Routine question with good context. Quick review and approve.</p>
              <p>🟡 <strong>Amber (60-79%)</strong> -- Check carefully, might need revision.</p>
              <p>🔴 <strong>Red (below 60%)</strong> -- Complex situation, complaint, or missing context. Review closely.</p>
            </div>
          </Section>

          <Section title="What scores are based on">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Message type: routine questions score higher, complaints lower</li>
              <li>Context: more reservation details = higher confidence</li>
              <li>Property knowledge: known property with FAQ data = higher confidence</li>
              <li>Language: non-English messages slightly lower (translation uncertainty)</li>
              <li>Complexity: multiple questions or long messages = lower</li>
            </ul>
          </Section>

          <Section title="Reviewing drafts">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Read the draft</strong> in the center panel</li>
              <li><strong>Edit directly</strong> -- click the draft text to make changes</li>
              <li><strong>Ask Judith to revise</strong> -- type an instruction like &ldquo;Make it shorter&rdquo; or &ldquo;Add the WiFi password&rdquo;</li>
              <li><strong>Approve &amp; Send</strong> -- sends via the guest&apos;s booking platform</li>
              <li><strong>Reject</strong> -- discards with a reason (helps Judith learn)</li>
            </ul>
          </Section>

          <Section title="Pending actions">
            <p className="text-sm">When we promise something to a guest (&ldquo;we&apos;ll check and confirm&rdquo;), it appears in the &#9203; Action Items tab. Check this regularly -- don&apos;t leave guests hanging.</p>
          </Section>

          <Section title="Keyboard shortcuts">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-mono bg-gray-700 px-2 py-1 rounded text-center">&uarr;/&darr;</span><span>Navigate conversations</span>
              <span className="font-mono bg-gray-700 px-2 py-1 rounded text-center">Enter</span><span>Open selected</span>
              <span className="font-mono bg-gray-700 px-2 py-1 rounded text-center">/</span><span>Focus &ldquo;Ask Judith&rdquo; input</span>
              <span className="font-mono bg-gray-700 px-2 py-1 rounded text-center">Cmd+Enter</span><span>Approve &amp; send</span>
              <span className="font-mono bg-gray-700 px-2 py-1 rounded text-center">Esc</span><span>Deselect</span>
            </div>
          </Section>

          <Section title="Staff notes">
            <p className="text-sm">The notes field (right panel) is shared with Judith. Use it for VIP info, guest preferences, special needs.</p>
          </Section>

          <Section title="Auto-send">
            <p className="text-sm">Toggle per conversation in the right panel. When enabled, replies with 85%+ confidence for routine questions send automatically. Start with this OFF until you trust Judith&apos;s drafts.</p>
          </Section>

          <Section title="Need help?">
            <p className="text-sm">Tag @Ishant in Slack or message Judith directly.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-gray-300">{children}</div>
    </div>
  )
}

// ── Login Screen ──

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      onLogin(data.token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Friday GMS</h1>
        <p className="text-sm text-gray-500 mb-6">Guest Messaging System</p>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        <button type="submit" disabled={loading}
          className="w-full bg-[#1a2332] text-white py-2 rounded-lg hover:bg-[#2a3542] disabled:opacity-50 font-medium">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── Main Dashboard ──

export default function InboxPage() {
  const [token, setTokenState] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [convDetail, setConvDetail] = useState<{ conversation: Conversation; messages: Message[]; drafts: Draft[]; reservation: any } | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'needs_review' | 'open' | 'done' | 'actions'>('all')
  const [helpOpen, setHelpOpen] = useState(false)
  const [soundMuted, setSoundMuted] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('gms_muted') === 'true'
    return false
  })
  const [adjustInput, setAdjustInput] = useState('')
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [editDraftBody, setEditDraftBody] = useState('')
  const [notes, setNotes] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [actionModal, setActionModal] = useState<{ id: string; type: 'complete' | 'dismiss' } | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [addActionModal, setAddActionModal] = useState(false)
  const [newActionText, setNewActionText] = useState('')
  const adjustRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedIndexRef = useRef<number>(-1)

  // Initialize auth
  useEffect(() => {
    setTokenState(getToken())
  }, [])

  const handleLogin = (t: string) => {
    setToken(t)
    setTokenState(t)
  }

  // Mute persistence
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('gms_muted', String(soundMuted))
  }, [soundMuted])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiFetch('/api/conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {}
    setLoading(false)
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats/inbox`)
      setStats(await res.json())
    } catch {}
  }, [])

  // Fetch pending actions
  const fetchPendingActions = useCallback(async () => {
    try {
      const res = await apiFetch('/api/pending-actions?status=pending')
      const data = await res.json()
      setPendingActions(data.actions || [])
    } catch {}
  }, [])

  // Fetch conversation detail
  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/conversations/${id}`)
      const data = await res.json()
      setConvDetail(data)
      setNotes(data.conversation?.notes || '')
      setNotesDirty(false)
      // Mark as read
      apiFetch(`/api/conversations/${id}/read`, { method: 'POST' }).catch(() => {})
      // Update local unread state
      setConversations(prev => prev.map(c => c.id === id ? { ...c, is_unread: false } : c))
    } catch {}
  }, [])

  // Initial load + polling
  useEffect(() => {
    if (!token) return
    fetchConversations()
    fetchStats()
    fetchPendingActions()
    const interval = setInterval(() => {
      fetchConversations()
      fetchStats()
      fetchPendingActions()
    }, 30000)
    return () => clearInterval(interval)
  }, [token, fetchConversations, fetchStats, fetchPendingActions])

  // SSE connection
  useEffect(() => {
    if (!token) return

    const es = new EventSource(`${API_BASE}/api/sse/connect`)

    es.addEventListener('new_message', (e) => {
      if (!soundMuted) playChime()
      fetchConversations()
      fetchStats()
      const data = JSON.parse(e.data)
      if (data.conversationId === selectedConvId) {
        selectedConvId && fetchDetail(selectedConvId)
      }
    })

    es.addEventListener('draft_ready', (e) => {
      const data = JSON.parse(e.data)
      if (data.conversationId === selectedConvId) {
        selectedConvId && fetchDetail(selectedConvId)
      }
      fetchStats()
    })

    es.addEventListener('message_sent', (e) => {
      const data = JSON.parse(e.data)
      if (data.conversationId === selectedConvId) {
        selectedConvId && fetchDetail(selectedConvId)
      }
      fetchConversations()
      fetchStats()
      fetchPendingActions()
    })

    es.addEventListener('conversation_new', () => {
      fetchConversations()
    })

    es.addEventListener('pending_action_new', () => {
      fetchPendingActions()
    })

    es.onerror = () => {
      // Will auto-reconnect
    }

    return () => es.close()
  }, [token, soundMuted, selectedConvId, fetchConversations, fetchStats, fetchDetail, fetchPendingActions])

  // Select conversation
  useEffect(() => {
    if (selectedConvId) selectedConvId && fetchDetail(selectedConvId)
  }, [selectedConvId, fetchDetail])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convDetail?.messages])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
          return
        }
        if (e.key === 'Enter' && e.metaKey) {
          e.preventDefault()
          handleApprove()
          return
        }
        return
      }

      const filtered = filteredConversations
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        selectedIndexRef.current = Math.min(selectedIndexRef.current + 1, filtered.length - 1)
        if (filtered[selectedIndexRef.current]) setSelectedConvId(filtered[selectedIndexRef.current].id)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0)
        if (filtered[selectedIndexRef.current]) setSelectedConvId(filtered[selectedIndexRef.current].id)
      } else if (e.key === 'Enter' && selectedConvId) {
        // Already selected
      } else if (e.key === '/') {
        e.preventDefault()
        adjustRef.current?.focus()
      } else if (e.key === 'Escape') {
        setSelectedConvId(null)
        setConvDetail(null)
        selectedIndexRef.current = -1
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedConvId, activeTab, conversations])

  // ── Actions ──

  const handleApprove = async () => {
    const draft = latestDraft
    if (!draft) return
    try {
      await apiFetch(`/api/drafts/${draft.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewed_by: 'ishant' }),
      })
      if (selectedConvId) selectedConvId && fetchDetail(selectedConvId)
      fetchConversations()
      fetchStats()
    } catch {}
  }

  const handleReject = async () => {
    const draft = latestDraft
    if (!draft) return
    try {
      await apiFetch(`/api/drafts/${draft.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewed_by: 'ishant', rejection_reason: 'Rejected from dashboard' }),
      })
      if (selectedConvId) selectedConvId && fetchDetail(selectedConvId)
      fetchStats()
    } catch {}
  }

  const handleRevise = async () => {
    const draft = latestDraft
    if (!draft || !adjustInput.trim()) return
    try {
      await apiFetch(`/api/drafts/${draft.id}/revise`, {
        method: 'POST',
        body: JSON.stringify({ revision_instruction: adjustInput.trim(), reviewed_by: 'ishant' }),
      })
      setAdjustInput('')
      if (selectedConvId) selectedConvId && fetchDetail(selectedConvId)
    } catch {}
  }

  const handleSaveNotes = async () => {
    if (!selectedConvId || !notesDirty) return
    try {
      await apiFetch(`/api/conversations/${selectedConvId}`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      })
      setNotesDirty(false)
    } catch {}
  }

  const handleToggleAutoSend = async () => {
    if (!convDetail) return
    try {
      await apiFetch(`/api/conversations/${convDetail.conversation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ auto_send_enabled: !convDetail.conversation.auto_send_enabled }),
      })
      fetchDetail(convDetail.conversation.id)
    } catch {}
  }

  const handleCompleteAction = async () => {
    if (!actionModal) return
    try {
      await apiFetch(`/api/pending-actions/${actionModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: actionModal.type === 'complete' ? 'completed' : 'dismissed', completion_note: actionNote || null }),
      })
      setActionModal(null)
      setActionNote('')
      fetchPendingActions()
    } catch {}
  }

  const handleAddAction = async () => {
    if (!selectedConvId || !newActionText.trim()) return
    try {
      await apiFetch('/api/pending-actions', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: selectedConvId, action_text: newActionText.trim() }),
      })
      setAddActionModal(false)
      setNewActionText('')
      fetchPendingActions()
    } catch {}
  }

  // ── Computed ──

  const filteredConversations = conversations.filter(c => {
    switch (activeTab) {
      case 'unread': return c.is_unread
      case 'needs_review': return c.latest_draft_state === 'draft_ready' || c.latest_draft_state === 'under_review'
      case 'open': return c.status === 'active'
      case 'done': return c.status === 'closed'
      default: return true
    }
  })

  const latestDraft = convDetail?.drafts?.find(d => ['draft_ready', 'under_review', 'judith_drafting'].includes(d.state))
  const convActions = pendingActions.filter(a => a.conversation_id === selectedConvId)

  const unreadCount = conversations.filter(c => c.is_unread).length

  // Response time color
  const rtColor = (stats?.avg_response_time_minutes ?? 999) <= 15 ? 'text-green-600' : (stats?.avg_response_time_minutes ?? 999) <= 60 ? 'text-amber-600' : 'text-red-600'

  if (!token) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Action Complete Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => setActionModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">{actionModal.type === 'complete' ? 'Complete Action' : 'Dismiss Action'}</h3>
            <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
              placeholder="Optional note..." className="w-full border rounded-lg p-2 text-sm mb-3" rows={2} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setActionModal(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={handleCompleteAction}
                className={`px-3 py-1.5 text-sm text-white rounded ${actionModal.type === 'complete' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'}`}>
                {actionModal.type === 'complete' ? 'Mark Done' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Action Modal */}
      {addActionModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30" onClick={() => setAddActionModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Add Action Item</h3>
            <textarea value={newActionText} onChange={e => setNewActionText(e.target.value)}
              placeholder="What needs to be done?" className="w-full border rounded-lg p-2 text-sm mb-3" rows={3} />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAddActionModal(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={handleAddAction} className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1a2332] text-white px-6 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold">Friday GMS</h1>
          <p className="text-xs text-gray-400">Guest Messaging System</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {stats && (
            <>
              <span className={rtColor}>
                &#128340; {stats.avg_response_time_minutes != null ? `${stats.avg_response_time_minutes} min avg` : '--'}
              </span>
              <span className="text-gray-300">&#128233; {stats.needs_review_count} review</span>
              {stats.pending_actions_count > 0 && (
                <span className={stats.overdue_actions_count > 0 ? 'text-red-400' : 'text-gray-300'}>
                  &#9203; {stats.pending_actions_count} actions
                </span>
              )}
            </>
          )}
          <button onClick={() => setSoundMuted(!soundMuted)} className="text-gray-400 hover:text-white" title={soundMuted ? 'Unmute' : 'Mute'}>
            {soundMuted ? '🔇' : '🔔'}
          </button>
          <button onClick={() => setHelpOpen(true)} className="w-7 h-7 rounded-full border border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-white">?</button>
          <button onClick={() => { clearToken(); setTokenState(null) }} className="text-gray-400 hover:text-white text-xs">Logout</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel — Conversation List */}
        <div className="w-80 bg-white border-r flex flex-col shrink-0">
          {/* Filter Tabs */}
          <div className="flex border-b text-xs overflow-x-auto">
            {([
              ['all', 'All'],
              ['unread', `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`],
              ['needs_review', 'Review'],
              ['open', 'Open'],
              ['done', 'Done'],
              ['actions', `\u23F3 Actions`],
            ] as [string, string][]).map(([key, label]) => (
              <button key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-3 py-2 whitespace-nowrap border-b-2 ${activeTab === key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Conversation list or Actions list */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'actions' ? (
              // Pending Actions List
              <div>
                <div className="p-3 border-b flex justify-between items-center">
                  <span className="text-xs text-gray-500">{pendingActions.length} pending</span>
                  <button onClick={() => setAddActionModal(true)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add</button>
                </div>
                {pendingActions.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No pending actions &#127881;</div>
                ) : pendingActions.map(action => (
                  <div key={action.id} className="p-3 border-b hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900">{action.guest_name}</span>
                      <AgeBadge minutes={action.age_minutes} />
                    </div>
                    {action.property_code && <div className="text-xs text-gray-500 mb-1">{action.property_code}</div>}
                    <p className="text-xs text-gray-700 mb-2">{action.action_text}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setActionModal({ id: action.id, type: 'complete' })}
                        className="text-xs text-green-600 hover:text-green-800 font-medium">&#10003; Done</button>
                      <button onClick={() => setActionModal({ id: action.id, type: 'dismiss' })}
                        className="text-xs text-gray-500 hover:text-gray-700">&#10005; Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Conversation list
              filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">No conversations</div>
              ) : filteredConversations.map((conv, idx) => (
                <div key={conv.id}
                  onClick={() => { setSelectedConvId(conv.id); selectedIndexRef.current = idx }}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedConvId === conv.id ? 'bg-blue-50 border-l-3 border-l-blue-500' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {conv.is_unread && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                      <span className={`text-sm truncate ${conv.is_unread ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                        {conv.guest_name || 'Unknown Guest'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {conv.property_name && <span className="text-xs text-gray-500 truncate">{conv.property_name}</span>}
                    <ChannelBadge channel={conv.channel} />
                    {conv.latest_draft_confidence != null && <ConfidenceBadge confidence={conv.latest_draft_confidence} />}
                  </div>
                  {conv.last_message_body && (
                    <p className="text-xs text-gray-500 truncate">
                      {conv.last_message_direction === 'outbound' ? '&#10003; ' : ''}
                      {conv.last_message_body}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center Panel — Messages + Draft */}
        <div className="flex-1 flex flex-col min-w-0">
          {convDetail ? (
            <>
              {/* Conversation header */}
              <div className="bg-white border-b px-4 py-3 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-gray-900">{convDetail.conversation.guest_name || 'Unknown Guest'}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {convDetail.conversation.property_name && <span>{convDetail.conversation.property_name}</span>}
                      <ChannelBadge channel={convDetail.conversation.channel} />
                      {convDetail.conversation.check_in_date && convDetail.conversation.check_out_date && (
                        <span>{convDetail.conversation.check_in_date} &rarr; {convDetail.conversation.check_out_date}</span>
                      )}
                    </div>
                  </div>
                  {convDetail.conversation.conversation_summary && (
                    <p className="text-xs text-gray-500 max-w-xs text-right italic">{convDetail.conversation.conversation_summary}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {convDetail.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-lg px-4 py-2 rounded-xl ${msg.direction === 'outbound' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-900'}`}>
                      <p className="text-sm whitespace-pre-wrap">{showTranslation && msg.translated_body ? msg.translated_body : msg.body}</p>
                      {msg.original_language && msg.original_language !== 'en' && msg.translated_body && (
                        <button onClick={() => setShowTranslation(!showTranslation)}
                          className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-blue-500'}`}>
                          {showTranslation ? 'Show original' : 'Show translation'}
                        </button>
                      )}
                      <div className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {msg.sender_name && <span>{msg.sender_name} &middot; </span>}
                        {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Draft Review Area */}
              {latestDraft && (
                <div className="bg-gray-50 border-t px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      {latestDraft.state === 'judith_drafting' ? 'Judith is drafting...' : `Draft v${latestDraft.revision_number}`}
                    </span>
                    <ConfidenceBadge confidence={latestDraft.confidence} />
                  </div>

                  {latestDraft.state === 'judith_drafting' ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                      Generating draft...
                    </div>
                  ) : (
                    <>
                      {editingDraft === latestDraft.id ? (
                        <div className="space-y-2">
                          <textarea value={editDraftBody} onChange={e => setEditDraftBody(e.target.value)}
                            className="w-full border rounded-lg p-3 text-sm" rows={4} />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingDraft(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => { setEditingDraft(latestDraft.id); setEditDraftBody(latestDraft.draft_body) }}
                          className="bg-white border rounded-lg p-3 text-sm text-gray-800 cursor-text hover:border-blue-300 whitespace-pre-wrap">
                          {latestDraft.draft_body}
                        </div>
                      )}

                      {latestDraft.draft_translated && (
                        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
                          <span className="text-xs text-blue-600 font-medium">Translated version:</span>
                          <p className="mt-1">{latestDraft.draft_translated}</p>
                        </div>
                      )}

                      {/* Adjust Input */}
                      <div className="flex gap-2 mt-3">
                        <input ref={adjustRef} value={adjustInput} onChange={e => setAdjustInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRevise() } }}
                          placeholder="Ask Judith to adjust... (e.g., 'Make it shorter', 'Add WiFi password')"
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                        <button onClick={handleRevise} disabled={!adjustInput.trim()}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">Revise</button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={handleApprove}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium">
                          &#10003; Approve &amp; Send
                          <span className="text-xs opacity-75 ml-1">(&#8984;&#9166;)</span>
                        </button>
                        <button onClick={handleReject}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 font-medium">
                          &#10005; Reject
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-5xl mb-4">&#128233;</p>
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Use &#8593;&#8595; arrow keys to navigate, Enter to select</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Context Sidebar */}
        {convDetail && (
          <div className="w-72 bg-white border-l overflow-y-auto shrink-0">
            <div className="p-4 space-y-4">
              {/* Guest Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Guest</h3>
                <p className="text-sm font-medium">{convDetail.conversation.guest_name || 'Unknown'}</p>
                {convDetail.conversation.guest_email && <p className="text-xs text-gray-500">{convDetail.conversation.guest_email}</p>}
              </div>

              {/* Reservation */}
              {convDetail.reservation && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reservation</h3>
                  <div className="text-xs space-y-1 text-gray-600">
                    <p>Check-in: {convDetail.reservation.check_in || '--'}</p>
                    <p>Check-out: {convDetail.reservation.check_out || '--'}</p>
                    <p>Guests: {convDetail.reservation.num_guests || '--'}</p>
                    <p>Status: {convDetail.reservation.status || '--'}</p>
                  </div>
                </div>
              )}

              {/* Auto-send Toggle */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Auto-send</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={convDetail.conversation.auto_send_enabled} onChange={handleToggleAutoSend}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-xs text-gray-600">Auto-send high-confidence replies</span>
                </label>
              </div>

              {/* Staff Notes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Staff Notes</h3>
                <textarea value={notes}
                  onChange={e => { setNotes(e.target.value); setNotesDirty(true) }}
                  onBlur={handleSaveNotes}
                  placeholder="Add notes for the team..."
                  className="w-full border rounded-lg p-2 text-xs" rows={3} />
                {notesDirty && <span className="text-xs text-amber-500">Unsaved</span>}
              </div>

              {/* Pending Actions for this conversation */}
              {convActions.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">&#9203; Pending Actions</h3>
                  <div className="space-y-2">
                    {convActions.map(action => (
                      <div key={action.id} className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <p className="text-xs text-gray-700">{action.action_text}</p>
                        <div className="flex gap-2 mt-1">
                          <AgeBadge minutes={action.age_minutes} />
                          <button onClick={() => setActionModal({ id: action.id, type: 'complete' })}
                            className="text-xs text-green-600 hover:text-green-800">&#10003; Done</button>
                          <button onClick={() => setActionModal({ id: action.id, type: 'dismiss' })}
                            className="text-xs text-gray-500 hover:text-gray-700">Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add action button */}
              <button onClick={() => setAddActionModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add action item</button>

              {/* Conversation Summary */}
              {convDetail.conversation.conversation_summary && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-xs text-gray-600 italic">{convDetail.conversation.conversation_summary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
