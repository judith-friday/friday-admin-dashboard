'use client';

import { useMemo, useState } from 'react';
import {
  PROPERTY_BY_CODE,
  PROPERTY_BY_ID,
  lifecycleBadge,
  checklistProgress,
  isOnboardingComplete,
  LISTING_CHANNEL_LABEL,
  type Property,
} from '../../../_data/properties';
import { COHORT_LABEL } from '../../../_data/reviews';
import { FIN_OWNERS } from '../../../_data/finance';
import { useCurrentRole } from '../../usePermissions';

interface Props {
  propertyCode: string;
  onClose: () => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'identity', label: 'Identity & Layout' },
  { id: 'owner', label: 'Owner' },
  { id: 'operational', label: 'Operational' },
  { id: 'financial', label: 'Financial' },
  { id: 'listings', label: 'Listings' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'activity', label: 'Activity' },
];

/** Role-based tab gating per scoping pack §6. */
function visibleTabsFor(role: string): string[] {
  if (role === 'field') {
    // Contributor: Identity & Layout / Operational / Reservations / Activity. No Financial / Owner.
    return ['overview', 'identity', 'operational', 'reservations', 'activity'];
  }
  if (role === 'commercial_marketing' || role === 'ops_manager') {
    // Manager: all except detailed Owner contract + commission %. Owner tab still visible
    // (we hide the sensitive fields inside the tab in commit 2).
    return TABS.map((t) => t.id);
  }
  // Director / admin
  return TABS.map((t) => t.id);
}

export function PropertyDetail({ propertyCode, onClose }: Props) {
  const role = useCurrentRole();
  const visibleTabIds = useMemo(() => visibleTabsFor(role), [role]);
  const visibleTabs = TABS.filter((t) => visibleTabIds.includes(t.id));

  const [tab, setTab] = useState<string>(visibleTabs[0]?.id ?? 'overview');
  const property = PROPERTY_BY_CODE[propertyCode];

  if (!property) {
    return (
      <aside className="task-detail-pane open" style={{ width: 720, maxWidth: '95vw' }}>
        <div style={{ padding: 24 }}>
          <button className="btn ghost sm" onClick={onClose}>← Close</button>
          <p style={{ marginTop: 16, color: 'var(--color-text-tertiary)' }}>Property <span className="mono">{propertyCode}</span> not found.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="task-detail-pane open" style={{ width: 760, maxWidth: '95vw' }}>
      <PropertyDetailHeader property={property} onClose={onClose} />
      <div className="fad-tabs" style={{ padding: '0 20px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            className={'fad-tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tab === 'overview' && <OverviewTab property={property} />}
        {tab === 'identity' && <StubTab title="Identity & Layout" hint="Photo gallery, rooms & beds, max occupancy, listing type, sqm, building name, full + published address, geo, multi-unit group membership." />}
        {tab === 'owner' && <StubTab title="Owner" hint="Linked owner record(s) with ownership %, contract status, commission %, payment day, contract document link (Legal/Admin → Xodo Sign), maintenance spend cap." />}
        {tab === 'operational' && <StubTab title="Operational" hint="Property Cards (8 categories · AI-knowledge surface), key systems, time-gated access codes, wifi (team view), syndic flag + cross-link, cleaner / inspector / maintenance defaults from Breezeway." />}
        {tab === 'financial' && <StubTab title="Financial" hint="Per-property revenue YTD, payout YTD, owner balance, recent transactions, tourist tax collected. Role-gated." />}
        {tab === 'listings' && <StubTab title="Listings" hint="Per-channel listing IDs + status (Airbnb / Booking / VRBO / friday.mu), descriptions per channel, channel-specific photo subset, Guesty Accounting Dimensions, channel-specific commissions and markups." />}
        {tab === 'reservations' && <StubTab title="Reservations" hint="Recent + upcoming list, cross-link to Reservations module." />}
        {tab === 'activity' && <StubTab title="Activity" hint="Full audit trail — onboarding step completions, lifecycle status changes, owner changes, photo updates, contract events, cross-module events." />}
      </div>
    </aside>
  );
}

function PropertyDetailHeader({ property, onClose }: { property: Property; onClose: () => void }) {
  const badge = lifecycleBadge(property);
  const ownerName = FIN_OWNERS.find((o) => o.id === property.primaryOwnerId)?.name ?? property.primaryOwnerId;
  const { done, total } = checklistProgress(property);
  const showProgress = property.lifecycleStatus === 'onboarding' || (property.lifecycleStatus === 'live' && !isOnboardingComplete(property));

  return (
    <div style={{ padding: 20, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="btn ghost sm" onClick={onClose}>← Close</button>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          Last activity: {property.lastActivityAt}
        </span>
      </div>

      <div style={{
        aspectRatio: '16 / 5',
        background: 'radial-gradient(ellipse at 30% 30%, rgba(86,128,202,0.3), transparent 60%), linear-gradient(135deg, var(--color-brand-navy), #1a2855)',
        borderRadius: 'var(--radius-md)',
        position: 'relative',
        marginBottom: 12,
      }}>
        <span className="mono" style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{property.code}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{property.name}</h2>
        <span className={`chip ${badge.tone === 'success' ? 'info' : badge.tone === 'warning' ? 'warn' : ''}`}>{badge.label}</span>
        {property.isCombo && <span className="chip">Combo · {property.componentPropertyIds?.length ?? 0} units</span>}
        {property.parentPropertyId && (
          <span className="chip">
            Part of: <span className="mono" style={{ marginLeft: 4 }}>{PROPERTY_BY_ID[property.parentPropertyId]?.code ?? property.parentPropertyId}</span>
          </span>
        )}
        {property.isSyndicManaged && <span className="chip">Friday-as-syndic</span>}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        {property.address} · {COHORT_LABEL[property.region]} · {ownerName}
      </div>

      {showProgress && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
          Onboarding checklist: <strong style={{ color: 'var(--color-text-primary)' }}>{done} / {total}</strong>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ property }: { property: Property }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Section title="Quick stats">
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <Stat label="Occupancy YTD" value={property.occupancyYTD > 0 ? `${Math.round(property.occupancyYTD * 100)}%` : '—'} />
          <Stat label="Occupancy 90d" value={property.occupancy90d > 0 ? `${Math.round(property.occupancy90d * 100)}%` : '—'} />
          <Stat label="ADR" value={property.adr > 0 ? `€${property.adr}` : '—'} />
          <Stat label="Rating" value={property.rating > 0 ? `★ ${property.rating.toFixed(2)} (${property.ratingCount})` : '—'} />
          <Stat label="Base rate" value={property.baseRateMUR > 0 ? `Rs ${(property.baseRateMUR / 100).toLocaleString()}` : '—'} />
        </div>
      </Section>

      <Section title="Layout">
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 13 }}>
          <span><strong>{property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BR`}</strong></span>
          {property.bathrooms !== undefined && <span><strong>{property.bathrooms}</strong> bath</span>}
          <span>Sleeps <strong>{property.maxOccupancy}</strong></span>
          {property.sqm !== undefined && <span><strong>{property.sqm}</strong> m²</span>}
          <span style={{ textTransform: 'capitalize' }}>{property.listingType}</span>
        </div>
      </Section>

      <Section title="Channels">
        {property.listings.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>No active listings yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {property.listings.map((l) => (
              <div key={l.channel + l.externalId} style={{ display: 'flex', gap: 12, fontSize: 12, alignItems: 'center' }}>
                <span style={{ width: 96 }}>{LISTING_CHANNEL_LABEL[l.channel]}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{l.externalId}</span>
                <span className={`chip sm ${l.status === 'active' ? 'info' : l.status === 'paused' ? 'warn' : ''}`}>{l.status}</span>
                {l.commissionPct !== undefined && <span style={{ color: 'var(--color-text-tertiary)' }}>· {l.commissionPct}% commission</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {property.tags.length > 0 && (
        <Section title="Tags">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {property.tags.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        </Section>
      )}

      {property.pausedReason && (
        <Section title="Paused">
          <p style={{ margin: 0, fontSize: 13 }}>{property.pausedReason}</p>
          {property.pauseReturnBy && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-tertiary)' }}>Return by {property.pauseReturnBy}</p>}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function StubTab({ title, hint }: { title: string; hint: string }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 12, maxWidth: 480, marginInline: 'auto' }}>{hint}</p>
      <p style={{ margin: '12px 0 0', fontSize: 11, fontStyle: 'italic' }}>Lands in commit 2 of the Properties rebuild.</p>
    </div>
  );
}
