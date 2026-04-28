'use client';

import { useMemo, useState } from 'react';
import {
  pendingAiSuggestions,
  acceptAiSuggestion,
  rejectAiSuggestion,
  PROPERTY_BY_ID,
  PROPERTY_CARD_CATEGORY_LABEL,
  type AiCardSuggestion,
} from '../../../_data/properties';
import { fireToast } from '../../Toaster';

interface Props {
  onOpen: (code: string) => void;
}

export function AiCardsPage({ onOpen }: Props) {
  const [, setRev] = useState(0);
  const bump = () => setRev((n) => n + 1);
  const pending = useMemo(() => pendingAiSuggestions(), []);

  const handleAccept = (id: string) => {
    const card = acceptAiSuggestion(id);
    if (card) {
      fireToast(`Card added · ${card.title}`);
      bump();
    }
  };

  const handleReject = (id: string) => {
    rejectAiSuggestion(id);
    fireToast('Suggestion dismissed');
    bump();
  };

  return (
    <div className="fad-module-body" style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 500 }}>AI Card suggestions</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-tertiary)' }}>
          Pending Property Card additions surfaced by the AI extraction loop · scans Inbox guest threads + Operations task comments + Reviews. One-click accept moves the suggestion to the property's Operational tab as a structured Card · reject discards.
        </p>
      </div>

      {pending.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
          No pending suggestions · queue is empty.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={() => handleAccept(s.id)}
              onReject={() => handleReject(s.id)}
              onOpen={() => {
                const property = PROPERTY_BY_ID[s.propertyId];
                if (property) onOpen(property.code);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion: s, onAccept, onReject, onOpen,
}: {
  suggestion: AiCardSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onOpen: () => void;
}) {
  const property = PROPERTY_BY_ID[s.propertyId];
  const confidenceColor = s.confidence >= 0.85 ? 'var(--color-text-success)' : s.confidence >= 0.7 ? 'var(--color-brand-accent)' : 'var(--color-text-warning)';

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <button
              onClick={onOpen}
              className="mono"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: 'var(--color-brand-accent)', textDecoration: 'underline' }}
            >
              {property?.code ?? s.propertyId}
            </button>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{property?.name}</span>
            <span className="chip sm">{PROPERTY_CARD_CATEGORY_LABEL[s.category]}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: confidenceColor, fontWeight: 500 }}>
              {Math.round(s.confidence * 100)}% confidence
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{s.proposedTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
            {s.proposedBody}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>
            Source: {s.sourceLabel}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary sm" onClick={onAccept}>Accept</button>
            <button className="btn ghost sm" onClick={onReject}>Reject</button>
            <button
              className="btn ghost sm"
              onClick={() => fireToast('Edit modal would open · Phase 2')}
            >
              Edit before adding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
