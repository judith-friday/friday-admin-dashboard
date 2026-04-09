'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { apiFetch } from './types'
import { trackEvent } from '../lib/analytics'

interface AnalyticsSummary {
  counts_by_type: { event_type: string; count: number }[]
  daily_activity: { date: string; count: number }[]
  total_events: number
  date_range: { start: string; end: string }
  by_user: { user_name: string; event_type: string; count: number }[]
  page_views: {
    total: number
    by_user: { user_name: string; count: number }[]
    by_day: { date: string; count: number }[]
  }
}

interface AnalyticsPanelProps {
  show: boolean
  onClose: () => void
}

function formatEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const PAGE_VIEW_TYPE = 'page_view'

export default function AnalyticsPanel({ show, onClose }: AnalyticsPanelProps) {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('all')
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

  // Derived data
  const users = useMemo(() => {
    if (!data) return []
    const names = new Set(data.by_user.map(r => r.user_name))
    return Array.from(names).sort()
  }, [data])

  // Feature usage: exclude page_view
  const featureUsage = useMemo(() => {
    if (!data) return []
    return data.counts_by_type.filter(e => e.event_type !== PAGE_VIEW_TYPE)
  }, [data])

  const featureTotal = useMemo(() => featureUsage.reduce((s, e) => s + e.count, 0), [featureUsage])

  // Per-user data filtered by selected user
  const filteredByUser = useMemo(() => {
    if (!data) return []
    if (selectedUser === 'all') return data.by_user
    return data.by_user.filter(r => r.user_name === selectedUser)
  }, [data, selectedUser])

  // Per-user totals for the user summary row
  const userTotals = useMemo(() => {
    if (!data) return []
    const map = new Map<string, number>()
    for (const r of data.by_user) {
      map.set(r.user_name, (map.get(r.user_name) || 0) + r.count)
    }
    return Array.from(map.entries()).map(([user_name, count]) => ({ user_name, count })).sort((a, b) => b.count - a.count)
  }, [data])

  if (!show) return null

  const maxFeature = featureUsage.length > 0 ? Math.max(...featureUsage.map(e => e.count), 1) : 1
  const maxDaily = data ? Math.max(...data.daily_activity.map(d => d.count), 1) : 1
  const maxPvDay = data && data.page_views.by_day.length > 0 ? Math.max(...data.page_views.by_day.map(d => d.count), 1) : 1

  const sectionStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }
  const headerColor = '#e2e8f0'
  const subColor = '#94a3b8'
  const mutedColor = '#64748b'
  const accentColor = '#6395ff'

  return (
    <div
      className="fixed inset-0 z-[70] flex"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
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
          <div className="flex items-center gap-2">
            <button onClick={() => fetchData(startDate, endDate)} disabled={loading} className="text-sm p-1.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: loading ? '#475569' : subColor }} title="Refresh analytics">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            </button>
            <button onClick={onClose} className="text-sm px-3 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: subColor }}>Close</button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {/* Date range + user filter */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs block mb-1" style={{ color: mutedColor }}>From</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleDateChange(e.target.value, endDate)}
                className="text-sm rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: mutedColor }}>To</label>
              <input
                type="date"
                value={endDate}
                onChange={e => handleDateChange(startDate, e.target.value)}
                className="text-sm rounded px-2 py-1.5 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
              />
            </div>
            {users.length > 1 && (
              <div>
                <label className="text-xs block mb-1" style={{ color: mutedColor }}>User</label>
                <select
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  className="text-sm rounded px-2 py-1.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
                >
                  <option value="all">All Users</option>
                  {users.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}
            {data && (
              <div className="text-sm font-medium" style={{ color: accentColor }}>
                {data.total_events} events total
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm" style={{ color: mutedColor }}>Loading analytics...</div>
          ) : data ? (
            <>
              {/* ── Page Views Section ── */}
              <div style={sectionStyle} className="p-4">
                <h3 className="text-sm font-semibold mb-3" style={{ color: headerColor }}>
                  Page Views
                  <span className="ml-2 text-xs font-normal" style={{ color: mutedColor }}>({data.page_views.total} total visits)</span>
                </h3>

                {/* Page views per user */}
                {data.page_views.by_user.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-3">
                      {data.page_views.by_user.map(u => (
                        <div key={u.user_name} className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)' }}>
                          <div className="text-xs" style={{ color: subColor }}>{u.user_name}</div>
                          <div className="text-lg font-bold" style={{ color: accentColor }}>{u.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Page views over time mini chart */}
                {data.page_views.by_day.length > 0 && (
                  <div>
                    <div className="text-xs mb-2" style={{ color: mutedColor }}>Visits over time</div>
                    <div className="overflow-x-auto">
                      <div className="flex items-end gap-1" style={{ minHeight: '80px', minWidth: data.page_views.by_day.length * 20 }}>
                        {data.page_views.by_day.map(d => {
                          const heightPct = Math.max((d.count / maxPvDay) * 100, 3)
                          const dateObj = new Date(d.date + 'T00:00:00')
                          const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`
                          return (
                            <div key={d.date} className="flex flex-col items-center flex-1" style={{ minWidth: '18px' }}>
                              <div className="text-xs mb-1" style={{ color: subColor, fontSize: '10px' }}>{d.count}</div>
                              <div
                                className="w-full rounded-t"
                                style={{
                                  height: `${heightPct}px`,
                                  minHeight: '3px',
                                  background: 'linear-gradient(180deg, rgba(56,189,248,0.6), rgba(56,189,248,0.2))',
                                }}
                                title={`${d.date}: ${d.count} page views`}
                              />
                              <div className="text-xs mt-1" style={{ color: '#475569', fontSize: '9px', whiteSpace: 'nowrap' }}>{label}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Feature Usage (excludes page_view) ── */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: headerColor }}>
                  Feature Usage
                  <span className="ml-2 text-xs font-normal" style={{ color: mutedColor }}>({featureTotal} interactions, excludes page views)</span>
                </h3>
                <div className="space-y-2">
                  {featureUsage.map(e => (
                    <div key={e.event_type} className="flex items-center gap-3">
                      <div className="text-xs w-40 sm:w-48 text-right truncate" style={{ color: subColor }} title={e.event_type}>
                        {formatEventName(e.event_type)}
                      </div>
                      <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="h-full rounded flex items-center px-2"
                          style={{
                            width: `${Math.max((e.count / maxFeature) * 100, 2)}%`,
                            background: 'linear-gradient(90deg, rgba(99,149,255,0.3), rgba(99,149,255,0.5))',
                            transition: 'width 0.3s ease',
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: headerColor }}>{e.count}</span>
                        </div>
                      </div>
                      <div className="text-xs w-12 text-right" style={{ color: mutedColor }}>
                        {featureTotal > 0 ? ((e.count / featureTotal) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Daily Activity Timeline ── */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: headerColor }}>Daily Activity (Last {data.daily_activity.length} days)</h3>
                {data.daily_activity.length === 0 ? (
                  <p className="text-xs" style={{ color: mutedColor }}>No activity in this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-1" style={{ minHeight: '120px', minWidth: data.daily_activity.length * 20 }}>
                      {data.daily_activity.map(d => {
                        const heightPct = Math.max((d.count / maxDaily) * 100, 3)
                        const dateObj = new Date(d.date + 'T00:00:00')
                        const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`
                        return (
                          <div key={d.date} className="flex flex-col items-center flex-1" style={{ minWidth: '18px' }}>
                            <div className="text-xs mb-1" style={{ color: subColor, fontSize: '10px' }}>{d.count}</div>
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

              {/* ── Per-User Breakdown ── */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: headerColor }}>Per-User Breakdown</h3>

                {/* User summary cards */}
                {selectedUser === 'all' && userTotals.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {userTotals.map(u => (
                      <button
                        key={u.user_name}
                        onClick={() => setSelectedUser(u.user_name)}
                        className="rounded-lg px-3 py-2 text-left transition-colors"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="text-xs" style={{ color: subColor }}>{u.user_name}</div>
                        <div className="text-base font-bold" style={{ color: accentColor }}>{u.count} <span className="text-xs font-normal" style={{ color: mutedColor }}>events</span></div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Per-user event table */}
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: mutedColor }}>User</th>
                        <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: mutedColor }}>Event Type</th>
                        <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: mutedColor }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredByUser.map((r, i) => (
                        <tr key={`${r.user_name}-${r.event_type}-${i}`} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="px-3 py-2" style={{ color: headerColor }}>{r.user_name}</td>
                          <td className="px-3 py-2" style={{ color: subColor }}>{formatEventName(r.event_type)}</td>
                          <td className="text-right px-3 py-2 font-medium" style={{ color: accentColor }}>{r.count}</td>
                        </tr>
                      ))}
                      {filteredByUser.length === 0 && (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-xs" style={{ color: mutedColor }}>No data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm" style={{ color: mutedColor }}>Failed to load analytics</div>
          )}
        </div>
      </div>
    </div>
  )
}
