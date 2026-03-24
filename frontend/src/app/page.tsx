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
  localStorage.removeItem('gms_token');
  localStorage.removeItem('gms_display_name');
  localStorage.removeItem('gms_role');
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
      localStorage.setItem('gms_display_name', data.display_name || data.username)
      localStorage.setItem('gms_role', data.role || 'agent')
      onLogin(data.token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)'}}>
      <form onSubmit={handleSubmit} className="p-8 rounded-xl w-full max-w-sm" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)'}}>
        <h1 className="text-2xl font-bold mb-1" style={{color: '#f1f5f9'}}>Friday GMS</h1>
        <p className="text-sm mb-6" style={{color: '#64748b'}}>Guest Messaging System</p>
        {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
        <button type="submit" disabled={loading}
          className="w-full py-2 rounded-lg font-medium disabled:opacity-50" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>
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
    if (isOverdue) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>OVERDUE</span>
    if (hours > 6) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{Math.round(hours)}h</span>
    if (hours > 2) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>{Math.round(hours)}h</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>{mins < 60 ? `${Math.round(mins)}m` : `${Math.round(hours)}h`}</span>
  }

  if (loading) return <div className="p-4 text-center" style={{color: '#64748b'}}>Loading actions...</div>

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {!conversationFilter && (
        <div className="p-3 flex justify-between items-center" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <span className="text-sm font-medium" style={{color: '#94a3b8'}}>{actions.length} pending action{actions.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center text-sm" style={{color: '#6395ff'}}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add
          </button>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreate} className="p-3 space-y-2" style={{borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,149,255,0.06)'}}>
          <select value={newAction.conversation_id} onChange={e => setNewAction({ ...newAction, conversation_id: e.target.value })}
            className="w-full text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} required>
            <option value="">Select conversation...</option>
            {conversations.map(c => <option key={c.id} value={c.id}>{c.guest_name}</option>)}
          </select>
          <input type="text" placeholder="Action text..." value={newAction.action_text}
            onChange={e => setNewAction({ ...newAction, action_text: e.target.value })}
            className="w-full text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} required />
          <input type="datetime-local" value={newAction.due_by}
            onChange={e => setNewAction({ ...newAction, due_by: e.target.value })}
            className="w-full text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
          <div className="flex space-x-2">
            <button type="submit" className="px-3 py-1 text-xs rounded" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Create</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
          </div>
        </form>
      )}

      {actions.length === 0 ? (
        <div className="p-6 text-center" style={{color: '#64748b'}}>
          <CheckIcon className="h-10 w-10 mx-auto mb-2" />
          <p className="text-sm">No pending actions</p>
        </div>
      ) : (
        actions.map(action => (
          <div key={action.id} className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: action.status !== 'pending' ? 0.5 : 1}}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium" style={{color: '#f1f5f9'}}>{action.guest_name}</span>
              {action.status === 'pending' && ageBadge(action)}
            </div>
            {action.property_code && <div className="text-xs mb-1" style={{color: '#64748b'}}>{action.property_code}</div>}
            <p className="text-sm mb-2" style={{color: '#94a3b8'}}>{action.action_text}</p>
            {action.status === 'pending' ? (
              <div className="space-y-1">
                <input type="text" placeholder="Note (optional)..."
                  value={completionNotes[action.id] || ''}
                  onChange={e => setCompletionNotes({ ...completionNotes, [action.id]: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                <div className="flex space-x-2">
                  <button onClick={() => handleAction(action.id, 'completed')}
                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>Done</button>
                  <button onClick={() => handleAction(action.id, 'dismissed')}
                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Dismiss</button>
                </div>
              </div>
            ) : (
              <div className="text-xs" style={{color: '#64748b'}}>
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


// ── Help Panel ──
function HelpPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  // ExpandableSection sub-component for training content
  const ExpandableSection = ({title, children}: {title: string, children: React.ReactNode}) => {
    const [open, setOpen] = useState(false)
    return (
      <section>
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wide mb-1" style={{color: '#6395ff'}}>
          <span>{title}</span>
          <span style={{color: '#64748b'}}>{open ? '▼' : '▶'}</span>
        </button>
        {open && <div className="mt-2 text-xs leading-relaxed" style={{color: '#94a3b8'}}>{children}</div>}
      </section>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)'}} />
      <div className="relative w-[340px] h-full overflow-y-auto slide-in-right custom-scrollbar" 
           style={{background: 'rgba(15,25,50,0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)'}}
           onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 px-6 pt-5 pb-4 flex items-center justify-between" style={{background: 'rgba(15,25,50,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div>
            <div className="text-base font-bold" style={{color: '#f1f5f9'}}>Friday GMS</div>
            <div className="text-xs" style={{color: '#64748b'}}>Quick guide</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center" style={{background: 'rgba(255,255,255,0.06)', color: '#64748b'}}>✕</button>
        </div>
        <div className="px-6 py-5 space-y-6">
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>How it works</h4>
            <p className="text-xs leading-relaxed mb-2" style={{color: '#94a3b8'}}>When a guest sends a message, Judith automatically:</p>
            <div className="space-y-1.5">
              {['Detects the language and translates if needed', 'Summarizes the conversation', 'Drafts a reply with a confidence score', 'Queues it for your review'].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{color: '#94a3b8'}}>
                  <span className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-semibold" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}}>{i+1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Confidence scores</h4>
            <div className="space-y-2">
              {[
                {range: '80-98%', color: '#4ade80', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.1)', badge: 'rgba(34,197,94,0.15)', label: 'Green', desc: 'Routine question with good context. Quick review and approve.'},
                {range: '60-79%', color: '#fbbf24', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.1)', badge: 'rgba(245,158,11,0.15)', label: 'Amber', desc: 'Check carefully, might need revision.'},
                {range: 'Below 60%', color: '#f87171', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.1)', badge: 'rgba(239,68,68,0.15)', label: 'Red', desc: 'Complex situation, complaint, or missing context. Review closely.'},
              ].map(s => (
                <div key={s.range} className="rounded-lg p-2.5" style={{background: s.bg, border: `1px solid ${s.border}`}}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{background: s.badge, color: s.color}}>{s.range}</span>
                    <span className="text-xs font-semibold" style={{color: s.color}}>{s.label}</span>
                  </div>
                  <div className="text-xs" style={{color: '#94a3b8'}}>{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Reviewing drafts</h4>
            <div className="space-y-1.5 text-xs" style={{color: '#94a3b8'}}>
              {[
                ['Read the draft', ' in the center panel'],
                ['Edit directly', ' — click Edit to make changes'],
                ['Ask Judith to revise', ' — type an instruction below the draft'],
                ['Approve & Send', ' — sends via the guest\'s booking platform'],
                ['Reject', ' — discards with a reason (helps Judith learn)'],
              ].map(([bold, rest], i) => (
                <div key={i}><span style={{color: '#e2e8f0', fontWeight: 500}}>{bold}</span>{rest}</div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Tips for great revisions</h4>
            <div className="space-y-1.5">
              {[
                ['"Add the WiFi password"', '"Add more info"'],
                ['"Guest seems upset, be extra empathetic"', '"Make it better"'],
                ['"Mention the beach is 2 min walk"', '"Talk about the location"'],
              ].map(([good, bad], i) => (
                <div key={i} className="rounded-md p-2 text-xs" style={{background: 'rgba(255,255,255,0.03)'}}>
                  <span style={{color: '#4ade80'}}>Good:</span> <span style={{color: '#e2e8f0'}}>{good}</span><br/>
                  <span style={{color: '#f87171'}}>Vague:</span> <span style={{color: '#64748b'}}>{bad}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Pending actions</h4>
            <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
              When we promise something to a guest, it appears in the <span style={{color: '#fbbf24'}}>Actions</span> tab. Age badges show urgency:
            </p>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>under 2h</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>2-6h</span>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>6h+ overdue</span>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Keyboard shortcuts</h4>
            <div className="space-y-1.5">
              {[
                ['Navigate conversations', ['↑', '↓']],
                ['Open conversation', ['Enter']],
                ['Focus "Ask Judith"', ['/']],
                ['Approve & send', ['⌘', '↵']],
                ['Deselect', ['Esc']],
              ].map(([label, keys]) => (
                <div key={label as string} className="flex items-center justify-between text-xs">
                  <span style={{color: '#94a3b8'}}>{label as string}</span>
                  <div className="flex gap-1">
                    {(keys as string[]).map(k => (
                      <span key={k} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{background: 'rgba(255,255,255,0.08)', color: '#e2e8f0'}}>{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Staff notes</h4>
            <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
              The notes field in the right panel is shared with Judith. Anything you write becomes context for future drafts.
            </p>
            <div className="space-y-1 mt-2">
              {['"VIP guest, husband proposed here last year"', '"Guest is elderly, needs ground floor access"', '"Repeat guest, prefers early check-in"'].map(ex => (
                <div key={ex} className="rounded px-2 py-1 text-xs italic" style={{background: 'rgba(255,255,255,0.03)', color: '#e2e8f0'}}>{ex}</div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2.5" style={{color: '#6395ff'}}>Auto-send</h4>
            <p className="text-xs leading-relaxed" style={{color: '#94a3b8'}}>
              Toggle per conversation in the right panel. When enabled, replies with 85%+ confidence for routine questions send automatically.
            </p>
            <div className="mt-2 rounded-md px-2.5 py-1.5 text-xs" style={{background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24'}}>
              Start with this OFF until you trust Judith&apos;s drafts
            </div>
          </section>

          
          {/* Team Training Sections */}
          <ExpandableSection title="How confidence scores work">
            <div className="space-y-2">
              <p>Judith calculates confidence using a weighted formula:</p>
              <div className="pl-2 space-y-1" style={{color: '#64748b'}}>
                <div>• Base score: 75%</div>
                <div>• Message type: +20% routine, -15% complaints</div>
                <div>• Reservation context: +15% good, -10% missing</div>
                <div>• Property knowledge: +10% relevant, -10% unknown</div>
                <div>• Language: -5% non-English</div>
                <div>• Complexity: -5% per extra question</div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="rounded p-2" style={{background: 'rgba(34,197,94,0.08)'}}>
                  <div className="text-xs font-semibold" style={{color: '#4ade80'}}>Example: Routine WiFi question</div>
                  <div className="text-xs mt-1" style={{color: '#64748b'}}>75% + 20% (routine) + 15% (good context) + 10% (property info) = 95%</div>
                </div>
                <div className="rounded p-2" style={{background: 'rgba(239,68,68,0.08)'}}>
                  <div className="text-xs font-semibold" style={{color: '#f87171'}}>Example: Complex complaint</div>
                  <div className="text-xs mt-1" style={{color: '#64748b'}}>75% - 15% (complaint) - 10% (missing context) - 10% (complex) = 40%</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="How to help Judith learn">
            <div className="space-y-2">
              <p>Every interaction teaches Judith:</p>
              <div className="space-y-1.5">
                <div><span style={{color: '#4ade80', fontWeight: 500}}>Staff notes</span> — Context becomes part of future drafts</div>
                <div><span style={{color: '#4ade80', fontWeight: 500}}>Revision instructions</span> — "Add WiFi password" improves similar responses</div>
                <div><span style={{color: '#4ade80', fontWeight: 500}}>Rejections with reasons</span> — "Too formal" or "Missing empathy" refines tone</div>
              </div>
              <div className="mt-3 rounded-md p-2.5" style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)'}}>
                <div className="text-xs font-semibold mb-1" style={{color: '#f87171'}}>How NOT to teach</div>
                <div className="space-y-1 text-xs" style={{color: '#94a3b8'}}>
                  <div>❌ "This is wrong" (no specifics)</div>
                  <div>❌ "Make it better" (too vague)</div>
                  <div>❌ Approving bad drafts to save time</div>
                  <div>❌ Rejecting without explanation</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="What Judith can and can't do">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{color: '#4ade80'}}>✅ What Judith CAN do</div>
                <div className="space-y-1 text-xs pl-2" style={{color: '#94a3b8'}}>
                  <div>• Draft personalized replies in guest's language</div>
                  <div>• Detect complaint tone and urgency levels</div>
                  <div>• Use property-specific knowledge (WiFi, amenities, directions)</div>
                  <div>• Translate messages in 50+ languages</div>
                  <div>• Track promises and create action items</div>
                  <div>• Suggest empathetic responses for upset guests</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{color: '#f87171'}}>❌ What Judith CAN'T do (yet)</div>
                <div className="space-y-1 text-xs pl-2" style={{color: '#94a3b8'}}>
                  <div>• Send messages without human approval</div>
                  <div>• Access Breezeway for maintenance requests</div>
                  <div>• Modify reservations or booking details</div>
                  <div>• Handle payments, refunds, or billing issues</div>
                  <div>• Make decisions about property policies</div>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Escalation triggers">
            <div className="space-y-2">
              <p>Always escalate these to <span style={{color: '#6395ff', fontWeight: 500}}>@Ishant</span> immediately:</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Refund requests over $100</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Safety, security, or emergency situations</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Legal threats or liability concerns</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Guest injuries or medical incidents</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Property damage reports</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Discrimination or harassment allegations</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Issues involving minors or child safety</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Payment processing problems</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Booking modifications affecting revenue</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Noise complaints involving police</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span style={{color: '#f87171'}}>⚠️</span>
                  <span style={{color: '#94a3b8'}}>Threats of negative reviews over policy disputes</span>
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="The 'exception' pattern">
            <div className="space-y-2">
              <p>When granting special requests, use this proven formula:</p>
              <div className="space-y-2 mt-3">
                <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>1. Grant the favor</div>
                  <div className="text-xs italic" style={{color: '#94a3b8'}}>"I've arranged early check-in at 2 PM for you."</div>
                </div>
                <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>2. Frame as exception</div>
                  <div className="text-xs italic" style={{color: '#94a3b8'}}>"This is a special accommodation as our standard check-in is 4 PM."</div>
                </div>
                <div className="rounded-md p-2.5" style={{background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)'}}>
                  <div className="text-xs font-semibold mb-1" style={{color: '#6395ff'}}>3. Ask for 5-star review</div>
                  <div className="text-xs italic" style={{color: '#94a3b8'}}>"We'd be grateful if you could mention this flexibility in your review!"</div>
                </div>
              </div>
              <div className="mt-3 text-xs" style={{color: '#64748b'}}>
                This positions favors as value-adds while encouraging positive feedback.
              </div>
            </div>
          </ExpandableSection>


          <div className="rounded-lg p-4 text-center" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)'}}>
            <div className="text-xs" style={{color: '#94a3b8'}}>Need help? Tag <span style={{color: '#6395ff', fontWeight: 500}}>@Ishant</span> in Slack</div>
            <div className="text-xs mt-0.5" style={{color: '#64748b'}}>or message Judith directly</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ──
export default function MessageDashboard() {
  const [token, setTokenState] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('Dashboard')
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
  const [showTeachPrompt, setShowTeachPrompt] = useState<string | null>(null)
  const [teachScope, setTeachScope] = useState<'global' | 'property'>('global')
  const [showTeachingsPanel, setShowTeachingsPanel] = useState(false)
  const [teachings, setTeachings] = useState<any[]>([])
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [newTeachingText, setNewTeachingText] = useState('')
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
  const [isMuted, setIsMuted] = useState(false)
  const revisionInputRef = useRef<HTMLInputElement>(null)

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

  // Play notification chime using AudioContext
  const playChime = useCallback(() => {
    try {
      const ctx = new AudioContext()
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
      setTimeout(() => ctx.close(), 500)
    } catch {}
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
  }, [token, selectedConvId, fetchConversations, fetchStats, fetchDetail, isMuted, playChime])

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

  // Show confirmation modal before sending
  const requestApproval = (draftId: string) => {
    if (!detail) return
    const draft = detail.drafts.find(d => d.id === draftId)
    if (!draft) return
    setSendChannel(detail?.conversation.channel || 'airbnb')
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
          body: JSON.stringify({ reviewed_by: displayName }),
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
      setTimeout(() => { if (selectedConvId) fetchDetail(selectedConvId) }, 3000)
      setTimeout(() => { if (selectedConvId) fetchDetail(selectedConvId) }, 8000)
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
      booking: { label: 'Booking', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
      direct: { label: 'Direct', bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
      whatsapp: { label: 'WhatsApp', bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
      other: { label: 'Other', bg: 'rgba(255,255,255,0.08)', color: '#94a3b8' },
    }
    const c = channels[ch.toLowerCase()] || channels.other
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
                    {t.revoke_reason && <p className="text-xs mt-1" style={{color: '#f87171'}}>Reason: {t.revoke_reason}</p>}
                  </div>
                ))}
              </div>
            )}
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
              <div className="flex space-x-5 items-center">
                <div className="text-center">
                  <div className="text-lg font-bold" style={{color: '#fbbf24'}}>{stats.needs_review_count}</div>
                  <div className="text-xs" style={{color: '#64748b'}}>to review</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{color: stats.avg_response_time_minutes != null ? rtColor(stats.avg_response_time_minutes) : '#64748b'}}>
                    {stats.avg_response_time_minutes != null ? `${stats.avg_response_time_minutes} min` : '\u2014'}
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

      <div className="flex h-[calc(100vh-72px)]">
        {/* Left sidebar - conversation list */}
        <div className="w-80 flex flex-col" style={{background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'}}>
          {/* Tabs */}
          <div className="flex text-xs" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
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
                        <span className="text-xs" style={{color: '#94a3b8'}}>{conv.property_name}</span>
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
              <div className="flex-1 flex flex-col min-w-0">
                {/* Conversation header */}
                <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>{detail.conversation.guest_name}</h2>
                      <div className="flex items-center space-x-3 text-xs mt-1" style={{color: '#64748b'}}>
                        {detail.conversation.property_name && <span>{detail.conversation.property_name}</span>}
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

                  {/* Queued drafts - browser fallback pending */}
                  {detail.drafts.filter(d => d.state === "send_queued").map(draft => (
                    <div key={draft.id} className="rounded-lg p-3 mt-2" style={{background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)"}}>
                      <div className="flex items-center text-xs font-medium mb-1" style={{color: "#fbbf24"}}>
                        <span className="mr-1.5">⏳</span> Queued for sending — API unavailable, will send via browser fallback
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{color: "#e2e8f0"}}>{draft.draft_body}</p>
                    </div>
                  ))}

                  {/* Sent drafts with translations */}
                  {detail.drafts.filter(d => d.state === 'sent' && d.translated_content && d.sent_language).map(draft => {
                    const lang = draft.sent_language || 'unknown'
                    return (
                      <div key={`sent-${draft.id}`} className="rounded-lg p-3 mt-2" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
                        <div className="text-xs font-medium mb-1" style={{color: '#4ade80'}}>Approved English draft:</div>
                        <p className="text-sm mb-2 whitespace-pre-wrap" style={{color: '#e2e8f0'}}>{draft.draft_body}</p>
                        <div className="pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.1)'}}>
                          <div className="text-xs font-medium mb-1" style={{color: '#4ade80'}}>Sent in {LANG_FLAGS[lang] || ''} {LANG_NAMES[lang] || lang}:</div>
                          <p className="text-sm whitespace-pre-wrap" style={{color: '#94a3b8'}}>{draft.translated_content}</p>
                        <div className="text-xs mt-2 pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.1)', color: '#64748b'}}>Approved by {draft.reviewed_by} · {draft.sent_at ? format(new Date(draft.sent_at), 'MMM d HH:mm') : format(new Date(draft.updated_at), 'MMM d HH:mm')}</div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Sent drafts without translations */}
                  {detail.drafts.filter(d => d.state === 'sent' && !d.translated_content).map(draft => (
                    <div key={`sent-plain-${draft.id}`} className="rounded-lg p-3 mt-2" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)'}}>
                      <div className="text-xs font-medium mb-1" style={{color: '#4ade80'}}>Sent:</div>
                      <p className="text-sm whitespace-pre-wrap" style={{color: '#e2e8f0'}}>{draft.draft_body}</p>
                      <div className="text-xs mt-2 pt-2" style={{borderTop: '1px solid rgba(34,197,94,0.1)', color: '#64748b'}}>Approved by {draft.reviewed_by} · {draft.sent_at ? format(new Date(draft.sent_at), 'MMM d HH:mm') : format(new Date(draft.updated_at), 'MMM d HH:mm')}</div>
                    </div>
                  ))}

                  {/* Rejected drafts */}
                  {detail.drafts.filter(d => d.state === 'rejected').map(draft => (
                    <div key={`rejected-${draft.id}`} className="rounded-lg p-3 mt-2" style={{background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)'}}>
                      <div className="text-xs font-medium mb-1" style={{color: '#f87171'}}>Rejected:</div>
                      <p className="text-sm mb-2 whitespace-pre-wrap" style={{color: '#e2e8f0'}}>{draft.draft_body}</p>
                      <div className="text-xs pt-2" style={{borderTop: '1px solid rgba(239,68,68,0.1)', color: '#f87171'}}>Rejected by {draft.reviewed_by} · {draft.rejection_reason}</div>
                    </div>
                  ))}                </div>

                {/* Draft review section - pinned to bottom */}
                {detail.drafts.filter(d => ['draft_ready', 'under_review'].includes(d.state)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 1).map(draft => (
                    <div key={draft.id} className="rounded-lg p-4 mx-4 mb-2 flex-shrink-0 max-h-[40vh] overflow-y-auto custom-scrollbar" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.15)', borderTop: '1px solid rgba(255,255,255,0.06)'}}>
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
                            <button onClick={() => setEditingDraft(null)}
                              className="px-3 py-1.5 text-sm rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 rounded text-sm mb-2 whitespace-pre-wrap" dir="auto" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0'}}>{draft.draft_body}</div>
                          {draft.draft_translated && draft.draft_translated !== draft.draft_body && (
                            <div className="p-3 rounded text-sm mb-2" style={{background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)'}}>
                              <LanguageIcon className="h-3 w-3 inline mr-1" style={{color: '#6395ff'}} />
                              <span className="text-xs font-medium" style={{color: '#6395ff'}}>Translated:</span>
                              <p className="mt-1 whitespace-pre-wrap" dir="auto">{draft.draft_translated}</p>
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button onClick={() => requestApproval(draft.id)}
                              className="flex items-center px-3 py-1.5 text-sm rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" /> Approve & Send
                            </button>
                            <button onClick={() => { setEditingDraft(draft.id); setEditBody(draft.draft_body) }}
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
                            <div className="mt-2 flex space-x-2">
                              <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                placeholder="Why are you rejecting? (helps Judith learn)"
                                className="flex-1 text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                                onKeyDown={e => { if (e.key === 'Enter') handleRejectWithReason(draft.id) }} />
                              <button onClick={() => handleRejectWithReason(draft.id)}
                                className="px-3 py-1 text-xs rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>Reject</button>
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
              <div className="w-72 overflow-y-auto custom-scrollbar" style={{background: 'rgba(255,255,255,0.05)', borderLeft: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'}}>
                <div className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  <h3 className="text-xs font-semibold" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Guest Info</h3>
                </div>
                <div className="p-3 space-y-2 text-xs" style={{color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
                  {detail.conversation.guest_email && <div>Email: {detail.conversation.guest_email}</div>}
                  {detail.conversation.channel && <div>Channel: {detail.conversation.channel}</div>}
                  {detail.conversation.check_in_date && <div>Check-in: {format(new Date(detail.conversation.check_in_date), 'MMM d, yyyy')}</div>}
                  {detail.conversation.check_out_date && <div>Check-out: {format(new Date(detail.conversation.check_out_date), 'MMM d, yyyy')}</div>}
                  {detail.conversation.num_guests && <div>{detail.conversation.num_guests} guest{detail.conversation.num_guests > 1 ? 's' : ''}</div>}
                  <div>{detail.conversation.inbound_count || 0} inbound messages</div>
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
