'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  CheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { apiFetch, PendingAction } from './types'

export default function PendingActionsTab({ token, conversationFilter }: { token: string; conversationFilter?: string }) {
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
                  <button onClick={async () => { try { await apiFetch('/api/action-feedback', { method: 'POST', body: JSON.stringify({ action_id: action.id, action_type: 'pending_action', feedback_type: 'teach', original_text: action.action_text }) }); toast.success('Taught: good action'); } catch { toast.error('Failed') } }}
                    className="px-1.5 py-0.5 rounded text-[10px]" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}} title="Good detection">\u2713</button>
                  <button onClick={async () => { try { await apiFetch('/api/action-feedback', { method: 'POST', body: JSON.stringify({ action_id: action.id, action_type: 'pending_action', feedback_type: 'reject', original_text: action.action_text }) }); toast.success('Rejected: bad detection'); } catch { toast.error('Failed') } }}
                    className="px-1.5 py-0.5 rounded text-[10px]" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}} title="Bad detection">\u2717</button>
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
