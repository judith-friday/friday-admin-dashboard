'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiFetch } from './types'
import { trackEvent } from '../lib/analytics'

// ── Color constants ──
const BG = '#0a0f1e'
const SECTION_BG = 'rgba(255,255,255,0.02)'
const SECTION_BORDER = 'rgba(255,255,255,0.06)'
const HEADER_COLOR = '#e2e8f0'
const SUB_COLOR = '#94a3b8'
const MUTED_COLOR = '#64748b'
const ACCENT = '#6395ff'

const sectionStyle: React.CSSProperties = { background: SECTION_BG, border: `1px solid ${SECTION_BORDER}`, borderRadius: '12px' }

function formatEventName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Shared sub-components ──

function LoadingState() {
  return <div className="text-center py-12 text-sm" style={{ color: MUTED_COLOR }}>Loading...</div>
}

function ErrorState({ message }: { message?: string }) {
  return <div className="text-center py-8 text-sm" style={{ color: '#f87171' }}>{message || 'Failed to load data'}</div>
}

function EmptyState({ message }: { message?: string }) {
  return <div className="text-center py-8 text-sm" style={{ color: MUTED_COLOR }}>{message || 'No data yet'}</div>
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle} className="p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: HEADER_COLOR }}>{title}</h3>
      {children}
    </div>
  )
}

function Bar({ value, max, color, label, rightLabel }: { value: number; max: number; color: string; label: string; rightLabel?: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, 2) : 2
  return (
    <div className="flex items-center gap-3 mb-1.5">
      <div className="text-xs w-36 sm:w-44 text-right truncate" style={{ color: SUB_COLOR }} title={label}>{label}</div>
      <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="h-full rounded flex items-center px-2" style={{ width: `${pct}%`, background: color, transition: 'width 0.3s ease' }}>
          <span className="text-xs font-medium" style={{ color: HEADER_COLOR }}>{value}</span>
        </div>
      </div>
      {rightLabel && <div className="text-xs w-16 text-right" style={{ color: MUTED_COLOR }}>{rightLabel}</div>}
    </div>
  )
}

// ── Hook for fetching section data ──

function useSectionData<T>(path: string, active: boolean) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const result = await apiFetch(path)
      setData(result)
    } catch {
      setError(true)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    if (active) fetch_()
  }, [active, fetch_])

  return { data, loading, error }
}

// ══════════════════════════════════════════════════════════
// DEVELOPER TAB SECTIONS
// ══════════════════════════════════════════════════════════

function DevFeatureUsage({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { event_type: string; count: string }[] }>('/api/analytics/v2/developer/feature-usage', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />
  // Aggregate by event_type across days
  const agg: Record<string, number> = {}
  for (const r of raw.data) agg[r.event_type] = (agg[r.event_type] || 0) + Number(r.count || 0)
  const features = Object.entries(agg).map(([event_type, count]) => ({ event_type, count })).sort((a, b) => b.count - a.count)
  const max = Math.max(...features.map(f => f.count), 1)
  const total = features.reduce((s, f) => s + f.count, 0)
  return (
    <SectionCard title="Feature Usage">
      {features.map(f => {
        const level = f.count > max * 0.6 ? 'rgba(34,197,94,0.4)' : f.count > max * 0.25 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.4)'
        return <Bar key={f.event_type} value={f.count} max={max} color={level} label={formatEventName(f.event_type)} rightLabel={total > 0 ? `${((f.count / total) * 100).toFixed(1)}%` : '0%'} />
      })}
    </SectionCard>
  )
}

function DevLearningRate({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ weeks: { week: string; rejections: number; revisions: number; teachings: number }[]; trend: string }>('/api/analytics/v2/developer/learning-rate', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.weeks?.length) return <EmptyState />
  const max = Math.max(...data.weeks.map(w => w.rejections + w.revisions + w.teachings), 1)
  const trendArrow = data.trend === 'up' ? ' \u2191' : data.trend === 'down' ? ' \u2193' : ''
  return (
    <SectionCard title={`Learning Rate${trendArrow}`}>
      {data.weeks.map(w => (
        <div key={w.week} className="mb-2">
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>{w.week}</div>
          <div className="flex gap-1" style={{ height: '20px' }}>
            {w.rejections > 0 && <div className="rounded" style={{ width: `${(w.rejections / max) * 100}%`, background: 'rgba(239,68,68,0.5)', minWidth: '2px' }} title={`Rejections: ${w.rejections}`} />}
            {w.revisions > 0 && <div className="rounded" style={{ width: `${(w.revisions / max) * 100}%`, background: 'rgba(234,179,8,0.5)', minWidth: '2px' }} title={`Revisions: ${w.revisions}`} />}
            {w.teachings > 0 && <div className="rounded" style={{ width: `${(w.teachings / max) * 100}%`, background: 'rgba(34,197,94,0.5)', minWidth: '2px' }} title={`Teachings: ${w.teachings}`} />}
          </div>
          <div className="flex gap-3 text-xs mt-0.5" style={{ color: SUB_COLOR }}>
            <span style={{ color: '#f87171' }}>{w.rejections} rej</span>
            <span style={{ color: '#fbbf24' }}>{w.revisions} rev</span>
            <span style={{ color: '#4ade80' }}>{w.teachings} teach</span>
          </div>
        </div>
      ))}
    </SectionCard>
  )
}

function DevDraftQuality({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ avg_revisions: number; first_draft_accept_rate: number; avg_confidence: number; weekly: { week: string; avg_revisions: number; accept_rate: number }[] }>('/api/analytics/v2/developer/draft-quality', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data) return <EmptyState />
  return (
    <SectionCard title="Draft Quality">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Avg Revisions</div>
          <div className="text-lg font-bold" style={{ color: ACCENT }}>{data.avg_revisions?.toFixed(1) ?? '-'}</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>1st Draft Accept</div>
          <div className="text-lg font-bold" style={{ color: '#4ade80' }}>{data.first_draft_accept_rate != null ? `${(data.first_draft_accept_rate * 100).toFixed(0)}%` : '-'}</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Avg Confidence</div>
          <div className="text-lg font-bold" style={{ color: '#c084fc' }}>{data.avg_confidence != null ? `${(data.avg_confidence * 100).toFixed(0)}%` : '-'}</div>
        </div>
      </div>
      {data.weekly?.length > 0 && (
        <div>
          <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>Weekly trend</div>
          {data.weekly.map(w => (
            <div key={w.week} className="flex items-center gap-3 mb-1">
              <div className="text-xs w-20" style={{ color: MUTED_COLOR }}>{w.week}</div>
              <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full rounded" style={{ width: `${Math.max(w.accept_rate * 100, 2)}%`, background: 'rgba(34,197,94,0.4)' }} />
              </div>
              <div className="text-xs w-16 text-right" style={{ color: SUB_COLOR }}>{(w.accept_rate * 100).toFixed(0)}% acc</div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

function DevAICosts({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ drafts: { input_tokens: string; output_tokens: string; category: string }[]; consult: { input_tokens: string; output_tokens: string; category: string }[]; pricing: { input_per_million: number; output_per_million: number } }>('/api/analytics/v2/developer/ai-costs', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw) return <EmptyState />

  // Combine drafts + consult into by_category and totals
  const allRows = [...(raw.drafts || []), ...(raw.consult || [])]
  const catAgg: Record<string, { input: number; output: number }> = {}
  let totalInput = 0, totalOutput = 0
  for (const r of allRows) {
    const inp = Number(r.input_tokens || 0)
    const out = Number(r.output_tokens || 0)
    totalInput += inp
    totalOutput += out
    const cat = r.category || 'other'
    if (!catAgg[cat]) catAgg[cat] = { input: 0, output: 0 }
    catAgg[cat].input += inp
    catAgg[cat].output += out
  }
  const by_category = Object.entries(catAgg).map(([category, v]) => ({ category, input_tokens: v.input, output_tokens: v.output }))
  const pricingIn = raw.pricing?.input_per_million ?? 15
  const pricingOut = raw.pricing?.output_per_million ?? 75
  const inputCost = (totalInput / 1_000_000) * pricingIn
  const outputCost = (totalOutput / 1_000_000) * pricingOut
  const totalCost = inputCost + outputCost

  return (
    <SectionCard title="AI Costs">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Total Tokens</div>
          <div className="text-lg font-bold" style={{ color: ACCENT }}>{((totalInput + totalOutput) / 1000).toFixed(1)}k</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Est. Cost</div>
          <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>${totalCost.toFixed(2)}</div>
        </div>
      </div>
      <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>
        Input: {(totalInput / 1000).toFixed(1)}k (${inputCost.toFixed(2)}) &middot; Output: {(totalOutput / 1000).toFixed(1)}k (${outputCost.toFixed(2)})
      </div>
      {by_category.length > 0 && (
        <div className="space-y-1 mt-3">
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>By category</div>
          {by_category.map(c => {
            const catTotal = c.input_tokens + c.output_tokens
            const allTotal = totalInput + totalOutput
            const pct = allTotal > 0 ? (catTotal / allTotal) * 100 : 0
            return (
              <div key={c.category} className="flex items-center gap-3">
                <div className="text-xs w-32 text-right truncate" style={{ color: SUB_COLOR }}>{formatEventName(c.category)}</div>
                <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded" style={{ width: `${Math.max(pct, 2)}%`, background: 'rgba(99,149,255,0.4)' }} />
                </div>
                <div className="text-xs w-14 text-right" style={{ color: MUTED_COLOR }}>{pct.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

function DevTeachingEffectiveness({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ teachings: { teaching_id: string; instruction: string; events_before: number; events_after: number }[] }>('/api/analytics/v2/developer/teaching-effectiveness', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.teachings?.length) return <EmptyState />
  const max = Math.max(...data.teachings.flatMap(t => [t.events_before, t.events_after]), 1)
  return (
    <SectionCard title="Teaching Effectiveness">
      {data.teachings.map(t => (
        <div key={t.teaching_id} className="mb-3">
          <div className="text-xs mb-1 truncate" style={{ color: SUB_COLOR }} title={t.instruction}>{t.instruction}</div>
          <div className="flex items-center gap-2">
            <div className="text-xs w-12 text-right" style={{ color: '#f87171' }}>Before</div>
            <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-full rounded" style={{ width: `${Math.max((t.events_before / max) * 100, 2)}%`, background: 'rgba(239,68,68,0.4)' }} />
            </div>
            <div className="text-xs w-8" style={{ color: MUTED_COLOR }}>{t.events_before}</div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="text-xs w-12 text-right" style={{ color: '#4ade80' }}>After</div>
            <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-full rounded" style={{ width: `${Math.max((t.events_after / max) * 100, 2)}%`, background: 'rgba(34,197,94,0.4)' }} />
            </div>
            <div className="text-xs w-8" style={{ color: MUTED_COLOR }}>{t.events_after}</div>
          </div>
        </div>
      ))}
    </SectionCard>
  )
}

function DevUnderusedFeatures({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ features: { feature: string; usage_count: number; trend: string }[] }>('/api/analytics/v2/developer/underused-features', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.features?.length) return <EmptyState message="All features well-used!" />
  const trendColors: Record<string, { bg: string; text: string }> = {
    active: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
    declining: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
    dormant: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  }
  return (
    <SectionCard title="Underused Features">
      <div className="space-y-2">
        {data.features.map(f => {
          const tc = trendColors[f.trend] || trendColors.dormant
          return (
            <div key={f.feature} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="text-sm" style={{ color: HEADER_COLOR }}>{formatEventName(f.feature)}</div>
                <div className="text-xs" style={{ color: MUTED_COLOR }}>{f.usage_count} uses</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.text }}>{f.trend}</span>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════
// TEAM TAB SECTIONS
// ══════════════════════════════════════════════════════════

function TeamResponseTimes({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { reviewed_by: string; median_response_min: number | null }[] }>('/api/analytics/v2/team/response-times', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />
  // Aggregate latest median per reviewer, skip system/null entries
  const byName: Record<string, number[]> = {}
  for (const r of raw.data) {
    if (r.median_response_min == null || r.reviewed_by === 'system' || r.reviewed_by === 'system-cleanup') continue
    if (!byName[r.reviewed_by]) byName[r.reviewed_by] = []
    byName[r.reviewed_by].push(Number(r.median_response_min))
  }
  const members = Object.entries(byName).map(([name, vals]) => ({
    name,
    median_response_time_minutes: vals.reduce((a, b) => a + b, 0) / vals.length,
  })).sort((a, b) => a.median_response_time_minutes - b.median_response_time_minutes)
  if (!members.length) return <EmptyState />
  const max = Math.max(...members.map(m => m.median_response_time_minutes), 1)
  return (
    <SectionCard title="Response Times (median, minutes)">
      {members.map(m => (
        <Bar key={m.name} value={Math.round(m.median_response_time_minutes)} max={max} color="rgba(99,149,255,0.4)" label={m.name} rightLabel={`${m.median_response_time_minutes.toFixed(0)}m`} />
      ))}
    </SectionCard>
  )
}

function TeamTeachingActivity({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ members: { name: string; reviews: number; teachings: number }[] }>('/api/analytics/v2/team/teaching-activity', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.members?.length) return <EmptyState />
  const max = Math.max(...data.members.map(m => m.reviews + m.teachings), 1)
  return (
    <SectionCard title="Teaching Activity (weekly)">
      {data.members.map(m => (
        <div key={m.name} className="mb-2">
          <div className="text-xs mb-0.5" style={{ color: SUB_COLOR }}>{m.name}</div>
          <div className="flex gap-1" style={{ height: '20px' }}>
            {m.reviews > 0 && <div className="rounded" style={{ width: `${(m.reviews / max) * 100}%`, background: 'rgba(99,149,255,0.5)', minWidth: '2px' }} title={`Reviews: ${m.reviews}`} />}
            {m.teachings > 0 && <div className="rounded" style={{ width: `${(m.teachings / max) * 100}%`, background: 'rgba(168,85,247,0.5)', minWidth: '2px' }} title={`Teachings: ${m.teachings}`} />}
          </div>
          <div className="flex gap-3 text-xs mt-0.5" style={{ color: MUTED_COLOR }}>
            <span>{m.reviews} reviews</span>
            <span>{m.teachings} teachings</span>
          </div>
        </div>
      ))}
    </SectionCard>
  )
}

function TeamSentiment({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { week: string; sentiment: string; count: string }[] }>('/api/analytics/v2/team/sentiment', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />
  // Pivot flat rows into per-week objects
  const weekMap: Record<string, { week: string; positive: number; neutral: number; frustrated: number; upset: number }> = {}
  for (const r of raw.data) {
    if (!weekMap[r.week]) weekMap[r.week] = { week: r.week, positive: 0, neutral: 0, frustrated: 0, upset: 0 }
    const key = r.sentiment as 'positive' | 'neutral' | 'frustrated' | 'upset'
    if (key in weekMap[r.week]) weekMap[r.week][key] = Number(r.count || 0)
  }
  const weeks = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week))
  if (!weeks.length) return <EmptyState />
  const sentimentColors = { positive: '#4ade80', neutral: '#64748b', frustrated: '#fb923c', upset: '#f87171' }
  return (
    <SectionCard title="Sentiment Trends">
      <div className="flex gap-3 text-xs mb-3" style={{ color: MUTED_COLOR }}>
        <span><span style={{ color: sentimentColors.positive }}>{'\u25CF'}</span> Positive</span>
        <span><span style={{ color: sentimentColors.neutral }}>{'\u25CF'}</span> Neutral</span>
        <span><span style={{ color: sentimentColors.frustrated }}>{'\u25CF'}</span> Frustrated</span>
        <span><span style={{ color: sentimentColors.upset }}>{'\u25CF'}</span> Upset</span>
      </div>
      {weeks.map(w => {
        const total = w.positive + w.neutral + w.frustrated + w.upset
        if (total === 0) return null
        return (
          <div key={w.week} className="mb-2">
            <div className="text-xs mb-0.5" style={{ color: MUTED_COLOR }}>{w.week}</div>
            <div className="flex rounded overflow-hidden" style={{ height: '20px' }}>
              {w.positive > 0 && <div style={{ width: `${(w.positive / total) * 100}%`, background: sentimentColors.positive }} title={`Positive: ${w.positive}`} />}
              {w.neutral > 0 && <div style={{ width: `${(w.neutral / total) * 100}%`, background: sentimentColors.neutral }} title={`Neutral: ${w.neutral}`} />}
              {w.frustrated > 0 && <div style={{ width: `${(w.frustrated / total) * 100}%`, background: sentimentColors.frustrated }} title={`Frustrated: ${w.frustrated}`} />}
              {w.upset > 0 && <div style={{ width: `${(w.upset / total) * 100}%`, background: sentimentColors.upset }} title={`Upset: ${w.upset}`} />}
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}

function TeamVolumePatterns({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { day_of_week: number; hour: number; count: string }[] }>('/api/analytics/v2/team/volume', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />

  const heatmap = raw.data.map(h => ({ day: h.day_of_week, hour: h.hour, count: Number(h.count || 0) }))
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const max = Math.max(...heatmap.map(h => h.count), 1)

  // Build 7x24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const h of heatmap) {
    if (h.day >= 0 && h.day < 7 && h.hour >= 0 && h.hour < 24) {
      grid[h.day][h.hour] = h.count
    }
  }

  return (
    <SectionCard title="Volume Patterns (day x hour)">
      <div className="overflow-x-auto">
        <div style={{ minWidth: '500px' }}>
          {/* Hour labels */}
          <div className="flex">
            <div style={{ width: '36px' }} />
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-center" style={{ fontSize: '9px', color: MUTED_COLOR }}>{i}</div>
            ))}
          </div>
          {grid.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center">
              <div style={{ width: '36px', fontSize: '10px', color: MUTED_COLOR }}>{dayNames[dayIdx]}</div>
              {row.map((count, hourIdx) => {
                const intensity = max > 0 ? count / max : 0
                const bg = count === 0
                  ? 'rgba(255,255,255,0.02)'
                  : `rgba(99,149,255,${0.15 + intensity * 0.7})`
                return (
                  <div
                    key={hourIdx}
                    className="flex-1 rounded-sm m-px"
                    style={{ height: '16px', background: bg }}
                    title={`${dayNames[dayIdx]} ${hourIdx}:00 — ${count} messages`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}

function TeamLeaderboard({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { reviewed_by: string; total_actions: string; drafts_sent: string; drafts_rejected: string; avg_revisions: string; median_response_min: number | null }[] }>('/api/analytics/v2/team/leaderboard', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />
  const members = raw.data
    .filter(r => r.reviewed_by !== 'system' && r.reviewed_by !== 'system-cleanup')
    .map(r => ({
      name: r.reviewed_by,
      total_actions: Number(r.total_actions || 0),
      sent: Number(r.drafts_sent || 0),
      rejected: Number(r.drafts_rejected || 0),
      avg_revisions: Number(r.avg_revisions || 0),
      median_response_time_minutes: Number(r.median_response_min || 0),
    }))
  const sorted = [...members].sort((a, b) => b.total_actions - a.total_actions)
  if (!sorted.length) return <EmptyState />
  return (
    <SectionCard title="Team Leaderboard">
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Name</th>
              <th className="text-right px-2 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Actions</th>
              <th className="text-right px-2 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Sent</th>
              <th className="text-right px-2 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Rej</th>
              <th className="text-right px-2 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Avg Rev</th>
              <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Resp (m)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={m.name} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                <td className="px-3 py-2" style={{ color: HEADER_COLOR }}>{m.name}</td>
                <td className="text-right px-2 py-2 font-medium" style={{ color: ACCENT }}>{m.total_actions}</td>
                <td className="text-right px-2 py-2" style={{ color: SUB_COLOR }}>{m.sent}</td>
                <td className="text-right px-2 py-2" style={{ color: SUB_COLOR }}>{m.rejected}</td>
                <td className="text-right px-2 py-2" style={{ color: SUB_COLOR }}>{m.avg_revisions.toFixed(1)}</td>
                <td className="text-right px-3 py-2" style={{ color: SUB_COLOR }}>{m.median_response_time_minutes.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

function TeamSuggestions({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ suggestions: { title: string; detail: string; priority: string }[] }>('/api/analytics/v2/team/suggestions', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.suggestions?.length) return <EmptyState message="No suggestions right now" />
  const priorityColors: Record<string, { bg: string; text: string }> = {
    high: { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
    medium: { bg: 'rgba(234,179,8,0.15)', text: '#fbbf24' },
  }
  return (
    <SectionCard title="Actionable Suggestions">
      <div className="space-y-2">
        {data.suggestions.map((s, i) => {
          const pc = priorityColors[s.priority] || priorityColors.medium
          return (
            <div key={i} className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: pc.bg, color: pc.text }}>{s.priority}</span>
                <span className="text-sm font-medium" style={{ color: HEADER_COLOR }}>{s.title}</span>
              </div>
              <div className="text-xs" style={{ color: SUB_COLOR }}>{s.detail}</div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════

interface AnalyticsDashboardProps {
  show: boolean
  onClose: () => void
}

export default function AnalyticsDashboard({ show, onClose }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'developer' | 'team'>('developer')

  useEffect(() => {
    if (show) {
      trackEvent('panel_opened', { panel: 'analytics_dashboard' })
    }
  }, [show])

  if (!show) return null

  const isDev = activeTab === 'developer'
  const isTeam = activeTab === 'team'

  return (
    <div
      className="fixed inset-0 z-[70] flex"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      onClick={onClose}
    >
      <div
        className="ml-auto w-full max-w-2xl h-full overflow-y-auto"
        style={{ background: BG, borderLeft: '1px solid rgba(255,255,255,0.06)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 sm:px-6 py-4" style={{ background: 'rgba(10,15,30,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>Analytics Dashboard</h2>
            <button onClick={onClose} className="text-sm px-3 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: SUB_COLOR }}>Close</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['developer', 'team'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 text-sm py-1.5 rounded-md font-medium transition-colors"
                style={{
                  background: activeTab === tab ? 'rgba(99,149,255,0.15)' : 'transparent',
                  color: activeTab === tab ? ACCENT : MUTED_COLOR,
                }}
              >
                {tab === 'developer' ? 'Developer' : 'Team'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-4 space-y-4">
          {isDev && (
            <>
              <DevFeatureUsage active={isDev} />
              <DevLearningRate active={isDev} />
              <DevDraftQuality active={isDev} />
              <DevAICosts active={isDev} />
              <DevTeachingEffectiveness active={isDev} />
              <DevUnderusedFeatures active={isDev} />
            </>
          )}
          {isTeam && (
            <>
              <TeamResponseTimes active={isTeam} />
              <TeamTeachingActivity active={isTeam} />
              <TeamSentiment active={isTeam} />
              <TeamVolumePatterns active={isTeam} />
              <TeamLeaderboard active={isTeam} />
              <TeamSuggestions active={isTeam} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
