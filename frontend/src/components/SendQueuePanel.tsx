'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface QueuedDraft {
  id: string
  state: 'send_queued' | 'send_failed'
  draft_body: string
  retry_count: number
  send_method: string | null
  updated_at: string
  created_at: string
  conversation_id: string
  next_retry_at: string | null
  guest_name: string
  property_name: string
  channel: string
}

interface SendQueuePanelProps {
  show: boolean
  onClose: () => void
  onNavigate?: (conversationId: string) => void
}

const STATE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  send_queued: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Queued' },
  send_failed: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', label: 'Failed' },
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function SendQueuePanel({ show, onClose, onNavigate }: SendQueuePanelProps) {
  const [drafts, setDrafts] = useState<QueuedDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [stateFilter, setStateFilter] = useState<string>('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/api/drafts/queued/list')
      setDrafts(data.drafts || [])
    } catch (err: any) {
      toast.error('Failed to load send queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (show) fetchQueue()
  }, [show, fetchQueue])

  const handleRetry = async (id: string) => {
    setActioningId(id)
    try {
      await apiFetch(`/api/drafts/${id}/retry`, {
        method: 'POST',
        body: JSON.stringify({ reviewed_by: 'dashboard' }),
      })
      toast.success('Retry initiated')
      fetchQueue()
    } catch (err: any) {
      toast.error('Retry failed: ' + err.message)
    } finally {
      setActioningId(null)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Mark all queued messages as failed?')) return
    try {
      await Promise.all(drafts.filter(d => d.state === 'send_queued').map(d =>
        apiFetch(`/api/drafts/${d.id}/fail`, { method: 'POST' })
      ))
      toast.success('All queued messages cleared')
      fetchQueue()
    } catch (err: any) {
      toast.error('Clear failed: ' + err.message)
    }
  }

  const handleCancel = async (id: string) => {
    setActioningId(id)
    try {
      await apiFetch(`/api/drafts/${id}/fail`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      toast.success('Marked as failed')
      fetchQueue()
    } catch (err: any) {
      toast.error('Cancel failed: ' + err.message)
    } finally {
      setActioningId(null)
    }
  }

  const filtered = stateFilter
    ? drafts.filter(d => d.state === stateFilter)
    : drafts

  const queuedCount = drafts.filter(d => d.state === 'send_queued').length
  const failedCount = drafts.filter(d => d.state === 'send_failed').length

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[70] flex" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} onClick={onClose}>
      <div
        className="ml-auto w-full max-w-2xl h-full overflow-y-auto"
        style={{ background: '#0d1220', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: '#0d1220', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>{'\uD83D\uDCE4'} Send Queue</h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {queuedCount > 0 && <span style={{ color: '#fbbf24' }}>{queuedCount} queued</span>}
              {queuedCount > 0 && failedCount > 0 && ' \u00B7 '}
              {failedCount > 0 && <span style={{ color: '#f87171' }}>{failedCount} failed</span>}
              {queuedCount === 0 && failedCount === 0 && 'No pending messages'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {queuedCount > 0 && (
              <button onClick={handleClearAll} className="text-xs px-2 py-1 rounded"
                style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                Clear All
              </button>
            )}
            <button onClick={onClose} className="text-sm px-2 py-1 rounded" style={{ color: '#64748b' }}>
              {'\u2715'}
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-5 py-2 flex gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            { value: '', label: `All (${drafts.length})` },
            { value: 'send_queued', label: `Queued (${queuedCount})` },
            { value: 'send_failed', label: `Failed (${failedCount})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setStateFilter(f.value)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                background: stateFilter === f.value ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)',
                color: stateFilter === f.value ? '#6395ff' : '#64748b',
                border: `1px solid ${stateFilter === f.value ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Draft list */}
        <div className="px-5 py-3 space-y-2">
          {loading ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#64748b' }}>
              {drafts.length === 0 ? 'No queued or failed messages' : 'No messages match this filter'}
            </div>
          ) : filtered.map(draft => {
            const sc = STATE_COLORS[draft.state] || STATE_COLORS.send_queued
            const isActioning = actioningId === draft.id
            const preview = (draft.draft_body || '').substring(0, 100)

            return (
              <div
                key={draft.id}
                className="rounded-lg p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Top row: guest + property + state */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                        {draft.guest_name || 'Unknown Guest'}
                      </span>
                      {draft.property_name && (
                        <span className="text-xs truncate" style={{ color: '#94a3b8' }}>
                          {draft.property_name}
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </div>

                    {/* Message preview */}
                    <div className="text-xs mt-1.5 leading-relaxed" style={{ color: '#cbd5e1' }}>
                      {preview}{preview.length >= 100 ? '...' : ''}
                    </div>

                    {/* Meta row */}
                    <div className="text-xs mt-1.5 flex items-center gap-2 flex-wrap" style={{ color: '#64748b' }}>
                      <span>{timeAgo(draft.updated_at)}</span>
                      {draft.retry_count > 0 && (
                        <span style={{ color: '#fbbf24' }}>
                          {draft.retry_count}/3 retries
                        </span>
                      )}
                      {draft.next_retry_at && new Date(draft.next_retry_at) > new Date() && (
                        <span style={{ color: '#94a3b8' }}>
                          next retry {timeAgo(draft.next_retry_at).replace(' ago', '')}
                        </span>
                      )}
                      {draft.channel && (
                        <span>{draft.channel}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-2.5">
                  <button
                    disabled={isActioning}
                    onClick={() => handleRetry(draft.id)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: 'rgba(99,149,255,0.15)',
                      color: '#6395ff',
                      border: '1px solid rgba(99,149,255,0.3)',
                      opacity: isActioning ? 0.5 : 1,
                    }}
                  >
                    {'\u{1F504}'} Retry Now
                  </button>
                  {draft.state === 'send_queued' && (
                    <button
                      disabled={isActioning}
                      onClick={() => handleCancel(draft.id)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: 'rgba(239,68,68,0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.3)',
                        opacity: isActioning ? 0.5 : 1,
                      }}
                    >
                      {'\u274C'} Cancel
                    </button>
                  )}
                  {onNavigate && (
                    <button
                      onClick={() => { onNavigate(draft.conversation_id); onClose() }}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {'\u{1F441}'} View
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
