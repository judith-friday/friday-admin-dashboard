'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'

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
  pendingCandidates: any[]
  pendingTeachings: any[]
  onApproveCandidate: (id: string) => void
  onRejectCandidate: (id: string, reason: string) => void
  onApproveTeaching: (id: string) => void
  onRejectTeaching: (id: string, reason: string) => void
}

function sourceBadge(source: string) {
  if (source === 'auto_pattern' || source === 'auto_learned') return '🔄 Auto-learned'
  if (source === 'revision' || source === 'from_revision') return '💬 From revision'
  if (source === 'ai_suggested') return '🤖 AI-suggested'
  if (source === 'manual') return '✏️ Manual'
  return '💬 Direct'
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

function RejectInline({ onReject, onCancel }: { onReject: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div className="flex items-center space-x-1 mt-2">
      <input type="text" value={reason} onChange={e => setReason(e.target.value)}
        placeholder="Reason..." className="text-xs rounded px-1.5 py-0.5 flex-1 outline-none"
        style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
        onKeyDown={e => { if (e.key === 'Enter') onReject(reason) }} />
      <button onClick={() => onReject(reason)} className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171'}}>OK</button>
      <button onClick={onCancel} className="text-xs" style={{color: '#64748b'}}>✕</button>
    </div>
  )
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
  pendingCandidates,
  pendingTeachings,
  onApproveCandidate,
  onRejectCandidate,
  onApproveTeaching,
  onRejectTeaching,
}: TeachingsPanelProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectingSource, setRejectingSource] = useState<'candidate' | 'teaching' | null>(null)

  if (!showTeachingsPanel) return null

  const allPending = [
    ...pendingCandidates.map(c => ({ ...c, _source: 'candidate' as const })),
    ...pendingTeachings.map(t => ({ ...t, _source: 'teaching' as const })),
  ]
  const propertyPending = allPending.filter(p => p.property_code)
  const generalPending = allPending.filter(p => !p.property_code)
  const totalPending = allPending.length

  const activeTeachings = teachings.filter(t => t.status === 'active')
  const revokedTeachings = teachings.filter(t => t.status === 'revoked')

  const renderPendingItem = (item: any) => {
    const isCandidate = item._source === 'candidate'
    const text = item.instruction || item.correction || item.pattern || ''
    const isRejecting = rejectingId === item.id && rejectingSource === item._source

    return (
      <div key={`${item._source}-${item.id}`} className="p-3 rounded-lg mb-2" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
        <p className="text-sm" style={{color: '#e2e8f0'}}>{text}</p>
        <div className="flex items-center flex-wrap gap-2 mt-2">
          {scopeBadge(item)}
          <span className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(168,85,247,0.15)', color: '#c084fc'}}>
            {sourceBadge(item.source)}
          </span>
          {(item.evidence_count || item.confidence) && (
            <span className="text-xs" style={{color: '#c084fc'}}>
              {item.evidence_count ? `${item.evidence_count} evidence` : ''}{item.evidence_count && item.confidence ? ' · ' : ''}{item.confidence ? `${Math.round(item.confidence * 100)}% confidence` : ''}
            </span>
          )}
          <span className="text-xs" style={{color: '#64748b'}}>
            {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : ''}
          </span>
        </div>
        {isRejecting ? (
          <RejectInline
            onReject={(reason) => {
              if (isCandidate) onRejectCandidate(item.id, reason)
              else onRejectTeaching(item.id, reason)
              setRejectingId(null)
              setRejectingSource(null)
            }}
            onCancel={() => { setRejectingId(null); setRejectingSource(null) }}
          />
        ) : (
          <div className="flex items-center space-x-2 mt-2">
            <button onClick={() => isCandidate ? onApproveCandidate(item.id) : onApproveTeaching(item.id)}
              className="text-xs px-2 py-1 rounded" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
              ✅ Approve
            </button>
            <button onClick={() => { setRejectingId(item.id); setRejectingSource(item._source) }}
              className="text-xs px-2 py-1 rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>
              ❌ Reject
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="modal-teachings-panel">
      <div className="flex-1" style={{background: 'rgba(0,0,0,0.4)'}} onClick={() => setShowTeachingsPanel(false)} />
      <div className="w-[480px] h-full overflow-y-auto custom-scrollbar" style={{background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.08)'}}>
        <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🧠 Teachings</h2>
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
              className="flex-1 text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTeaching() }} />
            <button onClick={handleAddTeaching} disabled={!newTeachingText.trim()}
              data-testid="btn-add-teaching"
              className="px-3 py-1.5 text-xs rounded disabled:opacity-50" style={{background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)'}}>
              Add
            </button>
          </div>
        </div>

        {/* Pending Review section */}
        {totalPending > 0 && (
          <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-xs font-semibold mb-3" style={{color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              📋 Pending Review ({totalPending})
            </h3>

            {/* General pending items */}
            {generalPending.length > 0 && generalPending.map(renderPendingItem)}

            {/* Property Corrections sub-section */}
            {propertyPending.length > 0 && (
              <>
                <h4 className="text-xs font-semibold mt-4 mb-2" style={{color: '#fbbf24', letterSpacing: '0.3px'}}>
                  🏠 Property Corrections ({propertyPending.length})
                </h4>
                <p className="text-xs mb-2" style={{color: '#64748b'}}>Approving will add as a teaching. Property card updates are manual.</p>
                {propertyPending.map(renderPendingItem)}
              </>
            )}
          </div>
        )}

        {totalPending === 0 && (
          <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-xs font-semibold mb-2" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              📋 Pending Review
            </h3>
            <p className="text-xs" style={{color: '#64748b'}}>No items pending review.</p>
          </div>
        )}

        {/* Active teachings */}
        <div className="p-4">
          <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Active ({activeTeachings.length})</h3>
          {activeTeachings.length === 0 && (
            <p className="text-xs" style={{color: '#64748b'}}>No active teachings yet. Teachings are created from revision patterns or manually.</p>
          )}
          {activeTeachings.map(t => (
            <div key={t.id} className="p-3 rounded-lg mb-2" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm" style={{color: '#e2e8f0'}}>{t.instruction}</p>
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
                      placeholder="Why?" className="text-xs rounded px-1.5 py-0.5 w-32 outline-none"
                      style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
                      onKeyDown={e => { if (e.key === 'Enter') handleRevokeTeaching(t.id) }} />
                    <button onClick={() => handleRevokeTeaching(t.id)} className="text-xs px-1.5 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171'}}>OK</button>
                    <button onClick={() => setRevokeId(null)} className="text-xs" style={{color: '#64748b'}}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => setRevokeId(t.id)} className="text-xs" data-testid={`btn-revoke-teaching-${t.id}`} style={{color: '#f87171'}}>Revoke</button>
                )}
              </div>
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
