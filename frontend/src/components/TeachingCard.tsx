'use client'

import React, { useState } from 'react'
import { AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'

interface TeachingCardProps {
  instruction: string
  suggestedScope?: 'global' | 'property'
  propertyCode?: string
  onDismiss: () => void
  onConfirm?: (scope: string, propertyCode?: string) => void
}

export default function TeachingCard({
  instruction, suggestedScope = 'global', propertyCode, onDismiss, onConfirm,
}: TeachingCardProps) {
  const [scope, setScope] = useState<'global' | 'property'>(suggestedScope)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await apiFetch('/api/teachings', {
        method: 'POST',
        body: JSON.stringify({
          instruction,
          scope,
          property_code: scope === 'property' ? propertyCode : null,
          taught_by: 'ask_judith',
        }),
      })
      setSaved(true)
      if (onConfirm) onConfirm(scope, scope === 'property' ? propertyCode : undefined)
      setTimeout(onDismiss, 2000)
    } catch (err: any) {
      console.error('Failed to save teaching:', err.message)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="mx-3 my-1.5 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
        style={{background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80'}}>
        <AcademicCapIcon className="h-4 w-4 flex-shrink-0" />
        <span>Teaching saved! Judith will apply this going forward.</span>
      </div>
    )
  }

  return (
    <div className="mx-3 my-1.5 px-3 py-2.5 rounded-lg"
      style={{background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)'}}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <AcademicCapIcon className="h-4 w-4 flex-shrink-0" style={{color: '#c084fc'}} />
          <span className="text-xs font-medium" style={{color: '#c084fc'}}>Teachable moment</span>
        </div>
        <button onClick={onDismiss} className="p-0.5 rounded hover:bg-white/10" style={{color: '#64748b'}}>
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs mb-2" style={{color: '#e2e8f0'}}>{instruction}</p>
      <div className="flex items-center gap-2">
        <select value={scope} onChange={e => setScope(e.target.value as 'global' | 'property')}
          className="text-xs rounded px-2 py-1 outline-none"
          style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}}>
          <option value="global">🌐 Global</option>
          {propertyCode && <option value="property">📍 {propertyCode}</option>}
        </select>
        <button onClick={handleConfirm} disabled={saving}
          className="px-2.5 py-1 text-xs rounded disabled:opacity-50"
          style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)'}}>
          {saving ? 'Saving...' : 'Learn this'}
        </button>
        <button onClick={onDismiss}
          className="px-2.5 py-1 text-xs rounded"
          style={{background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)'}}>
          Skip
        </button>
      </div>
    </div>
  )
}
