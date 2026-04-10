'use client'

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react'
import { apiFetch } from './types'
import { trackEvent } from '../lib/analytics'

// Date range context — section components automatically get date filtering
const DateRangeContext = createContext({ start: '', end: '' })

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

function EmptyState({ message: _message }: { message?: string }) {
  return null // Hide empty sections entirely
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

function useSectionData<T>(basePath: string, active: boolean) {
  const { start, end } = useContext(DateRangeContext)
  const path = useMemo(() => {
    if (!start && !end) return basePath
    const sep = basePath.includes('?') ? '&' : '?'
    const params = [start && `start=${start}`, end && `end=${end}`].filter(Boolean).join('&')
    return `${basePath}${sep}${params}`
  }, [basePath, start, end])

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

  return { data, loading, error, refetch: fetch_ }
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

// ── NEW DEVELOPER DEPTH SECTIONS ──

function DevTokenTrends({ active }: { active: boolean }) {
  const [days, setDays] = useState(14)
  const { data, loading, error } = useSectionData<{ drafts: { day: string; input_tokens: string; output_tokens: string; draft_count: string }[]; consult: { day: string; input_tokens: string; output_tokens: string }[]; days: number }>(`/api/analytics/v2/developer/token-trends?days=${days}`, active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.drafts?.length && !data?.consult?.length) return <EmptyState message="No token data yet" />

  // Merge draft + consult into per-day totals
  const dayMap: Record<string, { input: number; output: number }> = {}
  for (const r of (data.drafts || [])) {
    const d = r.day?.slice(0, 10) || ''
    if (!dayMap[d]) dayMap[d] = { input: 0, output: 0 }
    dayMap[d].input += Number(r.input_tokens || 0)
    dayMap[d].output += Number(r.output_tokens || 0)
  }
  for (const r of (data.consult || [])) {
    const d = r.day?.slice(0, 10) || ''
    if (!dayMap[d]) dayMap[d] = { input: 0, output: 0 }
    dayMap[d].input += Number(r.input_tokens || 0)
    dayMap[d].output += Number(r.output_tokens || 0)
  }
  const entries = Object.entries(dayMap).sort((a, b) => a[0].localeCompare(b[0]))
  const maxTokens = Math.max(...entries.map(([, v]) => v.input + v.output), 1)

  return (
    <SectionCard title="Token Usage Trends">
      <div className="flex gap-2 mb-3">
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setDays(d)} className="text-xs px-2 py-1 rounded" style={{ background: days === d ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)', color: days === d ? ACCENT : MUTED_COLOR }}>{d}d</button>
        ))}
      </div>
      {entries.map(([day, v]) => {
        const total = v.input + v.output
        const inputPct = total > 0 ? (v.input / total) * 100 : 50
        return (
          <div key={day} className="mb-1.5">
            <div className="flex items-center gap-2">
              <div className="text-xs w-16" style={{ color: MUTED_COLOR }}>{day.slice(5)}</div>
              <div className="flex-1 h-5 rounded overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="h-full" style={{ width: `${(total / maxTokens) * inputPct}%`, background: 'rgba(99,149,255,0.5)' }} title={`Input: ${(v.input / 1000).toFixed(1)}k`} />
                <div className="h-full" style={{ width: `${(total / maxTokens) * (100 - inputPct)}%`, background: 'rgba(168,85,247,0.5)' }} title={`Output: ${(v.output / 1000).toFixed(1)}k`} />
              </div>
              <div className="text-xs w-14 text-right" style={{ color: SUB_COLOR }}>{(total / 1000).toFixed(1)}k</div>
            </div>
          </div>
        )
      })}
      <div className="flex gap-4 text-xs mt-2" style={{ color: MUTED_COLOR }}>
        <span><span style={{ color: ACCENT }}>●</span> Input</span>
        <span><span style={{ color: '#c084fc' }}>●</span> Output</span>
      </div>
    </SectionCard>
  )
}

function DevCostPerConversation({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ summary: { conversation_count: string; total_input_tokens: string; total_output_tokens: string; avg_input_per_conv: string; avg_output_per_conv: string; avg_drafts_per_conv: string }; top_conversations: { guest_name: string; property_name: string; channel: string; input_tokens: string; output_tokens: string; draft_count: string }[]; pricing: { input_per_million: number; output_per_million: number } }>('/api/analytics/v2/developer/cost-per-conversation', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.summary) return <EmptyState />

  const s = data.summary
  const avgIn = Number(s.avg_input_per_conv || 0)
  const avgOut = Number(s.avg_output_per_conv || 0)
  const pIn = data.pricing?.input_per_million ?? 15
  const pOut = data.pricing?.output_per_million ?? 75
  const avgCost = (avgIn / 1e6) * pIn + (avgOut / 1e6) * pOut

  return (
    <SectionCard title="Cost per Conversation">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Avg Cost/Conv</div>
          <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>${avgCost.toFixed(3)}</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Conversations</div>
          <div className="text-lg font-bold" style={{ color: ACCENT }}>{Number(s.conversation_count || 0)}</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Avg Drafts/Conv</div>
          <div className="text-lg font-bold" style={{ color: '#c084fc' }}>{Number(s.avg_drafts_per_conv || 0).toFixed(1)}</div>
        </div>
      </div>
      {data.top_conversations?.length > 0 && (
        <>
          <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>Most expensive conversations</div>
          {data.top_conversations.map((c, i) => {
            const tokens = Number(c.input_tokens || 0) + Number(c.output_tokens || 0)
            const cost = (Number(c.input_tokens || 0) / 1e6) * pIn + (Number(c.output_tokens || 0) / 1e6) * pOut
            return (
              <div key={i} className="flex items-center justify-between py-1.5" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                <div>
                  <div className="text-xs" style={{ color: HEADER_COLOR }}>{c.guest_name || 'Unknown'}</div>
                  <div className="text-xs" style={{ color: MUTED_COLOR }}>{c.property_name} · {c.channel} · {c.draft_count} drafts</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium" style={{ color: '#fbbf24' }}>${cost.toFixed(3)}</div>
                  <div className="text-xs" style={{ color: MUTED_COLOR }}>{(tokens / 1000).toFixed(1)}k tok</div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </SectionCard>
  )
}

function DevErrorTrends({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ draft_errors: { day: string; total_drafts: string; error_or_stuck: string; retried: string }[]; consult_errors: { day: string; total_sessions: string; abandoned: string; with_errors: string }[] }>('/api/analytics/v2/developer/error-trends', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.draft_errors?.length && !data?.consult_errors?.length) return <EmptyState message="No error data" />

  const totalDraftErrors = (data.draft_errors || []).reduce((s, r) => s + Number(r.error_or_stuck || 0), 0)
  const totalDrafts = (data.draft_errors || []).reduce((s, r) => s + Number(r.total_drafts || 0), 0)
  const errorRate = totalDrafts > 0 ? ((totalDraftErrors / totalDrafts) * 100).toFixed(1) : '0'
  const totalConsultErrors = (data.consult_errors || []).reduce((s, r) => s + Number(r.with_errors || 0) + Number(r.abandoned || 0), 0)

  const max = Math.max(...(data.draft_errors || []).map(r => Number(r.total_drafts || 0)), 1)

  return (
    <SectionCard title="Error Trends">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Draft Error Rate</div>
          <div className="text-lg font-bold" style={{ color: '#f87171' }}>{errorRate}%</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Consult Errors</div>
          <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>{totalConsultErrors}</div>
        </div>
      </div>
      {(data.draft_errors || []).slice(-14).map(r => {
        const total = Number(r.total_drafts || 0)
        const errors = Number(r.error_or_stuck || 0)
        const okPct = total > 0 ? ((total - errors) / max) * 100 : 0
        const errPct = total > 0 ? (errors / max) * 100 : 0
        return (
          <div key={r.day} className="flex items-center gap-2 mb-1">
            <div className="text-xs w-16" style={{ color: MUTED_COLOR }}>{(r.day || '').slice(5, 10)}</div>
            <div className="flex-1 h-4 rounded overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-full" style={{ width: `${okPct}%`, background: 'rgba(34,197,94,0.4)' }} />
              {errors > 0 && <div className="h-full" style={{ width: `${errPct}%`, background: 'rgba(239,68,68,0.5)' }} />}
            </div>
            <div className="text-xs w-12 text-right" style={{ color: errors > 0 ? '#f87171' : MUTED_COLOR }}>{errors > 0 ? `${errors} err` : ''}</div>
          </div>
        )
      })}
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════
// TEAM TAB SECTIONS
// ══════════════════════════════════════════════════════════

// — Inquiry Performance (D1) —

interface InquiryData {
  period: { start: string; end: string }
  conversions: {
    total: number; inquiry: number; booked: number; lost: number; unknown: number; conversion_rate: number
    by_channel: { channel: string; total: number; booked: number; rate: number }[]
    by_property: { property_name: string; total: number; booked: number; rate: number }[]
  }
  response_time: { avg_first_response_minutes: number | null; booked_avg_first_response: number | null; lost_avg_first_response: number | null }
  followups: { total: number; by_status: Record<string, number>; by_urgency: Record<string, number>; dismissed_reasons: Record<string, number>; avg_escalation_level: number }
  intents: Record<string, number>
  trends: { daily: { date: string; new_conversations: number; booked: number; followups_created: number }[] }
}

function TeamInquiryFunnel({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.conversions) return <EmptyState />

  const c = data.conversions
  const funnelSteps = [
    { label: 'Total', value: c.total, color: ACCENT },
    { label: 'Inquiry', value: c.inquiry, color: '#fbbf24' },
    { label: 'Booked', value: c.booked, color: '#4ade80' },
    { label: 'Lost', value: c.lost, color: '#f87171' },
    { label: 'Unknown', value: c.unknown, color: MUTED_COLOR },
  ]
  const max = Math.max(c.total, 1)

  return (
    <SectionCard title="Conversion Funnel">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Conversion Rate</div>
          <div className="text-lg font-bold" style={{ color: '#4ade80' }}>{c.conversion_rate}%</div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Total Conversations</div>
          <div className="text-lg font-bold" style={{ color: ACCENT }}>{c.total}</div>
        </div>
      </div>
      {funnelSteps.map(s => (
        <div key={s.label} className="flex items-center gap-3 mb-1.5">
          <div className="text-xs w-16 text-right" style={{ color: SUB_COLOR }}>{s.label}</div>
          <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded flex items-center px-2" style={{ width: `${Math.max((s.value / max) * 100, 2)}%`, background: s.color, opacity: 0.5, transition: 'width 0.3s ease' }}>
              <span className="text-xs font-medium" style={{ color: HEADER_COLOR }}>{s.value}</span>
            </div>
          </div>
        </div>
      ))}
    </SectionCard>
  )
}

function TeamInquiryByChannel({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.conversions?.by_channel?.length) return <EmptyState />

  const channels = data.conversions.by_channel
  const max = Math.max(...channels.map(c => c.total), 1)

  return (
    <SectionCard title="Conversions by Channel">
      {channels.map(ch => (
        <div key={ch.channel} className="mb-2">
          <div className="flex items-center gap-3 mb-0.5">
            <div className="text-xs w-20 text-right truncate" style={{ color: SUB_COLOR }}>{ch.channel}</div>
            <div className="flex-1 h-5 rounded overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {ch.booked > 0 && <div className="h-full" style={{ width: `${(ch.booked / max) * 100}%`, background: 'rgba(74,222,128,0.5)' }} title={`Booked: ${ch.booked}`} />}
              {(ch.total - ch.booked) > 0 && <div className="h-full" style={{ width: `${((ch.total - ch.booked) / max) * 100}%`, background: 'rgba(99,149,255,0.3)' }} title={`Other: ${ch.total - ch.booked}`} />}
            </div>
            <div className="text-xs w-20 text-right" style={{ color: MUTED_COLOR }}>{ch.booked}/{ch.total} ({ch.rate}%)</div>
          </div>
        </div>
      ))}
      <div className="flex gap-3 text-xs mt-2" style={{ color: MUTED_COLOR }}>
        <span><span style={{ color: '#4ade80' }}>{'\u25CF'}</span> Booked</span>
        <span><span style={{ color: ACCENT }}>{'\u25CF'}</span> Other</span>
      </div>
    </SectionCard>
  )
}

function TeamInquiryByProperty({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.conversions?.by_property?.length) return <EmptyState />

  const properties = data.conversions.by_property.filter(p => p.total > 0)
  if (!properties.length) return <EmptyState />

  return (
    <SectionCard title="Conversions by Property">
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Property</th>
              <th className="text-right px-2 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Total</th>
              <th className="text-right px-2 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Booked</th>
              <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p, i) => (
              <tr key={p.property_name} style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                <td className="px-3 py-2 text-xs truncate" style={{ color: HEADER_COLOR, maxWidth: '180px' }}>{p.property_name}</td>
                <td className="text-right px-2 py-2 text-xs" style={{ color: SUB_COLOR }}>{p.total}</td>
                <td className="text-right px-2 py-2 text-xs font-medium" style={{ color: '#4ade80' }}>{p.booked}</td>
                <td className="text-right px-3 py-2 text-xs font-medium" style={{ color: p.rate > 0 ? '#4ade80' : MUTED_COLOR }}>{p.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

function TeamInquiryResponseTime({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.response_time) return <EmptyState />

  const rt = data.response_time
  if (rt.avg_first_response_minutes == null && rt.booked_avg_first_response == null && rt.lost_avg_first_response == null) return <EmptyState />

  const items = [
    { label: 'All Conversations', value: rt.avg_first_response_minutes, color: ACCENT },
    { label: 'Booked', value: rt.booked_avg_first_response, color: '#4ade80' },
    { label: 'Lost', value: rt.lost_avg_first_response, color: '#f87171' },
  ].filter(i => i.value != null) as { label: string; value: number; color: string }[]
  const max = Math.max(...items.map(i => i.value), 1)

  return (
    <SectionCard title="Avg First Response Time (minutes)">
      {items.map(i => (
        <Bar key={i.label} value={Math.round(i.value)} max={max} color={i.color} label={i.label} rightLabel={`${Math.round(i.value)}m`} />
      ))}
      {rt.booked_avg_first_response != null && rt.lost_avg_first_response != null && rt.lost_avg_first_response > rt.booked_avg_first_response && (
        <div className="text-xs mt-2 px-2 py-1.5 rounded" style={{ background: 'rgba(74,222,128,0.06)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.1)' }}>
          Booked guests got {Math.round(rt.lost_avg_first_response - rt.booked_avg_first_response)}m faster first response on average
        </div>
      )}
    </SectionCard>
  )
}

function TeamInquiryFollowups({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.followups || data.followups.total === 0) return <EmptyState />

  const f = data.followups
  const statusColors: Record<string, string> = { pending: '#fbbf24', auto_dismissed: '#64748b', completed: '#4ade80', dismissed: '#94a3b8' }
  const statusEntries = Object.entries(f.by_status).filter(([, v]) => v > 0)
  const urgencyColors: Record<string, string> = { low: '#64748b', medium: '#fbbf24', high: '#fb923c', critical: '#f87171' }
  const urgencyEntries = Object.entries(f.by_urgency).filter(([, v]) => v > 0)

  return (
    <SectionCard title={`Follow-up Activity (${f.total} total)`}>
      {statusEntries.length > 0 && (
        <div className="mb-3">
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>By Status</div>
          <div className="flex rounded overflow-hidden" style={{ height: '20px' }}>
            {statusEntries.map(([status, count]) => (
              <div key={status} style={{ width: `${(count / f.total) * 100}%`, background: statusColors[status] || MUTED_COLOR, minWidth: '2px' }} title={`${status}: ${count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs mt-1" style={{ color: MUTED_COLOR }}>
            {statusEntries.map(([s, c]) => <span key={s}><span style={{ color: statusColors[s] }}>{'\u25CF'}</span> {s.replace('_', ' ')} ({c})</span>)}
          </div>
        </div>
      )}
      {urgencyEntries.length > 0 && (
        <div>
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>By Urgency</div>
          <div className="flex rounded overflow-hidden" style={{ height: '20px' }}>
            {urgencyEntries.map(([urgency, count]) => (
              <div key={urgency} style={{ width: `${(count / f.total) * 100}%`, background: urgencyColors[urgency] || MUTED_COLOR, minWidth: '2px' }} title={`${urgency}: ${count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 text-xs mt-1" style={{ color: MUTED_COLOR }}>
            {urgencyEntries.map(([u, c]) => <span key={u}><span style={{ color: urgencyColors[u] }}>{'\u25CF'}</span> {u} ({c})</span>)}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function TeamInquiryIntents({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.intents) return <EmptyState />

  const entries = Object.entries(data.intents).filter(([, v]) => v > 0)
  if (!entries.length) return <EmptyState />

  const total = entries.reduce((s, [, v]) => s + v, 0)
  const intentColors: Record<string, string> = { new_booking: '#4ade80', extension: '#6395ff', question: '#fbbf24', complaint: '#f87171', followup: '#c084fc', unknown: '#64748b' }

  return (
    <SectionCard title="Intent Distribution">
      <div className="flex rounded overflow-hidden mb-2" style={{ height: '24px' }}>
        {entries.map(([intent, count]) => (
          <div key={intent} style={{ width: `${(count / total) * 100}%`, background: intentColors[intent] || MUTED_COLOR, minWidth: '2px' }} title={`${intent}: ${count}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: MUTED_COLOR }}>
        {entries.map(([i, c]) => <span key={i}><span style={{ color: intentColors[i] }}>{'\u25CF'}</span> {i.replace('_', ' ')} ({c})</span>)}
      </div>
    </SectionCard>
  )
}

function TeamInquiryTrends({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<InquiryData>('/api/analytics/inquiries', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.trends?.daily?.length) return <EmptyState />

  const days = data.trends.daily
  const maxConv = Math.max(...days.map(d => d.new_conversations), 1)

  return (
    <SectionCard title="Daily Trends">
      <div className="flex gap-3 text-xs mb-2" style={{ color: MUTED_COLOR }}>
        <span><span style={{ color: ACCENT }}>{'\u25CF'}</span> Conversations</span>
        <span><span style={{ color: '#4ade80' }}>{'\u25CF'}</span> Booked</span>
        <span><span style={{ color: '#c084fc' }}>{'\u25CF'}</span> Follow-ups</span>
      </div>
      {days.map(d => {
        const convPct = Math.max((d.new_conversations / maxConv) * 100, 0)
        return (
          <div key={d.date} className="flex items-center gap-2 mb-1">
            <div className="text-xs w-14" style={{ color: MUTED_COLOR }}>{d.date.slice(5)}</div>
            <div className="flex-1 h-4 rounded overflow-hidden flex gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {d.new_conversations > 0 && <div className="h-full rounded-sm" style={{ width: `${convPct}%`, background: 'rgba(99,149,255,0.4)' }} title={`Conversations: ${d.new_conversations}`} />}
            </div>
            <div className="flex gap-2 text-xs w-24 justify-end" style={{ color: MUTED_COLOR }}>
              <span style={{ color: ACCENT }}>{d.new_conversations}</span>
              {d.booked > 0 && <span style={{ color: '#4ade80' }}>{d.booked}b</span>}
              {d.followups_created > 0 && <span style={{ color: '#c084fc' }}>{d.followups_created}f</span>}
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}

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

// ── NEW TEAM DEPTH SECTIONS ──

function TeamMessagesPerUser({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ daily: { user_name: string; day: string; messages_sent: string }[]; totals: { user_name: string; total_sent: string; active_days: string; avg_per_day: string }[] }>('/api/analytics/v2/team/messages-per-user', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.totals?.length) return <EmptyState message="No message data" />

  const max = Math.max(...data.totals.map(t => Number(t.total_sent || 0)), 1)

  return (
    <SectionCard title="Messages Sent per User">
      {data.totals.map(t => (
        <div key={t.user_name} className="mb-2">
          <Bar value={Number(t.total_sent || 0)} max={max} color="rgba(99,149,255,0.4)" label={t.user_name} rightLabel={`${t.avg_per_day}/day`} />
        </div>
      ))}
    </SectionCard>
  )
}

function TeamDraftDecisions({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { reviewed_by: string; total: string; approved_first_draft: string; approved_after_revision: string; rejected: string; avg_revisions: string; approval_rate: string }[] }>('/api/analytics/v2/team/draft-decisions', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />

  return (
    <SectionCard title="Draft Decisions by User">
      {raw.data.map(r => {
        const total = Number(r.total || 0)
        const approved1st = Number(r.approved_first_draft || 0)
        const approvedRev = Number(r.approved_after_revision || 0)
        const rejected = Number(r.rejected || 0)
        if (total === 0) return null
        return (
          <div key={r.reviewed_by} className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: SUB_COLOR }}>{r.reviewed_by}</span>
              <span className="text-xs" style={{ color: MUTED_COLOR }}>{total} total · {Number(r.avg_revisions || 0).toFixed(1)} avg rev</span>
            </div>
            <div className="flex rounded overflow-hidden" style={{ height: '20px' }}>
              {approved1st > 0 && <div style={{ width: `${(approved1st / total) * 100}%`, background: 'rgba(34,197,94,0.5)' }} title={`Approved 1st draft: ${approved1st}`} />}
              {approvedRev > 0 && <div style={{ width: `${(approvedRev / total) * 100}%`, background: 'rgba(234,179,8,0.5)' }} title={`Approved after revision: ${approvedRev}`} />}
              {rejected > 0 && <div style={{ width: `${(rejected / total) * 100}%`, background: 'rgba(239,68,68,0.5)' }} title={`Rejected: ${rejected}`} />}
            </div>
            <div className="flex gap-3 text-xs mt-0.5" style={{ color: MUTED_COLOR }}>
              <span style={{ color: '#4ade80' }}>{approved1st} 1st</span>
              <span style={{ color: '#fbbf24' }}>{approvedRev} revised</span>
              <span style={{ color: '#f87171' }}>{rejected} rej</span>
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}

function TeamAskFridayUsage({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ by_user: { user_name: string; sessions: string; total_turns: string; avg_turns: string; total_tokens: string }[]; by_context: { context: string; sessions: string; avg_turns: string }[]; daily: { day: string; sessions: string }[]; missing_knowledge_count: number }>('/api/analytics/v2/team/ask-friday-usage', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.by_user?.length && !data?.by_context?.length) return <EmptyState message="No Ask Friday usage yet" />

  const maxSessions = Math.max(...(data.by_user || []).map(u => Number(u.sessions || 0)), 1)
  const totalSessions = (data.by_user || []).reduce((s, u) => s + Number(u.sessions || 0), 0)

  return (
    <SectionCard title="Ask Friday Usage">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(99,149,255,0.08)', border: '1px solid rgba(99,149,255,0.15)' }}>
          <div className="text-xs" style={{ color: SUB_COLOR }}>Total Sessions</div>
          <div className="text-lg font-bold" style={{ color: ACCENT }}>{totalSessions}</div>
        </div>
        {data.missing_knowledge_count > 0 && (
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)' }}>
            <div className="text-xs" style={{ color: SUB_COLOR }}>Missing Knowledge</div>
            <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>{data.missing_knowledge_count}</div>
          </div>
        )}
      </div>

      {(data.by_user || []).length > 0 && (
        <div className="mb-3">
          <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>By user</div>
          {data.by_user.map(u => (
            <Bar key={u.user_name} value={Number(u.sessions || 0)} max={maxSessions} color="rgba(168,85,247,0.4)" label={u.user_name} rightLabel={`${u.avg_turns} avg turns`} />
          ))}
        </div>
      )}

      {(data.by_context || []).length > 0 && (
        <div>
          <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>By context</div>
          {data.by_context.map(c => {
            const maxCtx = Math.max(...data.by_context.map(x => Number(x.sessions || 0)), 1)
            return <Bar key={c.context} value={Number(c.sessions || 0)} max={maxCtx} color="rgba(99,149,255,0.4)" label={formatEventName(c.context)} rightLabel={`${c.sessions}`} />
          })}
        </div>
      )}
    </SectionCard>
  )
}

function TeamRevisionTrends({ active }: { active: boolean }) {
  const { data: raw, loading, error } = useSectionData<{ data: { week: string; total_drafts: string; total_revisions: string; avg_revision_number: string; first_draft_count: string; second_draft_count: string; third_plus_count: string }[] }>('/api/analytics/v2/team/revision-trends', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!raw?.data?.length) return <EmptyState />

  return (
    <SectionCard title="Revision Trends (weekly)">
      {raw.data.map(r => {
        const total = Number(r.total_drafts || 0)
        const first = Number(r.first_draft_count || 0)
        const second = Number(r.second_draft_count || 0)
        const third = Number(r.third_plus_count || 0)
        if (total === 0) return null
        return (
          <div key={r.week} className="mb-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs" style={{ color: MUTED_COLOR }}>{(r.week || '').slice(0, 10)}</span>
              <span className="text-xs" style={{ color: SUB_COLOR }}>avg {Number(r.avg_revision_number || 0).toFixed(1)} rev</span>
            </div>
            <div className="flex rounded overflow-hidden" style={{ height: '18px' }}>
              {first > 0 && <div style={{ width: `${(first / total) * 100}%`, background: 'rgba(34,197,94,0.5)' }} title={`1st draft: ${first}`} />}
              {second > 0 && <div style={{ width: `${(second / total) * 100}%`, background: 'rgba(234,179,8,0.5)' }} title={`2nd draft: ${second}`} />}
              {third > 0 && <div style={{ width: `${(third / total) * 100}%`, background: 'rgba(239,68,68,0.5)' }} title={`3+ drafts: ${third}`} />}
            </div>
            <div className="flex gap-3 text-xs mt-0.5" style={{ color: MUTED_COLOR }}>
              <span style={{ color: '#4ade80' }}>{first} 1st</span>
              <span style={{ color: '#fbbf24' }}>{second} 2nd</span>
              <span style={{ color: '#f87171' }}>{third} 3+</span>
            </div>
          </div>
        )
      })}
    </SectionCard>
  )
}

// ── ACTIONS & LEARNING SECTIONS ──

interface ActionsData {
  period: { start: string; end: string }
  pending_actions: {
    total: number
    by_type_and_status: { action_type: string; status: string; count: number }[]
    accept_rate: number; dismiss_rate: number; auto_dismiss_rate: number
    by_urgency: { low: number; medium: number; high: number; critical: number }
    avg_resolution_hours: number
    resolution_by_type: { action_type: string; avg_hours: number; count: number }[]
    by_team_member: { completed_by: string; count: number; avg_hours: number }[]
    daily_trend: { date: string; created: number; completed: number; dismissed: number }[]
  }
  next_steps: {
    total: number; by_status: Record<string, number>; dismiss_rate: number
    daily_trend: { date: string; created: number; dismissed: number }[]
  }
  teachings: {
    total: number; by_status: Record<string, number>; acceptance_rate: number
    avg_confidence: number; avg_evidence_count: number
    by_scope: { scope: string; count: number }[]
    recent: { content: string; status: string; created_at: string; confidence: number | null; evidence_count: number | null }[]
  }
}

function useActionsData(active: boolean) {
  return useSectionData<ActionsData>('/api/analytics/v2/team/actions', active)
}

function TeamActionsOverview({ data }: { data: ActionsData }) {
  const pa = data.pending_actions
  if (!pa.total) return null

  const statusColors: Record<string, string> = {
    completed: '#4ade80', dismissed: '#fbbf24', auto_dismissed: '#f87171',
    pending: '#6395ff', auto_converted: '#c084fc',
  }

  // Aggregate by status for pie-style stacked bar
  const statusTotals: Record<string, number> = {}
  pa.by_type_and_status.forEach(r => {
    statusTotals[r.status] = (statusTotals[r.status] || 0) + r.count
  })
  const entries = Object.entries(statusTotals).sort((a, b) => b[1] - a[1])

  return (
    <SectionCard title="Actions Overview">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: '#4ade80' }}>{pa.accept_rate}%</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Accept rate</div>
        </div>
        <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: '#fbbf24' }}>{pa.dismiss_rate}%</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Dismiss rate</div>
        </div>
        <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: '#f87171' }}>{pa.auto_dismiss_rate}%</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Auto-dismiss</div>
        </div>
      </div>

      {/* Status distribution bar */}
      <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>{pa.total} total actions</div>
      <div className="flex rounded overflow-hidden mb-2" style={{ height: '22px' }}>
        {entries.map(([status, count]) => (
          <div key={status} style={{ width: `${(count / pa.total) * 100}%`, background: statusColors[status] || '#64748b', minWidth: count > 0 ? '2px' : 0 }} title={`${formatEventName(status)}: ${count}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: MUTED_COLOR }}>
        {entries.map(([status, count]) => (
          <span key={status}><span style={{ color: statusColors[status] || '#64748b' }}>●</span> {formatEventName(status)} ({count})</span>
        ))}
      </div>

      {/* By urgency */}
      {(pa.by_urgency.high > 0 || pa.by_urgency.critical > 0) && (
        <div className="mt-3">
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>By urgency</div>
          <div className="flex gap-2 text-xs">
            {pa.by_urgency.critical > 0 && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{pa.by_urgency.critical} critical</span>}
            {pa.by_urgency.high > 0 && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>{pa.by_urgency.high} high</span>}
            {pa.by_urgency.medium > 0 && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(99,149,255,0.15)', color: ACCENT }}>{pa.by_urgency.medium} medium</span>}
            {pa.by_urgency.low > 0 && <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: SUB_COLOR }}>{pa.by_urgency.low} low</span>}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function TeamResolutionTime({ data }: { data: ActionsData }) {
  const items = data.pending_actions.resolution_by_type
  if (!items.length) return null
  const maxH = Math.max(...items.map(r => r.avg_hours), 1)

  return (
    <SectionCard title="Resolution Time by Action Type">
      <div className="text-xs mb-2" style={{ color: MUTED_COLOR }}>
        Overall avg: {data.pending_actions.avg_resolution_hours}h
      </div>
      {items.map(r => (
        <Bar key={r.action_type} value={Number(r.avg_hours.toFixed(1))} max={maxH} color="rgba(99,149,255,0.5)" label={formatEventName(r.action_type)} rightLabel={`${r.avg_hours.toFixed(1)}h (${r.count})`} />
      ))}
    </SectionCard>
  )
}

function TeamPerformance({ data }: { data: ActionsData }) {
  const members = data.pending_actions.by_team_member
  if (!members.length) return null

  return (
    <SectionCard title="Team Performance">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
            <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Team Member</th>
            <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Actions</th>
            <th className="text-right px-3 py-2 text-xs font-medium" style={{ color: MUTED_COLOR }}>Avg Time</th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => (
            <tr key={m.completed_by} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <td className="px-3 py-2 text-xs" style={{ color: HEADER_COLOR }}>{m.completed_by}</td>
              <td className="text-right px-3 py-2 text-xs" style={{ color: SUB_COLOR }}>{m.count}</td>
              <td className="text-right px-3 py-2 text-xs" style={{ color: m.avg_hours > 24 ? '#fbbf24' : '#4ade80' }}>{m.avg_hours.toFixed(1)}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  )
}

function TeamNextStepsQuality({ data }: { data: ActionsData }) {
  const ns = data.next_steps
  if (!ns.total) return null
  const isNoisy = ns.dismiss_rate > 60

  return (
    <SectionCard title="Next Steps Quality">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center p-2 rounded flex-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: HEADER_COLOR }}>{ns.total}</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Total</div>
        </div>
        <div className="text-center p-2 rounded flex-1" style={{ background: isNoisy ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: isNoisy ? '#f87171' : '#fbbf24' }}>{ns.dismiss_rate}%</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Dismiss rate</div>
        </div>
      </div>
      {isNoisy && (
        <div className="text-xs px-3 py-2 rounded" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          High dismiss rate suggests next-step suggestions may be too noisy — consider suppression tuning.
        </div>
      )}
      {/* Status breakdown */}
      <div className="flex gap-3 text-xs mt-2" style={{ color: MUTED_COLOR }}>
        {Object.entries(ns.by_status).map(([status, count]) => (
          <span key={status}>{formatEventName(status)}: {count}</span>
        ))}
      </div>
    </SectionCard>
  )
}

function TeamTeachingStats({ data }: { data: ActionsData }) {
  const t = data.teachings
  if (!t.total) return null

  return (
    <SectionCard title="Teaching Stats">
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: '#4ade80' }}>{t.acceptance_rate}%</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Active rate</div>
        </div>
        <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: ACCENT }}>{t.avg_confidence || '—'}</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Avg confidence</div>
        </div>
        <div className="text-center p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-lg font-bold" style={{ color: '#c084fc' }}>{t.avg_evidence_count || '—'}</div>
          <div className="text-xs" style={{ color: MUTED_COLOR }}>Avg evidence</div>
        </div>
      </div>

      {/* By scope */}
      {t.by_scope.length > 0 && (
        <div className="mb-3">
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>By scope</div>
          <div className="flex gap-2 text-xs">
            {t.by_scope.map(s => (
              <span key={s.scope} className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: SUB_COLOR }}>
                {formatEventName(s.scope)}: {s.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status breakdown bar */}
      <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>{t.total} total teachings</div>
      <div className="flex rounded overflow-hidden mb-2" style={{ height: '18px' }}>
        {(t.by_status['active'] || 0) > 0 && <div style={{ width: `${((t.by_status['active'] || 0) / t.total) * 100}%`, background: 'rgba(34,197,94,0.5)' }} title={`Active: ${t.by_status['active']}`} />}
        {(t.by_status['revoked'] || 0) > 0 && <div style={{ width: `${((t.by_status['revoked'] || 0) / t.total) * 100}%`, background: 'rgba(239,68,68,0.5)' }} title={`Revoked: ${t.by_status['revoked']}`} />}
      </div>
      <div className="flex gap-3 text-xs" style={{ color: MUTED_COLOR }}>
        <span style={{ color: '#4ade80' }}>{t.by_status['active'] || 0} active</span>
        <span style={{ color: '#f87171' }}>{t.by_status['revoked'] || 0} revoked</span>
      </div>

      {/* Recent teachings */}
      {t.recent.length > 0 && (
        <div className="mt-3">
          <div className="text-xs mb-1" style={{ color: MUTED_COLOR }}>Recent</div>
          <div className="space-y-1">
            {t.recent.map((r, i) => (
              <div key={i} className="text-xs px-2 py-1.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: SUB_COLOR }}>{r.content}</div>
                <div className="flex gap-2 mt-0.5" style={{ color: MUTED_COLOR }}>
                  <span style={{ color: r.status === 'active' ? '#4ade80' : '#f87171' }}>{r.status}</span>
                  {r.confidence != null && <span>conf: {r.confidence.toFixed(2)}</span>}
                  {r.evidence_count != null && <span>evidence: {r.evidence_count}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function TeamActionsTrends({ data }: { data: ActionsData }) {
  const trend = data.pending_actions.daily_trend
  if (!trend.length) return null
  const maxVal = Math.max(...trend.map(d => Math.max(d.created, d.completed + d.dismissed)), 1)

  return (
    <SectionCard title="Actions Daily Trends">
      <div className="flex items-end gap-0.5" style={{ minHeight: '100px' }}>
        {trend.map(d => {
          const createdH = Math.max((d.created / maxVal) * 80, 1)
          const completedH = Math.max((d.completed / maxVal) * 80, 1)
          const dismissedH = Math.max((d.dismissed / maxVal) * 80, 1)
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.created} created, ${d.completed} completed, ${d.dismissed} dismissed`}>
              <div className="w-full flex flex-col gap-px">
                <div style={{ height: `${createdH}px`, background: 'rgba(99,149,255,0.5)', borderRadius: '2px 2px 0 0' }} />
                <div style={{ height: `${completedH}px`, background: 'rgba(34,197,94,0.5)' }} />
                <div style={{ height: `${dismissedH}px`, background: 'rgba(251,191,36,0.5)', borderRadius: '0 0 2px 2px' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-3 text-xs mt-2" style={{ color: MUTED_COLOR }}>
        <span><span style={{ color: ACCENT }}>●</span> Created</span>
        <span><span style={{ color: '#4ade80' }}>●</span> Completed</span>
        <span><span style={{ color: '#fbbf24' }}>●</span> Dismissed</span>
      </div>
    </SectionCard>
  )
}

function TeamActionsAndLearning({ active }: { active: boolean }) {
  const { data, loading, error } = useActionsData(active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data) return <EmptyState />

  return (
    <>
      <TeamActionsOverview data={data} />
      <TeamResolutionTime data={data} />
      <TeamPerformance data={data} />
      <TeamNextStepsQuality data={data} />
      <TeamTeachingStats data={data} />
      <TeamActionsTrends data={data} />
    </>
  )
}

// ── SHARED INSIGHTS SECTION ──

function ActionableInsights({ active }: { active: boolean }) {
  const { data, loading, error } = useSectionData<{ insights: { type: string; severity: 'green' | 'yellow' | 'red'; title: string; detail: string; metric?: string; trend?: string }[] }>('/api/analytics/v2/insights', active)
  if (loading) return <LoadingState />
  if (error) return <ErrorState />
  if (!data?.insights?.length) return <EmptyState message="No insights right now — everything looks good" />

  const severityConfig: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    red: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '●', text: '#f87171' },
    yellow: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', icon: '●', text: '#fbbf24' },
    green: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '●', text: '#4ade80' },
  }

  return (
    <div style={sectionStyle} className="p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: HEADER_COLOR }}>Actionable Insights</h3>
      <div className="space-y-2">
        {data.insights.map((insight, i) => {
          const cfg = severityConfig[insight.severity] || severityConfig.yellow
          return (
            <div key={i} className="rounded-lg px-3 py-2.5" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: cfg.text, fontSize: '10px' }}>{cfg.icon}</span>
                <span className="text-sm font-medium" style={{ color: HEADER_COLOR }}>{insight.title}</span>
                {insight.metric && (
                  <span className="text-xs px-1.5 py-0.5 rounded ml-auto" style={{ background: 'rgba(255,255,255,0.06)', color: cfg.text }}>{insight.metric} {insight.trend === 'up' ? '↑' : insight.trend === 'down' ? '↓' : ''}</span>
                )}
              </div>
              <div className="text-xs" style={{ color: SUB_COLOR }}>{insight.detail}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════

interface AnalyticsDashboardProps {
  show: boolean
  onClose: () => void
}

function computeDates(preset: string, customStart: string, customEnd: string) {
  const today = new Date().toISOString().slice(0, 10)
  const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }
  switch (preset) {
    case 'today': return { start: today, end: today }
    case '7d': return { start: daysAgo(7), end: today }
    case '30d': return { start: daysAgo(30), end: today }
    case '90d': return { start: daysAgo(90), end: today }
    case 'custom': return { start: customStart || daysAgo(30), end: customEnd || today }
    default: return { start: daysAgo(30), end: today }
  }
}

const DATE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: 'custom', label: 'Custom' },
] as const

export default function AnalyticsDashboard({ show, onClose }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'developer' | 'team'>('developer')
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [datePreset, setDatePreset] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateRange = useMemo(() => computeDates(datePreset, customStart, customEnd), [datePreset, customStart, customEnd])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshKey(k => k + 1)
    setTimeout(() => setRefreshing(false), 1500)
  }, [])

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
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
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
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={refreshing} className="text-sm p-1.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: refreshing ? '#475569' : SUB_COLOR }} title="Refresh analytics">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
              </button>
              <button onClick={onClose} className="text-sm px-3 py-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: SUB_COLOR }}>Close</button>
            </div>
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

          {/* Date range pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {DATE_PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => setDatePreset(p.key)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  background: datePreset === p.key ? 'rgba(99,149,255,0.2)' : 'rgba(255,255,255,0.04)',
                  color: datePreset === p.key ? ACCENT : MUTED_COLOR,
                  border: `1px solid ${datePreset === p.key ? 'rgba(99,149,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {datePreset === 'custom' && (
            <div className="flex gap-3 mt-2">
              <div>
                <label className="text-xs block mb-1" style={{ color: MUTED_COLOR }}>From</label>
                <input
                  type="date"
                  value={customStart || dateRange.start}
                  onChange={e => setCustomStart(e.target.value)}
                  className="text-xs rounded px-2 py-1.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: MUTED_COLOR }}>To</label>
                <input
                  type="date"
                  value={customEnd || dateRange.end}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="text-xs rounded px-2 py-1.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', colorScheme: 'dark' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <DateRangeContext.Provider value={dateRange}>
          <div className="px-4 sm:px-6 py-4 space-y-4" key={refreshKey}>
            {/* Actionable Insights — always visible, shown first */}
            <ActionableInsights active={show} />

            {isDev && (
              <>
                <DevFeatureUsage active={isDev} />
                <DevLearningRate active={isDev} />
                <DevDraftQuality active={isDev} />
                <DevAICosts active={isDev} />
                <DevTokenTrends active={isDev} />
                <DevCostPerConversation active={isDev} />
                <DevErrorTrends active={isDev} />
                <DevTeachingEffectiveness active={isDev} />
                <DevUnderusedFeatures active={isDev} />
              </>
            )}
            {isTeam && (
              <>
                <TeamInquiryFunnel active={isTeam} />
                <TeamInquiryByChannel active={isTeam} />
                <TeamInquiryByProperty active={isTeam} />
                <TeamInquiryResponseTime active={isTeam} />
                <TeamInquiryFollowups active={isTeam} />
                <TeamInquiryIntents active={isTeam} />
                <TeamInquiryTrends active={isTeam} />
                <TeamResponseTimes active={isTeam} />
                <TeamMessagesPerUser active={isTeam} />
                <TeamDraftDecisions active={isTeam} />
                <TeamTeachingActivity active={isTeam} />
                <TeamAskFridayUsage active={isTeam} />
                <TeamRevisionTrends active={isTeam} />
                <TeamActionsAndLearning active={isTeam} />
                <TeamSentiment active={isTeam} />
                <TeamVolumePatterns active={isTeam} />
                <TeamLeaderboard active={isTeam} />
                <TeamSuggestions active={isTeam} />
              </>
            )}
          </div>
        </DateRangeContext.Provider>
      </div>
    </div>
  )
}
