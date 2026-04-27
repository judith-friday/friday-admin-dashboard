'use client';

import { useMemo } from 'react';
import {
  PROPERTIES,
  ONBOARDING_LABEL,
  ONBOARDING_REQUIRED,
  checklistProgress,
  type Property,
} from '../../../_data/properties';
import { FIN_OWNERS } from '../../../_data/finance';

interface Props {
  onOpen: (code: string) => void;
}

export function OnboardingPage({ onOpen }: Props) {
  const onboarding = useMemo(() => PROPERTIES.filter((p) => p.lifecycleStatus === 'onboarding'), []);
  const ownerName = (id: string) => FIN_OWNERS.find((o) => o.id === id)?.name ?? id;

  return (
    <div className="fad-module-body" style={{ flex: 1, overflowY: 'auto' }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-tertiary)' }}>
        Properties currently going through onboarding. Owns artifact capture (Site Visit, Owner Agreement, Standards Book, Keys, Amenities Form, Gap Analysis, Home Build-Out, Preventative Maintenance, Aesthetic Check, Photoshoot, Listing Setup) before listings push to channels.
      </p>

      {onboarding.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
          No properties currently in onboarding.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {onboarding.map((p) => (
            <OnboardingRow key={p.code} property={p} ownerName={ownerName(p.primaryOwnerId)} onOpen={() => onOpen(p.code)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OnboardingRow({ property, ownerName, onOpen }: { property: Property; ownerName: string; onOpen: () => void }) {
  const { done, total, pct } = checklistProgress(property);
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 11 }}>{property.code}</span>
        <button onClick={onOpen} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {property.name}
        </button>
        <span className="chip info">Onboarding</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{ownerName}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500 }}>{done} / {total} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>· {pct}%</span></span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: 'var(--color-background-secondary)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-brand-accent)', transition: 'width 200ms' }} />
      </div>

      {/* Checklist preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, fontSize: 12 }}>
        {ONBOARDING_REQUIRED.map((k) => {
          const status = property.onboardingChecklist[k] ?? 'not_started';
          const symbol = status === 'complete' ? '✓' : status === 'in_progress' ? '◐' : '○';
          const color = status === 'complete' ? 'var(--color-text-success)' : status === 'in_progress' ? 'var(--color-brand-accent)' : 'var(--color-text-tertiary)';
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
              <span style={{ fontSize: 11 }}>{symbol}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{ONBOARDING_LABEL[k]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
