// @demo:data — Channel reviews — GET /api/reviews
// Tag: PROD-DATA-9 — see frontend/DEMO_CRUFT.md

/**
 * Reviews module — Phase 1 fixture (direct read from Guesty + Breezeway).
 *
 * Strategic frame (per Apr 2026 sessions): skip Reva entirely. Once the FAD
 * backend is built, reviews come from Guesty's API (Airbnb / Booking / VRBO
 * / Direct) and staff attribution comes from Breezeway task IDs. Reva is
 * decommissioned the moment FAD is up. This fixture mirrors the shape that
 * integration will return so the UI can be built against it now.
 *
 * Cross-link primary keys:
 *  - reservationId → `reservations.ts:RESERVATION_BY_ID`
 *  - propertyCode  → `tasks.ts:TASK_PROPERTY_BY_CODE`
 *  - staff (cleaner/inspector) → `tasks.ts:TASK_USER_BY_ID`
 *  - breezewayTaskId on each StaffReviewLink — the join key for Phase 2's
 *    real Breezeway-task ↔ review correlation
 */

export type ReviewChannel = 'airbnb' | 'booking' | 'vrbo' | 'google' | 'direct';
export type ReviewSentiment = 'positive' | 'mixed' | 'negative';
export type ReplyStatus = 'unreplied' | 'draft' | 'sent' | 'failed';
export type Cohort = 'flic_en_flac' | 'grand_baie' | 'pereybere' | 'bel_ombre';
export type StaffRole = 'cleaner' | 'inspector';
export type TagSentiment = 'positive' | 'negative' | 'neutral';

export const COHORT_LABEL: Record<Cohort, string> = {
  flic_en_flac: 'Flic en Flac',
  grand_baie: 'Grand Baie',
  pereybere: 'Pereybere',
  bel_ombre: 'Bel Ombre',
};

export const CHANNEL_LABEL: Record<ReviewChannel, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'VRBO',
  google: 'Google',
  direct: 'Direct',
};

/** Property → cohort mapping. Now back-compat shim — canonical `Property.region`
 *  lives in `_data/properties.ts`. This export will be removed in commit 4 of
 *  the Properties rebuild. */
import { PROPERTY_COHORT_SHIM } from './properties';
export const PROPERTY_COHORT: Record<string, Cohort> = PROPERTY_COHORT_SHIM;

export interface SubRatings {
  accuracy: number;
  checkin: number;
  cleanliness: number;
  communication: number;
  location: number;
  value: number;
}

export interface Review {
  id: string;
  /** Reva's review ID — primary external key in Phase 1. */
  externalId: string;
  channel: ReviewChannel;
  /** Channel-side review ID (Airbnb/Booking/etc) — needed for reply pushback. */
  channelReviewId?: string;
  /** Public deep-link to the channel-side review surface. */
  channelUrl?: string;
  reservationId?: string;
  propertyCode: string;
  cohort: Cohort;
  guestName: string;
  guestInitials: string;
  rating: number;
  subRatings: SubRatings;
  title: string;
  reviewText: string;
  /** Friday-internal feedback only — never shown to guests / channels. */
  privateFeedback?: string;
  /** ISO timestamp the guest submitted. */
  submittedAt: string;
  /** Auto-derived from rating + sub-ratings + tag set. */
  sentiment: ReviewSentiment;
  replyStatus: ReplyStatus;
  replyText?: string;
  replySentAt?: string;
  /** Optional flag — surfaces in OverviewPage Suggested Actions. */
  urgent?: boolean;
}

export interface ReviewTag {
  id: string;
  reviewId: string;
  tag: string;
  source: 'ai' | 'manual';
  sentiment: TagSentiment;
}

/** Links a review to the cleaner / inspector responsible for the stay. Phase 1
 *  this comes from Reva's Breezeway-task join; Phase 2+ we'll derive locally. */
export interface StaffReviewLink {
  reviewId: string;
  staffId: string;
  role: StaffRole;
  /** Breezeway task id of the cleaning / inspection job for this stay. */
  breezewayTaskId: string;
  cleaningDate: string;
}

// ───────────────── Tag library ─────────────────
// Curated by Reva's AI today; this enumerates the canonical set we'll
// surface as chips. New tags can still appear; this list is the trending /
// drill-down catalogue, not a hard schema.

export const TAG_LIBRARY: { tag: string; sentiment: TagSentiment }[] = [
  // Positive
  { tag: 'Spotless', sentiment: 'positive' },
  { tag: 'Great location', sentiment: 'positive' },
  { tag: 'Communication', sentiment: 'positive' },
  { tag: 'Welcome touches', sentiment: 'positive' },
  { tag: 'Beach access', sentiment: 'positive' },
  { tag: 'Pool', sentiment: 'positive' },
  { tag: 'Chef service', sentiment: 'positive' },
  { tag: 'Driver', sentiment: 'positive' },
  { tag: 'Family friendly', sentiment: 'positive' },
  { tag: 'View', sentiment: 'positive' },
  { tag: 'Quiet', sentiment: 'positive' },
  { tag: 'Design', sentiment: 'positive' },
  { tag: 'Concierge', sentiment: 'positive' },
  // Negative
  { tag: 'Slow check-in', sentiment: 'negative' },
  { tag: 'AC issues', sentiment: 'negative' },
  { tag: 'Wifi issues', sentiment: 'negative' },
  { tag: 'Hot water', sentiment: 'negative' },
  { tag: 'Smell', sentiment: 'negative' },
  { tag: 'FF&E', sentiment: 'negative' },
  { tag: 'Bugs', sentiment: 'negative' },
  { tag: 'Pool maintenance', sentiment: 'negative' },
  { tag: 'Linen quality', sentiment: 'negative' },
  { tag: 'Coffee machine', sentiment: 'negative' },
  { tag: 'Communication delay', sentiment: 'negative' },
  { tag: 'Noise', sentiment: 'negative' },
];

// ───────────────── Reviews fixture ─────────────────
// 30 reviews across last ~120 days. Distribution: ~70% positive, ~22% mixed,
// ~8% negative. Channels weighted Airbnb > Booking > Vrbo/Direct/Google.

const r = (overrides: Partial<Review> & Pick<Review,
  'id' | 'externalId' | 'channel' | 'propertyCode' | 'guestName' | 'guestInitials' |
  'rating' | 'title' | 'reviewText' | 'submittedAt' | 'sentiment' | 'replyStatus'
>): Review => {
  const cohort = PROPERTY_COHORT[overrides.propertyCode] ?? 'flic_en_flac';
  // Default sub-ratings: jitter each within 0.3 of overall rating, clamp to [1, 5].
  const base = overrides.rating;
  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v * 10) / 10));
  const subRatings: SubRatings = overrides.subRatings ?? {
    accuracy: clamp(base + 0.1),
    checkin: clamp(base - 0.1),
    cleanliness: clamp(base),
    communication: clamp(base + 0.1),
    location: clamp(base + 0.2),
    value: clamp(base - 0.2),
  };
  return { ...overrides, cohort, subRatings };
};

export const REVIEWS: Review[] = [];

export const REVIEW_BY_ID: Record<string, Review> = Object.fromEntries(
  REVIEWS.map((rv) => [rv.id, rv]),
);

// ───────────────── Tags fixture ─────────────────
// AI-extracted per review. Multiple tags per review.

const t = (id: number, reviewId: string, tag: string, sentiment: TagSentiment): ReviewTag => ({
  id: `rvt-${String(id).padStart(3, '0')}`, reviewId, tag, source: 'ai', sentiment,
});

let tid = 1;
const T = (reviewId: string, tag: string, sentiment: TagSentiment) => t(tid++, reviewId, tag, sentiment);

export const REVIEW_TAGS: ReviewTag[] = [];

export function tagsForReview(reviewId: string): ReviewTag[] {
  return REVIEW_TAGS.filter((tg) => tg.reviewId === reviewId);
}

// ───────────────── Staff attribution fixture ─────────────────
// Cleaners: Mary, Catherine, Alex. Inspectors: Alex, Catherine, Franny.
// Each review has up to 1 cleaner + 1 inspector linked via the reservation
// (in the real Reva integration this comes via Breezeway task IDs).

const sl = (
  reviewId: string, staffId: string, role: StaffRole, breezewayTaskId: string, cleaningDate: string,
): StaffReviewLink => ({ reviewId, staffId, role, breezewayTaskId, cleaningDate });

export const STAFF_REVIEW_LINKS: StaffReviewLink[] = [
  sl('rv-001', 'u-catherine', 'cleaner', 'bzw-tk-rc15-426', '2026-04-26'),
  sl('rv-002', 'u-alex', 'cleaner', 'bzw-tk-lc9-424', '2026-04-24'),
  sl('rv-003', 'u-catherine', 'cleaner', 'bzw-tk-gbh8-422', '2026-04-22'),
  sl('rv-003', 'u-franny', 'inspector', 'bzw-tk-gbh8-i422', '2026-04-22'),
  sl('rv-004', 'u-mary', 'cleaner', 'bzw-tk-bs1-421', '2026-04-21'),
  sl('rv-005', 'u-catherine', 'cleaner', 'bzw-tk-bl12-420', '2026-04-20'),
  sl('rv-005', 'u-alex', 'inspector', 'bzw-tk-bl12-i420', '2026-04-20'),
  sl('rv-006', 'u-mary', 'cleaner', 'bzw-tk-vv47-418', '2026-04-18'),
  sl('rv-007', 'u-mary', 'cleaner', 'bzw-tk-sd10-417', '2026-04-17'),
  sl('rv-008', 'u-alex', 'cleaner', 'bzw-tk-gbh3-416', '2026-04-16'),
  sl('rv-009', 'u-catherine', 'cleaner', 'bzw-tk-vv47-415', '2026-04-15'),
  sl('rv-010', 'u-alex', 'cleaner', 'bzw-tk-pt3-414', '2026-04-14'),
  sl('rv-011', 'u-mary', 'cleaner', 'bzw-tk-lc9-413', '2026-04-13'),
  sl('rv-012', 'u-catherine', 'cleaner', 'bzw-tk-ks5-412', '2026-04-12'),
  sl('rv-012', 'u-franny', 'inspector', 'bzw-tk-ks5-i412', '2026-04-12'),
  sl('rv-013', 'u-mary', 'cleaner', 'bzw-tk-lb2-411', '2026-04-11'),
  sl('rv-014', 'u-catherine', 'cleaner', 'bzw-tk-bl12-410', '2026-04-10'),
  sl('rv-015', 'u-alex', 'cleaner', 'bzw-tk-bcna-409', '2026-04-09'),
  sl('rv-016', 'u-catherine', 'cleaner', 'bzw-tk-gbh8-408', '2026-04-08'),
  sl('rv-017', 'u-mary', 'cleaner', 'bzw-tk-rc15-407', '2026-04-07'),
  sl('rv-018', 'u-alex', 'cleaner', 'bzw-tk-sd10-406', '2026-04-06'),
  sl('rv-019', 'u-mary', 'cleaner', 'bzw-tk-pt3-405', '2026-04-05'),
  sl('rv-020', 'u-catherine', 'cleaner', 'bzw-tk-vv47-403', '2026-04-03'),
  sl('rv-021', 'u-alex', 'cleaner', 'bzw-tk-lv10-401', '2026-04-01'),
  sl('rv-022', 'u-catherine', 'cleaner', 'bzw-tk-gbh3-323', '2026-03-23'),
  sl('rv-023', 'u-mary', 'cleaner', 'bzw-tk-bs1-320', '2026-03-20'),
  sl('rv-024', 'u-catherine', 'cleaner', 'bzw-tk-ks5-316', '2026-03-16'),
  sl('rv-025', 'u-alex', 'cleaner', 'bzw-tk-lb2-312', '2026-03-12'),
  sl('rv-026', 'u-mary', 'cleaner', 'bzw-tk-vv47-308', '2026-03-08'),
  sl('rv-027', 'u-catherine', 'cleaner', 'bzw-tk-bl12-303', '2026-03-03'),
  sl('rv-028', 'u-alex', 'cleaner', 'bzw-tk-gbh8-220', '2026-02-20'),
  sl('rv-029', 'u-mary', 'cleaner', 'bzw-tk-pt3-213', '2026-02-13'),
  sl('rv-030', 'u-catherine', 'cleaner', 'bzw-tk-sd10-201', '2026-02-01'),
];

export function staffLinksForReview(reviewId: string): StaffReviewLink[] {
  return STAFF_REVIEW_LINKS.filter((l) => l.reviewId === reviewId);
}

// ───────────────── Aggregations / helpers ─────────────────

// @demo:logic — Tag: PROD-LOGIC-7 — see frontend/DEMO_CRUFT.md. Replace with real Date.now() / server now().
const TODAY_ISO = '2026-04-27';
function daysAgo(iso: string): number {
  return Math.round((new Date(TODAY_ISO).getTime() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export function reviewsInWindow(days: number): Review[] {
  return REVIEWS.filter((rv) => daysAgo(rv.submittedAt) <= days);
}

export function avgRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export function ratingDistribution(reviews: Review[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) dist[Math.round(r.rating) as 1 | 2 | 3 | 4 | 5]++;
  return dist;
}

export function reviewsByCohort(): Record<Cohort, Review[]> {
  const out: Record<Cohort, Review[]> = {
    flic_en_flac: [], grand_baie: [], pereybere: [], bel_ombre: [],
  };
  for (const rv of REVIEWS) out[rv.cohort].push(rv);
  return out;
}

export function reviewsByChannel(): Record<ReviewChannel, Review[]> {
  const out: Record<ReviewChannel, Review[]> = {
    airbnb: [], booking: [], vrbo: [], google: [], direct: [],
  };
  for (const rv of REVIEWS) out[rv.channel].push(rv);
  return out;
}

export function reviewsByProperty(): Record<string, Review[]> {
  const out: Record<string, Review[]> = {};
  for (const rv of REVIEWS) {
    (out[rv.propertyCode] = out[rv.propertyCode] || []).push(rv);
  }
  return out;
}

export interface TagAgg {
  tag: string;
  sentiment: TagSentiment;
  count: number;
  pct: number;
  trendingDelta?: number;
}

export function tagAggregate(window: 'all' | 30 | 90 = 'all'): TagAgg[] {
  const reviewIds = new Set(
    (window === 'all' ? REVIEWS : reviewsInWindow(window)).map((r) => r.id),
  );
  const denom = reviewIds.size || 1;
  const counts: Record<string, { sentiment: TagSentiment; count: number }> = {};
  for (const tg of REVIEW_TAGS) {
    if (!reviewIds.has(tg.reviewId)) continue;
    const k = tg.tag;
    counts[k] = counts[k] || { sentiment: tg.sentiment, count: 0 };
    counts[k].count++;
  }
  return Object.entries(counts)
    .map(([tag, v]) => ({
      tag,
      sentiment: v.sentiment,
      count: v.count,
      pct: v.count / denom,
    }))
    .sort((a, b) => b.count - a.count);
}

export interface StaffPerf {
  staffId: string;
  role: StaffRole;
  reviewCount: number;
  avgRating: number;
  avgCleanliness: number;
  goodTagCount: number;
  badTagCount: number;
}

export function staffPerformance(role: StaffRole): StaffPerf[] {
  const byStaff: Record<string, StaffReviewLink[]> = {};
  for (const link of STAFF_REVIEW_LINKS) {
    if (link.role !== role) continue;
    (byStaff[link.staffId] = byStaff[link.staffId] || []).push(link);
  }
  return Object.entries(byStaff).map(([staffId, links]) => {
    const reviews = links.map((l) => REVIEW_BY_ID[l.reviewId]).filter(Boolean);
    const tags = reviews.flatMap((rv) => tagsForReview(rv.id));
    return {
      staffId,
      role,
      reviewCount: reviews.length,
      avgRating: avgRating(reviews),
      avgCleanliness: reviews.length === 0 ? 0
        : reviews.reduce((s, rv) => s + rv.subRatings.cleanliness, 0) / reviews.length,
      goodTagCount: tags.filter((tg) => tg.sentiment === 'positive').length,
      badTagCount: tags.filter((tg) => tg.sentiment === 'negative').length,
    };
  });
}

export function lowRatedReviews(): Review[] {
  return REVIEWS.filter((rv) => rv.rating <= 3).sort(
    (a, b) => b.submittedAt.localeCompare(a.submittedAt),
  );
}

export function unrepliedReviews(): Review[] {
  return REVIEWS.filter((rv) => rv.replyStatus === 'unreplied').sort(
    (a, b) => b.submittedAt.localeCompare(a.submittedAt),
  );
}

/** AI-derived cohort narratives — Phase 1 hand-crafted, Phase 2 will pull
 *  from a real LLM call. Shape stays the same so swap is local. */
export const COHORT_NARRATIVES: Record<Cohort, string> = {
  flic_en_flac:
    "In the last 90 days Flic en Flac is the highest-volume cohort by a wide margin (12 reviews) and the most consistent — average rating 4.6, no review under 3 stars. Welcome-touches and Communication dominate the positive tag mix; the only repeat negative pattern is FF&E (Tomás's coffee machine, Sofia's curtains) which suggests a portfolio-wide hardware refresh would lift scores another notch.",
  grand_baie:
    "Grand Baie is small but elite: 6 reviews, 4.8 average, no negative tags in the last 60 days. Beach access and Spotless are the standout positive signals. Worth flagging that GBH-C8 has produced two five-star reviews in three weeks — Catherine has cleaned both. Keep her on that property.",
  pereybere:
    "Pereybere swung in the last 30 days. BCN-A's drain-smell incident dragged the cohort average down to 3.5 (Lukas's 2-star). PT-3 is steady at 4.0 across three reviews but Hot water and Welcome-basket-completeness keep recurring as small misses. Plumbing-then-checklist pass would close this gap.",
  bel_ombre:
    "Bel Ombre is split: SD-10 produces consistent 5-star stays (Nina, Ines), LB-2 shows mixed results with two recent 3-star reviews around AC, Wifi and Linen. Both properties use the same maintenance vendor — worth checking whether LB-2 is on a different cleaner rotation.",
};

/** AI Suggested Actions — review → suggested Operations task. Phase 1
 *  hand-curated based on review tags + sub-rating dips; Phase 2 generated. */
export interface SuggestedAction {
  id: string;
  reviewId: string;
  taskTitle: string;
  taskDescription: string;
  department: 'cleaning' | 'inspection' | 'maintenance' | 'office';
  subdepartment: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reasoning: string;
}

export const SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    id: 'sa-001', reviewId: 'rv-002',
    taskTitle: 'AC unit replacement at LC-9 master bedroom',
    taskDescription: 'Henrik flagged AC outage on day 2 of stay; parts took 36h. Replace unit now to prevent repeat with incoming guest.',
    department: 'maintenance', subdepartment: 'aircon', priority: 'high',
    reasoning: 'AC issues tag + 3-star rating + complaint about parts ETA',
  },
  {
    id: 'sa-002', reviewId: 'rv-015',
    taskTitle: 'BCN-A drain trap replacement (kitchen)',
    taskDescription: 'Lukas left a day early due to persistent kitchen drain smell. Replace drain trap before next booking on May 3.',
    department: 'maintenance', subdepartment: 'plumbing', priority: 'urgent',
    reasoning: 'Smell tag + 2-star rating + early-departure flag',
  },
  {
    id: 'sa-003', reviewId: 'rv-021',
    taskTitle: 'Tighten LV-10 pool service interval to 7 days',
    taskDescription: "Olivia found algae on day 1. Confirm interval is 7d not 9d, brief the vendor.",
    department: 'maintenance', subdepartment: 'pool', priority: 'medium',
    reasoning: 'Pool maintenance tag + 3-star rating',
  },
  {
    id: 'sa-004', reviewId: 'rv-017',
    taskTitle: 'Descale RC-15 coffee machine',
    taskDescription: 'Tomás flagged descaling overdue. 15-min job, do before Saturday turnover.',
    department: 'cleaning', subdepartment: 'amenities', priority: 'low',
    reasoning: 'Coffee machine tag + at-this-price-it-stands-out sentiment',
  },
];

/** Anomaly callouts shown above OverviewPage. Phase 1 hand-crafted, Phase 2
 *  pattern-detected from rolling sub-rating means. */
export interface Anomaly {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warn' | 'danger';
}

export const REVIEW_ANOMALIES: Anomaly[] = [
  {
    id: 'an-001', severity: 'warn',
    title: 'Cleanliness rating dropped 0.3 vs last month',
    body: "Last 30 days: 4.4 avg cleanliness. Prior 30 days: 4.7. Drag is concentrated at LB-2 and BCN-A — both north-zone, both Mary-cleaned. Worth a 1:1 before Mary's last day on May 25.",
  },
  {
    id: 'an-002', severity: 'info',
    title: 'Welcome-touches mentions doubled in 30 days',
    body: 'From 4 mentions in March to 9 mentions in April. Catherine\'s welcome-basket protocol seems to be the driver. Codify into the standard pre-arrival checklist.',
  },
  {
    id: 'an-003', severity: 'danger',
    title: 'BCN-A on watch — 2 reviews in 60 days, 3.0 avg',
    body: 'Drain-smell incident plus a previous Wifi complaint. Property is at risk of slipping into Reva\'s low-activity threshold AND a low-rating cluster simultaneously. Schedule a full property pass.',
  },
];
