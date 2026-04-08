'use client'

import React from 'react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ConflictBannerProps {
  message: string
  existingTeaching?: string
  onUpdateTeaching?: () => void
  onException?: () => void
  onDismiss: () => void
}

export default function ConflictBanner({
  message, existingTeaching, onUpdateTeaching, onException, onDismiss,
}: ConflictBannerProps) {
  return (
    <div className="mx-3 my-1.5 px-3 py-2.5 rounded-lg"
      style={{background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)'}}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" style={{color: '#fbbf24'}} />
          <span className="text-xs font-medium" style={{color: '#fbbf24'}}>Teaching conflict</span>
        </div>
        <button onClick={onDismiss} className="p-0.5 rounded hover:bg-white/10" style={{color: '#64748b'}}>
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-xs mb-1.5" style={{color: '#e2e8f0'}}>{message}</p>
      {existingTeaching && (
        <p className="text-xs mb-2 px-2 py-1 rounded" style={{background: 'rgba(245,158,11,0.06)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.1)'}}>
          Existing teaching: "{existingTeaching}"
        </p>
      )}
      <div className="flex items-center gap-2">
        {onUpdateTeaching && (
          <button onClick={onUpdateTeaching}
            className="px-2.5 py-1 text-xs rounded"
            style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)'}}>
            Update teaching
          </button>
        )}
        {onException && (
          <button onClick={onException}
            className="px-2.5 py-1 text-xs rounded"
            style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
            Exception this time
          </button>
        )}
        <button onClick={onDismiss}
          className="px-2.5 py-1 text-xs rounded"
          style={{background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)'}}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
