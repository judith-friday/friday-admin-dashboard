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
  created_at: string
  updated_at: string | null
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  submitted: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff' },
  approved: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  queued: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
  rejected: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  assigned: { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  pending_review: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  resolved: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
}

const SEVERITY_EMOJI: Record<string, string> = { critical: '\u{1F534}', high: '\u{1F7E0}', medium: '\u{1F7E1}', low: '\u{1F7E2}' }

export default function BugReportsPanel({ show, onClose }: BugReportsPanelProps) {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [reopenComment, setReopenComment] = useState<string>('')
  const [reopenBugId, setReopenBugId] = useState<string | null>(null)

  const fetchBugs = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const data = await apiFetch(`/api/bug-reports${params}`)
      setBugs(data.bug_reports || [])
    } catch (err: any) {
      toast.error('Failed to load bug reports')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (show) fetchBugs()
  }, [show, fetchBugs])

  const updateStatus = async (id: string, status: string, extra?: Record<string, string>) => {
    setUpdatingId(id)
    try {
      await apiFetch(`/api/bug-reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...extra }),
      })
      toast.success(`Bug ${status}`)
      setReopenBugId(null)
      setReopenComment('')
      fetchBugs()
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[70] flex" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
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
          {['', 'submitted', 'approved', 'queued', 'assigned', 'pending_review', 'rejected', 'resolved'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                background: statusFilter === s ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === s ? '#6395ff' : '#64748b',
                border: `1px solid ${statusFilter === s ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Bug list */}
        <div className="px-5 py-3 space-y-2">
          {loading ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
          ) : bugs.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>No bug reports{statusFilter ? ` with status "${statusFilter}"` : ''}</div>
          ) : bugs.map(bug => {
            const sc = SEVERITY_COLORS[bug.severity] || SEVERITY_COLORS.medium
            const stc = STATUS_COLORS[bug.status] || STATUS_COLORS.submitted
            const expanded = expandedId === bug.id
            const isUpdating = updatingId === bug.id

            return (
              <div
                key={bug.id}
                className="rounded-lg p-3 transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                onClick={() => setExpandedId(expanded ? null : bug.id)}
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
                        {bug.status}
                      </span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {bug.reporter_name} {'\u00B7'} {new Date(bug.created_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {bug.review_comment && (
                      <div className="text-xs mt-1 italic" style={{ color: '#fb923c' }}>
                        {'\u{1F4AC}'} {bug.review_comment} — {bug.reviewed_by}{bug.reviewed_at ? `, ${new Date(bug.reviewed_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                    )}
                    {!bug.review_comment && bug.reviewed_by && (
                      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        Reviewed by {bug.reviewed_by}{bug.reviewed_at ? ` on ${new Date(bug.reviewed_at).toLocaleDateString('en-MU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
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

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {bug.status === 'submitted' && (
                        <>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'approved')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            {'\u2705'} Approve
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'queued')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            {'\u23F3'} Queue
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'rejected')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            {'\u274C'} Reject
                          </button>
                        </>
                      )}
                      {bug.status === 'queued' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(bug.id, 'approved')}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                        >
                          {'\u2705'} Approve
                        </button>
                      )}
                      {bug.status === 'approved' && (
                        <span className="text-xs py-1.5" style={{ color: '#4ade80' }}>Waiting for assignment...</span>
                      )}
                      {bug.status === 'assigned' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(bug.id, 'pending_review')}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                        >
                          {'\u{1F50D}'} Mark for Review
                        </button>
                      )}
                      {bug.status === 'pending_review' && (
                        <>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStatus(bug.id, 'resolved')}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            {'\u2705'} Verify
                          </button>
                          {reopenBugId === bug.id ? (
                            <div className="flex-1 flex gap-1.5 items-end">
                              <textarea
                                value={reopenComment}
                                onChange={e => setReopenComment(e.target.value)}
                                placeholder="Why is this being reopened?"
                                className="flex-1 text-xs rounded-lg p-2 resize-none"
                                style={{ background: 'rgba(0,0,0,0.3)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', minHeight: '48px' }}
                                rows={2}
                              />
                              <button
                                disabled={isUpdating || !reopenComment.trim()}
                                onClick={() => updateStatus(bug.id, 'submitted', { review_comment: reopenComment })}
                                className="text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                                style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', opacity: isUpdating || !reopenComment.trim() ? 0.5 : 1 }}
                              >
                                Send
                              </button>
                              <button
                                onClick={() => { setReopenBugId(null); setReopenComment('') }}
                                className="text-xs px-2 py-1.5 rounded-lg"
                                style={{ color: '#64748b' }}
                              >
                                {'\u2715'}
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled={isUpdating}
                              onClick={() => setReopenBugId(bug.id)}
                              className="text-xs px-3 py-1.5 rounded-lg transition-all"
                              style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                            >
                              {'\u21A9'} Reopen
                            </button>
                          )}
                        </>
                      )}
                      {(bug.status === 'rejected' || bug.status === 'resolved') && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(bug.id, 'submitted')}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)', opacity: isUpdating ? 0.5 : 1 }}
                        >
                          {'\u{1F504}'} Reopen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
