// @demo:data — Benchmarks + KPIs — GET /api/analytics/*
// Tag: PROD-DATA-7 — see frontend/DEMO_CRUFT.md

export const ANALYTICS_OVERVIEW_KPI: { label: string; value: string; sub: string; dir: 'up' | 'down' | null }[] = [];

export const REVENUE_TREND: { month: string; gross: number; fees: number; net: number; partial?: boolean }[] = [];

export const REVENUE_BY_PROPERTY: { code: string; property: string; gross: number; bookings: number; occ: number; partial?: boolean }[] = [];

export const OCC_HEATMAP_PROPS: { code: string; row: number[] }[] = [];
export const OCC_HEATMAP_MONTHS: string[] = [];

export const CHANNEL_REVENUE: { channel: string; share: number; gross: number; bookings: number; aov: number }[] = [];

export const CHANNEL_COSTS: { channel: string; revenue: number; commission: number; effectiveRate: number; notes: string }[] = [];

export const REVIEW_TREND: { month: string; avg: number; count: number; partial?: boolean }[] = [];

export const REVIEW_BY_REGION: { region: string; properties: number; avg: number; count: number; sla: string }[] = [];

export const TEAM_LOAD: { name: string; role: string; tasks: number; messages: number; reviews: number; leads: number }[] = [];

export const MARGIN_BREAKDOWN: { label: string; value: number; color: string; isTotal?: boolean }[] = [];
