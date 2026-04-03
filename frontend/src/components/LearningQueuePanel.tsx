'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface TeachingCandidate {
  id: string
  cluster_id: string | null
  instruction: string
  scope: string
  property_code: string | null
  confidence: number
  evidence_count: number
  evidence_ids: string[]
  status: string
  recommendation: string | null
  auto_approved_at: string | null
  expires_at: string | null
  approved_at: string | null
  rejected_at: string | null
  applied_teaching_id: string | null
  created_at: string
  pattern_type: string | null
  cluster_description: string | null
  property_card_update: any | null
}

interface LearningMetrics {
  candidates_by_status: Array<{ status: string; count: string }>
  clusters_by_type: Array<{ pattern_type: string; count: string }>
  recent_events: number
  active_teachings: number
  auto_teachings: number
}

interface LearningQueuePanelProps {
  show: boolean
  onClose: () => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_review: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
  auto_approved: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  approved: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff' },
  rejected: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  expired: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
}

const PATTERN_LABELS: Record<string, { emoji: string; label: string }> = {
  hallucination: { emoji: '\u{1F47B}', label: 'Hallucination' },
  wrong_commitment: { emoji: '\u{1F91D}', label: 'Wrong Commitment' },
  wrong_local_knowledge: { emoji: '\u{1F4CD}', label: 'Wrong Local Knowledge' },
  no_response_needed: { emoji: '\u{1F6D1}', label: 'No Response Needed' },
  context_misread: { emoji: '\u{1F50D}', label: 'Context Misread' },
  tone_issue: { emoji: '\u{1F3A4}', label: 'Tone Issue' },
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function confidenceBadge(conf: number) {
  const pct = Math.round(conf * 100)
  const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'
  return (
    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      {pct}%
    </span>
  )
}

export default function LearningQueuePanel({ show, onClose }: LearningQueuePanelProps) {
  const [candidates, setCandidates] = useState<TeachingCandidate[]>([])
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<any[]>([])
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [tab, setTab] = useState<'candidates' | 'corrections' | 'metrics'>('candidates')

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const data = await apiFetch(`/api/learning/candidates${params}`)
      setCandidates(data.candidates || [])
    } catch (err: any) {
      toast.error('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiFetch('/api/learning/metrics')
      setMetrics(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (show) {
      fetchCandidates()
      fetchMetrics()
    }
  }, [show, fetchCandidates, fetchMetrics])

  const loadEvidence = async (candidateId: string) => {
    if (expandedId === candidateId) {
      setExpandedId(null)
      return
    }
    setExpandedId(candidateId)
    setLoadingEvidence(true)
    try {
      const data = await apiFetch(`/api/learning/candidates/${candidateId}`)
      setEvidence(data.evidence || [])
    } catch {
      setEvidence([])
    } finally {
      setLoadingEvidence(false)
    }
  }

  const handleAction = async (id: string, action: 'approve' | 'reject', instruction?: string) => {
    setActionInProgress(id)
    try {
      await apiFetch(`/api/learning/candidates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, instruction }),
      })
      toast.success(action === 'approve' ? 'Teaching approved and applied!' : 'Candidate rejected')
      setEditingId(null)
      fetchCandidates()
      fetchMetrics()
    } catch (err: any) {
      toast.error('Action failed: ' + err.message)
    } finally {
      setActionInProgress(null)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return
    setActionInProgress(id)
    try {
      await apiFetch(`/api/learning/candidates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'edit', instruction: editText }),
      })
      toast.success('Instruction updated')
      setEditingId(null)
      fetchCandidates()
    } catch (err: any) {
      toast.error('Edit failed: ' + err.message)
    } finally {
      setActionInProgress(null)
    }
  }

  if (!show) return null

  // Group candidates for display
  const autoApprovedExpiring = candidates
    .filter(c => c.status === 'auto_approved' && c.expires_at)
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())
  const pendingReview = candidates.filter(c => c.status === 'pending_review')
  const corrections = candidates.filter(c => c.property_card_update)

  return (
    <div className="fixed inset-0 z-[60] flex" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="ml-auto w-full max-w-2xl h-full overflow-y-auto"
        style={{ background: '#0d1220', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>{'\u{1F9EA}'} Learning Queue</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              {metrics && ` \u00B7 ${metrics.active_teachings} active teachings`}
            </p>
          </div>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded" style={{ color: '#64748b' }}>{'\u2715'}</button>
        </div>

        {/* Tab bar */}
        <div className="px-5 py-2 flex gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {(['candidates', 'corrections', 'metrics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs px-3 py-1.5 rounded-full transition-all capitalize"
              style={{
                background: tab === t ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
                color: tab === t ? '#c084fc' : '#64748b',
                border: `1px solid ${tab === t ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {t === 'candidates' ? `Candidates (${candidates.length})` : t === 'corrections' ? `Corrections (${corrections.length})` : 'Metrics'}
            </button>
          ))}
        </div>

        {tab === 'candidates' && (
          <>
            {/* Status filter */}
            <div className="px-5 py-2 flex gap-1.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {['', 'pending_review', 'auto_approved', 'approved', 'rejected', 'expired'].map(s => (
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
                  {s ? s.replace('_', ' ') : 'All'}
                </button>
              ))}
            </div>

            {/* Auto-approved expiring soon */}
            {!statusFilter && autoApprovedExpiring.length > 0 && (
              <div className="px-5 py-2">
                <div className="text-xs font-medium mb-2" style={{ color: '#fbbf24' }}>{'\u23F0'} Auto-approved (expiring)</div>
                {autoApprovedExpiring.map(c => renderCandidate(c, true))}
              </div>
            )}

            {/* Pending review */}
            {!statusFilter && pendingReview.length > 0 && (
              <div className="px-5 py-2">
                <div className="text-xs font-medium mb-2" style={{ color: '#6395ff' }}>{'\u{1F4CB}'} Pending Review</div>
                {pendingReview.map(c => renderCandidate(c, false))}
              </div>
            )}

            {/* Filtered view */}
            {statusFilter && (
              <div className="px-5 py-3 space-y-2">
                {loading ? (
                  <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8" style={{ color: '#64748b' }}>No candidates with status &quot;{statusFilter.replace('_', ' ')}&quot;</div>
                ) : candidates.map(c => renderCandidate(c, false))}
              </div>
            )}

            {/* All view when no filter and no grouped sections */}
            {!statusFilter && autoApprovedExpiring.length === 0 && pendingReview.length === 0 && (
              <div className="px-5 py-3 space-y-2">
                {loading ? (
                  <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8" style={{ color: '#64748b' }}>No teaching candidates yet. Run analysis to generate candidates from rejection history.</div>
                ) : candidates.map(c => renderCandidate(c, false))}
              </div>
            )}
          </>
        )}

        {tab === 'corrections' && (
          <div className="px-5 py-3 space-y-2">
            {corrections.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>No pending property corrections</div>
            ) : corrections.map(c => {
              const update = c.property_card_update
              return (
                <div key={c.id} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{'\u{1F4CD}'}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: '#f1f5f9' }}>
                        {update?.property_code || 'Unknown property'}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                        Field: {update?.field || 'unknown'}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#fbbf24' }}>
                        Correction: {update?.correction || c.instruction}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                        Evidence: {c.evidence_count} events {'\u00B7'} {confidenceBadge(c.confidence)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      disabled={actionInProgress === c.id}
                      onClick={() => handleAction(c.id, 'approve')}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: actionInProgress === c.id ? 0.5 : 1 }}
                    >
                      Approve Teaching
                    </button>
                    <button
                      disabled={actionInProgress === c.id}
                      onClick={() => handleAction(c.id, 'reject')}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: actionInProgress === c.id ? 0.5 : 1 }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'metrics' && (
          <div className="px-5 py-3 space-y-4">
            {!metrics ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>Loading metrics...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Active Teachings" value={metrics.active_teachings} color="#4ade80" />
                  <MetricCard label="Auto Teachings" value={metrics.auto_teachings} color="#c084fc" />
                  <MetricCard label="Events (7d)" value={metrics.recent_events} color="#6395ff" />
                  <MetricCard
                    label="Pending Review"
                    value={metrics.candidates_by_status.find(c => c.status === 'pending_review')?.count || '0'}
                    color="#fbbf24"
                  />
                </div>

                {metrics.clusters_by_type.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Pattern Distribution</div>
                    {metrics.clusters_by_type.map(ct => {
                      const p = PATTERN_LABELS[ct.pattern_type] || { emoji: '\u{2753}', label: ct.pattern_type }
                      return (
                        <div key={ct.pattern_type} className="flex items-center gap-2 py-1">
                          <span className="text-sm">{p.emoji}</span>
                          <span className="text-xs flex-1" style={{ color: '#cbd5e1' }}>{p.label}</span>
                          <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>{ct.count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {metrics.candidates_by_status.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Candidate Status</div>
                    {metrics.candidates_by_status.map(cs => {
                      const sc = STATUS_COLORS[cs.status] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' }
                      return (
                        <div key={cs.status} className="flex items-center gap-2 py-1">
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>{cs.status.replace('_', ' ')}</span>
                          <span className="text-xs font-mono ml-auto" style={{ color: '#94a3b8' }}>{cs.count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )

  function renderCandidate(c: TeachingCandidate, showExpiry: boolean) {
    const sc = STATUS_COLORS[c.status] || STATUS_COLORS.pending_review
    const pattern = PATTERN_LABELS[c.pattern_type || ''] || { emoji: '\u{2753}', label: c.pattern_type || 'unknown' }
    const expanded = expandedId === c.id
    const isActioning = actionInProgress === c.id
    const isEditing = editingId === c.id

    return (
      <div
        key={c.id}
        className="rounded-lg p-3 mb-2 transition-all cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        onClick={() => loadEvidence(c.id)}
      >
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">{pattern.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>
                {c.status.replace('_', ' ')}
              </span>
              {confidenceBadge(c.confidence)}
              <span className="text-xs" style={{ color: '#64748b' }}>{c.evidence_count} evidence</span>
              {showExpiry && c.expires_at && (
                <span className="text-xs" style={{ color: daysUntil(c.expires_at) <= 7 ? '#f87171' : '#fbbf24' }}>
                  {'\u23F0'} {daysUntil(c.expires_at)}d left
                </span>
              )}
            </div>
            <div className="text-sm mt-1.5" style={{ color: '#e2e8f0' }}>
              {c.instruction}
            </div>
            {c.cluster_description && (
              <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                {pattern.label}: {c.cluster_description}
              </div>
            )}
            {c.recommendation && (
              <div className="text-xs mt-2 p-2 rounded" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)', color: '#94a3b8' }}>
                <span style={{ color: '#6395ff', fontWeight: 500 }}>{'\u{1F4AC}'} Judith&apos;s take:</span>{' '}
                {c.recommendation}
              </div>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
            {/* Evidence */}
            {loadingEvidence ? (
              <div className="text-xs py-2" style={{ color: '#64748b' }}>Loading evidence...</div>
            ) : evidence.length > 0 ? (
              <div className="rounded-lg p-2 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>Evidence ({evidence.length})</div>
                {evidence.slice(0, 5).map((ev: any, i: number) => (
                  <div key={i} className="text-xs p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: '#cbd5e1' }}>
                    <div style={{ color: '#94a3b8' }}>{ev.type === 'rejection' ? 'Rejection' : 'Revision'}:</div>
                    {ev.type === 'rejection' && ev.rejection_reason && (
                      <div className="mt-1">Reason: &quot;{ev.rejection_reason}&quot;</div>
                    )}
                    {ev.type === 'revision' && ev.revision_instruction && (
                      <div className="mt-1">Instruction: &quot;{ev.revision_instruction}&quot;</div>
                    )}
                    {ev.draft_body && (
                      <div className="mt-1 truncate" style={{ color: '#64748b' }}>Draft: {ev.draft_body.substring(0, 100)}...</div>
                    )}
                  </div>
                ))}
                {evidence.length > 5 && (
                  <div className="text-xs" style={{ color: '#64748b' }}>+{evidence.length - 5} more</div>
                )}
              </div>
            ) : null}

            {/* Edit mode */}
            {isEditing && (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full text-sm rounded-lg p-2 resize-none"
                  style={{ background: 'rgba(0,0,0,0.4)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', minHeight: '60px' }}
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(c.id)}
                    disabled={isActioning}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleAction(c.id, 'approve', editText)}
                    disabled={isActioning}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                  >
                    Save & Approve
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
            )}

            {/* Action buttons */}
            {!isEditing && ['pending_review', 'auto_approved'].includes(c.status) && (
              <div className="flex gap-2 flex-wrap">
                <button
                  disabled={isActioning}
                  onClick={() => handleAction(c.id, 'approve')}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isActioning ? 0.5 : 1 }}
                >
                  {c.status === 'auto_approved' ? 'Approve Permanently' : 'Approve'}
                </button>
                <button
                  disabled={isActioning}
                  onClick={() => { setEditingId(c.id); setEditText(c.instruction) }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)', opacity: isActioning ? 0.5 : 1 }}
                >
                  Edit
                </button>
                <button
                  disabled={isActioning}
                  onClick={() => handleAction(c.id, 'reject')}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: isActioning ? 0.5 : 1 }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</div>
    </div>
  )
}
