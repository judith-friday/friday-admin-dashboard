'use client';

import { useState } from 'react';
import { RESERVATION_KPI, RESERVATIONS, type Reservation } from '../../_data/fixtures';
import { FilterBar, FilterPill } from '../FilterBar';
import { IconClose, IconDownload, IconPlus } from '../icons';
import { ModuleHeader } from '../ModuleHeader';

const STATUS_CHIP: Record<Reservation['status'], string> = {
  confirmed: 'info',
  'checked-in': 'info',
  hold: 'warn',
  'checked-out': '',
  cancelled: 'warn',
};

const PAYOUT_CHIP: Record<Reservation['payoutStatus'], string> = {
  captured: 'info',
  pending: 'warn',
  settled: '',
  refunded: 'warn',
};

export function ReservationsModule() {
  const [tab, setTab] = useState<Reservation['status'] | 'all' | 'upcoming'>('upcoming');
  const [channel, setChannel] = useState<string>('all');
  const [propFilter, setPropFilter] = useState<string>('all');
  const [sel, setSel] = useState<string | null>(null);

  const upcoming = RESERVATIONS.filter(
    (r) => r.status === 'confirmed' || r.status === 'hold' || r.status === 'checked-in'
  );
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'checked-in', label: 'In-house', count: RESERVATIONS.filter((r) => r.status === 'checked-in').length },
    { id: 'checked-out', label: 'Past', count: RESERVATIONS.filter((r) => r.status === 'checked-out').length },
    { id: 'hold', label: 'Holds', count: RESERVATIONS.filter((r) => r.status === 'hold').length },
    { id: 'all', label: 'All' },
  ];

  const props = Array.from(new Set(RESERVATIONS.map((r) => r.property))).sort();
  const channels = Array.from(new Set(RESERVATIONS.map((r) => r.channel)));

  const filtered = RESERVATIONS.filter((r) => {
    if (tab === 'upcoming' && !upcoming.includes(r)) return false;
    if (tab !== 'upcoming' && tab !== 'all' && r.status !== tab) return false;
    if (channel !== 'all' && r.channel !== channel) return false;
    if (propFilter !== 'all' && r.property !== propFilter) return false;
    return true;
  });

  const selected = sel ? RESERVATIONS.find((r) => r.id === sel) : null;

  return (
    <>
      <ModuleHeader
        title="Reservations"
        subtitle="Single source of truth — past, in-house, upcoming across all channels"
        tabs={tabs.map((t) => ({ id: t.id as string, label: t.label, count: t.count }))}
        activeTab={tab}
        onTabChange={(id) => setTab(id as typeof tab)}
        actions={
          <>
            <button className="btn sm">
              <IconDownload size={12} /> Export CSV
            </button>
            <button className="btn primary sm">
              <IconPlus size={12} /> New reservation
            </button>
          </>
        }
      />
      <div className="fad-module-body">
        <div className="kpi-grid">
          {RESERVATION_KPI.map((k, i) => (
            <div className="kpi" key={i}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        <FilterBar
          count={`${filtered.length} reservations`}
          onClear={
            propFilter !== 'all' || channel !== 'all'
              ? () => {
                  setPropFilter('all');
                  setChannel('all');
                }
              : undefined
          }
        >
          <FilterPill
            label="Property"
            value={propFilter}
            onChange={setPropFilter}
            options={[
              { value: 'all', label: 'All properties' },
              ...props.map((p) => ({ value: p, label: p })),
            ]}
          />
          <FilterPill
            label="Channel"
            value={channel}
            onChange={setChannel}
            options={[
              { value: 'all', label: 'All channels' },
              ...channels.map((c) => ({ value: c, label: c })),
            ]}
          />
        </FilterBar>

        <div className="card">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '0.7fr 1.6fr 1.4fr 1.2fr 0.6fr 0.9fr 0.9fr 0.8fr',
              gap: 12,
              padding: '10px 16px',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-text-tertiary)',
            }}
          >
            <span>ID</span>
            <span>Guest</span>
            <span>Property</span>
            <span>Stay</span>
            <span>Ch.</span>
            <span>Total</span>
            <span>Payout</span>
            <span>Status</span>
          </div>
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSel(r.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '0.7fr 1.6fr 1.4fr 1.2fr 0.6fr 0.9fr 0.9fr 0.8fr',
                gap: 12,
                padding: '12px 16px',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                alignItems: 'center',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                {r.id}
              </span>
              <div>
                <div style={{ fontWeight: 500 }}>{r.guest}</div>
                <div className="row-meta">
                  {r.adults}A{r.children ? ' + ' + r.children + 'C' : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13 }}>{r.property}</div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}
                >
                  {r.propCode}
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 12 }}>
                  {r.checkIn} → {r.checkOut}
                </div>
                <div className="row-meta">{r.nights} nts</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{r.channel}</span>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>
                € {r.total.toLocaleString()}
              </span>
              <span className={'chip ' + PAYOUT_CHIP[r.payoutStatus]}>{r.payoutStatus}</span>
              <span className={'chip ' + STATUS_CHIP[r.status]}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
      {selected && <ReservationDetail r={selected} onClose={() => setSel(null)} />}
    </>
  );
}

function ReservationDetail({ r, onClose }: { r: Reservation; onClose: () => void }) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: '48px 0 0 0',
          background: 'rgba(15, 24, 54, 0.12)',
          zIndex: 44,
        }}
        onClick={onClose}
      />
      <aside className="task-detail-pane open" style={{ width: 540 }}>
        <div className="task-detail-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}
              >
                {r.id}
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{r.guest}</div>
              <div className="row-meta">
                <span>{r.property}</span>
                <span className="sep">·</span>
                <span>{r.channel}</span>
              </div>
            </div>
            <button className="fad-util-btn" onClick={onClose} title="Close">
              <IconClose size={14} />
            </button>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <span className={'chip ' + STATUS_CHIP[r.status]}>{r.status}</span>
            <span className={'chip ' + PAYOUT_CHIP[r.payoutStatus]}>
              payout · {r.payoutStatus}
            </span>
          </div>
        </div>
        <div className="task-detail-body">
          <div className="task-detail-section">
            <h5>Stay</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Check-in</div>
                <div className="mono">{r.checkIn}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Check-out</div>
                <div className="mono">{r.checkOut}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Nights</div>
                <div className="mono">{r.nights}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>Guests</div>
                <div className="mono">
                  {r.adults}A{r.children ? ' + ' + r.children + 'C' : ''}
                </div>
              </div>
            </div>
          </div>
          <div className="task-detail-section">
            <h5>Financials</h5>
            <div className="row" style={{ padding: '6px 0', border: 0 }}>
              <span style={{ flex: 1 }}>Stay total</span>
              <span className="mono">€ {r.total.toLocaleString()}</span>
            </div>
            <div className="row" style={{ padding: '6px 0', border: 0 }}>
              <span style={{ flex: 1 }}>Tourist tax</span>
              <span className="mono" style={{ color: 'var(--color-text-tertiary)' }}>
                € {r.touristTax}
              </span>
            </div>
            <div className="row" style={{ padding: '6px 0', border: 0 }}>
              <span style={{ flex: 1 }}>Channel fee (est.)</span>
              <span className="mono" style={{ color: 'var(--color-text-tertiary)' }}>
                − € {Math.round(r.total * (r.channel === 'Direct' ? 0.03 : r.channel === 'Email' ? 0 : 0.15))}
              </span>
            </div>
            <div
              className="row"
              style={{
                padding: '8px 0 0',
                borderTop: '0.5px solid var(--color-border-tertiary)',
                marginTop: 6,
              }}
            >
              <span style={{ flex: 1, fontWeight: 500 }}>Net to owner (est.)</span>
              <span className="mono" style={{ fontWeight: 500 }}>
                €{' '}
                {Math.round(
                  r.total - r.total * (r.channel === 'Direct' ? 0.03 : r.channel === 'Email' ? 0 : 0.15)
                ).toLocaleString()}
              </span>
            </div>
          </div>
          {r.notes && (
            <div className="task-detail-section">
              <h5>Notes</h5>
              <div style={{ fontSize: 13, lineHeight: 1.55 }}>{r.notes}</div>
            </div>
          )}
          <div className="task-detail-section">
            <h5>Related</h5>
            <div className="row" style={{ padding: '8px 0', border: 0 }}>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--color-text-tertiary)', width: 90 }}
              >
                Inbox thread
              </span>
              <span style={{ fontSize: 13 }}>
                {r.guest} · {r.channel}
              </span>
            </div>
            <div className="row" style={{ padding: '8px 0', border: 0 }}>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--color-text-tertiary)', width: 90 }}
              >
                Calendar
              </span>
              <span style={{ fontSize: 13 }}>
                Check-in {r.checkIn} · Check-out {r.checkOut}
              </span>
            </div>
            <div className="row" style={{ padding: '8px 0', border: 0 }}>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--color-text-tertiary)', width: 90 }}
              >
                Property
              </span>
              <span style={{ fontSize: 13 }}>{r.property}</span>
            </div>
          </div>
          <div className="task-detail-section">
            <h5>Actions</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button className="btn sm">Message guest</button>
              <button className="btn sm">Edit dates</button>
              <button className="btn sm">Issue refund</button>
              <button className="btn ghost sm">Cancel reservation</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
