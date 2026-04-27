'use client';

import { useMemo, useState } from 'react';
import {
  RESERVATIONS,
  CHANNEL_LABEL,
  STATUS_LABEL,
  formatMoney,
  type Reservation,
  type ReservationChannel,
  type ReservationStatus,
} from '../../../_data/reservations';
import { FilterBar, FilterPill } from '../../FilterBar';
import { IconSearch } from '../../icons';

type SortKey = 'checkIn' | 'checkOut' | 'confirmationCode' | 'guestName' | 'totalAmount' | 'balanceDue';
type SortDir = 'asc' | 'desc';

interface Props {
  onOpen: (reservationId: string) => void;
}

const TODAY_ISO = '2026-04-27';

function statusToneClass(s: ReservationStatus): string {
  switch (s) {
    case 'checked_in':
    case 'confirmed':
      return 'info';
    case 'hold':
      return 'warn';
    case 'cancelled':
      return 'warn';
    case 'checked_out':
      return '';
    default:
      return '';
  }
}

function isInScope(r: Reservation): boolean {
  // Default scope per scoping pack §7: active + future 90 days + past 12 months. Older → archived.
  const today = new Date(TODAY_ISO);
  const checkIn = new Date(r.checkIn.slice(0, 10));
  const checkOut = new Date(r.checkOut.slice(0, 10));
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const ninetyDaysOut = new Date(today);
  ninetyDaysOut.setDate(today.getDate() + 90);
  return checkOut >= oneYearAgo && checkIn <= ninetyDaysOut;
}

export function AllReservationsPage({ onOpen }: Props) {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<ReservationChannel | 'all'>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [balanceDueOnly, setBalanceDueOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('checkIn');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const allInScope = useMemo(() => RESERVATIONS.filter(isInScope), []);
  const properties = useMemo(
    () => Array.from(new Set(allInScope.map((r) => r.propertyCode))).sort(),
    [allInScope],
  );
  const channels = useMemo(
    () => Array.from(new Set(allInScope.map((r) => r.channel))) as ReservationChannel[],
    [allInScope],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allInScope.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
      if (propertyFilter !== 'all' && r.propertyCode !== propertyFilter) return false;
      if (balanceDueOnly && r.balanceDue <= 0) return false;
      if (q) {
        const hay = `${r.guestName} ${r.confirmationCode} ${r.propertyCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allInScope, statusFilter, channelFilter, propertyFilter, search, balanceDueOnly]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortInd = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '');

  const filtersDirty = statusFilter !== 'all' || channelFilter !== 'all' || propertyFilter !== 'all' || balanceDueOnly || search.trim() !== '';
  const clearAll = () => {
    setStatusFilter('all');
    setChannelFilter('all');
    setPropertyFilter('all');
    setBalanceDueOnly(false);
    setSearch('');
  };

  return (
    <div className="fad-module-body" style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: 200,
            maxWidth: 360,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 6,
            background: 'var(--color-background-secondary)',
            fontSize: 13,
          }}
        >
          <IconSearch size={12} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guest, conf code, property…"
            style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontSize: 13 }}
          />
        </div>
        <button
          className={'btn sm' + (balanceDueOnly ? ' active' : '')}
          onClick={() => setBalanceDueOnly((v) => !v)}
          title="Show only reservations with outstanding balance"
        >
          Balance due
        </button>
      </div>

      <FilterBar
        count={`${sorted.length} of ${allInScope.length}`}
        onClear={filtersDirty ? clearAll : undefined}
      >
        <FilterPill
          label="Status"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as ReservationStatus | 'all')}
          options={[
            { value: 'all', label: 'All statuses' },
            ...(['confirmed', 'checked_in', 'checked_out', 'hold', 'cancelled'] as ReservationStatus[]).map((s) => ({
              value: s,
              label: STATUS_LABEL[s],
            })),
          ]}
        />
        <FilterPill
          label="Channel"
          value={channelFilter}
          onChange={(v) => setChannelFilter(v as ReservationChannel | 'all')}
          options={[
            { value: 'all', label: 'All channels' },
            ...channels.map((c) => ({ value: c, label: CHANNEL_LABEL[c] })),
          ]}
        />
        <FilterPill
          label="Property"
          value={propertyFilter}
          onChange={setPropertyFilter}
          options={[
            { value: 'all', label: 'All properties' },
            ...properties.map((p) => ({ value: p, label: p })),
          ]}
        />
      </FilterBar>

      <div className="card fad-rsv-table">
        <div className="fad-rsv-head">
          <button className="fad-rsv-th" onClick={() => toggleSort('checkIn')}>Check-in{sortInd('checkIn')}</button>
          <button className="fad-rsv-th" onClick={() => toggleSort('checkOut')}>Check-out{sortInd('checkOut')}</button>
          <button className="fad-rsv-th" onClick={() => toggleSort('confirmationCode')}>Conf{sortInd('confirmationCode')}</button>
          <span className="fad-rsv-th">Listing</span>
          <button className="fad-rsv-th" onClick={() => toggleSort('guestName')}>Guest{sortInd('guestName')}</button>
          <span className="fad-rsv-th">Channel</span>
          <span className="fad-rsv-th">Status</span>
          <button className="fad-rsv-th" style={{ textAlign: 'right' }} onClick={() => toggleSort('balanceDue')}>
            Balance{sortInd('balanceDue')}
          </button>
        </div>
        {sorted.map((r) => (
          <div key={r.id} className="fad-rsv-row" onClick={() => onOpen(r.id)}>
            <span className="fad-rsv-cell mono" data-mlabel="Check-in">{r.checkIn.slice(5, 10)}</span>
            <span className="fad-rsv-cell mono" data-mlabel="Check-out">{r.checkOut.slice(5, 10)}</span>
            <span className="fad-rsv-cell mono fad-rsv-conf" data-mlabel="Conf">{r.confirmationCode}</span>
            <span className="fad-rsv-cell mono" data-mlabel="Listing">{r.propertyCode}</span>
            <span className="fad-rsv-cell fad-rsv-guest" data-mlabel="Guest">{r.guestName}</span>
            <span className="fad-rsv-cell fad-rsv-muted" data-mlabel="Channel">{CHANNEL_LABEL[r.channel]}</span>
            <span className="fad-rsv-cell">
              <span className={'chip sm ' + statusToneClass(r.status)}>{STATUS_LABEL[r.status]}</span>
            </span>
            <span
              className="fad-rsv-cell mono fad-rsv-balance"
              data-mlabel="Balance"
              style={{
                color: r.balanceDue > 0 ? 'var(--color-text-warning)' : 'var(--color-text-tertiary)',
                fontWeight: r.balanceDue > 0 ? 500 : 400,
              }}
            >
              {r.balanceDue > 0 ? formatMoney(r.balanceDue, r.currency) : '—'}
            </span>
          </div>
        ))}
        {sorted.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
            No reservations match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
