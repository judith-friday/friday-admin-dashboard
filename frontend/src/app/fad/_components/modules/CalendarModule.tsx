'use client';

import { Fragment, useState } from 'react';
import { CAL_DAYS, CAL_EVENTS, type CalEvent } from '../../_data/fixtures';
import { FilterBar, FilterChip } from '../FilterBar';
import { IconClose, IconPlus, IconRefresh } from '../icons';
import { ModuleHeader } from '../ModuleHeader';

const EVENT_TYPES: { id: CalEvent['type']; label: string; dot: string }[] = [
  { id: 'checkin', label: 'Check-in', dot: 'green' },
  { id: 'checkout', label: 'Check-out', dot: 'accent' },
  { id: 'maint', label: 'Maintenance', dot: 'amber' },
  { id: 'meeting', label: 'Meeting', dot: 'neutral' },
];

export function CalendarModule() {
  const [tab, setTab] = useState<'day' | 'week' | 'month'>('week');
  const [typeFilter, setTypeFilter] = useState<Set<CalEvent['type']>>(
    new Set(EVENT_TYPES.map((t) => t.id))
  );
  const [selectedEvent, setSelectedEvent] = useState<{ ev: CalEvent; x: number; y: number } | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const tabs = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];

  const visibleEvents = CAL_EVENTS.filter((e) => typeFilter.has(e.type));

  const toggleType = (t: CalEvent['type']) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  return (
    <>
      <ModuleHeader
        title="Calendar"
        subtitle="Check-ins, check-outs, maintenance and meetings · Apr 14 – 20"
        tabs={tabs}
        activeTab={tab}
        onTabChange={(id) => setTab(id as typeof tab)}
        actions={
          <>
            <button className="btn sm">
              <IconRefresh size={12} /> Sync
            </button>
            <button className="btn primary sm" onClick={() => setCreateOpen(true)}>
              <IconPlus size={12} /> Event
            </button>
          </>
        }
      />
      <div className="fad-module-body">
        <FilterBar>
          {EVENT_TYPES.map((t) => (
            <FilterChip
              key={t.id}
              active={typeFilter.has(t.id)}
              dot={t.dot}
              onClick={() => toggleType(t.id)}
            >
              {t.label}
            </FilterChip>
          ))}
        </FilterBar>

        {tab === 'month' ? (
          <MonthView events={visibleEvents} onEventClick={(ev, x, y) => setSelectedEvent({ ev, x, y })} />
        ) : tab === 'day' ? (
          <DayView events={visibleEvents} onEventClick={(ev, x, y) => setSelectedEvent({ ev, x, y })} />
        ) : (
          <WeekView events={visibleEvents} onEventClick={(ev, x, y) => setSelectedEvent({ ev, x, y })} />
        )}

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 16,
            fontSize: 12,
            color: 'var(--color-text-tertiary)',
            flexWrap: 'wrap',
          }}
        >
          {EVENT_TYPES.map((t) => (
            <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={'dot ' + t.dot} />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <EventPopover
          ev={selectedEvent.ev}
          x={selectedEvent.x}
          y={selectedEvent.y}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      {createOpen && <NewEventModal onClose={() => setCreateOpen(false)} />}
    </>
  );
}

function WeekView({
  events,
  onEventClick,
}: {
  events: CalEvent[];
  onEventClick: (ev: CalEvent, x: number, y: number) => void;
}) {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  return (
    <div className="cal-wrap">
      <div className="cal-head">
        <div className="cal-head-cell">
          <span style={{ fontSize: 10 }}>Apr</span>
        </div>
        {CAL_DAYS.map((d) => (
          <div key={d.date} className={'cal-head-cell' + (d.today ? ' today' : '')}>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{d.label}</span>
            <span className="day">{d.date}</span>
          </div>
        ))}
      </div>
      <div className="cal-grid">
        {hours.map((h) => (
          <Fragment key={h}>
            <div className="cal-hour-label">{String(h).padStart(2, '0')}:00</div>
            {CAL_DAYS.map((d, di) => {
              const evs = events.filter((e) => e.day === di && e.start === h);
              return (
                <div key={di} className="cal-cell">
                  {evs.map((e, i) => {
                    const span = e.end - e.start;
                    return (
                      <div
                        key={i}
                        className={'cal-event ' + e.type}
                        style={{ top: 2, height: `calc(${span * 52}px - 4px)` }}
                        onClick={(evt) => {
                          evt.stopPropagation();
                          const rect = (evt.target as HTMLElement).getBoundingClientRect();
                          onEventClick(e, rect.right + 8, rect.top);
                        }}
                      >
                        <span className="ev-time mono">
                          {String(e.start).padStart(2, '0')}:00
                        </span>
                        {e.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function DayView({
  events,
  onEventClick,
}: {
  events: CalEvent[];
  onEventClick: (ev: CalEvent, x: number, y: number) => void;
}) {
  const hours = Array.from({ length: 14 }, (_, i) => 7 + i);
  const today = CAL_DAYS.findIndex((d) => d.today);
  const evs = events.filter((e) => e.day === today);
  return (
    <div className="cal-wrap">
      <div className="cal-head" style={{ gridTemplateColumns: '64px 1fr' }}>
        <div className="cal-head-cell">
          <span style={{ fontSize: 10 }}>Apr</span>
        </div>
        <div className="cal-head-cell today">
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            {CAL_DAYS[today].label}
          </span>
          <span className="day">{CAL_DAYS[today].date}</span>
        </div>
      </div>
      <div className="cal-grid" style={{ gridTemplateColumns: '64px 1fr' }}>
        {hours.map((h) => {
          const cellEvs = evs.filter((e) => e.start === h);
          return (
            <Fragment key={h}>
              <div className="cal-hour-label">{String(h).padStart(2, '0')}:00</div>
              <div className="cal-cell" style={{ height: 52 }}>
                {cellEvs.map((e, i) => {
                  const span = e.end - e.start;
                  return (
                    <div
                      key={i}
                      className={'cal-event ' + e.type}
                      style={{ top: 2, height: `calc(${span * 52}px - 4px)` }}
                      onClick={(evt) => {
                        evt.stopPropagation();
                        const rect = (evt.target as HTMLElement).getBoundingClientRect();
                        onEventClick(e, rect.right + 8, rect.top);
                      }}
                    >
                      <span className="ev-time mono">
                        {String(e.start).padStart(2, '0')}:00
                      </span>
                      {e.title}
                    </div>
                  );
                })}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  events,
  onEventClick,
}: {
  events: CalEvent[];
  onEventClick: (ev: CalEvent, x: number, y: number) => void;
}) {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Fake 30-day month: 4 rows × 7 days, with Apr 14-20 events from fixtures mapped to row 3
  const weeks = 5;
  const monthStart = -2; // offset so day 1 starts in week 0 at position 3 (Thu Apr 1)
  const todayNum = 17;
  return (
    <div className="cal-month">
      <div className="cal-month-head">
        {dayNames.map((d) => (
          <div key={d} className="cal-month-head-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="cal-month-grid">
        {Array.from({ length: weeks * 7 }, (_, idx) => {
          const dayNum = idx + monthStart + 1;
          const inMonth = dayNum >= 1 && dayNum <= 30;
          const weekOfApr14 = dayNum >= 14 && dayNum <= 20;
          const fixtureDay = weekOfApr14 ? dayNum - 14 : -1;
          const evs = weekOfApr14 ? events.filter((e) => e.day === fixtureDay) : [];
          return (
            <div
              key={idx}
              className={
                'cal-month-cell' +
                (!inMonth ? ' other' : '') +
                (dayNum === todayNum ? ' today' : '')
              }
            >
              <div className="cal-month-day">{inMonth ? dayNum : ''}</div>
              {evs.slice(0, 3).map((e, i) => (
                <div
                  key={i}
                  className={'cal-month-ev ' + e.type}
                  onClick={(evt) => {
                    evt.stopPropagation();
                    const rect = (evt.target as HTMLElement).getBoundingClientRect();
                    onEventClick(e, rect.right + 8, rect.top);
                  }}
                >
                  {e.title}
                </div>
              ))}
              {evs.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                  +{evs.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventPopover({
  ev,
  x,
  y,
  onClose,
}: {
  ev: CalEvent;
  x: number;
  y: number;
  onClose: () => void;
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={onClose} />
      <div
        className="cal-popover"
        style={{ top: y, left: Math.min(x, window.innerWidth - 280) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span className={'chip ' + (ev.type === 'maint' ? 'warn' : ev.type === 'checkin' || ev.type === 'checkout' ? 'info' : '')}>
            {ev.type}
          </span>
          <button className="fad-util-btn" onClick={onClose} style={{ marginLeft: 'auto', width: 22, height: 22 }}>
            <IconClose size={12} />
          </button>
        </div>
        <div className="cal-popover-title">{ev.title}</div>
        <div className="cal-popover-meta">
          {CAL_DAYS[ev.day].label} {CAL_DAYS[ev.day].date} · {String(ev.start).padStart(2, '0')}:00
          –{String(ev.end).padStart(2, '0')}:00
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn sm">Open reservation</button>
          <button className="btn ghost sm">Edit</button>
        </div>
      </div>
    </>
  );
}

function NewEventModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fad-modal-overlay" onClick={onClose}>
      <div className="fad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fad-modal-head">
          <div className="fad-modal-title">New event</div>
          <button className="fad-util-btn" style={{ marginLeft: 'auto' }} onClick={onClose}>
            <IconClose />
          </button>
        </div>
        <div className="fad-modal-body">
          <div className="fad-field">
            <label>Title</label>
            <input placeholder="e.g. Owner call · Nitzana" defaultValue="" />
          </div>
          <div className="fad-field">
            <label>Type</label>
            <select defaultValue="meeting">
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="fad-field">
              <label>Day</label>
              <select>
                {CAL_DAYS.map((d) => (
                  <option key={d.date}>
                    {d.label} {d.date}
                  </option>
                ))}
              </select>
            </div>
            <div className="fad-field">
              <label>Start</label>
              <select>
                {Array.from({ length: 14 }, (_, i) => 7 + i).map((h) => (
                  <option key={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>
          <div className="fad-field">
            <label>Property (optional)</label>
            <input placeholder="—" />
          </div>
          <div className="fad-field">
            <label>Notes</label>
            <textarea rows={3} placeholder="What's this about?" />
          </div>
        </div>
        <div className="fad-modal-foot">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={onClose}>
            Create event
          </button>
        </div>
      </div>
    </div>
  );
}
