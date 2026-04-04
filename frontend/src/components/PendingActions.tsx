'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  CheckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { apiFetch, PendingAction } from './types'
import ConsultChat from './ConsultChat'

type SortKey = 'urgency' | 'newest' | 'oldest' | 'guest'

export default function PendingActionsTab({ token, conversationFilter }: { token: string; conversationFilter?: string }) {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this action?')) return
    try {
      await apiFetch(`/api/pending-actions/${id}`, { method: 'DELETE' })
      toast.success('Action deleted')
      fetchActions()
    } catch (err: any) { toast.error(err.message) }
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
      toast.success('Note added')
    } catch (err: any) { toast.error(err.message) }
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
              className="text-xs py-0.5 px-1.5 rounded outline-none" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
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
                  rows={3} className="w-full text-sm rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,149,255,0.3)', color: '#f1f5f9', resize: 'vertical', minHeight: '4.5em', maxHeight: '12em'}} />
                <input type="datetime-local" value={editDueBy} onChange={e => setEditDueBy(e.target.value)}
                  className="w-full text-xs rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
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
                        className="flex-1 text-xs rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                      <button onClick={() => addNote(action.id)} className="px-2 py-1 text-xs rounded" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {action.status === 'pending' && editingId !== action.id ? (
              <div className="space-y-1">
                <input type="text" placeholder="Note (optional)..."
                  value={completionNotes[action.id] || ''}
                  onChange={e => setCompletionNotes({ ...completionNotes, [action.id]: e.target.value })}
                  className="w-full text-xs rounded px-2 py-1 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
                <div className="flex space-x-2 flex-wrap gap-y-1">
                  <button data-testid={`btn-action-done-${action.id}`} onClick={() => handleAction(action.id, 'completed')}
                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>Done</button>
                  <button data-testid={`btn-action-dismiss-${action.id}`} onClick={() => handleAction(action.id, 'dismissed')}
                    className="px-2 py-1 text-xs rounded" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>Dismiss</button>
                  <button onClick={() => startEdit(action)} className="px-2 py-1 text-xs rounded flex items-center" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                    <PencilIcon className="h-3 w-3 mr-1" />Edit</button>
                  <button onClick={() => handleDelete(action.id)} className="px-2 py-1 text-xs rounded flex items-center" style={{background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)'}}>
                    <TrashIcon className="h-3 w-3 mr-1" />Delete</button>
                  <button onClick={() => setConsultActionId(consultActionId === action.id ? null : action.id)} className="px-2 py-1 text-xs rounded flex items-center" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
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
    </div>
  )
}
