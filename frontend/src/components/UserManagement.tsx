'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface User {
  id: string
  username: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  manager: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
  agent: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
}

export default function UserManagement({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', display_name: '', email: '', password: '', role: 'agent' })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/api/users')
      setUsers(data.users || [])
    } catch (err: any) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.display_name.trim()) {
      toast.error('Username, display name, and password are required')
      return
    }
    setSubmitting(true)
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUser.username.trim(),
          display_name: newUser.display_name.trim(),
          password: newUser.password,
          role: newUser.role,
        }),
      })
      toast.success(`User ${newUser.display_name} created`)
      setNewUser({ username: '', display_name: '', email: '', password: '', role: 'agent' })
      setShowAddForm(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return
    setActionInProgress(id)
    try {
      await apiFetch(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ display_name: editName.trim(), role: editRole }),
      })
      toast.success('User updated')
      setEditingId(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionInProgress(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    setActionInProgress(user.id)
    try {
      if (user.is_active) {
        await apiFetch(`/api/users/${user.id}`, { method: 'DELETE' })
        toast.success(`${user.display_name} deactivated`)
      } else {
        await apiFetch(`/api/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: true }),
        })
        toast.success(`${user.display_name} reactivated`)
      }
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActionInProgress(null)
    }
  }

  const activeUsers = users.filter(u => u.is_active)
  const inactiveUsers = users.filter(u => !u.is_active)

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[80]" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[85vh] overflow-y-auto" style={{ background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>👥 User Management</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddForm(!showAddForm)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>
              {showAddForm ? 'Cancel' : '+ Add User'}
            </button>
            <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm" style={{ color: '#64748b' }}>✕</button>
          </div>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Display Name *</label>
                <input value={newUser.display_name} onChange={e => setNewUser({ ...newUser, display_name: e.target.value })} placeholder="e.g. Mathias" className="w-full text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Username *</label>
                <input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="e.g. mathias" className="w-full text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Temporary Password *</label>
                <input value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} type="password" placeholder="Min 6 characters" className="w-full text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#94a3b8' }}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}>
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button disabled={submitting} onClick={handleAddUser} className="mt-3 px-4 py-2 rounded-lg text-sm font-medium w-full" style={{ background: submitting ? 'rgba(99,149,255,0.08)' : 'rgba(99,149,255,0.2)', color: submitting ? '#475569' : '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        )}

        {/* User List */}
        {loading ? (
          <div className="text-center py-8" style={{ color: '#64748b' }}>Loading users...</div>
        ) : (
          <div className="space-y-2">
            {activeUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {editingId === user.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="text-sm rounded px-2 py-1 flex-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9' }} />
                    <select value={editRole} onChange={e => setEditRole(e.target.value)} className="text-xs rounded px-2 py-1" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9' }}>
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => handleEdit(user.id)} disabled={actionInProgress === user.id} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded" style={{ color: '#64748b' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{user.display_name}</div>
                        <div className="text-xs" style={{ color: '#64748b' }}>@{user.username}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ROLE_COLORS[user.role]?.bg || 'rgba(148,163,184,0.15)', color: ROLE_COLORS[user.role]?.text || '#94a3b8' }}>{user.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingId(user.id); setEditName(user.display_name); setEditRole(user.role) }} className="text-xs px-2 py-1 rounded" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.04)' }}>Edit</button>
                      <button onClick={() => handleToggleActive(user)} disabled={actionInProgress === user.id} className="text-xs px-2 py-1 rounded" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>Deactivate</button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Inactive users */}
            {inactiveUsers.length > 0 && (
              <div className="mt-4">
                <div className="text-xs mb-2" style={{ color: '#64748b', fontStyle: 'italic' }}>Deactivated</div>
                {inactiveUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg mb-2 opacity-50" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm" style={{ color: '#64748b' }}>{user.display_name}</div>
                        <div className="text-xs" style={{ color: '#475569' }}>@{user.username}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(148,163,184,0.1)', color: '#475569' }}>{user.role}</span>
                    </div>
                    <button onClick={() => handleToggleActive(user)} disabled={actionInProgress === user.id} className="text-xs px-2 py-1 rounded" style={{ color: '#4ade80', background: 'rgba(34,197,94,0.1)' }}>Reactivate</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
