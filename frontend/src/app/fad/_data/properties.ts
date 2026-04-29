// @demo:data — Properties + onboarding + insights — GET /api/properties
// Tag: PROD-DATA-4 — see frontend/DEMO_CRUFT.md

// Properties — canonical namespace per v0.2 LOCKED scoping pack.
//
// Replaces three legacy namespaces (legacy `Property` in fixtures.ts,
// `FinProperty` in finance.ts, `TaskProperty` in tasks.ts). Those files now
// re-export back-compat shims derived from this module so consumers don't break
// during the migration; full retirement happens in commit 4.

import type { Cohort } from './reviews';

// ───────────────── Lifecycle ─────────────────

export type LifecycleStatus = 'onboarding' | 'live' | 'paused' | 'off_boarded';

export const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  onboarding: 'Onboarding',
  live: 'Live',
  paused: 'Paused',
  off_boarded: 'Off-boarded',
};

/** Required onboarding artifacts. `Photoshoot` is the only flexible item — pro-shoot
 *  can defer post-active. `ListingPushedToBooking` is deferred (fires after 3-5 reviews)
 *  and is excluded from the "is_onboarding_complete" check. */
export type OnboardingChecklistKey =
  | 'site_visit'
  | 'owner_agreement'
  | 'standards_book'
  | 'keys'
  | 'amenities_form'
  | 'gap_analysis'
  | 'home_build_out'
  | 'preventative_maintenance'
  | 'aesthetic_check'
  | 'photoshoot'
  | 'listing_airbnb'
  | 'listing_friday_mu'
  | 'base_price'
  | 'listing_booking_com';

export const ONBOARDING_REQUIRED: OnboardingChecklistKey[] = [
  'site_visit',
  'owner_agreement',
  'standards_book',
  'keys',
  'amenities_form',
  'gap_analysis',
  'home_build_out',
  'preventative_maintenance',
  'aesthetic_check',
  'photoshoot',
  'listing_airbnb',
  'listing_friday_mu',
  'base_price',
];

export const ONBOARDING_OPTIONAL: OnboardingChecklistKey[] = ['listing_booking_com'];

export const ONBOARDING_LABEL: Record<OnboardingChecklistKey, string> = {
  site_visit: 'Site visit completed',
  owner_agreement: 'Owner agreement signed',
  standards_book: 'Standards Book delivered',
  keys: 'Key duplicates received',
  amenities_form: 'Amenities Form completed',
  gap_analysis: 'Gap Analysis resolved',
  home_build_out: 'Home Build-Out registry',
  preventative_maintenance: 'Preventative Maintenance check',
  aesthetic_check: 'Aesthetic check',
  photoshoot: 'Photoshoot (preliminary or pro)',
  listing_airbnb: 'Listing pushed to Airbnb',
  listing_friday_mu: 'Listing pushed to friday.mu',
  base_price: 'Base price set',
  listing_booking_com: 'Listing pushed to Booking.com',
};

export type ChecklistItemStatus = 'not_started' | 'in_progress' | 'complete' | 'skipped';

export type OnboardingChecklist = Partial<Record<OnboardingChecklistKey, ChecklistItemStatus>>;

// ───────────────── Channels ─────────────────

export type ListingChannel = 'airbnb' | 'booking' | 'vrbo' | 'friday_mu';

export const LISTING_CHANNEL_LABEL: Record<ListingChannel, string> = {
  airbnb: 'Airbnb',
  booking: 'Booking.com',
  vrbo: 'VRBO',
  friday_mu: 'friday.mu',
};

export interface ListingRecord {
  channel: ListingChannel;
  externalId: string;
  status: 'active' | 'paused' | 'unavailable' | 'pending';
  /** Per-channel commission % override (read-only Phase 1). */
  commissionPct?: number;
  /** Per-channel description override. Empty = use property base description. */
  description?: string;
  /** Last successful push to this channel — Phase 2 write-through tracking. */
  lastPushedAt?: string;
}

// ───────────────── Amenities (Phase 2 — per-property matrix) ─────────────────

export type Amenity =
  | 'wifi' | 'ac' | 'pool' | 'pool_heated' | 'jacuzzi' | 'sauna'
  | 'kitchen' | 'dishwasher' | 'washer' | 'dryer' | 'oven' | 'microwave' | 'coffee_machine'
  | 'tv' | 'sound_system'
  | 'parking_free' | 'parking_paid' | 'ev_charger'
  | 'beachfront' | 'sea_view' | 'garden' | 'bbq' | 'outdoor_dining'
  | 'family_friendly' | 'baby_cot' | 'high_chair' | 'pet_friendly'
  | 'workspace' | 'gym' | 'concierge' | 'security' | 'elevator';

export const AMENITY_GROUPS: { label: string; items: { key: Amenity; label: string }[] }[] = [
  {
    label: 'Essentials',
    items: [
      { key: 'wifi', label: 'Wifi' },
      { key: 'ac', label: 'Air conditioning' },
      { key: 'kitchen', label: 'Kitchen' },
      { key: 'workspace', label: 'Workspace' },
    ],
  },
  {
    label: 'Pool & Outdoor',
    items: [
      { key: 'pool', label: 'Pool' },
      { key: 'pool_heated', label: 'Heated pool' },
      { key: 'jacuzzi', label: 'Jacuzzi' },
      { key: 'sauna', label: 'Sauna' },
      { key: 'beachfront', label: 'Beachfront' },
      { key: 'sea_view', label: 'Sea view' },
      { key: 'garden', label: 'Garden' },
      { key: 'bbq', label: 'BBQ' },
      { key: 'outdoor_dining', label: 'Outdoor dining' },
    ],
  },
  {
    label: 'Kitchen & Laundry',
    items: [
      { key: 'dishwasher', label: 'Dishwasher' },
      { key: 'washer', label: 'Washer' },
      { key: 'dryer', label: 'Dryer' },
      { key: 'oven', label: 'Oven' },
      { key: 'microwave', label: 'Microwave' },
      { key: 'coffee_machine', label: 'Coffee machine' },
    ],
  },
  {
    label: 'Entertainment',
    items: [
      { key: 'tv', label: 'TV' },
      { key: 'sound_system', label: 'Sound system' },
    ],
  },
  {
    label: 'Family & Pets',
    items: [
      { key: 'family_friendly', label: 'Family-friendly' },
      { key: 'baby_cot', label: 'Baby cot' },
      { key: 'high_chair', label: 'High chair' },
      { key: 'pet_friendly', label: 'Pet-friendly' },
    ],
  },
  {
    label: 'Building',
    items: [
      { key: 'parking_free', label: 'Free parking' },
      { key: 'parking_paid', label: 'Paid parking' },
      { key: 'ev_charger', label: 'EV charger' },
      { key: 'gym', label: 'Gym' },
      { key: 'concierge', label: 'Concierge' },
      { key: 'security', label: '24/7 security' },
      { key: 'elevator', label: 'Elevator' },
    ],
  },
];

// ───────────────── Property type ─────────────────

export type ListingType = 'villa' | 'apartment' | 'studio' | 'townhouse' | 'bungalow';

/** Property zone — back-compat with Operations roster. Office is a synthetic non-property entry. */
export type PropertyZone = 'north' | 'west' | 'office';

/** Coarse capacity tier — back-compat with TaskProperty. */
export type PropertyTier = 'small' | 'medium' | 'big';

export interface Property {
  /** Stable internal id (mock — same as code Phase 1). */
  id: string;
  /** Display SKU shown across the app. */
  code: string;
  name: string;
  /** Building / complex name — when relevant (e.g. "Grand Baie Heights"). */
  buildingName?: string;
  /** Free-form full address. */
  address: string;
  /** Cohort/region — lifted from reviews.PROPERTY_COHORT. */
  region: Cohort;
  /** Optional sub-region label for display ("Bel Ombre · South"). */
  area: string;
  /** Roster zone (mostly mirrors region but kept distinct for ops). */
  zone: PropertyZone;
  /** Capacity tier — small/medium/big. */
  tier: PropertyTier;
  geo?: { lat: number; lng: number };

  // Lifecycle
  lifecycleStatus: LifecycleStatus;
  onboardingChecklist: OnboardingChecklist;
  /** When the property went live (or is targeted to). */
  liveSince?: string;
  pausedReason?: string;
  pauseReturnBy?: string;

  // Layout
  listingType: ListingType;
  bedrooms: number;
  bathrooms?: number;
  maxOccupancy: number;
  sqm?: number;

  // Multi-unit
  parentPropertyId?: string;
  isCombo?: boolean;
  componentPropertyIds?: string[];

  // Owners (link via PROPERTY_OWNERS; primaryOwnerId is the signing party)
  primaryOwnerId: string;
  /** Maintenance spend cap override in MUR minor. Undefined = inherit from contract.
   *  Per T&Cs: Rs 2,500 OR 10% of booking, whichever applies (Finance/Owner contract owns). */
  maintenanceCapOverrideMinor?: number;
  /** Friday-Owner contract block (signing party = primaryOwner). */
  contract?: {
    status: 'active' | 'pending' | 'renewal_due' | 'expired';
    commissionPct: number;
    paymentDay: number;
    /** Renewal date (display only). */
    endsAt?: string;
    /** Cross-link to Legal/Admin → Xodo Sign envelope. */
    xodoEnvelopeId?: string;
  };

  // Listings
  listings: ListingRecord[];
  /** Display base rate per night MUR (read-only Phase 1; Guesty owns). */
  baseRateMUR: number;

  // Photos
  heroPhotoId?: string;
  photoIds: string[];

  // Tags + filters
  tags: string[];
  /** Per-property amenity set. Phase 1 derived from common defaults; Phase 2 editable. */
  amenities?: Amenity[];
  /** Base property description (channel descriptions live on ListingRecord). */
  description?: string;

  // Syndic relationship
  /** True if Friday acts as the syndicate (e.g. Grand Beehive). */
  isSyndicManaged?: boolean;
  /** Cross-link to Syndic module record (Phase 1: just a flag/string). */
  syndicId?: string;

  // Mock metrics (Phase 2 sources from real Finance/Analytics)
  occupancyYTD: number;
  occupancy90d: number;
  adr: number;
  rating: number;
  ratingCount: number;
  lastActivityAt: string;
}

// ───────────────── PropertyOwner (N:M with %) ─────────────────

export interface PropertyOwner {
  propertyId: string;
  ownerId: string;
  ownershipPct: number;
  isPrimary: boolean;
}

// ───────────────── PropertyCard (AI-knowledge surface) ─────────────────

export type PropertyCardCategory =
  | 'access'
  | 'wifi_tech'
  | 'utilities'
  | 'waste'
  | 'pool_outdoor'
  | 'building_syndic'
  | 'local_context'
  | 'quirks';

export const PROPERTY_CARD_CATEGORY_LABEL: Record<PropertyCardCategory, string> = {
  access: 'Access',
  wifi_tech: 'Wifi & Tech',
  utilities: 'Utilities',
  waste: 'Waste',
  pool_outdoor: 'Pool / Outdoor',
  building_syndic: 'Building / Syndic',
  local_context: 'Local context',
  quirks: 'Quirks',
};

export type CardSurface = 'guest_facing' | 'internal_only' | 'both';
export type CardSource = 'manual' | 'ai_extracted' | 'onboarding_form' | 'breezeway_imported' | 'guesty_imported';

export interface PropertyCard {
  id: string;
  /** 'global' for cross-property cards. */
  propertyId: string | 'global';
  category: PropertyCardCategory;
  title: string;
  body: string;
  surface: CardSurface;
  source: CardSource;
  aiExtractionMetadata?: { threadId: string; confidence: number };
  lastUpdated: string;
  lastUpdatedByUserId: string;
}

// ───────────────── Onboarding artifacts (typed union) ─────────────────

export type OnboardingArtifactType =
  | 'site_visit'
  | 'owner_agreement'
  | 'standards_book'
  | 'keys'
  | 'amenities_form'
  | 'gap_analysis'
  | 'home_build_out'
  | 'preventative_maintenance'
  | 'aesthetic_check'
  | 'photoshoot'
  | 'listing_setup';

export interface OnboardingArtifactBase {
  id: string;
  propertyId: string;
  type: OnboardingArtifactType;
  status: ChecklistItemStatus;
  startedAt?: string;
  completedAt?: string;
  assignedToUserId?: string;
  notes?: string;
}

export interface SiteVisitArtifact extends OnboardingArtifactBase {
  type: 'site_visit';
  visitDate?: string;
  attendeesUserIds?: string[];
  photosCount?: number;
  approvedBy?: string;
}

export interface OwnerAgreementArtifact extends OnboardingArtifactBase {
  type: 'owner_agreement';
  xodoEnvelopeId?: string;
  xodoStatus?: 'draft' | 'sent' | 'signed' | 'declined';
  commissionPct?: number;
  paymentDay?: number;
  maintenanceCapMinor?: number;
}

export interface StandardsBookArtifact extends OnboardingArtifactBase {
  type: 'standards_book';
  versionDelivered?: string;
  deliveredAt?: string;
  ownerAcknowledgedAt?: string;
}

export interface KeysArtifact extends OnboardingArtifactBase {
  type: 'keys';
  setsReceived?: number;
  duplicatesMadeAt?: string;
  storageLocation?: string;
}

export interface AmenitiesFormArtifact extends OnboardingArtifactBase {
  type: 'amenities_form';
  /** Phase 1: free-form. Phase 2: structured question-set. */
  responsesSummary?: string;
}

export interface GapAnalysisItem {
  id: string;
  item: string;
  qtyNeeded: number;
  status: 'missing' | 'purchased' | 'owner_provided';
  costMinor?: number;
  paidBy?: 'friday' | 'owner';
  reimbursementStatus?: 'pending' | 'deducted_from_payout' | 'invoiced' | 'settled';
}

export interface GapAnalysisArtifact extends OnboardingArtifactBase {
  type: 'gap_analysis';
  items: GapAnalysisItem[];
}

export interface HomeBuildOutItem {
  id: string;
  item: string;
  brand?: string;
  model?: string;
  serial?: string;
  warrantyDocId?: string;
  purchaseDate?: string;
  locationInProperty?: string;
}

export interface HomeBuildOutArtifact extends OnboardingArtifactBase {
  type: 'home_build_out';
  items: HomeBuildOutItem[];
}

export interface PreventativeMaintenanceArtifact extends OnboardingArtifactBase {
  type: 'preventative_maintenance';
  checklistJson?: string;
  photosCount?: number;
}

export interface AestheticCheckArtifact extends OnboardingArtifactBase {
  type: 'aesthetic_check';
  checklistJson?: string;
  photosCount?: number;
}

export interface PhotoshootArtifact extends OnboardingArtifactBase {
  type: 'photoshoot';
  shootKind?: 'preliminary' | 'professional';
  photographer?: string;
  shootDate?: string;
  galleryCount?: number;
}

export interface ListingSetupArtifact extends OnboardingArtifactBase {
  type: 'listing_setup';
  listingsByChannel?: Partial<Record<ListingChannel, string>>;
  basePriceMUR?: number;
  basePriceRationale?: string;
}

export type OnboardingArtifact =
  | SiteVisitArtifact
  | OwnerAgreementArtifact
  | StandardsBookArtifact
  | KeysArtifact
  | AmenitiesFormArtifact
  | GapAnalysisArtifact
  | HomeBuildOutArtifact
  | PreventativeMaintenanceArtifact
  | AestheticCheckArtifact
  | PhotoshootArtifact
  | ListingSetupArtifact;

// ───────────────── Activity log ─────────────────

export type PropertyActivityKind =
  | 'lifecycle_changed'
  | 'onboarding_step_complete'
  | 'owner_changed'
  | 'photo_updated'
  | 'contract_event'
  | 'tag_added'
  | 'card_added'
  | 'note';

export interface PropertyActivity {
  id: string;
  propertyId: string;
  ts: string;
  kind: PropertyActivityKind;
  actorId: string;
  detail: string;
}

// ───────────────── Fixtures ─────────────────

const FULL_CHECKLIST: OnboardingChecklist = ONBOARDING_REQUIRED.reduce(
  (acc, k) => ({ ...acc, [k]: 'complete' as ChecklistItemStatus }),
  {},
);

/** Most properties are "live + complete checklist." */
const LIVE_COMPLETE = (): OnboardingChecklist => ({ ...FULL_CHECKLIST });

export const PROPERTIES: Property[] = [];

// ───────────────── Lookups + helpers ─────────────────

export const PROPERTY_BY_CODE: Record<string, Property> = PROPERTIES.reduce(
  (acc, p) => ({ ...acc, [p.code]: p }),
  {} as Record<string, Property>,
);

export const PROPERTY_BY_ID: Record<string, Property> = PROPERTIES.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<string, Property>,
);

export function isOnboardingComplete(p: Property): boolean {
  return ONBOARDING_REQUIRED.every((k) => p.onboardingChecklist[k] === 'complete');
}

export function lifecycleBadge(p: Property): { label: string; tone: 'success' | 'warning' | 'info' | 'neutral' } {
  if (p.lifecycleStatus === 'onboarding') return { label: 'Onboarding', tone: 'info' };
  if (p.lifecycleStatus === 'paused') return { label: 'Paused', tone: 'warning' };
  if (p.lifecycleStatus === 'off_boarded') return { label: 'Off-boarded', tone: 'neutral' };
  if (!isOnboardingComplete(p)) return { label: 'Active · Pending', tone: 'warning' };
  return { label: 'Active', tone: 'success' };
}

export function checklistProgress(p: Property): { done: number; total: number; pct: number } {
  const total = ONBOARDING_REQUIRED.length;
  const done = ONBOARDING_REQUIRED.filter((k) => p.onboardingChecklist[k] === 'complete').length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

// ───────────────── Contract helper ─────────────────

/** Returns the property's contract, falling back to a sensible default for
 *  Phase 1 fixtures that don't carry one. Real contract data lands when
 *  Owners module + Legal/Admin Xodo integration ships. */
export function getContract(p: Property): Required<NonNullable<Property['contract']>> | { status: 'pending'; commissionPct: 0; paymentDay: 0 } {
  if (p.contract) {
    return {
      status: p.contract.status,
      commissionPct: p.contract.commissionPct,
      paymentDay: p.contract.paymentDay,
      endsAt: p.contract.endsAt ?? '—',
      xodoEnvelopeId: p.contract.xodoEnvelopeId ?? '—',
    };
  }
  if (p.lifecycleStatus === 'onboarding') {
    return { status: 'pending', commissionPct: 0, paymentDay: 0 };
  }
  // Reasonable Phase 1 default for live properties without explicit contract data.
  return { status: 'active', commissionPct: 20, paymentDay: 3, endsAt: '2027-12-31', xodoEnvelopeId: 'xodo-default' };
}

// ───────────────── Owners (N:M) ─────────────────

export const PROPERTY_OWNERS: PropertyOwner[] = PROPERTIES.map((p) => ({
  propertyId: p.id,
  ownerId: p.primaryOwnerId,
  ownershipPct: 100,
  isPrimary: true,
}));

export function ownersOfProperty(propertyId: string): PropertyOwner[] {
  return PROPERTY_OWNERS.filter((po) => po.propertyId === propertyId);
}

export function propertiesOfOwner(ownerId: string): Property[] {
  const ids = new Set(PROPERTY_OWNERS.filter((po) => po.ownerId === ownerId).map((po) => po.propertyId));
  return PROPERTIES.filter((p) => ids.has(p.id));
}

// ───────────────── Property photos (Phase 2 — gallery editor) ─────────────────

export type PhotoRoomTag =
  | 'exterior'
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'pool'
  | 'view'
  | 'amenity'
  | 'lifestyle'
  | 'other';

export const PHOTO_ROOM_LABEL: Record<PhotoRoomTag, string> = {
  exterior: 'Exterior',
  living: 'Living',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  pool: 'Pool',
  view: 'View',
  amenity: 'Amenity',
  lifestyle: 'Lifestyle',
  other: 'Other',
};

export interface PropertyPhoto {
  id: string;
  propertyId: string;
  /** Mock URL — Phase 2 backend bridges to real storage. */
  url?: string;
  caption?: string;
  roomTag: PhotoRoomTag;
  /** Channels this photo is published to. Empty = published to all. */
  channelSubsets: ListingChannel[];
  /** Hex hue for the gradient placeholder so different photos look different. */
  hue?: number;
}

/** Build a minimal photo record from a photoId in `Property.photoIds`. Phase 2
 *  swaps to real storage; this lets the gallery editor work today over the
 *  existing photoIds array without breaking the schema. */
function makePhoto(propertyId: string, id: string, idx: number): PropertyPhoto {
  // Heuristic room tag rotation so the gallery shows variety.
  const tags: PhotoRoomTag[] = ['exterior', 'living', 'bedroom', 'kitchen', 'bathroom', 'pool', 'view', 'amenity'];
  return {
    id,
    propertyId,
    roomTag: tags[idx % tags.length],
    channelSubsets: [],
    hue: (idx * 47) % 360,
  };
}

export const PROPERTY_PHOTOS: PropertyPhoto[] = PROPERTIES.flatMap((p) =>
  p.photoIds.map((id, idx) => makePhoto(p.id, id, idx)),
);

const PHOTO_BY_ID: Record<string, PropertyPhoto> = PROPERTY_PHOTOS.reduce(
  (acc, ph) => ({ ...acc, [ph.id]: ph }),
  {} as Record<string, PropertyPhoto>,
);

export function photosForProperty(propertyId: string): PropertyPhoto[] {
  const property = PROPERTY_BY_ID[propertyId];
  if (!property) return [];
  // Order matches Property.photoIds[]
  return property.photoIds
    .map((id) => PHOTO_BY_ID[id])
    .filter((p): p is PropertyPhoto => Boolean(p));
}

/** Mutate-in-place reorder. Returns the new order. */
export function reorderPhotos(propertyId: string, newOrder: string[]): void {
  const property = PROPERTY_BY_ID[propertyId];
  if (!property) return;
  property.photoIds = newOrder;
}

export function setHeroPhoto(propertyId: string, photoId: string): void {
  const property = PROPERTY_BY_ID[propertyId];
  if (!property) return;
  property.heroPhotoId = photoId;
}

export function updatePhoto(photoId: string, patch: Partial<Pick<PropertyPhoto, 'caption' | 'roomTag' | 'channelSubsets'>>): void {
  const photo = PHOTO_BY_ID[photoId];
  if (!photo) return;
  Object.assign(photo, patch);
}

export function addPhoto(propertyId: string, opts?: { roomTag?: PhotoRoomTag; caption?: string }): PropertyPhoto | null {
  const property = PROPERTY_BY_ID[propertyId];
  if (!property) return null;
  const id = `ph-${propertyId.slice(2)}-${Date.now()}`;
  const photo: PropertyPhoto = {
    id,
    propertyId,
    roomTag: opts?.roomTag ?? 'other',
    caption: opts?.caption,
    channelSubsets: [],
    hue: Math.floor(Math.random() * 360),
  };
  PROPERTY_PHOTOS.push(photo);
  PHOTO_BY_ID[id] = photo;
  property.photoIds = [...property.photoIds, id];
  if (!property.heroPhotoId) property.heroPhotoId = id;
  return photo;
}

export function removePhoto(propertyId: string, photoId: string): void {
  const property = PROPERTY_BY_ID[propertyId];
  if (!property) return;
  property.photoIds = property.photoIds.filter((id) => id !== photoId);
  if (property.heroPhotoId === photoId) property.heroPhotoId = property.photoIds[0];
  const idx = PROPERTY_PHOTOS.findIndex((ph) => ph.id === photoId);
  if (idx >= 0) PROPERTY_PHOTOS.splice(idx, 1);
  delete PHOTO_BY_ID[photoId];
}

// ───────────────── AI Card suggestions (Training-bound) ─────────────────
//
// Queue of pending Property Card suggestions surfaced by the AI extraction
// loop. Originally surfaced as a Properties sub-page; reframed as a Training
// concern (knowledge-extraction loop = "teaching the system") — moves to
// Training module when it scopes. Stays in this fixture for now so the
// inline per-property AI banner in the Operational tab keeps working;
// Properties · Insights surfaces a separate concern (improvement opportunities,
// not new knowledge).

export interface AiCardSuggestion {
  id: string;
  propertyId: string;
  /** Source thread / task / comment that surfaced the suggestion. */
  sourceLabel: string;
  category: PropertyCardCategory;
  proposedTitle: string;
  proposedBody: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const AI_CARD_SUGGESTIONS: AiCardSuggestion[] = [];

const AI_BY_ID: Record<string, AiCardSuggestion> = AI_CARD_SUGGESTIONS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<string, AiCardSuggestion>,
);

export function pendingAiSuggestions(): AiCardSuggestion[] {
  return AI_CARD_SUGGESTIONS.filter((s) => s.status === 'pending');
}

export function pendingAiSuggestionsForProperty(propertyId: string): AiCardSuggestion[] {
  return AI_CARD_SUGGESTIONS.filter((s) => s.propertyId === propertyId && s.status === 'pending');
}

export function acceptAiSuggestion(id: string): PropertyCard | null {
  const s = AI_BY_ID[id];
  if (!s || s.status !== 'pending') return null;
  s.status = 'accepted';
  const card: PropertyCard = {
    id: `pc-${s.propertyId.slice(2)}-ai-${s.id.slice(3)}`,
    propertyId: s.propertyId,
    category: s.category,
    title: s.proposedTitle,
    body: s.proposedBody,
    surface: 'both',
    source: 'ai_extracted',
    aiExtractionMetadata: { threadId: s.sourceLabel, confidence: s.confidence },
    lastUpdated: new Date().toISOString(),
    lastUpdatedByUserId: 'ai',
  };
  PROPERTY_CARDS.push(card);
  return card;
}

export function rejectAiSuggestion(id: string): void {
  const s = AI_BY_ID[id];
  if (s) s.status = 'rejected';
}

// ───────────────── Listing-quality recommendations (Phase 2) ─────────────────
//
// Heuristic recommendations surfaced per-property. Phase 1 = computed from
// property state; Phase 2 = augmented by photo analysis + LLM description
// scoring + occupancy trend signals.

export interface ListingRecommendation {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  actionLabel?: string;
}

export function listingRecommendations(p: Property): ListingRecommendation[] {
  const recs: ListingRecommendation[] = [];

  if (p.lifecycleStatus === 'live') {
    if (p.photoIds.length < 6) {
      recs.push({
        id: 'photos_low',
        severity: p.photoIds.length === 0 ? 'high' : 'medium',
        message: `Photo count is low (${p.photoIds.length} / 10 recommended). Channels weight listings with rich galleries.`,
        actionLabel: 'Open gallery',
      });
    }
    if (!p.description || p.description.length < 60) {
      recs.push({
        id: 'desc_short',
        severity: 'medium',
        message: `Base description is ${p.description ? p.description.length + ' chars' : 'empty'} — channels expect 200+ chars for SEO weighting.`,
        actionLabel: 'Edit description',
      });
    }
    if ((p.amenities ?? []).length < 8) {
      recs.push({
        id: 'amenities_thin',
        severity: 'low',
        message: `Only ${(p.amenities ?? []).length} amenities tagged. Filling out the matrix improves channel filterability.`,
        actionLabel: 'Open amenity matrix',
      });
    }
    // Occupancy trend (mock signal — Phase 2 wires real Analytics)
    if (p.occupancy90d < p.occupancyYTD - 0.10 && p.occupancyYTD > 0.4) {
      recs.push({
        id: 'occ_dropping',
        severity: 'high',
        message: `Occupancy dropping — 90d ${Math.round(p.occupancy90d * 100)}% vs YTD ${Math.round(p.occupancyYTD * 100)}%. Consider campaign or pricing review.`,
        actionLabel: 'Review pricing',
      });
    }
    if (p.listings.length < 2) {
      recs.push({
        id: 'channels_thin',
        severity: 'medium',
        message: `Only listed on ${p.listings.length} channel${p.listings.length === 1 ? '' : 's'}. Multi-channel exposure typically lifts occupancy 12-18%.`,
        actionLabel: 'Push to more channels',
      });
    }
  }

  if (p.lifecycleStatus === 'paused' && p.pauseReturnBy) {
    const returnDate = new Date(p.pauseReturnBy);
    const daysUntil = Math.ceil((returnDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil < 14) {
      recs.push({
        id: 'unpause_due',
        severity: 'medium',
        message: `Pause return-by is in ${daysUntil} days. Confirm renovation completion + plan re-listing.`,
      });
    }
  }

  return recs;
}

// ───────────────── Portfolio-level insights (Phase 2) ─────────────────
//
// Cross-property pattern detection — feeds the Insights sub-page.
// Phase 1 = heuristic; Phase 2 augments with real Analytics data + LLM
// pattern extraction across reviews / occupancy / pricing.

export interface PortfolioInsight {
  id: string;
  severity: 'low' | 'medium' | 'high';
  /** Properties impacted — code list. */
  propertyCodes: string[];
  title: string;
  message: string;
  /** Suggested follow-up action — narrative for now. */
  actionLabel?: string;
  /** Group-by axis (region / cohort / type). */
  axis?: 'region' | 'type' | 'multi-unit' | 'syndic';
}

export function portfolioInsights(): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];

  // Group occupancy slumps by region
  const byRegion: Record<string, Property[]> = {};
  PROPERTIES.forEach((p) => {
    if (p.lifecycleStatus !== 'live') return;
    (byRegion[p.region] = byRegion[p.region] || []).push(p);
  });
  Object.entries(byRegion).forEach(([region, props]) => {
    if (props.length < 2) return;
    const ytdAvg = props.reduce((acc, p) => acc + p.occupancyYTD, 0) / props.length;
    const recent = props.reduce((acc, p) => acc + p.occupancy90d, 0) / props.length;
    if (ytdAvg > 0.4 && recent < ytdAvg - 0.05) {
      insights.push({
        id: `region_drop_${region}`,
        severity: ytdAvg - recent > 0.10 ? 'high' : 'medium',
        propertyCodes: props.map((p) => p.code),
        title: `${region.replace(/_/g, ' ')} occupancy slipping`,
        message: `${props.length} live properties in this region · 90-day avg ${Math.round(recent * 100)}% vs YTD ${Math.round(ytdAvg * 100)}%. Pattern across the cohort, not isolated.`,
        actionLabel: 'Review pricing + campaign options',
        axis: 'region',
      });
    }
  });

  // Photo-thin properties
  const photoLow = PROPERTIES.filter((p) => p.lifecycleStatus === 'live' && p.photoIds.length < 4);
  if (photoLow.length >= 3) {
    insights.push({
      id: 'photos_thin_portfolio',
      severity: 'medium',
      propertyCodes: photoLow.map((p) => p.code),
      title: 'Photo gallery sweep needed',
      message: `${photoLow.length} live properties have fewer than 4 photos. Channel algorithms penalise listings with thin galleries.`,
      actionLabel: 'Schedule photoshoot batch',
    });
  }

  // Description coverage
  const descMissing = PROPERTIES.filter((p) => p.lifecycleStatus === 'live' && (!p.description || p.description.length < 60));
  if (descMissing.length >= 3) {
    insights.push({
      id: 'desc_coverage',
      severity: 'medium',
      propertyCodes: descMissing.map((p) => p.code),
      title: 'Description coverage low',
      message: `${descMissing.length} live properties have empty or short base descriptions. Channels weight SEO based on description length + freshness.`,
      actionLabel: 'Generate descriptions with AI assistant',
    });
  }

  // Multi-unit combo under-utilization
  const combos = PROPERTIES.filter((p) => p.isCombo);
  combos.forEach((combo) => {
    if (combo.occupancy90d < 0.4 && combo.componentPropertyIds) {
      const components = combo.componentPropertyIds.map((id) => PROPERTY_BY_ID[id]).filter(Boolean) as Property[];
      const componentAvg = components.reduce((acc, p) => acc + p.occupancy90d, 0) / Math.max(components.length, 1);
      insights.push({
        id: `combo_under_${combo.code}`,
        severity: 'low',
        propertyCodes: [combo.code, ...components.map((p) => p.code)],
        title: `${combo.code} combo under-booked`,
        message: `Combo property ${combo.code} (${combo.name}) at ${Math.round(combo.occupancy90d * 100)}% 90d occ vs component avg ${Math.round(componentAvg * 100)}%. Consider Smart Calendar Rule tuning or pricing review.`,
        actionLabel: 'Review combo strategy',
        axis: 'multi-unit',
      });
    }
  });

  // Channel coverage thin
  const oneChannel = PROPERTIES.filter((p) => p.lifecycleStatus === 'live' && p.listings.length === 1);
  if (oneChannel.length >= 3) {
    insights.push({
      id: 'channel_coverage_thin',
      severity: 'low',
      propertyCodes: oneChannel.map((p) => p.code),
      title: 'Single-channel exposure',
      message: `${oneChannel.length} live properties are listed on only one channel. Multi-channel typically lifts occupancy 12-18%.`,
      actionLabel: 'Push to additional channels',
    });
  }

  // Onboarding stuck
  const onboardingStuck = PROPERTIES.filter((p) => {
    if (p.lifecycleStatus !== 'onboarding') return false;
    const lastDate = new Date(p.lastActivityAt);
    const days = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return days > 7;
  });
  if (onboardingStuck.length >= 1) {
    insights.push({
      id: 'onboarding_stuck',
      severity: 'high',
      propertyCodes: onboardingStuck.map((p) => p.code),
      title: 'Onboarding stalled',
      message: `${onboardingStuck.length} ${onboardingStuck.length === 1 ? 'property' : 'properties'} stuck > 7 days without activity. Escalate to Mathias.`,
      actionLabel: 'Review onboarding queue',
    });
  }

  return insights;
}

// ───────────────── Bulk-operation helpers (Phase 2) ─────────────────

export function bulkSetLifecycle(propertyIds: string[], status: LifecycleStatus, reason?: string): number {
  let n = 0;
  propertyIds.forEach((id) => {
    const p = PROPERTY_BY_ID[id];
    if (!p) return;
    p.lifecycleStatus = status;
    if (status === 'paused' && reason) p.pausedReason = reason;
    if (status === 'live') { p.pausedReason = undefined; p.pauseReturnBy = undefined; }
    n++;
  });
  return n;
}

export function bulkAddTag(propertyIds: string[], tag: string): number {
  let n = 0;
  propertyIds.forEach((id) => {
    const p = PROPERTY_BY_ID[id];
    if (!p) return;
    if (!p.tags.includes(tag)) {
      p.tags = [...p.tags, tag];
      n++;
    }
  });
  return n;
}

export function bulkRemoveTag(propertyIds: string[], tag: string): number {
  let n = 0;
  propertyIds.forEach((id) => {
    const p = PROPERTY_BY_ID[id];
    if (!p) return;
    if (p.tags.includes(tag)) {
      p.tags = p.tags.filter((t) => t !== tag);
      n++;
    }
  });
  return n;
}

/** All distinct tags across the portfolio — for the bulk-edit autocomplete. */
export function allTags(): string[] {
  const set = new Set<string>();
  PROPERTIES.forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

// ───────────────── Description + amenity + listing-push helpers (Phase 2) ─────────────────

export function setBaseDescription(propertyId: string, description: string): void {
  const p = PROPERTY_BY_ID[propertyId];
  if (!p) return;
  p.description = description;
}

export function setChannelDescription(propertyId: string, channel: ListingChannel, description: string): void {
  const p = PROPERTY_BY_ID[propertyId];
  if (!p) return;
  const listing = p.listings.find((l) => l.channel === channel);
  if (!listing) return;
  listing.description = description;
}

export function toggleAmenity(propertyId: string, amenity: Amenity): void {
  const p = PROPERTY_BY_ID[propertyId];
  if (!p) return;
  const set = new Set(p.amenities ?? []);
  if (set.has(amenity)) set.delete(amenity); else set.add(amenity);
  p.amenities = Array.from(set);
}

/** Mock listing push — simulates write-through to Guesty/channel. Phase 2
 *  swaps the toast for real Guesty API call. */
export function pushListingToChannel(propertyId: string, channel: ListingChannel): { ok: boolean; message: string } {
  const p = PROPERTY_BY_ID[propertyId];
  if (!p) return { ok: false, message: 'Property not found' };

  const existing = p.listings.find((l) => l.channel === channel);
  const ts = new Date().toISOString();

  if (existing) {
    existing.status = 'active';
    existing.lastPushedAt = ts;
    return { ok: true, message: `Updated ${LISTING_CHANNEL_LABEL[channel]} listing · ${existing.externalId}` };
  }

  // Create-new path (Phase 2 write-through · listing-create per pack §13)
  const newId = `${channel}-${p.code.toLowerCase()}-${Math.floor(Math.random() * 999)}`;
  p.listings.push({
    channel,
    externalId: newId,
    status: 'active',
    description: p.description,
    lastPushedAt: ts,
  });
  return { ok: true, message: `Created ${LISTING_CHANNEL_LABEL[channel]} listing · ${newId}` };
}

/** Returns preflight issues that would block a successful push. Empty = ready. */
export function preflightChannelPush(p: Property, channel: ListingChannel): string[] {
  const issues: string[] = [];
  if (p.lifecycleStatus === 'off_boarded') issues.push('Property is off-boarded.');
  if (p.lifecycleStatus === 'paused') issues.push('Property is paused — unpause before pushing.');
  if (p.photoIds.length === 0) issues.push('No photos uploaded — channels require ≥ 1 photo.');
  if (!p.heroPhotoId) issues.push('No hero photo selected.');
  if (p.baseRateMUR === 0) issues.push('Base price not set.');
  if (channel === 'booking' && !isOnboardingComplete(p)) issues.push('Booking.com pushes require complete onboarding (3-5 reviews strategy).');
  return issues;
}

// ───────────────── Property Cards (sample fixtures) ─────────────────

export const PROPERTY_CARDS: PropertyCard[] = [];

export function cardsForProperty(propertyId: string, opts?: { includeGlobal?: boolean }): PropertyCard[] {
  const own = PROPERTY_CARDS.filter((c) => c.propertyId === propertyId);
  if (opts?.includeGlobal) return [...own, ...PROPERTY_CARDS.filter((c) => c.propertyId === 'global')];
  return own;
}

// ───────────────── Onboarding artifacts (Nitzana mid-flight) ─────────────────

export const ONBOARDING_ARTIFACTS: OnboardingArtifact[] = [];

export function artifactsForProperty(propertyId: string): OnboardingArtifact[] {
  return ONBOARDING_ARTIFACTS.filter((a) => a.propertyId === propertyId);
}

// ───────────────── Activity (light fixtures) ─────────────────

export const PROPERTY_ACTIVITY: PropertyActivity[] = [];

export function activityForProperty(propertyId: string): PropertyActivity[] {
  return PROPERTY_ACTIVITY.filter((a) => a.propertyId === propertyId).sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

// ───────────────── Back-compat shims ─────────────────
//
// These derive the legacy shapes from the canonical `PROPERTIES` array so old
// imports keep working. Commit 4 will retire the shims and update consumers.

/** Synthetic OFFICE meta-entry — not a real property, but Operations module needs it as a task-property option. */
export const OFFICE_META: { code: string; name: string; zone: PropertyZone; tier: PropertyTier } = {
  code: 'OFFICE', name: 'Office / Store / Admin', zone: 'office', tier: 'small',
};

/** Drop-in shim for the legacy `TaskProperty` shape. */
export const TASK_PROPERTIES_SHIM: { code: string; name: string; zone: PropertyZone; tier: PropertyTier }[] =
  [...PROPERTIES.map((p) => ({ code: p.code, name: p.name, zone: p.zone, tier: p.tier })), OFFICE_META];

/** Drop-in shim for the legacy `FinProperty` shape. */
export const FIN_PROPERTIES_SHIM: { code: string; name: string; ownerId: string }[] =
  PROPERTIES
    .filter((p) => p.lifecycleStatus !== 'onboarding') // onboarding properties have no Finance shape yet
    .map((p) => ({ code: p.code, name: p.name, ownerId: p.primaryOwnerId }));

/** Drop-in shim for legacy `PROPERTY_COHORT`. */
export const PROPERTY_COHORT_SHIM: Record<string, Cohort> = PROPERTIES.reduce(
  (acc, p) => ({ ...acc, [p.code]: p.region }),
  {} as Record<string, Cohort>,
);
