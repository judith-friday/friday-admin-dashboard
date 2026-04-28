'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { useCurrentRole, useCurrentUserId } from '../usePermissions';
import {
  allNotifications,
  markAllRead,
  markRead,
  markUnread,
  isRead,
  subscribeNotifications,
  type Notification,
  type Severity,
  type ModuleId,
} from '../../_data/notifications';

type ReadFilter = 'all' | 'unread' | 'read';
type SortMode = 'ai' | 'recent';

const MODULE_LABELS: Record<ModuleId, string> = {
  inbox: 'Inbox',
  operations: 'Operations',
  calendar: 'Calendar',
  reservations: 'Reservations',
  properties: 'Properties',
  reviews: 'Reviews',
  finance: 'Finance',
  hr: 'HR',
  friday: 'Friday AI',
};

const SEVERITY_LABEL: Record<Severity, string> = { info: 'Info', warn: 'Warning', urgent: 'Urgent' };
const SEVERITY_EMOJI: Record<Severity, string> = { info: '⚪', warn: '🟡', urgent: '🔴' };

export function NotificationsModule() {
  const role = useCurrentRole();
  const userId = useCurrentUserId();

  const [, setRev] = useState(0);
  useEffect(() => subscribeNotifications(setRev), []);

  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [moduleFilter, setModuleFilter] = useState<Set<ModuleId>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Set<Severity>>(new Set());
  const [mentionsOnly, setMentionsOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('ai');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = allNotifications(role, userId);

  const filtered = useMemo(() => {
    let out = all.slice();
    if (readFilter === 'unread') out = out.filter((n) => !isRead(n.id));
    else if (readFilter === 'read') out = out.filter((n) => isRead(n.id));
    if (moduleFilter.size > 0) out = out.filter((n) => moduleFilter.has(n.module));
    if (severityFilter.size > 0) out = out.filter((n) => severityFilter.has(n.severity));
    if (mentionsOnly) out = out.filter((n) => n.isMention);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    }
    if (sortMode === 'ai') {
      out.sort((a, b) => (b.aiPriority ?? 0) - (a.aiPriority ?? 0));
    } else {
      out.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    }
    return out;
  }, [all, readFilter, moduleFilter, severityFilter, mentionsOnly, search, sortMode]);

  const selected = selectedId ? filtered.find((n) => n.id === selectedId) ?? all.find((n) => n.id === selectedId) : null;

  // Auto-mark-read when a notification is selected
  useEffect(() => {
    if (selected && !isRead(selected.id)) {
      markRead(selected.id);
    }
  }, [selected?.id]);

  const counts = {
    all: all.length,
    unread: all.filter((n) => !isRead(n.id)).length,
    mentions: all.filter((n) => n.isMention).length,
    urgent: all.filter((n) => n.severity === 'urgent' && !isRead(n.id)).length,
  };

  const moduleCounts = useMemo(() => {
    const m: Partial<Record<ModuleId, number>> = {};
    all.forEach((n) => { m[n.module] = (m[n.module] ?? 0) + 1; });
    return m;
  }, [all]);

  const toggleModule = (mod: ModuleId) => {
    setModuleFilter((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod); else next.add(mod);
      return next;
    });
  };

  const toggleSeverity = (sev: Severity) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev); else next.add(sev);
      return next;
    });
  };

  const handleMarkAllRead = () => markAllRead(filtered);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <ModuleHeader
        title="Notifications"
        subtitle={`${counts.unread} unread${counts.urgent > 0 ? ` · ${counts.urgent} urgent` : ''} · ${counts.all} total`}
        actions={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn ghost sm"
              onClick={() => setSortMode(sortMode === 'ai' ? 'recent' : 'ai')}
              title="Toggle ranking"
            >
              {sortMode === 'ai' ? '✨ AI priority' : 'Chronological'}
            </button>
            <button className="btn ghost sm" onClick={handleMarkAllRead}>Mark all read</button>
          </div>
        }
      />

      <div className="notif-page" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Filter sidebar */}
        <aside className="notif-filters">
          <div className="notif-filter-section">
            <h4>Read state</h4>
            <FilterRow label="All" count={counts.all} active={readFilter === 'all'} onClick={() => setReadFilter('all')} />
            <FilterRow label="Unread" count={counts.unread} active={readFilter === 'unread'} onClick={() => setReadFilter('unread')} />
            <FilterRow label="Read" count={counts.all - counts.unread} active={readFilter === 'read'} onClick={() => setReadFilter('read')} />
          </div>

          <div className="notif-filter-section">
            <h4>Mentions</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={mentionsOnly} onChange={() => setMentionsOnly(!mentionsOnly)} />
              <span>Only @mentions ({counts.mentions})</span>
            </label>
          </div>

          <div className="notif-filter-section">
            <h4>Severity</h4>
            {(['urgent', 'warn', 'info'] as Severity[]).map((sev) => (
              <FilterRow
                key={sev}
                label={`${SEVERITY_EMOJI[sev]} ${SEVERITY_LABEL[sev]}`}
                count={all.filter((n) => n.severity === sev).length}
                active={severityFilter.has(sev)}
                onClick={() => toggleSeverity(sev)}
              />
            ))}
          </div>

          <div className="notif-filter-section">
            <h4>Module</h4>
            {(Object.keys(MODULE_LABELS) as ModuleId[]).map((mod) => {
              const c = moduleCounts[mod] ?? 0;
              if (c === 0) return null;
              return (
                <FilterRow
                  key={mod}
                  label={MODULE_LABELS[mod]}
                  count={c}
                  active={moduleFilter.has(mod)}
                  onClick={() => toggleModule(mod)}
                />
              );
            })}
          </div>

          {(moduleFilter.size > 0 || severityFilter.size > 0 || mentionsOnly || readFilter !== 'all' || search) && (
            <button
              className="btn ghost sm"
              style={{ marginTop: 12, width: '100%' }}
              onClick={() => {
                setModuleFilter(new Set());
                setSeverityFilter(new Set());
                setMentionsOnly(false);
                setReadFilter('all');
                setSearch('');
              }}
            >
              Clear all filters
            </button>
          )}
        </aside>

        {/* List */}
        <div className="notif-list-pane">
          <div className="notif-search-bar">
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="fad-input"
            />
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </span>
          </div>
          <div className="notif-list-rows">
            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                No notifications match the current filters.
              </div>
            ) : (
              filtered.map((n) => (
                <ListRow
                  key={n.id}
                  notif={n}
                  selected={selectedId === n.id}
                  showAi={sortMode === 'ai'}
                  onSelect={() => setSelectedId(n.id)}
                  onToggleRead={() => {
                    if (isRead(n.id)) markUnread(n.id); else markRead(n.id);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <aside className="notif-detail">
          {selected ? (
            <DetailPane notification={selected} onMarkUnread={() => markUnread(selected.id)} />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              Select a notification to view detail.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function FilterRow({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={'notif-filter-row' + (active ? ' active' : '')}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{count}</span>
    </button>
  );
}

function ListRow({ notif, selected, showAi, onSelect, onToggleRead }: {
  notif: Notification;
  selected: boolean;
  showAi: boolean;
  onSelect: () => void;
  onToggleRead: () => void;
}) {
  const read = isRead(notif.id);
  return (
    <button
      onClick={onSelect}
      className={'notif-list-row' + (read ? ' read' : '') + (selected ? ' selected' : '')}
      title={showAi && notif.aiReason ? `Ranked: ${notif.aiReason}` : notif.title}
    >
      <span className={'notif-row-dot ' + notif.severity} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {notif.isMention && <span className="fad-notif-mention">@</span>}
          {showAi && notif.aiPriority && notif.aiPriority > 0.7 && (
            <span style={{ fontSize: 10, color: 'var(--color-brand-accent)' }}>✨</span>
          )}
          <span style={{ fontWeight: read ? 400 : 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {notif.title}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {notif.body}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {MODULE_LABELS[notif.module]} · {notif.ts.slice(5, 16).replace('T', ' ')}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleRead(); }}
        className="fad-notif-toggle"
        title={read ? 'Mark unread' : 'Mark read'}
      >
        {read ? '○' : '●'}
      </button>
    </button>
  );
}

function DetailPane({ notification, onMarkUnread }: { notification: Notification; onMarkUnread: () => void }) {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="chip sm">{MODULE_LABELS[notification.module]}</span>
        <span className={`chip sm ${notification.severity === 'urgent' ? 'warn' : notification.severity === 'warn' ? 'warn' : ''}`}>
          {SEVERITY_EMOJI[notification.severity]} {SEVERITY_LABEL[notification.severity]}
        </span>
        {notification.isMention && <span className="chip sm info">@mention</span>}
        {notification.aiPriority !== undefined && notification.aiPriority > 0.7 && (
          <span className="chip sm" title={notification.aiReason}>✨ AI-prioritized</span>
        )}
      </div>

      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 500 }}>{notification.title}</h2>
        <div className="mono" style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {notification.ts.replace('T', ' ').slice(0, 19)}
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
        {notification.body}
      </div>

      {notification.aiReason && (
        <div style={{
          padding: 10, borderRadius: 'var(--radius-sm)',
          background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          fontSize: 11, color: 'var(--color-text-tertiary)',
        }}>
          <strong>AI ranking:</strong> {notification.aiReason}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
        {notification.href && (
          <button
            className="btn primary sm"
            onClick={() => { if (notification.href) window.location.href = notification.href; }}
          >
            Open in {MODULE_LABELS[notification.module]} →
          </button>
        )}
        <button className="btn ghost sm" onClick={onMarkUnread}>
          Mark unread
        </button>
      </div>
    </div>
  );
}
