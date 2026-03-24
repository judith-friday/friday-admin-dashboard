'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
} from '@heroicons/react/24/outline'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// Comprehensive language name and flag mapping
const LANG_NAMES: Record<string, string> = {
  en: 'English', fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese',
  it: 'Italian', nl: 'Dutch', ru: 'Russian', uk: 'Ukrainian', pl: 'Polish',
  cs: 'Czech', sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish',
  zh: 'Chinese', ja: 'Japanese', ko: 'Korean', th: 'Thai', vi: 'Vietnamese',
  hi: 'Hindi', id: 'Indonesian', ms: 'Malay', ar: 'Arabic', he: 'Hebrew',
  tr: 'Turkish', el: 'Greek', hu: 'Hungarian', ro: 'Romanian', bg: 'Bulgarian',
  hr: 'Croatian', sk: 'Slovak', sl: 'Slovenian', et: 'Estonian', lv: 'Latvian',
  lt: 'Lithuanian', fa: 'Persian', ur: 'Urdu', bn: 'Bengali', ta: 'Tamil',
  te: 'Telugu', mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam',
  si: 'Sinhala', sw: 'Swahili', am: 'Amharic', ne: 'Nepali', my: 'Burmese',
  km: 'Khmer', lo: 'Lao', ka: 'Georgian', hy: 'Armenian', az: 'Azerbaijani',
  kk: 'Kazakh', uz: 'Uzbek', mn: 'Mongolian', tl: 'Filipino', 'zh-TW': 'Chinese (Traditional)',
}
const LANG_FLAGS: Record<string, string> = {
  en: '\u{1F1EC}\u{1F1E7}', fr: '\u{1F1EB}\u{1F1F7}', de: '\u{1F1E9}\u{1F1EA}', es: '\u{1F1EA}\u{1F1F8}', pt: '\u{1F1F5}\u{1F1F9}',
  it: '\u{1F1EE}\u{1F1F9}', nl: '\u{1F1F3}\u{1F1F1}', ru: '\u{1F1F7}\u{1F1FA}', uk: '\u{1F1FA}\u{1F1E6}', pl: '\u{1F1F5}\u{1F1F1}',
  cs: '\u{1F1E8}\u{1F1FF}', sv: '\u{1F1F8}\u{1F1EA}', da: '\u{1F1E9}\u{1F1F0}', no: '\u{1F1F3}\u{1F1F4}', fi: '\u{1F1EB}\u{1F1EE}',
  zh: '\u{1F1E8}\u{1F1F3}', ja: '\u{1F1EF}\u{1F1F5}', ko: '\u{1F1F0}\u{1F1F7}', th: '\u{1F1F9}\u{1F1ED}', vi: '\u{1F1FB}\u{1F1F3}',
  hi: '\u{1F1EE}\u{1F1F3}', id: '\u{1F1EE}\u{1F1E9}', ms: '\u{1F1F2}\u{1F1FE}', ar: '\u{1F1F8}\u{1F1E6}', he: '\u{1F1EE}\u{1F1F1}',
  tr: '\u{1F1F9}\u{1F1F7}', el: '\u{1F1EC}\u{1F1F7}', hu: '\u{1F1ED}\u{1F1FA}', ro: '\u{1F1F7}\u{1F1F4}', bg: '\u{1F1E7}\u{1F1EC}',
  hr: '\u{1F1ED}\u{1F1F7}', sk: '\u{1F1F8}\u{1F1F0}', sl: '\u{1F1F8}\u{1F1EE}', et: '\u{1F1EA}\u{1F1EA}', lv: '\u{1F1F1}\u{1F1FB}',
  lt: '\u{1F1F1}\u{1F1F9}', fa: '\u{1F1EE}\u{1F1F7}', ur: '\u{1F1F5}\u{1F1F0}', bn: '\u{1F1E7}\u{1F1E9}', ta: '\u{1F1EE}\u{1F1F3}',
  sw: '\u{1F1F0}\u{1F1EA}', tl: '\u{1F1F5}\u{1F1ED}', 'zh-TW': '\u{1F1F9}\u{1F1FC}', ne: '\u{1F1F3}\u{1F1F5}',
}
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur'])

// ── Auth helpers ──
function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('gms_token') : null
}
function setToken(token: string) {
  localStorage.setItem('gms_token', token)
}
function clearToken() {
  localStorage.removeItem('gms_token')
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers as Record<string, string> || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers })
  if (res.status === 401) { clearToken(); throw new Error('Unauthorized') }
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`) }
  return res.json()
}

// ── Types ──
interface Conversation {
  id: string
  guest_name: string
  guest_email?: string
  property_name?: string
  channel?: string
  status: string
  check_in_date?: string
  check_out_date?: string
  conversation_summary?: string
  last_message_at?: string
  last_message_body?: string
  last_message_direction?: string
  latest_draft_state?: string
  latest_draft_id?: string
  latest_draft_confidence?: string
  is_unread?: boolean
  inbound_count?: string
  num_guests?: number
  first_response_minutes?: number
  auto_send_enabled?: boolean
  notes?: string
  created_at: string
  updated_at: string
}

interface ConversationDetail {
  conversation: Conversation
  messages: MessageItem[]
  drafts: Draft[]
  reservation?: any
}

interface MessageItem {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  body: string
  translated_body?: string
  original_language?: string
  sender_name?: string
  created_at: string
}

interface Draft {
  id: string
  conversation_id: string
  message_id?: string
  state: string
  draft_body: string
  draft_translated?: string
  translated_content?: string
  sent_language?: string
  confidence?: number
  reviewed_by?: string
  rejection_reason?: string
  revision_instruction?: string
  revision_number?: number
  sent_at?: string
  created_at: string
  updated_at: string
}

interface PendingAction {
  id: string
  conversation_id: string
  guest_name: string
  property_code?: string
  action_text: string
  status: string
  detected_at: string
  due_by?: string
  completed_at?: string
  completed_by?: string
  completion_note?: string
  source: string
  age_minutes?: number
  channel?: string
}

interface InboxStats {
  total_conversations: number
  needs_review_count: number
  avg_response_time_minutes: number
  messages_today: number
  pending_actions_count: number
  overdue_actions_count: number
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
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full mb-3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        <button type="submit" disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// ── Pending Actions Panel ──
function PendingActionsTab({ token, conversationFilter }: { token: string; conversationFilter?: string }) {
  const [actions, setActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAction, setNewAction] = useState({ conversation_id: '', action_text: '', due_by: '' })
  const [conversations, setConversations] = useState<{ id: string; guest_name: string }[]>([])

  const fetchActions = useCallback(async () => {
    try {
      const qs = conversationFilter ? '?status=all' : '?status=pending'
      const data = await apiFetch(`/api/pending-actions${qs}`)
      let filtered = data.actions || []
      if (conversationFilter) {
        filtered = filtered.filter((a: PendingAction) => a.conversation_id === conversationFilter)
      }
      setActions(filtered)
    } catch { } finally { setLoading(false) }
  }, [conversationFilter])

  useEffect(() => { fetchActions() }, [fetchActions])

  useEffect(() => {
    if (showAddForm && conversations.length === 0) {
      apiFetch('/api/conversations').then(d => {
        setConversations((d.conversations || []).map((c: any) => ({ id: c.id, guest_name: c.guest_name })))
      }).catch(() => { })
    }
  }, [showAddForm, conversations.length])

  const handleAction = async (id: string, status: 'completed' | 'dismissed') => {
    try {
      await apiFetch(`/api/pending-actions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, completion_note: completionNotes[id] || undefined }),
      })
      toast.success(`Action ${status}`)
      fetchActions()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiFetch('/api/pending-actions', {
        method: 'POST',
        body: JSON.stringify(newAction),
      })
      toast.success('Action created')
      setShowAddForm(false)
      setNewAction({ conversation_id: '', action_text: '', due_by: '' })
      fetchActions()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const ageBadge = (action: PendingAction) => {
    const mins = action.age_minutes ?? (Date.now() - new Date(action.detected_at).getTime()) / 60000
    const hours = mins / 60
    const isOverdue = action.due_by && new Date(action.due_by) < new Date() && action.status === 'pending'
    if (isOverdue) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">OVERDUE</span>
    if (hours > 6) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{Math.round(hours)}h</span>
    if (hours > 2) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{Math.round(hours)}h</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{mins < 60 ? `${Math.round(mins)}m` : `${Math.round(hours)}h`}</span>
  }

  if (loading) return <div className="p-4 text-center text-gray-500">Loading actions...</div>

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {!conversationFilter && (
        <div className="p-3 border-b flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{actions.length} pending action{actions.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
            <PlusIcon className="h-4 w-4 mr-1" /> Add
          </button>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreate} className="p-3 border-b bg-blue-50 space-y-2">
          <select value={newAction.conversation_id} onChange={e => setNewAction({ ...newAction, conversation_id: e.target.value })}
            className="w-full text-sm border rounded px-2 py-1" required>
            <option value="">Select conversation...</option>
            {conversations.map(c => <option key={c.id} value={c.id}>{c.guest_name}</option>)}
          </select>
          <input type="text" placeholder="Action text..." value={newAction.action_text}
            onChange={e => setNewAction({ ...newAction, action_text: e.target.value })}
            className="w-full text-sm border rounded px-2 py-1" required />
          <input type="datetime-local" value={newAction.due_by}
            onChange={e => setNewAction({ ...newAction, due_by: e.target.value })}
            className="w-full text-sm border rounded px-2 py-1" />
          <div className="flex space-x-2">
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Create</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500">Cancel</button>
          </div>
        </form>
      )}

      {actions.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          <CheckIcon className="h-10 w-10 mx-auto mb-2" />
          <p className="text-sm">No pending actions</p>
        </div>
      ) : (
        actions.map(action => (
          <div key={action.id} className={`p-3 border-b hover:bg-gray-50 ${action.status !== 'pending' ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-gray-900">{action.guest_name}</span>
              {action.status === 'pending' && ageBadge(action)}
            </div>
            {action.property_code && <div className="text-xs text-gray-500 mb-1">{action.property_code}</div>}
            <p className="text-sm text-gray-700 mb-2">{action.action_text}</p>
            {action.status === 'pending' ? (
              <div className="space-y-1">
                <input type="text" placeholder="Note (optional)..."
                  value={completionNotes[action.id] || ''}
                  onChange={e => setCompletionNotes({ ...completionNotes, [action.id]: e.target.value })}
                  className="w-full text-xs border rounded px-2 py-1" />
                <div className="flex space-x-2">
                  <button onClick={() => handleAction(action.id, 'completed')}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Done</button>
                  <button onClick={() => handleAction(action.id, 'dismissed')}
                    className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500">Dismiss</button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                {action.status} {action.completed_by ? `by ${action.completed_by}` : ''}
                {action.completion_note ? ` - ${action.completion_note}` : ''}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

// ── Main Dashboard ──
export default function MessageDashboard() {
  const [token, setTokenState] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [stats, setStats] = useState<InboxStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'review' | 'open' | 'done' | 'actions'>('all')
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [revisionText, setRevisionText] = useState('')
  const [revisingDraft, setRevisingDraft] = useState<string | null>(null)
  const [rejectingDraft, setRejectingDraft] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [staffNotes, setStaffNotes] = useState('')
  const [showDoneWarning, setShowDoneWarning] = useState(false)
  const [doneWarningCount, setDoneWarningCount] = useState(0)
  const notesTimerRef = useRef<NodeJS.Timeout | null>(null)
  const sseRef = useRef<EventSource | null>(null)

  // Init auth
  useEffect(() => {
    const t = getToken()
    if (t) setTokenState(t)
    else setLoading(false)
  }, [])

  const handleLogin = (t: string) => {
    setToken(t)
    setTokenState(t)
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
    } catch { }
  }, [])

  // Fetch conversation detail
  const fetchDetail = useCallback(async (convId: string) => {
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
            fetchDetail(selectedConvId)
          }
          if (data.type === 'new_message') toast.success('New message received')
        }
      } catch { }
    }

    es.onerror = () => {
      console.log('[SSE] Connection error, reconnecting...')
    }

    return () => es.close()
  }, [token, selectedConvId, fetchConversations, fetchStats, fetchDetail])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!token) return
    const iv = setInterval(() => { fetchConversations(); fetchStats() }, 30000)
    return () => clearInterval(iv)
  }, [token, fetchConversations, fetchStats])

  const selectConversation = (conv: Conversation) => {
    setSelectedConvId(conv.id)
    fetchDetail(conv.id)
  }

  const handleDraftAction = async (draftId: string, action: 'approve' | 'reject', editedBody?: string) => {
    try {
      if (action === 'approve') {
        await apiFetch(`/api/drafts/${draftId}/approve`, {
          method: 'POST',
          body: JSON.stringify({ reviewed_by: 'dashboard' }),
        })
        toast.success('Draft approved and sent')
      } else {
        await apiFetch(`/api/drafts/${draftId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: 'Rejected from dashboard' }),
        })
        toast.success('Draft rejected')
      }
      setEditingDraft(null)
      if (selectedConvId) fetchDetail(selectedConvId)
      fetchConversations()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRevision = async (draftId: string) => {
    if (!revisionText.trim()) return
    setRevisingDraft(draftId)
    try {
      await apiFetch(`/api/drafts/${draftId}/revise`, {
        method: 'POST',
        body: JSON.stringify({ revision_instruction: revisionText.trim(), reviewed_by: 'dashboard' }),
      })
      toast.success('Revision requested — new draft coming...')
      setRevisionText('')
      // Poll for updated draft after short delay
      setTimeout(() => { if (selectedConvId) fetchDetail(selectedConvId) }, 3000)
      setTimeout(() => { if (selectedConvId) fetchDetail(selectedConvId) }, 8000)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRevisingDraft(null)
    }
  }

  const handleRejectWithReason = async (draftId: string) => {
    try {
      await apiFetch(`/api/drafts/${draftId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewed_by: 'dashboard', rejection_reason: rejectReason.trim() || 'Rejected from dashboard' }),
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

  const statusBadge = (conv: Conversation) => {
    if (conv.status === 'done') return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Done</span>
    if (conv.latest_draft_state === 'draft_ready') return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Review</span>
    if (conv.latest_draft_state === 'sent') return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Sent</span>
    return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Open</span>
  }

  const channelEmoji = (ch?: string) => {
    if (!ch) return ''
    const m: Record<string, string> = { airbnb: 'AB', booking: 'BK', direct: 'DR', other: 'OT', whatsapp: 'WA' }
    return m[ch] || ch.slice(0, 2).toUpperCase()
  }

  const draftStateBadge = (state?: string) => {
    if (!state) return null
    const m: Record<string, { bg: string; text: string; label: string }> = {
      draft_ready: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Needs Review' },
      under_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Under Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sending...' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Sent' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      send_failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Send Failed' },
      generation_failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Gen Failed' },
    }
    const s = m[state]
    if (!s) return <span className="text-xs text-gray-500">{state}</span>
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>
  }

  const rtColor = (mins?: number) => {
    if (!mins && mins !== 0) return 'text-gray-400'
    if (mins <= 15) return 'text-green-600'
    if (mins <= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Friday GMS...</p>
        </div>
      </div>
    )
  }

  if (!token) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Friday GMS</h1>
              <p className="text-xs text-gray-500">Guest Messaging System</p>
            </div>

            {stats && (
              <div className="flex space-x-5 items-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{stats.needs_review_count}</div>
                  <div className="text-xs text-gray-500">Review</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${rtColor(stats.avg_response_time_minutes)}`}>{stats.avg_response_time_minutes}m</div>
                  <div className="text-xs text-gray-500">Avg RT</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.messages_today}</div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${stats.overdue_actions_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.pending_actions_count}
                  </div>
                  <div className="text-xs text-gray-500">
                    Actions {stats.overdue_actions_count > 0 && <span className="text-red-600">({stats.overdue_actions_count} overdue)</span>}
                  </div>
                </div>
                <button onClick={() => { clearToken(); setTokenState(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-4">Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)]">
        {/* Left sidebar - conversation list */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b text-xs">
            {([
              ['all', 'All'],
              ['unread', 'Unread'],
              ['review', 'Review'],
              ['open', 'Open'],
              ['done', 'Done'],
              ['actions', 'Actions'],
            ] as [string, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === key ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
                {key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-blue-500 text-white">{unreadCount}</span>
                )}
                {key === 'actions' && stats && stats.pending_actions_count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${stats.overdue_actions_count > 0 ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-700'}`}>
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
                <div className="p-4 text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No conversations</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div key={conv.id} onClick={() => selectConversation(conv)}
                    className={`group relative p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConvId === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    } ${conv.is_unread ? 'font-semibold' : ''}`}>
                    {/* Hover action: mark as unread */}
                    {!conv.is_unread && (
                      <button onClick={(e) => handleMarkUnread(conv.id, e)}
                        title="Mark as unread"
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 z-10">
                        <EyeSlashIcon className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    )}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {conv.is_unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                        <span className="text-sm truncate">{conv.guest_name}</span>
                        {conv.channel && <span className="text-xs text-gray-400 px-1 bg-gray-100 rounded">{channelEmoji(conv.channel)}</span>}
                      </div>
                      {conv.last_message_at && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 mb-1">
                      {conv.property_name && (
                        <span className="text-xs text-gray-500">{conv.property_name}</span>
                      )}
                      {statusBadge(conv)}
                      {conv.latest_draft_confidence && (() => {
                        const c = Number(conv.latest_draft_confidence)
                        const cls = c >= 80 ? 'bg-green-100 text-green-800' : c >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        return <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{c}%</span>
                      })()}
                    </div>
                    {conv.last_message_body && (
                      <p className="text-xs text-gray-500 truncate">
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
              <div className="flex-1 flex flex-col min-w-0">
                {/* Conversation header */}
                <div className="bg-white border-b p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{detail.conversation.guest_name}</h2>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        {detail.conversation.property_name && <span>{detail.conversation.property_name}</span>}
                        {detail.conversation.channel && <span className="px-1 bg-gray-100 rounded">{channelEmoji(detail.conversation.channel)}</span>}
                        {detail.conversation.check_in_date && detail.conversation.check_out_date && (
                          <span>{format(new Date(detail.conversation.check_in_date), 'MMM d')} - {format(new Date(detail.conversation.check_out_date), 'MMM d')}</span>
                        )}
                        {detail.conversation.num_guests && <span>{detail.conversation.num_guests} guests</span>}
                      </div>
                    </div>
                    {detail.conversation.first_response_minutes !== null && detail.conversation.first_response_minutes !== undefined && (
                      <span className={`text-xs font-medium ${rtColor(detail.conversation.first_response_minutes)}`}>
                        RT: {detail.conversation.first_response_minutes}m
                      </span>
                    )}
                  </div>
                  {detail.conversation.conversation_summary && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">{detail.conversation.conversation_summary}</p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {detail.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xl px-4 py-2.5 rounded-lg ${
                        msg.direction === 'outbound' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap" dir="auto">{msg.body}</p>
                        {msg.translated_body && msg.translated_body !== msg.body && (
                          <div className={`text-xs mt-2 pt-2 border-t ${msg.direction === 'outbound' ? 'border-blue-500 text-blue-100' : 'border-gray-200 text-gray-500'}`}>
                            <LanguageIcon className="h-3 w-3 inline mr-1" /> <span dir="auto">{msg.translated_body}</span>
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                          {format(new Date(msg.created_at), 'HH:mm')} {msg.sender_name && `- ${msg.sender_name}`}
                          {msg.direction === 'inbound' && msg.original_language && msg.original_language !== 'en' && (
                            <span className="ml-1">{LANG_FLAGS[msg.original_language] || ''} {LANG_NAMES[msg.original_language] || msg.original_language}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Latest draft */}
                  {detail.drafts.filter(d => ['draft_ready', 'under_review'].includes(d.state)).map(draft => (
                    <div key={draft.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-amber-800 flex items-center">
                          <GlobeAltIcon className="h-4 w-4 mr-1.5" /> AI Draft
                          {draft.confidence != null && (() => {
                            const c = Number(draft.confidence)
                            const cls = c >= 80 ? 'bg-green-100 text-green-800' : c >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            return <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{c}%</span>
                          })()}
                        </h4>
                        {draftStateBadge(draft.state)}
                      </div>

                      {editingDraft === draft.id ? (
                        <div className="space-y-2">
                          <textarea value={editBody} onChange={e => setEditBody(e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm" rows={4} />
                          <div className="flex space-x-2">
                            <button onClick={() => { handleDraftAction(draft.id, 'approve', editBody) }}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">Save and Send</button>
                            <button onClick={() => setEditingDraft(null)}
                              className="px-3 py-1.5 bg-gray-400 text-white text-sm rounded hover:bg-gray-500">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white p-3 rounded border text-sm mb-2 whitespace-pre-wrap" dir="auto">{draft.draft_body}</div>
                          {draft.draft_translated && draft.draft_translated !== draft.draft_body && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm mb-2">
                              <LanguageIcon className="h-3 w-3 inline mr-1 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600">Translated:</span>
                              <p className="mt-1 whitespace-pre-wrap" dir="auto">{draft.draft_translated}</p>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button onClick={() => handleDraftAction(draft.id, 'approve')}
                              className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" /> Approve and Send
                            </button>
                            <button onClick={() => { setEditingDraft(draft.id); setEditBody(draft.draft_body) }}
                              className="flex items-center px-3 py-1.5 bg-amber-500 text-white text-sm rounded hover:bg-amber-600">
                              <PencilSquareIcon className="h-4 w-4 mr-1" /> Edit
                            </button>
                            <button onClick={() => { setRejectingDraft(rejectingDraft === draft.id ? null : draft.id); setRejectReason('') }}
                              className="flex items-center px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                              <XMarkIcon className="h-4 w-4 mr-1" /> Reject
                            </button>
                          </div>

                          {/* Rejection reason */}
                          {rejectingDraft === draft.id && (
                            <div className="mt-2 flex space-x-2">
                              <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                placeholder="Why are you rejecting? (helps Judith learn)"
                                className="flex-1 text-sm border rounded px-2 py-1"
                                onKeyDown={e => { if (e.key === 'Enter') handleRejectWithReason(draft.id) }} />
                              <button onClick={() => handleRejectWithReason(draft.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">Reject</button>
                            </div>
                          )}

                          {/* Revision input */}
                          <div className="mt-3 flex space-x-2">
                            <input type="text" value={revisionText} onChange={e => setRevisionText(e.target.value)}
                              placeholder="Ask Judith to adjust... (e.g. 'make it shorter', 'add WiFi password')"
                              className="flex-1 text-sm border border-purple-200 rounded px-2 py-1.5 bg-purple-50 placeholder-purple-300 focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                              disabled={revisingDraft === draft.id}
                              onKeyDown={e => { if (e.key === 'Enter') handleRevision(draft.id) }} />
                            <button onClick={() => handleRevision(draft.id)}
                              disabled={revisingDraft === draft.id || !revisionText.trim()}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50">
                              {revisingDraft === draft.id ? 'Revising...' : 'Revise'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Sent drafts with translations */}
                  {detail.drafts.filter(d => d.state === 'sent' && d.translated_content && d.sent_language).map(draft => {
                    const lang = draft.sent_language || 'unknown'
                    return (
                      <div key={`sent-${draft.id}`} className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                        <div className="text-xs font-medium text-green-700 mb-1">Approved English draft:</div>
                        <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{draft.draft_body}</p>
                        <div className="border-t border-green-200 pt-2">
                          <div className="text-xs font-medium text-green-700 mb-1">Sent in {LANG_FLAGS[lang] || ''} {LANG_NAMES[lang] || lang}:</div>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{draft.translated_content}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right sidebar - conversation info + pending actions */}
              <div className="w-72 bg-white border-l overflow-y-auto custom-scrollbar">
                <div className="p-3 border-b">
                  <h3 className="text-sm font-semibold text-gray-700">Conversation Info</h3>
                </div>
                <div className="p-3 space-y-2 text-xs text-gray-600 border-b">
                  {detail.conversation.guest_email && <div>Email: {detail.conversation.guest_email}</div>}
                  {detail.conversation.channel && <div>Channel: {detail.conversation.channel}</div>}
                  {detail.conversation.check_in_date && <div>Check-in: {format(new Date(detail.conversation.check_in_date), 'MMM d, yyyy')}</div>}
                  {detail.conversation.check_out_date && <div>Check-out: {format(new Date(detail.conversation.check_out_date), 'MMM d, yyyy')}</div>}
                  {detail.conversation.num_guests && <div>{detail.conversation.num_guests} guest{detail.conversation.num_guests > 1 ? 's' : ''}</div>}
                  <div>{detail.conversation.inbound_count || 0} inbound messages</div>
                </div>

                {/* Mark as Done / Reopen button */}
                <div className="p-3 border-b">
                  {detail.conversation.status === 'done' ? (
                    <button onClick={() => handleReopen(detail.conversation.id)}
                      className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      <ArrowPathIcon className="h-4 w-4 mr-1.5" /> Reopen Conversation
                    </button>
                  ) : (
                    <button onClick={() => handleMarkDone(detail.conversation.id)}
                      className="w-full flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                      <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Mark as Done
                    </button>
                  )}
                </div>

                {/* Pending actions warning modal */}
                {showDoneWarning && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
                      <div className="flex items-center mb-3">
                        <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Open Actions</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        This conversation has <strong>{doneWarningCount}</strong> open action{doneWarningCount !== 1 ? 's' : ''}. Complete or dismiss them first.
                      </p>
                      <div className="flex space-x-2">
                        <button onClick={() => { setShowDoneWarning(false); setActiveTab('actions') }}
                          className="flex-1 px-3 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600">
                          View Actions
                        </button>
                        <button onClick={() => setShowDoneWarning(false)}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-send toggle */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Auto-send</span>
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
                    }} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${detail.conversation.auto_send_enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${detail.conversation.auto_send_enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{detail.conversation.auto_send_enabled ? 'On — routine replies ≥85% send automatically' : 'Off — all drafts require review'}</p>
                </div>

                {/* Staff notes */}
                <div className="p-3 border-b">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Staff Notes</h3>
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
                    placeholder="Add notes... (e.g. 'VIP guest', 'needs early check-in')"
                    className="w-full text-xs border rounded px-2 py-1.5 resize-none" rows={3} />
                </div>

                {/* Draft history */}
                {detail.drafts.length > 0 && (
                  <div className="border-b">
                    <div className="p-3 pb-1">
                      <h3 className="text-sm font-semibold text-gray-700">Draft History</h3>
                    </div>
                    <div className="p-3 pt-1 space-y-1.5">
                      {detail.drafts.map(d => (
                        <div key={d.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{format(new Date(d.created_at), 'MMM d HH:mm')}</span>
                          {draftStateBadge(d.state)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending actions for this conversation */}
                <div>
                  <div className="p-3 pb-1">
                    <h3 className="text-sm font-semibold text-gray-700">Pending Actions</h3>
                  </div>
                  <PendingActionsTab token={token} conversationFilter={selectedConvId} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-20 w-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Friday GMS</h3>
                <p className="text-gray-500 text-sm max-w-md">Select a conversation to view messages, review AI drafts, and manage guest communication.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
