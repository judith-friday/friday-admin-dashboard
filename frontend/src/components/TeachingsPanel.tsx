'use client'

import React from 'react'
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
}: TeachingsPanelProps) {
  if (!showTeachingsPanel) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" style={{background: 'rgba(0,0,0,0.4)'}} onClick={() => setShowTeachingsPanel(false)} />
      <div className="w-[480px] h-full overflow-y-auto custom-scrollbar" style={{background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.08)'}}>
        <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🧠 Teachings</h2>
            <button onClick={() => setShowTeachingsPanel(false)} className="text-sm" style={{color: '#64748b'}}>✕</button>
          </div>
          <p className="text-xs mt-1" style={{color: '#64748b'}}>Instructions Judith has learned from revisions</p>
        </div>

        {/* Add new teaching */}
        <div className="p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex space-x-2">
            <input type="text" value={newTeachingText} onChange={e => setNewTeachingText(e.target.value)}
              placeholder="Add a teaching..."
              className="flex-1 text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTeaching() }} />
            <button onClick={handleAddTeaching} disabled={!newTeachingText.trim()}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-50" style={{background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)'}}>
              Add
            </button>
          </div>
        </div>

        {/* Active teachings */}
        <div className="p-4">
          <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Active</h3>
          {teachings.filter(t => t.status === 'active').length === 0 && (
            <p className="text-xs" style={{color: '#64748b'}}>No active teachings yet. Teachings are created from revision patterns or manually.</p>
          )}
          {teachings.filter(t => t.status === 'active').map(t => (
            <div key={t.id} className="p-3 rounded-lg mb-2" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
              <p className="text-sm" style={{color: '#e2e8f0'}}>{t.instruction}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{background: t.scope === 'global' ? 'rgba(99,149,255,0.15)' : 'rgba(245,158,11,0.15)', color: t.scope === 'global' ? '#6395ff' : '#fbbf24'}}>
                    {t.scope === 'global' ? '🌐 Global' : `📍 ${t.property_code}`}
                  </span>
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
                  <button onClick={() => setRevokeId(t.id)} className="text-xs" style={{color: '#f87171'}}>Revoke</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Revoked teachings */}
        {teachings.filter(t => t.status === 'revoked').length > 0 && (
          <div className="p-4" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-xs font-semibold mb-3" style={{color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Revoked</h3>
            {teachings.filter(t => t.status === 'revoked').map(t => (
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
