'use client'

import React, { useState, useEffect } from 'react'
import { BookOpenIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { apiFetch } from './types'

interface Teaching {
  id: string
  instruction: string
  scope: string
  property_code: string | null
}

interface TeachingSummaryProps {
  propertyCode?: string
}

export default function TeachingSummary({ propertyCode }: TeachingSummaryProps) {
  const [teachings, setTeachings] = useState<Teaching[]>([])
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiFetch('/api/teachings?status=active')
        if (cancelled) return
        const all: Teaching[] = data.teachings || []
        // Filter to teachings relevant to this property (global + property-scoped)
        const relevant = all.filter(t =>
          t.scope === 'global' || (t.scope === 'property' && t.property_code === propertyCode)
        )
        setTeachings(relevant)
      } catch {
        // Silently fail — teaching summary is informational only
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [propertyCode])

  if (loading || teachings.length === 0) return null

  return (
    <div className="mb-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        data-testid="teaching-summary-toggle"
      >
        <span className="flex items-center text-xs font-medium" style={{ color: '#c084fc' }}>
          <BookOpenIcon className="h-3.5 w-3.5 mr-1.5" />
          {teachings.length} teaching{teachings.length !== 1 ? 's' : ''} applied
        </span>
        {expanded
          ? <ChevronUpIcon className="h-3.5 w-3.5" style={{ color: '#c084fc' }} />
          : <ChevronDownIcon className="h-3.5 w-3.5" style={{ color: '#c084fc' }} />
        }
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1.5">
          {teachings.map(t => (
            <div key={t.id} className="flex items-start gap-1.5 text-xs" style={{ color: '#cbd5e1' }}>
              <span className="mt-0.5 shrink-0 px-1 py-0.5 rounded text-xs font-medium" style={{
                background: t.scope === 'global' ? 'rgba(99,149,255,0.1)' : 'rgba(245,158,11,0.1)',
                color: t.scope === 'global' ? '#6395ff' : '#fbbf24',
                fontSize: '10px',
                lineHeight: '1',
              }}>
                {t.scope === 'global' ? 'Global' : t.property_code || 'Property'}
              </span>
              <span>{t.instruction}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
