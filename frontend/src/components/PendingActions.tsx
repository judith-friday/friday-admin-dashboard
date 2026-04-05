'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  CheckIcon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  InboxIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { apiFetch, PendingAction } from './types'
import ConsultChat from './ConsultChat'
import { trackEvent } from '../lib/analytics'

type SortKey = 'urgency' | 'newest' | 'oldest' | 'guest'

export default function PendingActionsTab({ token, conversationFilter, onNavigateToConversation }: { token: string; conversationFilter?: string; onNavigateToConversation?: (convId: string) => void }) {
  const [actions, setActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>('urgency')
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editDueBy, setEditDueBy] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAction, setNewAction] = useState({ conversation_id: '', action_text: '', due_by: '' })
  const [conversations, setConversations] = useState<{ id: string; guest_name: string }[]>([])
  const [consultActionId, setConsultActionId] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [notesMap, setNotesMap] = useState<Record<string, { id: string; user_id: string; content: string; created_at: string }[]>>({})
  const [newNoteText, setNewNoteText] = useState<Record<string, string>>({})
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())
  const [historyMap, setHistoryMap] = useState<Record<string, { id: string; field_changed: string; old_value: string | null; new_value: string | null; changed_by: string | null; changed_at: string }[]>>({})
  const [resolvedActions, setResolvedActions] = useState<PendingAction[]>([])
  const [showResolved, setShowResolved] = useState(false)
  const [resolvedFilter, setResolvedFilter] = useState<'all' | 'completed' | 'dismissed'>('all')
  const [resolvedLoading, setResolvedLoading] = useState(false)

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

  const handleEdit = async (id: string) => {
    try {
      await apiFetch(`/api/pending-actions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action_text: editText, due_by: editDueBy || undefined }),
      })
      toast.success('Action updated')
      setEditingId(null)
      fetchActions()
    } catch (err: any) { toast.error(err.message) }
  }

  const fetchResolved = useCallback(async () => {
    setResolvedLoading(true)
    try {
      const data = await apiFetch('/api/pending-actions?status=all')
      const resolved = (data.actions || []).filter((a: PendingAction) => a.status === 'completed' || a.status === 'dismissed')
      resolved.sort((a: PendingAction, b: PendingAction) => new Date(b.completed_at || b.detected_at).getTime() - new Date(a.completed_at || a.detected_at).getTime())
      setResolvedActions(resolved)
    } catch { } finally { setResolvedLoading(false) }
  }, [])

  const handleRevert = async (actionId: string) => {
    try {
      await apiFetch(`/api/pending-actions/${actionId}/revert`, { method: 'PATCH' })
      toast.success('Action reopened')
      fetchResolved()
      fetchActions()
    } catch {
      toast.error('Failed to reopen action')
    }
  }

  const exportResolvedCSV = () => {
    const filtered = resolvedActions.filter(a => resolvedFilter === 'all' || a.status === resolvedFilter)
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`
    const header = 'Guest Name,Property,Action,Status,Detected,Completed/Dismissed,Completed By,Notes'
    const rows = filtered.map(a => [
      escape(a.guest_name),
      escape(a.property_name || a.property_code || ''),
      escape(a.action_text),
      a.status,
      a.detected_at ? new Date(a.detected_at).toLocaleString() : '',
      a.completed_at ? new Date(a.completed_at).toLocaleString() : '',
      escape(a.completed_by || ''),
      escape(a.completion_note || ''),
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resolved-actions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleNotes = async (actionId: string) => {
    const next = new Set(expandedNotes)
    if (next.has(actionId)) {
      next.delete(actionId)
    } else {
      next.add(actionId)
      if (!notesMap[actionId]) {
        try {
          const data = await apiFetch(`/api/pending-actions/${actionId}/notes`)
          setNotesMap(prev => ({ ...prev, [actionId]: data.notes || [] }))
        } catch { setNotesMap(prev => ({ ...prev, [actionId]: [] })) }
      }
    }
    setExpandedNotes(next)
  }

  const addNote = async (actionId: string) => {
    const text = (newNoteText[actionId] || '').trim()
    if (!text) return
    try {
      const note = await apiFetch(`/api/pending-actions/${actionId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      })
      setNotesMap(prev => ({ ...prev, [actionId]: [...(prev[actionId] || []), note] }))
      setNewNoteText(prev => ({ ...prev, [actionId]: '' }))
      trackEvent('pending_action_note_added', { actionId })
      toast.success('Note added')
    } catch (err: any) { toast.error(err.message) }
  }

  const toggleHistory = async (actionId: string) => {
    const next = new Set(expandedHistory)
    if (next.has(actionId)) {
      next.delete(actionId)
    } else {
      next.add(actionId)
      trackEvent('pending_action_history_viewed', { actionId })
      if (!historyMap[actionId]) {
        try {
          const data = await apiFetch(`/api/pending-actions/${actionId}/history`)
          setHistoryMap(prev => ({ ...prev, [actionId]: data.history || [] }))
        } catch { setHistoryMap(prev => ({ ...prev, [actionId]: [] })) }
      }
    }
    setExpandedHistory(next)
  }

  const startEdit = (action: PendingAction) => {
    setEditingId(action.id)
    setEditText(action.action_text)
    setEditDueBy(action.due_by ? new Date(action.due_by).toISOString().slice(0, 16) : '')
  }

  const ageBadge = (action: PendingAction) => {
    const mins = action.age_minutes ?? (Date.now() - new Date(action.detected_at).getTime()) / 60000
    const hours = mins / 60
    const isOverdue = action.due_by && new Date(action.due_by) < new Date() && action.status === 'pending'
    const isDueSoon = action.due_by && !isOverdue && action.status === 'pending' && (new Date(action.due_by).getTime() - Date.now()) < 24 * 60 * 60 * 1000
    const noDueDate = !action.due_by && action.status === 'pending'
    if (isOverdue) return <span className="px-2 py-0.5 rounded-full text-xs font-bold animate-pulse" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>OVERDUE</span>
    if (isDueSoon) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)'}}>DUE SOON</span>
    if (noDueDate) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(100,116,139,0.15)', color: '#94a3b8'}}>no deadline</span>
    if (hours > 6) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{Math.round(hours)}h</span>
    if (hours > 2) return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>{Math.round(hours)}h</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>{mins < 60 ? `${Math.round(mins)}m` : `${Math.round(hours)}h`}</span>
  }

  const sortedActions = [...actions].sort((a, b) => {
    if (sortBy === 'urgency') {
      const aOverdue = a.due_by && new Date(a.due_by) < new Date() && a.status === 'pending' ? 1 : 0
      const bOverdue = b.due_by && new Date(b.due_by) < new Date() && b.status === 'pending' ? 1 : 0
      if (aOverdue !== bOverdue) return bOverdue - aOverdue
      const aDue = a.due_by ? new Date(a.due_by).getTime() : Infinity
      const bDue = b.due_by ? new Date(b.due_by).getTime() : Infinity
      return aDue - bDue
    }
    if (sortBy === 'newest') return new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    if (sortBy === 'oldest') return new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
    if (sortBy === 'guest') return (a.guest_name || '').localeCompare(b.guest_name || '')
    return 0
  })

  if (loading) return <div className="p-4 text-center" style={{color: '#64748b'}}>Loading actions...</div>

  return (
    <div data-testid="section-pending-actions" className="flex-1 overflow-y-auto custom-scrollbar">
      {!conversationFilter && (
        <div className="p-3 flex justify-between items-center" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <span className="text-sm font-medium" style={{color: '#94a3b8'}}>{actions.length} pending action{actions.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
              className="text-base py-0.5 px-1.5 rounded outline-none" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
              <option value="urgency">Urgency</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="guest">Guest name</option>
            </select>
            <button data-testid="btn-add-action" onClick={() => setShowAddForm(!showAddForm)} className="flex items-center text-sm" style={{color: '#6395ff'}}>
              <PlusIcon className="h-4 w-4 mr-1" /> Add
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreate} className="p-3 space-y-2" style={{borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,149,255,0.06)'}}>
          <select value={newAction.conversation_id} onChange={e => setNewAction({ ...newAction, conversation_id: e.target.value })}
            className="w-full text-base rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} required>
            <option value="">Select conversation...</option>
            {conversations.map(c => <option key={c.id} value={c.id}>{c.guest_name}</option>)}
          </select>
          <input type="text" placeholder="Action text..." value={newAction.action_text}
            onChange={e => setNewAction({ ...newAction, action_text: e.target.value })}
            className="w-full text-base rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} required />
          <input type="datetime-local" value={newAction.due_by}
            onChange={e => setNewAction({ ...newAction, due_by: e.target.value })}
            className="w-full text-base rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
          <div className="flex space-x-2">
            <button data-testid="btn-create-action" type="submit" className="px-3 py-1 text-xs rounded" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Create</button>
            <button data-testid="btn-cancel-add-action" type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
          </div>
        </form>
      )}

      {actions.length === 0 ? (
        <div className="p-6 text-center" style={{color: '#64748b'}}>
          <CheckIcon className="h-10 w-10 mx-auto mb-2" />
          <p className="text-sm">No pending actions</p>
        </div>
      ) : (
        sortedActions.map(action => (
          <div key={action.id} className="p-3" style={{borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: action.status !== 'pending' ? 0.5 : 1}}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium" style={{color: '#f1f5f9'}}>{action.guest_name}</span>
              {action.status === 'pending' && ageBadge(action)}
            </div>
            {action.property_code && <div className="text-xs mb-1" style={{color: '#64748b'}}>{action.property_code}</div>}
            {editingId === action.id ? (
              <div className="space-y-1">
                <textarea value={editText} onChange={e => { setEditText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 192) + 'px' }}
                  rows={3} className="w-full text-base rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,149,255,0.3)', color: '#f1f5f9', resize: 'vertical', minHeight: '4.5em', maxHeight: '12em'}} />
                <input type="datetime-local" value={editDueBy} onChange={e => setEditDueBy(e.target.value)}
                  className="w-full text-base rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(action.id)} className="px-2 py-1 text-xs rounded" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Save</button>
                  <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mb-2" style={{color: '#94a3b8'}}>{action.action_text}</p>
                {action.due_by && <div className="text-xs mb-2" style={{color: '#64748b'}}>Due: {new Date(action.due_by).toLocaleString()}</div>}
              </>
            )}
            {action.status === 'pending' && editingId !== action.id && (
              <div className="mb-2">
                <button onClick={() => toggleNotes(action.id)} className="flex items-center text-xs gap-1 py-0.5" style={{color: '#6395ff'}}>
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                  {notesMap[action.id] ? `${notesMap[action.id].length} note${notesMap[action.id].length !== 1 ? 's' : ''}` : 'Notes'}
                </button>
                {expandedNotes.has(action.id) && (
                  <div className="mt-1 ml-1 space-y-1">
                    {(notesMap[action.id] || []).map(note => (
                      <div key={note.id} className="text-xs p-1.5 rounded" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'}}>
                        <div style={{color: '#94a3b8'}}>{note.content}</div>
                        <div style={{color: '#475569', fontSize: '0.65rem'}}>{note.user_id ? `${note.user_id} · ` : ''}{new Date(note.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <input type="text" placeholder="Add a note..."
                        value={newNoteText[action.id] || ''}
                        onChange={e => setNewNoteText(prev => ({ ...prev, [action.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addNote(action.id)}
                        className="flex-1 text-base rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                      <button onClick={() => addNote(action.id)} className="px-2 py-1 text-xs rounded" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {editingId !== action.id && (
              <div className="mb-2">
                <button onClick={() => toggleHistory(action.id)} className="flex items-center text-xs gap-1 py-0.5" style={{color: '#64748b'}}>
                  <ClockIcon className="h-3.5 w-3.5" />
                  {historyMap[action.id] ? `${historyMap[action.id].length} change${historyMap[action.id].length !== 1 ? 's' : ''}` : 'History'}
                </button>
                {expandedHistory.has(action.id) && (
                  <div className="mt-1 ml-1 space-y-1">
                    {(historyMap[action.id] || []).length === 0 ? (
                      <div className="text-xs" style={{color: '#475569'}}>No changes recorded</div>
                    ) : (
                      (historyMap[action.id] || []).map(h => (
                        <div key={h.id} className="text-xs p-1.5 rounded" style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)'}}>
                          <div style={{color: '#94a3b8'}}>
                            <span style={{color: '#6395ff'}}>{h.field_changed}</span>
                            {h.old_value ? <>{' '}<span style={{color: '#f87171', textDecoration: 'line-through'}}>{h.old_value.length > 60 ? h.old_value.slice(0, 60) + '…' : h.old_value}</span></> : null}
                            {' → '}
                            <span style={{color: '#4ade80'}}>{(h.new_value || '(empty)').length > 60 ? (h.new_value || '(empty)').slice(0, 60) + '…' : h.new_value || '(empty)'}</span>
                          </div>
                          <div style={{color: '#475569', fontSize: '0.65rem'}}>{h.changed_by ? `${h.changed_by} · ` : ''}{new Date(h.changed_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            {action.status === 'pending' && editingId !== action.id ? (
              <div className="space-y-1">
                <div className="flex space-x-2 flex-wrap gap-y-1">
                  <button data-testid={`btn-action-done-${action.id}`} onClick={() => handleAction(action.id, 'completed')}
                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>Done</button>
                  <button data-testid={`btn-action-dismiss-${action.id}`} onClick={() => handleAction(action.id, 'dismissed')}
                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Dismiss</button>
                  <button onClick={() => startEdit(action)} className="px-2 py-1 text-xs rounded flex items-center" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                    <PencilIcon className="h-3 w-3 mr-1" />Edit</button>
                  <button onClick={() => { const opening = consultActionId !== action.id; setConsultActionId(opening ? action.id : null); if (opening) trackEvent('ask_judith_opened', { context: 'pending_action', actionId: action.id }) }} className="px-2 py-1 text-xs rounded flex items-center" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                    <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />Ask Judith</button>
                </div>
                {consultActionId === action.id && (
                  <ConsultChat
                    conversationId={action.conversation_id}
                    context="pending_action"
                    initialInstruction={`How should I handle this pending action? "${action.action_text}"`}
                    contextData={{
                      actionText: action.action_text,
                      status: action.status,
                      guestName: action.guest_name,
                      propertyCode: action.property_code,
                      dueBy: action.due_by,
                    }}
                    onConfirm={() => setConsultActionId(null)}
                    onCancel={() => setConsultActionId(null)}
                    confirmLabel="Got it"
                  />
                )}
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

      {/* Resolved Actions History */}
      {!conversationFilter && (
        <div style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
          <button
            onClick={() => { if (!showResolved) trackEvent('resolved_actions_viewed'); setShowResolved(!showResolved); if (!showResolved && resolvedActions.length === 0) fetchResolved() }}
            className="w-full p-3 flex items-center justify-between text-sm"
            style={{color: '#64748b'}}
          >
            <span className="flex items-center gap-1.5">
              {showResolved ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
              Resolved Actions
              {resolvedActions.length > 0 && <span className="text-xs" style={{color: '#475569'}}>({resolvedActions.length})</span>}
            </span>
          </button>
          {showResolved && (
            <div>
              <div className="px-3 pb-2 flex gap-1.5 items-center">
                {(['all', 'completed', 'dismissed'] as const).map(f => {
                  const count = f === 'all' ? resolvedActions.length : resolvedActions.filter(a => a.status === f).length
                  return (
                    <button key={f} onClick={() => setResolvedFilter(f)}
                      className="px-2 py-0.5 text-xs rounded"
                      style={{
                        background: resolvedFilter === f ? 'rgba(99,149,255,0.15)' : 'rgba(255,255,255,0.04)',
                        color: resolvedFilter === f ? '#6395ff' : '#64748b',
                        border: `1px solid ${resolvedFilter === f ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                      {f === 'all' ? 'All' : f === 'completed' ? 'Done' : 'Dismissed'} ({count})
                    </button>
                  )
                })}
                {resolvedActions.length > 0 && (
                  <button onClick={exportResolvedCSV} title="Export CSV" className="ml-auto p-1 rounded" style={{color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'}}>
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {resolvedLoading ? (
                <div className="p-4 text-center text-xs" style={{color: '#475569'}}>Loading...</div>
              ) : (
                resolvedActions
                  .filter(a => resolvedFilter === 'all' || a.status === resolvedFilter)
                  .map(action => (
                    <div key={action.id} className={`px-3 py-2${onNavigateToConversation ? ' cursor-pointer hover:bg-white/5' : ''}`}
                      style={{borderTop: '1px solid rgba(255,255,255,0.03)', opacity: 0.55}}
                      onClick={() => onNavigateToConversation?.(action.conversation_id)}>
                      <div className="flex justify-between items-start mb-0.5">
                        <div>
                          <span className="text-xs font-medium" style={{color: '#94a3b8'}}>{action.guest_name}</span>
                          {(action.property_name || action.property_code) && (
                            <span className="text-xs ml-1.5" style={{color: '#475569'}}>{action.property_name || action.property_code}</span>
                          )}
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-xs shrink-0" style={{
                          background: action.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: action.status === 'completed' ? '#4ade80' : '#94a3b8',
                          fontSize: '0.65rem',
                        }}>
                          {action.status === 'completed' ? 'Done' : 'Dismissed'}
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{color: '#64748b'}}>{action.action_text}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{color: '#475569', fontSize: '0.65rem'}}>
                          {action.completed_by && <span>{action.completed_by} · </span>}
                          {action.completed_at && <span>{new Date(action.completed_at).toLocaleString()}</span>}
                          {action.completion_note && <span> · {action.completion_note}</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleRevert(action.id) }}
                          className="shrink-0 px-2 py-0.5 text-xs rounded flex items-center gap-1"
                          style={{background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)'}}>
                          <ArrowPathIcon className="h-3 w-3" />Reopen
                        </button>
                      </div>
                    </div>
                  ))
              )}
              {!resolvedLoading && resolvedActions.filter(a => resolvedFilter === 'all' || a.status === resolvedFilter).length === 0 && (
                <div className="p-6 text-center" style={{color: '#475569'}}>
                  <InboxIcon className="h-8 w-8 mx-auto mb-2" style={{opacity: 0.5}} />
                  <p className="text-xs">No resolved actions yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
