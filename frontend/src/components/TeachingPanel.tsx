'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import { ChatBubbleLeftRightIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'
import ConsultChat from './ConsultChat'
import { trackEvent } from '../lib/analytics'

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

interface TeachingPanelProps {
  show: boolean
  onClose: () => void
  displayName: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_review: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
  auto_approved: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  approved: { bg: 'rgba(99,149,255,0.15)', text: '#6395ff' },
  rejected: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
}

const PATTERN_LABELS: Record<string, { emoji: string; label: string }> = {
  hallucination: { emoji: '\u{1F47B}', label: 'Hallucination' },
  wrong_commitment: { emoji: '\u{1F91D}', label: 'Wrong Commitment' },
  wrong_local_knowledge: { emoji: '\u{1F4CD}', label: 'Wrong Local Knowledge' },
  no_response_needed: { emoji: '\u{1F6D1}', label: 'No Response Needed' },
  context_misread: { emoji: '\u{1F50D}', label: 'Context Misread' },
  tone_issue: { emoji: '\u{1F3A4}', label: 'Tone Issue' },
  tone_mismatch: { emoji: '\u{1F3A4}', label: 'Tone Mismatch' },
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

export default function TeachingPanel({ show, onClose, displayName }: TeachingPanelProps) {
  // Tab state
  const [tab, setTab] = useState<'rules' | 'review' | 'metrics' | 'corrections'>('rules')

  // Teachings (Active Rules) state
  const [teachings, setTeachings] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'' | 'global' | 'property'>('')
  const [propertyFilter, setPropertyFilter] = useState('')
  const [creatorFilter, setCreatorFilter] = useState('')
  const [editingTeachingId, setEditingTeachingId] = useState<string | null>(null)
  const [editingTeachingText, setEditingTeachingText] = useState('')
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [newTeachingText, setNewTeachingText] = useState('')
  const [undoTeaching, setUndoTeaching] = useState<{ id: string; timeout: NodeJS.Timeout } | null>(null)
  const [pendingRewrites, setPendingRewrites] = useState<Record<string, { rewrite_id: string; original: string; proposed: string }>>({})
  const [consultTeachingId, setConsultTeachingId] = useState<string | null>(null)
  const [showRevoked, setShowRevoked] = useState(false)
  const [expandedTeachingId, setExpandedTeachingId] = useState<string | null>(null)

  // Candidates (Review Queue) state
  const [candidates, setCandidates] = useState<TeachingCandidate[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<any[]>([])
  const [loadingEvidence, setLoadingEvidence] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [commentsById, setCommentsById] = useState<Record<string, any[]>>({})
  const [loadingComments, setLoadingComments] = useState<string | null>(null)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [consultCandidateId, setConsultCandidateId] = useState<string | null>(null)

  // Metrics state
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null)
  const [analyzingAll, setAnalyzingAll] = useState(false)

  // Loading
  const [loading, setLoading] = useState(false)

  // Data fetching
  const fetchTeachings = useCallback(async () => {
    try {
      const data = await apiFetch('/api/teachings')
      setTeachings(data.teachings || [])
    } catch {
      toast.error('Failed to load teachings')
    }
  }, [])

  const fetchPendingRewrites = useCallback(async () => {
    try {
      const data = await apiFetch('/api/teachings/rewrites?status=pending')
      const map: Record<string, { rewrite_id: string; original: string; proposed: string }> = {}
      for (const r of (data.rewrites || [])) {
        map[r.teaching_id] = { rewrite_id: r.id, original: r.original_instruction, proposed: r.proposed_instruction }
      }
      setPendingRewrites(map)
    } catch {}
  }, [])

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const data = await apiFetch(`/api/learning/candidates${params}`)
      setCandidates(data.candidates || [])
    } catch {
      toast.error('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiFetch('/api/learning/metrics')
      setMetrics(data)
    } catch {}
  }, [])

  useEffect(() => {
    if (show) {
      fetchTeachings()
      fetchPendingRewrites()
      fetchCandidates()
      fetchMetrics()
    }
  }, [show, fetchTeachings, fetchPendingRewrites, fetchCandidates, fetchMetrics])

  // === Teaching handlers ===

  const handleAddTeaching = async () => {
    if (!newTeachingText.trim()) return
    try {
      const data = await apiFetch('/api/teachings', {
        method: 'POST',
        body: JSON.stringify({ instruction: newTeachingText.trim(), scope: 'global', taught_by: displayName || 'Dashboard' }),
      })
      const created = data.teaching || data
      trackEvent('teaching_created', { source: 'manual' })
      setNewTeachingText('')
      fetchTeachings()
      const timeout = setTimeout(() => setUndoTeaching(null), 10000)
      setUndoTeaching({ id: created.id, timeout })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleUndoTeaching = async () => {
    if (!undoTeaching) return
    clearTimeout(undoTeaching.timeout)
    try {
      await apiFetch(`/api/teachings/${undoTeaching.id}/revoke`, {
        method: 'PATCH',
        body: JSON.stringify({ revoke_reason: 'Undone by creator' }),
      })
    } catch {}
    setUndoTeaching(null)
    fetchTeachings()
  }

  const handleSaveInlineEdit = async (id: string) => {
    if (!editingTeachingText.trim()) { setEditingTeachingId(null); return }
    try {
      await apiFetch(`/api/teachings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ instruction: editingTeachingText }),
      })
      toast.success('Teaching updated')
      setEditingTeachingId(null)
      fetchTeachings()
    } catch (err: any) {
      toast.error('Edit failed: ' + err.message)
    }
  }

  const handlePauseTeaching = async (id: string) => {
    try {
      await apiFetch(`/api/teachings/${id}/pause`, { method: 'POST' })
      toast.success('Teaching paused')
      fetchTeachings()
    } catch (err: any) {
      toast.error('Pause failed: ' + err.message)
    }
  }

  const handleResumeTeaching = async (id: string) => {
    try {
      await apiFetch(`/api/teachings/${id}/resume`, { method: 'POST' })
      toast.success('Teaching resumed')
      fetchTeachings()
    } catch (err: any) {
      toast.error('Resume failed: ' + err.message)
    }
  }

  const handleRevokeTeaching = async (id: string) => {
    try {
      await apiFetch(`/api/teachings/${id}/revoke`, {
        method: 'PATCH',
        body: JSON.stringify({ revoked_by: displayName || 'Dashboard', revoke_reason: revokeReason }),
      })
      trackEvent('teaching_revoked', { teaching_id: id })
      toast.success('Teaching revoked')
      setRevokeId(null)
      setRevokeReason('')
      fetchTeachings()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true)
    trackEvent('teaching_analyzed_bulk', { count: teachings.filter((t: any) => t.status === 'active').length })
    try {
      await apiFetch('/api/teachings/analyze-all', { method: 'POST' })
      toast.success('Analysis complete')
      fetchTeachings()
      fetchMetrics()
    } catch (err: any) {
      toast.error('Bulk analyze failed: ' + err.message)
    } finally {
      setAnalyzingAll(false)
    }
  }

  const approveRewrite = async (teachingId: string, rewriteId: string) => {
    try {
      await apiFetch(`/api/teachings/${teachingId}/rewrite/${rewriteId}/approve`, { method: 'POST' })
      setPendingRewrites(prev => { const next = { ...prev }; delete next[teachingId]; return next })
      fetchTeachings()
    } catch (err: any) {
      toast.error('Approve rewrite failed: ' + err.message)
    }
  }

  const rejectRewrite = async (teachingId: string, rewriteId: string) => {
    try {
      await apiFetch(`/api/teachings/${teachingId}/rewrite/${rewriteId}/reject`, { method: 'POST' })
      setPendingRewrites(prev => { const next = { ...prev }; delete next[teachingId]; return next })
    } catch (err: any) {
      toast.error('Reject rewrite failed: ' + err.message)
    }
  }

  // === Candidate handlers ===

  const loadEvidence = async (candidateId: string) => {
    if (expandedId === candidateId) { setExpandedId(null); return }
    setExpandedId(candidateId)
    setLoadingEvidence(true)
    try {
      const data = await apiFetch(`/api/learning/candidates/${candidateId}`)
      setEvidence(data.evidence || [])
    } catch { setEvidence([]) }
    finally { setLoadingEvidence(false) }
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

  const handleCandidateEdit = async (id: string) => {
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

  const toggleComments = async (candidateId: string) => {
    if (showComments === candidateId) { setShowComments(null); return }
    if (!commentsById[candidateId]) {
      setLoadingComments(candidateId)
      try {
        const data = await apiFetch(`/api/learning/candidates/${candidateId}/comments`)
        setCommentsById(prev => ({ ...prev, [candidateId]: data.comments || [] }))
      } catch {
        setCommentsById(prev => ({ ...prev, [candidateId]: [] }))
      } finally { setLoadingComments(null) }
    }
    setShowComments(candidateId)
    setCommentText('')
  }

  const postComment = async (candidateId: string) => {
    if (!commentText.trim()) return
    try {
      const data = await apiFetch(`/api/learning/candidates/${candidateId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText, user_name: displayName || 'Dashboard' }),
      })
      setCommentsById(prev => ({
        ...prev,
        [candidateId]: [...(prev[candidateId] || []), data.comment],
      }))
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, comment_count: ((c as any).comment_count || 0) + 1 } : c))
      setCommentText('')
    } catch {
      toast.error('Failed to post comment')
    }
  }

  if (!show) return null

  // Derive filter options from teachings data
  const allProperties = [...new Set(teachings.filter((t: any) => t.property_code).map((t: any) => t.property_code as string))]
  const allCreators = [...new Set(teachings.filter((t: any) => t.taught_by).map((t: any) => t.taught_by as string))]

  // Filter teachings
  const filteredTeachings = teachings
    .filter((t: any) => t.status !== 'revoked')
    .filter((t: any) => !searchQuery || t.instruction.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((t: any) => !scopeFilter || t.scope === scopeFilter)
    .filter((t: any) => !propertyFilter || t.property_code === propertyFilter)
    .filter((t: any) => !creatorFilter || t.taught_by === creatorFilter)
    .sort((a: any, b: any) => {
      // Active first, then paused
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      return new Date(b.taught_at).getTime() - new Date(a.taught_at).getTime()
    })

  const revokedTeachings = teachings
    .filter((t: any) => t.status === 'revoked')
    .filter((t: any) => !searchQuery || t.instruction.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => new Date(b.revoked_at || b.taught_at).getTime() - new Date(a.revoked_at || a.taught_at).getTime())

  const pendingReview = candidates.filter(c => c.status === 'pending_review')
  const corrections = candidates.filter(c => c.property_card_update)
  const activeTeachings = teachings.filter((t: any) => t.status === 'active')

  const TAB_CONFIG = [
    { key: 'rules' as const, label: `Active Rules (${teachings.filter((t: any) => t.status === 'active' || t.status === 'paused').length})` },
    { key: 'review' as const, label: `Review Queue (${pendingReview.length})` },
    { key: 'metrics' as const, label: 'Metrics' },
    { key: 'corrections' as const, label: `Corrections (${corrections.length})` },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)' }} onClick={() => { if (!editingTeachingId) onClose() }}>
      <div className="ml-auto w-full max-w-2xl h-full overflow-y-auto" style={{ background: '#0d1220', borderLeft: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>{'\u{1F9E0}'} Knowledge & Rules</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {activeTeachings.length} active rules{metrics && ` \u00B7 ${pendingReview.length} pending review`}
            </p>
          </div>
          <button onClick={onClose} className="text-sm px-2 py-1 rounded" style={{ color: '#64748b' }}>{'\u2715'}</button>
        </div>

        {/* Tab bar */}
        <div className="px-5 py-2 flex gap-1.5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {TAB_CONFIG.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap" style={{ background: tab === t.key ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)', color: tab === t.key ? '#c084fc' : '#64748b', border: `1px solid ${tab === t.key ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== ACTIVE RULES TAB ===== */}
        {tab === 'rules' && (
          <div className="px-5 py-3">
            {undoTeaching && (
              <div className="mb-3 px-3 py-2 rounded-lg flex items-center justify-between" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <span className="text-xs" style={{ color: '#4ade80' }}>Teaching added</span>
                <button onClick={handleUndoTeaching} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Undo</button>
              </div>
            )}

            {/* Add rule input */}
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Add a new rule..." value={newTeachingText} onChange={e => setNewTeachingText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTeaching() }} className="flex-1 text-base rounded px-3 py-1.5 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />
              <button onClick={handleAddTeaching} disabled={!newTeachingText.trim()} className="px-4 py-1.5 text-xs rounded disabled:opacity-50" style={{ background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>Add</button>
            </div>

            {/* Search bar */}
            <input type="text" placeholder="Search rules..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full text-base rounded px-3 py-1.5 outline-none mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} />

            {/* Filter chips */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {/* Scope filters */}
              {(['', 'global', 'property'] as const).map(s => (
                <button key={s || 'all-scope'} onClick={() => setScopeFilter(s)} className="px-2.5 py-1 rounded-full text-xs transition-all" style={{ background: scopeFilter === s ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)', color: scopeFilter === s ? '#6395ff' : '#64748b', border: `1px solid ${scopeFilter === s ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  {s === '' ? 'All scopes' : s === 'global' ? '\u{1F310} Global' : '\u{1F4CD} Property'}
                </button>
              ))}

              {/* Property + Creator filters — same row */}
              {(allProperties.length > 0 || allCreators.length > 0) && (
                <div className="flex gap-2 flex-1">
                  {allProperties.length > 0 && (
                    <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="rounded px-2 py-1 text-xs outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: propertyFilter ? '#fbbf24' : '#64748b', fontSize: '16px' }}>
                      <option value="">All properties</option>
                      {allProperties.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                  {allCreators.length > 0 && (
                    <select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)} className="rounded px-2 py-1 text-xs outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: creatorFilter ? '#c084fc' : '#64748b', fontSize: '16px' }}>
                      <option value="">All creators</option>
                      {allCreators.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Active/paused rules */}
            {filteredTeachings.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>{(searchQuery || scopeFilter || propertyFilter || creatorFilter) ? 'No matching rules.' : 'No active rules.'}</div>
            ) : (
              <div className="space-y-2">
                {filteredTeachings.map((t: any) => renderTeachingCard(t))}
              </div>
            )}

            {/* Collapsible Revoked section */}
            {revokedTeachings.length > 0 && (
              <div className="mt-4">
                <button onClick={() => setShowRevoked(!showRevoked)} className="flex items-center gap-1.5 text-xs py-2 w-full" style={{ color: '#64748b' }}>
                  {showRevoked ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                  Revoked ({revokedTeachings.length})
                </button>
                {showRevoked && (
                  <div className="space-y-2">
                    {revokedTeachings.map((t: any) => renderTeachingCard(t))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== REVIEW QUEUE TAB ===== */}
        {tab === 'review' && (
          <>
            <div className="px-5 py-2 flex gap-1.5 flex-wrap" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {['', 'pending_review', 'auto_approved', 'approved', 'rejected'].map(s => (
                <button key={s || 'all'} onClick={() => setStatusFilter(s)} className="text-xs px-2.5 py-1 rounded-full transition-all" style={{ background: statusFilter === s ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)', color: statusFilter === s ? '#6395ff' : '#64748b', border: `1px solid ${statusFilter === s ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  {s ? s.replace(/_/g, ' ') : 'All'}
                </button>
              ))}
            </div>

            {!statusFilter && pendingReview.length > 0 && (
              <div className="px-5 py-2 space-y-2">
                <div className="text-xs font-medium mb-2" style={{ color: '#6395ff' }}>{'\u{1F4CB}'} Pending Review</div>
                {pendingReview.map(c => renderCandidate(c))}
              </div>
            )}

            {statusFilter && (
              <div className="px-5 py-3 space-y-2">
                {loading ? <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
                : candidates.length === 0 ? <div className="text-center py-8" style={{ color: '#64748b' }}>No candidates with status &quot;{statusFilter.replace(/_/g, ' ')}&quot;</div>
                : candidates.map(c => renderCandidate(c))}
              </div>
            )}

            {!statusFilter && pendingReview.length === 0 && (
              <div className="px-5 py-3 space-y-2">
                {loading ? <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
                : candidates.length === 0 ? <div className="text-center py-8" style={{ color: '#64748b' }}>No teaching candidates yet. Run analysis to generate candidates from rejection history.</div>
                : candidates.map(c => renderCandidate(c))}
              </div>
            )}
          </>
        )}

        {/* ===== METRICS TAB ===== */}
        {tab === 'metrics' && (
          <div className="px-5 py-3 space-y-4">
            {/* Analyze All button */}
            <div className="flex justify-end">
              <button onClick={handleAnalyzeAll} disabled={analyzingAll} className="px-3 py-1.5 text-xs rounded disabled:opacity-50" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)' }}>
                {analyzingAll ? '\u23F3 Analyzing...' : '\u{1F504} Analyze All'}
              </button>
            </div>

            {!metrics ? <div className="text-center py-8" style={{ color: '#64748b' }}>Loading metrics...</div> : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Active Teachings" value={metrics.active_teachings} color="#4ade80" />
                  <MetricCard label="Auto-detected" value={metrics.auto_teachings} color="#c084fc" />
                  <MetricCard label="Manual" value={metrics.active_teachings - metrics.auto_teachings} color="#6395ff" />
                  <MetricCard label="Events (7d)" value={metrics.recent_events} color="#38bdf8" />
                  <MetricCard label="Pending Review" value={metrics.candidates_by_status.find(c => c.status === 'pending_review')?.count || '0'} color="#fbbf24" className="col-span-2" />
                </div>
                {metrics.clusters_by_type.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Pattern Distribution</div>
                    {metrics.clusters_by_type.map(ct => {
                      const p = PATTERN_LABELS[ct.pattern_type] || { emoji: '\u{2753}', label: ct.pattern_type }
                      const maxCount = Math.max(...metrics.clusters_by_type.map(c => parseInt(c.count) || 0), 1)
                      const barWidth = ((parseInt(ct.count) || 0) / maxCount) * 100
                      return (
                        <div key={ct.pattern_type} className="flex items-center gap-2 py-1.5">
                          <span className="text-sm w-5">{p.emoji}</span>
                          <span className="text-xs w-32 flex-shrink-0" style={{ color: '#cbd5e1' }}>{p.label}</span>
                          <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div className="h-full rounded" style={{ width: `${barWidth}%`, background: 'rgba(168,85,247,0.4)' }} />
                          </div>
                          <span className="text-xs font-mono w-8 text-right" style={{ color: '#94a3b8' }}>{ct.count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {metrics.candidates_by_status.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>Candidate Status Breakdown</div>
                    {metrics.candidates_by_status.map(cs => {
                      const sc = STATUS_COLORS[cs.status] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' }
                      return <div key={cs.status} className="flex items-center gap-2 py-1"><span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>{cs.status.replace(/_/g, ' ')}</span><span className="text-xs font-mono ml-auto" style={{ color: '#94a3b8' }}>{cs.count}</span></div>
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== CORRECTIONS TAB ===== */}
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
                      <div className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{update?.property_code || 'Unknown property'}</div>
                      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>Field: {update?.field || 'unknown'}</div>
                      <div className="text-xs mt-1" style={{ color: '#fbbf24' }}>Correction: {update?.correction || c.instruction}</div>
                      <div className="text-xs mt-1" style={{ color: '#64748b' }}>Evidence: {c.evidence_count} events {'\u00B7'} {confidenceBadge(c.confidence)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button disabled={actionInProgress === c.id} onClick={() => handleAction(c.id, 'approve')} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: actionInProgress === c.id ? 0.5 : 1 }}>Apply Correction</button>
                    <button disabled={actionInProgress === c.id} onClick={() => handleAction(c.id, 'reject')} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: actionInProgress === c.id ? 0.5 : 1 }}>Dismiss</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // === Render helpers ===

  function renderTeachingCard(t: any) {
    const isEditing = editingTeachingId === t.id
    const isRevoking = revokeId === t.id
    const isExpanded = expandedTeachingId === t.id
    const statusColor = t.status === 'active' ? '#4ade80' : t.status === 'paused' ? '#fbbf24' : '#f87171'
    const statusBg = t.status === 'active' ? 'rgba(34,197,94,0.15)' : t.status === 'paused' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)'

    return (
      <div key={t.id} className="rounded-lg p-3 cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', opacity: t.status === 'revoked' ? 0.5 : t.status === 'paused' ? 0.7 : 1 }} onClick={() => { if (!editingTeachingId) setExpandedTeachingId(isExpanded ? null : t.id) }}>
        {/* Collapsed: instruction (truncated) + scope badge + paused badge */}
        {!isExpanded && !isEditing && (
          <>
            <p
              className="text-sm line-clamp-2"
              style={{ color: t.status === 'revoked' ? '#64748b' : '#e2e8f0', textDecoration: t.status === 'revoked' ? 'line-through' : undefined }}
            >
              {t.instruction}
            </p>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.scope === 'global' ? 'rgba(99,149,255,0.15)' : 'rgba(245,158,11,0.15)', color: t.scope === 'global' ? '#6395ff' : '#fbbf24' }}>
                {t.scope === 'global' ? 'Global' : t.property_code}
              </span>
              {t.status === 'paused' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusBg, color: statusColor }}>Paused</span>}
            </div>
          </>
        )}

        {/* Expanded: full content */}
        {(isExpanded || isEditing) && (
          <>
            {/* Instruction text — click to edit inline */}
            {isEditing ? (
              <>
                <textarea
                  autoFocus
                  value={editingTeachingText}
                  onChange={e => setEditingTeachingText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveInlineEdit(t.id) } if (e.key === 'Escape') setEditingTeachingId(null) }}
                  className="w-full text-base rounded-lg p-2 resize-y outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', color: '#e2e8f0', border: '1px solid rgba(168,85,247,0.4)', minHeight: '80px', fontSize: '16px' }}
                  rows={6}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleSaveInlineEdit(t.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Save</button>
                  <button onClick={() => setEditingTeachingId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#64748b' }}>Cancel</button>
                </div>
              </>
            ) : (
              <p
                className="text-sm"
                style={{ color: t.status === 'revoked' ? '#64748b' : '#e2e8f0', textDecoration: t.status === 'revoked' ? 'line-through' : undefined }}
              >
                {t.instruction}
              </p>
            )}

            {/* Friday's recommendation */}
            {t.recommendation && !isEditing && (
              <div className="text-xs mt-2 p-2 rounded" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)', color: '#94a3b8' }}>
                <span style={{ color: '#6395ff', fontWeight: 500 }}>{'\u{1F4AC}'} Friday&apos;s take:</span>{' '}{t.recommendation}
                {t.recommendation_updated_at && <span className="ml-2" style={{ color: '#475569', fontSize: '10px' }}>{formatDistanceToNow(new Date(t.recommendation_updated_at), { addSuffix: true })}</span>}
              </div>
            )}

            {/* Badges row: scope, creator, date */}
            {!isEditing && (
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.scope === 'global' ? 'rgba(99,149,255,0.15)' : 'rgba(245,158,11,0.15)', color: t.scope === 'global' ? '#6395ff' : '#fbbf24' }}>
                  {t.scope === 'global' ? 'Global' : t.property_code}
                </span>
                {t.status === 'paused' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: statusBg, color: statusColor }}>Paused</span>}
                <span className="text-xs" style={{ color: '#64748b' }}>
                  {t.taught_by || 'System'} {'\u00B7'} {t.taught_at ? format(new Date(t.taught_at), 'MMM d') : ''}
                </span>
              </div>
            )}

            {/* Action buttons */}
            {!isEditing && !isRevoking && t.status !== 'revoked' && (
              <div className="flex items-center gap-2 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); setEditingTeachingId(t.id); setEditingTeachingText(t.instruction) }} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>Edit</button>
                {t.status === 'active' && <button onClick={() => handlePauseTeaching(t.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(234,179,8,0.15)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.3)' }}>Pause</button>}
                {t.status === 'paused' && <button onClick={() => handleResumeTeaching(t.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Resume</button>}
                <button onClick={() => setRevokeId(t.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>Revoke</button>
                <button onClick={() => { const opening = consultTeachingId !== t.id; setConsultTeachingId(opening ? t.id : null); if (opening) trackEvent('ask_judith_opened', { context: 'teaching', teachingId: t.id }) }} className="text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <ChatBubbleLeftRightIcon className="h-3 w-3" /> Ask Friday
                </button>
              </div>
            )}

            {/* Revoke confirmation */}
            {isRevoking && (
              <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
                <input type="text" value={revokeReason} onChange={e => setRevokeReason(e.target.value)} placeholder="Reason for revoking..." className="flex-1 text-base rounded px-2 py-1 outline-none" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }} onKeyDown={e => { if (e.key === 'Enter') handleRevokeTeaching(t.id) }} />
                <button onClick={() => handleRevokeTeaching(t.id)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>OK</button>
                <button onClick={() => setRevokeId(null)} className="text-xs" style={{ color: '#64748b' }}>{'\u2715'}</button>
              </div>
            )}

            {/* Revoked info */}
            {t.status === 'revoked' && (
              <div className="mt-1">
                <p className="text-xs" style={{ color: '#475569' }}>{t.revoked_by ? `Revoked by ${t.revoked_by}` : ''}</p>
                {t.revoke_reason && <p className="text-xs" style={{ color: '#f87171' }}>Reason: {t.revoke_reason}</p>}
              </div>
            )}

            {/* Pending rewrite */}
            {pendingRewrites[t.id] && (
              <div className="mt-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
                <div className="text-xs mb-1" style={{ color: '#64748b' }}>Proposed rewrite:</div>
                <p className="text-sm line-through mb-1" style={{ color: '#64748b' }}>{pendingRewrites[t.id].original}</p>
                <p className="text-sm" style={{ color: '#4ade80' }}>{pendingRewrites[t.id].proposed}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => approveRewrite(t.id, pendingRewrites[t.id].rewrite_id)} className="text-xs px-3 py-1 rounded" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>Approve</button>
                  <button onClick={() => rejectRewrite(t.id, pendingRewrites[t.id].rewrite_id)} className="text-xs px-3 py-1 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>Reject</button>
                </div>
              </div>
            )}

            {/* Consult chat */}
            {consultTeachingId === t.id && (
              <div onClick={e => e.stopPropagation()}>
                <ConsultChat context="teaching" initialInstruction={`Analyze this teaching and suggest improvements: "${t.instruction}"`} contextData={{ instruction: t.instruction, scope: t.scope, propertyCode: t.property_code, source: t.source, recommendation: t.recommendation, relatedTeachings: activeTeachings.filter((at: any) => at.id !== t.id).map((at: any) => at.instruction) }} onConfirm={() => { setConsultTeachingId(null); fetchTeachings() }} onCancel={() => setConsultTeachingId(null)} confirmLabel="Done" />
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  function renderCandidate(c: TeachingCandidate) {
    const sc = STATUS_COLORS[c.status] || STATUS_COLORS.pending_review
    const pattern = PATTERN_LABELS[c.pattern_type || ''] || { emoji: '\u{2753}', label: c.pattern_type || 'unknown' }
    const expanded = expandedId === c.id
    const isActioning = actionInProgress === c.id
    const isCandidateEditing = editingId === c.id

    return (
      <div key={c.id} className="rounded-lg p-3 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={() => loadEvidence(c.id)}>
        <div className="flex items-start gap-2">
          <span className="text-sm mt-0.5">{pattern.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>{c.status.replace(/_/g, ' ')}</span>
              {confidenceBadge(c.confidence)}
              <span className="text-xs" style={{ color: '#64748b' }}>{c.evidence_count} evidence</span>
            </div>
            <div className="text-sm mt-1.5" style={{ color: '#e2e8f0' }}>{c.instruction}</div>
            {c.cluster_description && <div className="text-xs mt-1" style={{ color: '#64748b' }}>{pattern.label}: {c.cluster_description}</div>}
            {c.recommendation && (
              <div className="text-xs mt-2 p-2 rounded" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)', color: '#94a3b8' }}>
                <span style={{ color: '#6395ff', fontWeight: 500 }}>{'\u{1F4AC}'} Friday&apos;s take:</span>{' '}{c.recommendation}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons — always visible for actionable candidates */}
        {isCandidateEditing && (
          <div className="mt-2 space-y-2" onClick={e => e.stopPropagation()}>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full text-base rounded-lg p-2 resize-y" style={{ background: 'rgba(0,0,0,0.4)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', minHeight: '80px', fontSize: '16px' }} rows={6} />
            <div className="flex gap-2">
              <button onClick={() => handleCandidateEdit(c.id)} disabled={isActioning} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)' }}>Save</button>
              <button onClick={() => handleAction(c.id, 'approve', editText)} disabled={isActioning} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Save & Approve</button>
              <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#64748b' }}>Cancel</button>
            </div>
          </div>
        )}

        {!isCandidateEditing && ['pending_review', 'auto_approved'].includes(c.status) && (
          <div className="flex gap-2 flex-wrap mt-2" onClick={e => e.stopPropagation()}>
            <button disabled={isActioning} onClick={() => handleAction(c.id, 'approve')} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: isActioning ? 0.5 : 1 }}>{c.status === 'auto_approved' ? 'Approve Permanently' : 'Approve'}</button>
            <button disabled={isActioning} onClick={() => { setEditingId(c.id); setEditText(c.instruction) }} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)', opacity: isActioning ? 0.5 : 1 }}>Edit</button>
            <button disabled={isActioning} onClick={() => handleAction(c.id, 'reject')} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: isActioning ? 0.5 : 1 }}>Reject</button>
            <button onClick={() => { const opening = consultCandidateId !== c.id; setConsultCandidateId(opening ? c.id : null); if (opening) trackEvent('ask_judith_opened', { context: 'learning_candidate', candidateId: c.id }) }} className="text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>
              <ChatBubbleLeftRightIcon className="h-3 w-3" /> Ask Friday
            </button>
          </div>
        )}
        {consultCandidateId === c.id && (
          <div className="mt-2" onClick={e => e.stopPropagation()}>
            <ConsultChat context="learning_candidate" initialInstruction={`Help me understand this learning candidate: "${c.instruction}"`} contextData={{ instruction: c.instruction, confidence: c.confidence, evidenceCount: c.evidence_count, patternType: c.pattern_type, recommendation: c.recommendation }} onConfirm={() => setConsultCandidateId(null)} onCancel={() => setConsultCandidateId(null)} confirmLabel="Got it" />
          </div>
        )}

        {expanded && (
          <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
            {loadingEvidence ? <div className="text-xs py-2" style={{ color: '#64748b' }}>Loading evidence...</div> : evidence.length > 0 ? (
              <div className="rounded-lg p-2 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>Evidence ({evidence.length})</div>
                {evidence.slice(0, 5).map((ev: any, i: number) => (
                  <div key={i} className="text-xs p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: '#cbd5e1' }}>
                    <div style={{ color: '#94a3b8' }}>{ev.type === 'rejection' ? 'Rejection' : 'Revision'}:</div>
                    {ev.type === 'rejection' && ev.rejection_reason && <div className="mt-1">Reason: &quot;{ev.rejection_reason}&quot;</div>}
                    {ev.type === 'revision' && ev.revision_instruction && <div className="mt-1">Instruction: &quot;{ev.revision_instruction}&quot;</div>}
                    {ev.draft_body && <div className="mt-1 truncate" style={{ color: '#64748b' }}>Draft: {ev.draft_body.substring(0, 100)}...</div>}
                  </div>
                ))}
                {evidence.length > 5 && <div className="text-xs" style={{ color: '#64748b' }}>+{evidence.length - 5} more</div>}
              </div>
            ) : null}

            <div className="mt-2">
              <button onClick={(e) => { e.stopPropagation(); toggleComments(c.id) }} className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                {'\u{1F4AC}'} {(c as any).comment_count || 0} comment{((c as any).comment_count || 0) !== 1 ? 's' : ''}
              </button>
              {showComments === c.id && (
                <div className="mt-2 space-y-2">
                  {loadingComments === c.id ? <div className="text-xs py-1" style={{ color: '#64748b' }}>Loading comments...</div> : (commentsById[c.id] || []).map((comment: any) => (
                    <div key={comment.id} className="text-xs p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <div className="flex justify-between"><span style={{ color: '#94a3b8', fontWeight: 500 }}>{comment.user_name}</span><span style={{ color: '#475569' }}>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span></div>
                      <p className="mt-1" style={{ color: '#cbd5e1' }}>{comment.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 text-base rounded px-2 py-1.5 outline-none" style={{ background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }} onKeyDown={e => { if (e.key === 'Enter') postComment(c.id) }} onClick={e => e.stopPropagation()} />
                    <button onClick={(e) => { e.stopPropagation(); postComment(c.id) }} disabled={!commentText.trim()} className="text-xs px-2 py-1 rounded disabled:opacity-50" style={{ background: 'rgba(99,149,255,0.15)', color: '#6395ff' }}>Post</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
}

function MetricCard({ label, value, color, className }: { label: string; value: number | string; color: string; className?: string }) {
  return (
    <div className={`rounded-lg p-3 ${className || ''}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</div>
    </div>
  )
}
