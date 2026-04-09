'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface BugReport {
  id: string
  reporter_name: string
  title: string | null
  description: string
  expected_behavior: string | null
  page_url: string | null
  conversation_id: string | null
  browser_info: string | null
  viewport: string | null
  console_errors: any[] | null
  severity: string
  status: string
  approved_at: string | null
  assigned_at: string | null
  resolved_at: string | null
  review_comment: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  ai_category: string | null
  ai_component: string | null
  ai_assessment: string | null
  ai_priority: string | null
  created_at: string
  updated_at: string | null
  screenshot: string | null
}

interface BugReportsPanelProps {
  show: boolean
  onClose: () => void
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#f87171' },
  high: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.3)', text: '#fb923c' },
  medium: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', text: '#fbbf24' },
  low: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#4ade80' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff', label: 'New' },
  in_progress: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24', label: 'In Progress' },
  fixed: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Fixed' },
  closed: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', label: 'Closed' },
  // Legacy statuses — map to new display
  submitted: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff', label: 'New' },
  approved: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24', label: 'In Progress' },
  queued: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24', label: 'In Progress' },
  assigned: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24', label: 'In Progress' },
  pending_review: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Fixed' },
  rejected: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', label: 'Closed' },
  resolved: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', label: 'Closed' },
}

const SEVERITY_EMOJI: Record<string, string> = { critical: '\u{1F534}', high: '\u{1F7E0}', medium: '\u{1F7E1}', low: '\u{1F7E2}' }

export default function BugReportsPanel({ show, onClose }: BugReportsPanelProps) {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('')

  const fetchBugs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/bug-reports')
      setBugs(data.bug_reports || [])
    } catch (err: any) {
      toast.error('Failed to load bug reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (show) fetchBugs()
  }, [show, fetchBugs])

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      await apiFetch(`/api/bug-reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      toast.success(`Status → ${STATUS_COLORS[status]?.label || status}`)
      fetchBugs()
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const startEdit = (bug: BugReport) => {
    setEditingId(bug.id)
    setEditTitle(bug.title || '')
    setEditDescription(bug.description)
    setEditStatus(bug.status)
  }

  const saveEdit = async (id: string) => {
    setUpdatingId(id)
    try {
      await apiFetch(`/api/bug-reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle, description: editDescription, status: editStatus }),
      })
      toast.success('Bug updated')
      setEditingId(null)
      fetchBugs()
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter bugs by new status system
  const filteredBugs = statusFilter
    ? bugs.filter(b => b.status === statusFilter)
    : bugs

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[70] flex" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)' }} onClick={onClose}>
      <div
        className="ml-auto w-full max-w-2xl h-full overflow-y-auto"
        style={{ background: '#0d1220', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>{'\u{1F41B}'} Bug Reports</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{bugs.length} report{bugs.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded" style={{ color: '#64748b' }}>
            {'\u2715'}
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="px-5 py-2 flex gap-1.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { value: '', label: `All (${bugs.length})` },
            { value: 'new', label: `New (${bugs.filter(b => b.status === 'new').length})` },
            { value: 'in_progress', label: `In Progress (${bugs.filter(b => b.status === 'in_progress').length})` },
            { value: 'fixed', label: `Fixed (${bugs.filter(b => b.status === 'fixed').length})` },
            { value: 'closed', label: `Closed (${bugs.filter(b => b.status === 'closed').length})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                background: statusFilter === f.value ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === f.value ? '#6395ff' : '#64748b',
                border: `1px solid ${statusFilter === f.value ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bug list */}
        <div className="px-5 py-3 space-y-2">
          {loading ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
          ) : filteredBugs.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>No bug reports{statusFilter ? ` with status "${STATUS_COLORS[statusFilter]?.label || statusFilter}"` : ''}</div>
          ) : filteredBugs.map(bug => {
            const sc = SEVERITY_COLORS[bug.severity] || SEVERITY_COLORS.medium
            const stc = STATUS_COLORS[bug.status] || STATUS_COLORS.new
            const expanded = expandedId === bug.id
            const isUpdating = updatingId === bug.id
            const isEditing = editingId === bug.id

            return (
              <div
                key={bug.id}
                className="rounded-lg p-3 transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => { if (!isEditing) setExpandedId(expanded ? null : bug.id) }}
              >
                {/* Summary row */}
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{SEVERITY_EMOJI[bug.severity] || '\u{1F7E1}'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                        {bug.title || bug.description.slice(0, 60)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {bug.severity}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: stc.bg, color: stc.text }}>
                        {stc.label}
                      </span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {bug.reporter_name} {'\u00B7'} {new Date(bug.created_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {bug.review_comment && (
                      <div className="text-xs mt-1 italic" style={{ color: '#fb923c' }}>
                        {'\u{1F4AC}'} {bug.review_comment} — {bug.reviewed_by}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                    {/* Edit mode */}
                    {isEditing ? (
                      <div className="space-y-2 rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full text-base rounded px-3 py-1.5 outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '16px' }}
                          />
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Description</label>
                          <textarea
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            className="w-full text-base rounded px-3 py-2 outline-none resize-y"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', minHeight: '80px', fontSize: '16px' }}
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: '#94a3b8' }}>Status</label>
                          <select
                            value={editStatus}
                            onChange={e => setEditStatus(e.target.value)}
                            className="text-sm rounded px-3 py-1.5 outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '16px' }}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="fixed">Fixed</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            disabled={isUpdating}
                            onClick={() => saveEdit(bug.id)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: '#64748b' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Details view */}
                        <div className="text-sm rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.3)', color: '#cbd5e1' }}>
                          <div className="mb-2"><span style={{ color: '#94a3b8' }}>What happened:</span> {bug.description}</div>
                          {bug.expected_behavior && <div className="mb-2"><span style={{ color: '#94a3b8' }}>Expected:</span> {bug.expected_behavior}</div>}
                          {bug.page_url && <div className="mb-1 text-xs"><span style={{ color: '#64748b' }}>Page:</span> {bug.page_url}</div>}
                          {bug.viewport && <div className="mb-1 text-xs"><span style={{ color: '#64748b' }}>Viewport:</span> {bug.viewport}</div>}
                          {bug.browser_info && <div className="mb-1 text-xs"><span style={{ color: '#64748b' }}>Browser:</span> {bug.browser_info}</div>}
                          {bug.console_errors && bug.console_errors.length > 0 && (
                            <div className="mt-2 text-xs">
                              <span style={{ color: '#64748b' }}>Console errors ({bug.console_errors.length}):</span>
                              <pre className="mt-1 p-2 rounded overflow-x-auto text-xs" style={{ background: 'rgba(0,0,0,0.4)', color: '#f87171' }}>
                                {(Array.isArray(bug.console_errors) ? bug.console_errors : []).slice(0, 5).join('\n')}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Friday's AI Analysis */}
                        {bug.ai_assessment && (
                          <div className="rounded-lg px-3 py-2.5 text-xs" style={{
                            background: 'rgba(251,191,36,0.08)',
                            borderLeft: '2px solid #fbbf24',
                          }}>
                            <span className="block text-xs mb-1.5" style={{ color: '#fbbf24', fontSize: '10px', fontWeight: 600 }}>
                              {'\u{1F916}'} Friday&apos;s Analysis
                            </span>
                            <div className="flex gap-2 flex-wrap mb-1.5">
                              {bug.ai_category && (
                                <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontSize: '10px' }}>
                                  {bug.ai_category}
                                </span>
                              )}
                              {bug.ai_component && (
                                <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontSize: '10px' }}>
                                  {bug.ai_component}
                                </span>
                              )}
                              {bug.ai_priority && (
                                <span className="px-1.5 py-0.5 rounded" style={{
                                  background: (SEVERITY_COLORS[bug.ai_priority] || SEVERITY_COLORS.medium).bg,
                                  color: (SEVERITY_COLORS[bug.ai_priority] || SEVERITY_COLORS.medium).text,
                                  fontSize: '10px',
                                }}>
                                  {bug.ai_priority} priority
                                </span>
                              )}
                            </div>
                            <div style={{ color: '#e2e8f0', lineHeight: '1.4' }}>{bug.ai_assessment}</div>
                          </div>
                        )}

                        {/* Screenshot inline */}
                        {bug.screenshot && (
                          <div
                            className="rounded-lg overflow-hidden cursor-pointer transition-opacity hover:opacity-80"
                            style={{ maxWidth: '300px', border: '1px solid rgba(255,255,255,0.08)' }}
                            onClick={() => setLightboxSrc(bug.screenshot)}
                          >
                            <img
                              src={bug.screenshot}
                              alt="Bug screenshot"
                              className="w-full h-auto block"
                              style={{ borderRadius: '7px' }}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Action buttons */}
                    {!isEditing && (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => startEdit(bug)}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}
                        >
                          {'\u270F\uFE0F'} Edit
                        </button>
                        {bug.status === 'new' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'in_progress')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            Start Work
                          </button>
                        )}
                        {bug.status === 'in_progress' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'fixed')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            {'\u2705'} Mark Fixed
                          </button>
                        )}
                        {bug.status === 'fixed' && (
                          <>
                            <button
                              disabled={isUpdating}
                              onClick={() => updateStatus(bug.id, 'closed')}
                              className="text-xs px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                            >
                              Close
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => updateStatus(bug.id, 'in_progress')}
                              className="text-xs px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                            >
                              {'\u21A9'} Reopen
                            </button>
                          </>
                        )}
                        {bug.status === 'closed' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'new')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            {'\u{1F504}'} Reopen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Screenshot lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.1)' }}
            onClick={() => setLightboxSrc(null)}
          >
            {'\u2715'}
          </button>
          <img
            src={lightboxSrc}
            alt="Bug screenshot full"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
