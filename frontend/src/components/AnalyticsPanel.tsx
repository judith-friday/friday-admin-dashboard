'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiFetch } from './types'
import { trackEvent } from '../lib/analytics'

interface AnalyticsSummary {
  counts_by_type: { event_type: string; count: number }[]
  daily_activity: { date: string; count: number }[]
  total_events: number
  date_range: { start: string; end: string }
}

interface AnalyticsPanelProps {
  show: boolean
  onClose: () => void
}

function formatEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function AnalyticsPanel({ show, onClose }: AnalyticsPanelProps) {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  const fetchData = useCallback(async (start: string, end: string) => {
    setLoading(true)
    try {
      const result = await apiFetch(`/api/analytics/summary?start=${start}&end=${end}`)
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (show) {
      trackEvent('panel_opened', { panel: 'analytics' })
      fetchData(startDate, endDate)
    }
  }, [show])

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
    fetchData(start, end)
  }

  if (!show) return null

  const maxCount = data ? Math.max(...data.counts_by_type.map(e => e.count), 1) : 1
  const maxDaily = data ? Math.max(...data.daily_activity.map(d => d.count), 1) : 1

  return (
    <div
      className="fixed inset-0 z-[70] flex"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      onClick={onClose}
    >
      <div
        className="ml-auto w-full max-w-2xl h-full overflow-y-auto"
        style={{ background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 sm:px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(10,15,30,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>Analytics Dashboard</h2>
          <button onClick={onClose} className="text-sm px-3 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>Close</button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {/* Date range filter */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#64748b' }}>From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleDateChange(e.target.value, endDate)}
                className="text-sm rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#64748b' }}>To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => handleDateChange(startDate, e.target.value)}
                className="text-sm rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
              />
            </div>
            {data && (
              <div className="text-sm font-medium" style={{ color: '#6395ff' }}>
                {data.total_events} events total
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm" style={{ color: '#64748b' }}>Loading analytics...</div>
          ) : data ? (
            <>
              {/* Event counts by type — bar chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>Events by Type</h3>
                <div className="space-y-2">
                  {data.counts_by_type.map(e => (
                    <div key={e.event_type} className="flex items-center gap-3">
                      <div className="text-xs w-40 sm:w-48 text-right truncate" style={{ color: '#94a3b8' }} title={e.event_type}>
                        {formatEventName(e.event_type)}
                      </div>
                      <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded flex items-center px-2"
                          style={{
                            width: `${Math.max((e.count / maxCount) * 100, 2)}%`,
                            background: 'linear-gradient(90deg, rgba(99,149,255,0.3), rgba(99,149,255,0.5))',
                            transition: 'width 0.3s ease',
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: '#e2e8f0' }}>{e.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily activity timeline */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>Daily Activity (Last {data.daily_activity.length} days)</h3>
                {data.daily_activity.length === 0 ? (
                  <p className="text-xs" style={{ color: '#64748b' }}>No activity in this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-1" style={{ minHeight: '120px', minWidth: data.daily_activity.length * 20 }}>
                      {data.daily_activity.map(d => {
                        const heightPct = Math.max((d.count / maxDaily) * 100, 3)
                        const dateObj = new Date(d.date + 'T00:00:00')
                        const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`
                        return (
                          <div key={d.date} className="flex flex-col items-center flex-1" style={{ minWidth: '18px' }}>
                            <div className="text-xs mb-1" style={{ color: '#94a3b8', fontSize: '10px' }}>{d.count}</div>
                            <div
                              className="w-full rounded-t"
                              style={{
                                height: `${heightPct}px`,
                                minHeight: '3px',
                                background: 'linear-gradient(180deg, rgba(99,149,255,0.6), rgba(99,149,255,0.25))',
                              }}
                              title={`${d.date}: ${d.count} events`}
                            />
                            <div className="text-xs mt-1" style={{ color: '#475569', fontSize: '9px', whiteSpace: 'nowrap' }}>{label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary table */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>Event Details</h3>
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: '#64748b' }}>Event Type</th>
                        <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: '#64748b' }}>Count</th>
                        <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: '#64748b' }}>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.counts_by_type.map(e => (
                        <tr key={e.event_type} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-3 py-2" style={{ color: '#e2e8f0' }}>{formatEventName(e.event_type)}</td>
                          <td className="text-right px-3 py-2 font-medium" style={{ color: '#6395ff' }}>{e.count}</td>
                          <td className="text-right px-3 py-2" style={{ color: '#94a3b8' }}>{data.total_events > 0 ? ((e.count / data.total_events) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm" style={{ color: '#64748b' }}>Failed to load analytics</div>
          )}
        </div>
      </div>
    </div>
  )
}
