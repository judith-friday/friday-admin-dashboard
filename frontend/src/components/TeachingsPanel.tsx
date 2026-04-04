'use client'

import React, { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import ConsultChat from './ConsultChat'
import { trackEvent } from '../lib/analytics'

interface TeachingsPanelProps {
  showTeachingsPanel: boolean
  setShowTeachingsPanel: (v: boolean) => void
  teachings: any[]
  newTeachingText: string
  setNewTeachingText: (v: string) => void
  handleAddTeaching: () => void
  revokeId: string | null
  setRevokeId: (v: string | null) => void
  revokeReason: string
  setRevokeReason: (v: string) => void
  handleRevokeTeaching: (id: string) => void
  apiFetch: (url: string, opts?: any) => Promise<any>
  fetchTeachings: () => void
}

function scopeBadge(item: any) {
  if (item.scope === 'global' || !item.property_code) {
    return <span className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>🌐 Global</span>
  }
  return <span className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24'}}>📍 {item.property_code}</span>
}

function expiryBadge(expiresAt: string) {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return <span className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171'}}>⏳ Expired</span>
  const color = diffDays <= 7 ? '#f87171' : '#fbbf24'
  const bg = diffDays <= 7 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'
  return <span className="text-xs px-1.5 py-0.5 rounded" style={{background: bg, color}}>⏳ Expires in {diffDays}d</span>
}

export default function TeachingsPanel({
  showTeachingsPanel,
  setShowTeachingsPanel,
  teachings,
  newTeachingText,
  setNewTeachingText,
  handleAddTeaching,
  revokeId,
  setRevokeId,
  revokeReason,
  setRevokeReason,
  handleRevokeTeaching,
  apiFetch,
  fetchTeachings,
}: TeachingsPanelProps) {
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [pendingRewrites, setPendingRewrites] = useState<Record<string, { rewrite_id: string, original: string, proposed: string }>>({})
  const [consultTeachingId, setConsultTeachingId] = useState<string | null>(null)

  const fetchPendingRewrites = async () => {
    try {
      const res = await apiFetch('/api/teachings/rewrites?status=pending')
      const map: Record<string, { rewrite_id: string, original: string, proposed: string }> = {}
      for (const r of res.rewrites || []) {
        map[r.teaching_id] = { rewrite_id: r.id, original: r.original_instruction, proposed: r.proposed_instruction }
      }
      setPendingRewrites(map)
    } catch (err: any) {
      console.error('Fetch pending rewrites failed:', err.message)
    }
  }

  const approveRewrite = async (teachingId: string, rewriteId: string) => {
    try {
      await apiFetch(`/api/teachings/${teachingId}/rewrite/${rewriteId}/approve`, { method: 'POST' })
      setPendingRewrites(prev => { const next = { ...prev }; delete next[teachingId]; return next })
      fetchTeachings()
    } catch (err: any) {
      console.error('Approve rewrite failed:', err.message)
    }
  }

  const rejectRewrite = async (teachingId: string, rewriteId: string) => {
    try {
      await apiFetch(`/api/teachings/${teachingId}/rewrite/${rewriteId}/reject`, { method: 'POST' })
      setPendingRewrites(prev => { const next = { ...prev }; delete next[teachingId]; return next })
    } catch (err: any) {
      console.error('Reject rewrite failed:', err.message)
    }
  }

  // Fetch pending rewrites when panel opens
  React.useEffect(() => {
    if (showTeachingsPanel) fetchPendingRewrites()
  }, [showTeachingsPanel])

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true)
    trackEvent('teaching_analyzed_bulk', { count: teachings.filter(t => t.status === 'active').length })
    try {
      await apiFetch('/api/teachings/analyze-all', { method: 'POST' })
      fetchTeachings()
    } catch (err: any) {
      console.error('Bulk analyze failed:', err.message)
    } finally {
      setAnalyzingAll(false)
    }
  }

  if (!showTeachingsPanel) return null

  const activeTeachings = teachings.filter(t => t.status === 'active')
  const revokedTeachings = teachings.filter(t => t.status === 'revoked')

  return (
    <div className="fixed inset-0 z-[60] flex" data-testid="modal-teachings-panel" style={{paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)'}}>
      <div className="flex-1 hidden md:block" style={{background: 'rgba(0,0,0,0.4)'}} onClick={() => setShowTeachingsPanel(false)} />
      <div className="w-full md:w-[480px] h-full overflow-y-auto custom-scrollbar" style={{background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.08)'}}>
        <div className="sticky top-0 z-10 p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117'}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🧠 Teachings</h2>
              <button onClick={handleAnalyzeAll} disabled={analyzingAll}
                className="px-2 py-0.5 text-xs rounded disabled:opacity-50"
                style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.2)'}}>
                {analyzingAll ? '⏳ Analyzing...' : '🔄 Analyze All'}
              </button>
            </div>
            <button onClick={() => setShowTeachingsPanel(false)} className="text-sm" data-testid="btn-close-teachings" style={{color: '#64748b'}}>✕</button>
          </div>
          <p className="text-xs mt-1" style={{color: '#64748b'}}>Instructions Judith has learned from revisions</p>
        </div>

        {/* Add new teaching */}
        <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex space-x-2">
            <input type="text" value={newTeachingText} onChange={e => setNewTeachingText(e.target.value)}
              placeholder="Add a teaching..."
              data-testid="input-teaching-text"
              className="flex-1 text-base rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTeaching() }} />
            <button onClick={handleAddTeaching} disabled={!newTeachingText.trim()}
              data-testid="btn-add-teaching"
              className="px-3 py-1.5 text-xs rounded disabled:opacity-50" style={{background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)'}}>
              Add
            </button>
          </div>
        </div>

        {/* Active teachings */}
        <div className="p-4">
          <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Active ({activeTeachings.length})</h3>
          {activeTeachings.length === 0 && (
            <p className="text-xs" style={{color: '#64748b'}}>No active teachings yet. Teachings are created from revision patterns or manually.</p>
          )}
          {activeTeachings.map(t => (
            <div key={t.id} className="p-3 rounded-lg mb-2" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm" style={{color: '#e2e8f0'}}>{t.instruction}</p>
              {t.recommendation && (
                <div className="text-xs mt-2 p-2 rounded" style={{ background: 'rgba(99,149,255,0.06)', border: '1px solid rgba(99,149,255,0.1)', color: '#94a3b8' }}>
                  <span style={{ color: '#6395ff', fontWeight: 500 }}>💬 Judith&apos;s take:</span>{' '}
                  {t.recommendation}
                  {t.recommendation_updated_at && (
                    <span className="ml-2" style={{ color: '#475569', fontSize: '10px' }}>
                      {formatDistanceToNow(new Date(t.recommendation_updated_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{background: t.scope === 'global' ? 'rgba(99,149,255,0.15)' : 'rgba(245,158,11,0.15)', color: t.scope === 'global' ? '#6395ff' : '#fbbf24'}}>
                    {t.scope === 'global' ? '🌐 Global' : `📍 ${t.property_code}`}
                  </span>
                  {t.expires_at && expiryBadge(t.expires_at)}
                  <span className="text-xs" style={{color: '#64748b'}}>
                    {t.source === 'auto_pattern' ? '🔄 Auto' : t.source === 'manual' ? '✏️ Manual' : '💬 Direct'}
                  </span>
                  <span className="text-xs" style={{color: '#64748b'}}>
                    {t.taught_by ? `Taught by ${t.taught_by}` : 'Taught by Unknown'}{t.taught_at ? ` · ${format(new Date(t.taught_at), 'MMM d, yyyy')}` : ''}
                  </span>
                </div>
                {revokeId === t.id ? (
                  <div className="flex items-center space-x-1">
                    <input type="text" value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                      placeholder="Why?" className="text-base rounded px-1.5 py-0.5 w-32 outline-none"
                      style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                      onKeyDown={e => { if (e.key === 'Enter') handleRevokeTeaching(t.id) }} />
                    <button onClick={() => handleRevokeTeaching(t.id)} className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171'}}>OK</button>
                    <button onClick={() => setRevokeId(null)} className="text-xs" style={{color: '#64748b'}}>✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { const opening = consultTeachingId !== t.id; setConsultTeachingId(opening ? t.id : null); if (opening) trackEvent('ask_judith_opened', { context: 'teaching', teachingId: t.id }) }}
                      className="text-xs flex items-center gap-1" style={{color: '#c084fc'}}>
                      <ChatBubbleLeftRightIcon className="h-3 w-3" /> Ask Judith
                    </button>
                    <button onClick={() => setRevokeId(t.id)} className="text-xs" data-testid={`btn-revoke-teaching-${t.id}`} style={{color: '#f87171'}}>Revoke</button>
                  </div>
                )}
              </div>
              {pendingRewrites[t.id] && (
                <div className="mt-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="text-xs mb-1" style={{ color: '#64748b' }}>Proposed rewrite:</div>
                  <p className="text-sm line-through mb-1" style={{ color: '#64748b' }}>{pendingRewrites[t.id].original}</p>
                  <p className="text-sm" style={{ color: '#4ade80' }}>{pendingRewrites[t.id].proposed}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => approveRewrite(t.id, pendingRewrites[t.id].rewrite_id)}
                      className="text-xs px-3 py-1 rounded" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                      Approve
                    </button>
                    <button onClick={() => rejectRewrite(t.id, pendingRewrites[t.id].rewrite_id)}
                      className="text-xs px-3 py-1 rounded" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                      Reject
                    </button>
                  </div>
                </div>
              )}
              {consultTeachingId === t.id && (
                <ConsultChat
                  context="teaching"
                  initialInstruction={`Analyze this teaching and suggest improvements: "${t.instruction}"`}
                  contextData={{
                    instruction: t.instruction,
                    scope: t.scope,
                    propertyCode: t.property_code,
                    source: t.source,
                    recommendation: t.recommendation,
                    relatedTeachings: activeTeachings.filter((at: any) => at.id !== t.id).map((at: any) => at.instruction),
                  }}
                  onConfirm={() => { setConsultTeachingId(null); fetchTeachings() }}
                  onCancel={() => setConsultTeachingId(null)}
                  confirmLabel="Done"
                />
              )}
            </div>
          ))}
        </div>

        {/* Revoked teachings */}
        {revokedTeachings.length > 0 && (
          <div className="p-4" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Revoked</h3>
            {revokedTeachings.map(t => (
              <div key={t.id} className="p-3 rounded-lg mb-2 opacity-50" style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)'}}>
                <p className="text-sm line-through" style={{color: '#64748b'}}>{t.instruction}</p>
                <p className="text-xs mt-1" style={{color: '#475569'}}>{t.taught_by ? `Taught by ${t.taught_by}` : ''}{t.revoked_by ? ` · Revoked by ${t.revoked_by}` : ''}</p>
                {t.revoke_reason && <p className="text-xs mt-1" style={{color: '#f87171'}}>Reason: {t.revoke_reason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
