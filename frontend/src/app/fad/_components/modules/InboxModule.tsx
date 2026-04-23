'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  INBOX_CHANNEL_TREE,
  INBOX_THREADS,
  type InboxChannel,
  type InboxEntity,
} from '../../_data/fixtures';
import { FridayConsult } from '../FridayConsult';
import {
  IconAI,
  IconBell,
  IconCheck,
  IconChevron,
  IconClock,
  IconFilter,
  IconGlobe,
  IconInbox,
  IconMail,
  IconPaperclip,
  IconPin,
  IconPlus,
  IconSend,
  IconSparkle,
  IconUsers,
} from '../icons';
import { ModuleHeader } from '../ModuleHeader';

interface Props {
  onAskFriday: () => void;
}

export function InboxModule({ onAskFriday }: Props) {
  const [tab, setTab] = useState('all');
  const [entityFilter, setEntityFilter] = useState<'all' | InboxEntity>('all');
  const [channelFilter, setChannelFilter] = useState<InboxChannel | null>(null);
  const [selected, setSelected] = useState('t1');
  const [consultOpen, setConsultOpen] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [treeCollapsed, setTreeCollapsed] = useState(false);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [aiToolbarExpanded, setAiToolbarExpanded] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [composeCollapsed, setComposeCollapsed] = useState(false);

  useEffect(() => {
    setTreeCollapsed(localStorage.getItem('fad:inbox:tree') === '1');
    setListCollapsed(localStorage.getItem('fad:inbox:list') === '1');
    setRightCollapsed(localStorage.getItem('fad:inbox:right') === '1');
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    // On mobile, default collapse chatter-heavy panels
    if (mobile) {
      setSummaryCollapsed(true);
      setComposeCollapsed(true);
    }
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    setHydrated(true);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('fad:inbox:tree', treeCollapsed ? '1' : '0');
  }, [treeCollapsed, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem('fad:inbox:list', listCollapsed ? '1' : '0');
  }, [listCollapsed, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem('fad:inbox:right', rightCollapsed ? '1' : '0');
  }, [rightCollapsed, hydrated]);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [summaryOn, setSummaryOn] = useState(true);
  const [translateOn, setTranslateOn] = useState(false);

  const counts = useMemo(() => {
    const byEntity: Record<string, number> = { guest: 0, owner: 0, vendor: 0, all: INBOX_THREADS.length };
    const byChannel: Partial<Record<InboxChannel, number>> = {};
    for (const t of INBOX_THREADS) {
      byEntity[t.entity] = (byEntity[t.entity] || 0) + 1;
      byChannel[t.channelKey] = (byChannel[t.channelKey] || 0) + 1;
    }
    return { byEntity, byChannel };
  }, []);

  const filtered = INBOX_THREADS.filter((t) => {
    if (entityFilter !== 'all' && t.entity !== entityFilter) return false;
    if (channelFilter && t.channelKey !== channelFilter) return false;
    if (tab === 'unread' && !t.unread) return false;
    return true;
  });

  const thread = filtered.find((t) => t.id === selected) || filtered[0] || INBOX_THREADS[0];
  const unread = INBOX_THREADS.filter((t) => t.unread).length;

  const tabs = [
    { id: 'all', label: 'All', count: filtered.length },
    { id: 'unread', label: 'Unread', count: INBOX_THREADS.filter((t) => t.unread).length },
    { id: 'review', label: 'Review', count: 2 },
    { id: 'open', label: 'Open', count: 3 },
    { id: 'done', label: 'Done' },
  ];

  const actions = (
    <>
      <button className="btn ghost sm">
        <IconFilter size={14} />
      </button>
      <button className="btn primary sm">
        <IconPlus size={12} /> Compose
      </button>
    </>
  );

  return (
    <div
      className={isMobile && mobileThreadOpen ? 'inbox-thread-open-mobile' : ''}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
    >
      <ModuleHeader
        title="Inbox"
        subtitle="Guest · owner · vendor threads across Airbnb, Booking, WhatsApp, Email"
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        actions={actions}
      />
      <div className="inbox-chips-row">
        {(
          [
            { key: 'all' as const, label: 'All', count: counts.byEntity.all },
            { key: 'guest' as const, label: 'Guest', count: counts.byEntity.guest },
            { key: 'owner' as const, label: 'Owner', count: counts.byEntity.owner },
            { key: 'vendor' as const, label: 'Vendor', count: counts.byEntity.vendor },
          ] as { key: 'all' | InboxEntity; label: string; count: number }[]
        ).map((c) => (
          <button
            key={c.key}
            className={'inbox-chip' + (entityFilter === c.key ? ' active' : '')}
            onClick={() => {
              setEntityFilter(c.key);
              setChannelFilter(null);
            }}
          >
            {c.label}{' '}
            <span
              className="mono"
              style={{ fontSize: 10, marginLeft: 4, opacity: 0.8 }}
            >
              {c.count}
            </span>
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {unread} unread across all channels
        </span>
      </div>
      <div
        className={'inbox-split' + (mobileThreadOpen ? ' thread-open' : '')}
        style={{ flex: 1 }}
      >
        <aside className={'inbox-tree' + (treeCollapsed ? ' collapsed' : '')}>
          <button
            className="inbox-collapse-btn"
            onClick={() => setTreeCollapsed((v) => !v)}
            title={treeCollapsed ? 'Show channels' : 'Collapse channels'}
          >
            <IconChevron size={12} />
          </button>
          {treeCollapsed && (
            <div className="inbox-tree-rail">
              <IconFilter size={14} />
              <span>Channels</span>
            </div>
          )}
          <div className="inbox-tree-group">
            <button
              className={'inbox-tree-item all' + (entityFilter === 'all' && !channelFilter ? ' active' : '')}
              onClick={() => {
                setEntityFilter('all');
                setChannelFilter(null);
              }}
            >
              <span>All inbox</span>
              <span className="count">{counts.byEntity.all}</span>
            </button>
          </div>
          <TreeGroup
            label="Guest"
            entity="guest"
            entityFilter={entityFilter}
            channelFilter={channelFilter}
            onEntity={(e) => {
              setEntityFilter(e);
              setChannelFilter(null);
            }}
            onChannel={(c) => {
              setChannelFilter(c);
              setEntityFilter('guest');
            }}
            count={counts.byEntity.guest}
            channels={INBOX_CHANNEL_TREE.guest}
            channelCounts={counts.byChannel}
          />
          <TreeGroup
            label="Owner"
            entity="owner"
            entityFilter={entityFilter}
            channelFilter={channelFilter}
            onEntity={(e) => {
              setEntityFilter(e);
              setChannelFilter(null);
            }}
            onChannel={(c) => {
              setChannelFilter(c);
              setEntityFilter('owner');
            }}
            count={counts.byEntity.owner}
            channels={INBOX_CHANNEL_TREE.owner}
            channelCounts={counts.byChannel}
          />
          <TreeGroup
            label="Vendor"
            entity="vendor"
            entityFilter={entityFilter}
            channelFilter={channelFilter}
            onEntity={(e) => {
              setEntityFilter(e);
              setChannelFilter(null);
            }}
            onChannel={(c) => {
              setChannelFilter(c);
              setEntityFilter('vendor');
            }}
            count={counts.byEntity.vendor}
            channels={INBOX_CHANNEL_TREE.vendor}
            channelCounts={counts.byChannel}
          />
        </aside>
        <div className={'inbox-list' + (listCollapsed ? ' collapsed' : '')}>
          <button
            className="inbox-collapse-btn"
            onClick={() => setListCollapsed((v) => !v)}
            title={listCollapsed ? 'Show threads' : 'Collapse threads'}
          >
            <IconChevron size={12} />
          </button>
          {listCollapsed && (
            <div className="inbox-list-rail">
              <IconInbox size={14} />
              <span>Threads · {filtered.length}</span>
            </div>
          )}
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--color-text-tertiary)',
              }}
            >
              No threads match this filter.
            </div>
          )}
          {filtered.map((t) => (
            <div
              key={t.id}
              className={
                'row' + (t.unread ? ' unread' : '') + (t.id === selected ? ' selected' : '')
              }
              onClick={() => {
                setSelected(t.id);
                setMobileThreadOpen(true);
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '10px 1fr auto',
                gap: 10,
                alignItems: 'start',
                padding: '12px 16px',
              }}
            >
              <span
                className={
                  'dot ' +
                  (t.sentiment === 'urgent'
                    ? 'red'
                    : t.urgent || (t.unread ? 'accent' : 'neutral'))
                }
                style={{ marginTop: 6 }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  className="row-primary"
                  style={{
                    marginBottom: 2,
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    {t.guest}
                  </span>
                  {t.entity !== 'guest' && (
                    <span
                      style={{
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--color-text-tertiary)',
                        padding: '1px 5px',
                        background: 'var(--color-background-secondary)',
                        borderRadius: 4,
                        flexShrink: 0,
                      }}
                    >
                      {t.entity}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    fontWeight: t.unread ? 500 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {t.subject}
                </div>
                <div className="row-meta" style={{ marginTop: 3 }}>
                  <span>{t.channel}</span>
                  <span className="sep">·</span>
                  <span>{t.property}</span>
                </div>
              </div>
              <span className="row-time">{t.time}</span>
            </div>
          ))}
        </div>

        <div className="inbox-thread">
          <div className="inbox-thread-header">
            <button
              className="btn ghost sm inbox-mobile-back"
              onClick={() => setMobileThreadOpen(false)}
              style={{ marginBottom: 8 }}
            >
              ← Back to inbox
            </button>
            <div className="inbox-thread-subject">{thread.subject}</div>
            <div className="inbox-thread-meta" style={{ marginBottom: 8 }}>
              <span>{thread.guest}</span>
              <span className="sep">·</span>
              <span>{thread.channel}</span>
              <span className="sep">·</span>
              <span>{thread.property}</span>
              {thread.language && (
                <>
                  <span className="sep">·</span>
                  <span>{thread.language}</span>
                </>
              )}
            </div>
            {thread.whatsappWindow && <WhatsAppTimer window={thread.whatsappWindow} />}
            <div
              className={
                'inbox-ai-toolbar' +
                (isMobile && !aiToolbarExpanded ? ' mobile-collapsed' : '')
              }
            >
              <span className="inbox-ai-toolbar-label">Friday</span>
              {isMobile && (
                <button
                  className="inbox-ai-chip ai-toggle"
                  onClick={() => setAiToolbarExpanded((v) => !v)}
                >
                  <IconSparkle size={10} />
                  {aiToolbarExpanded ? 'Hide AI' : 'AI tools'}
                </button>
              )}
              <button
                className={'inbox-ai-chip' + (summaryOn ? ' on' : '')}
                onClick={() => setSummaryOn((v) => !v)}
              >
                <IconSparkle size={10} /> Summary
              </button>
              <button
                className={'inbox-ai-chip' + (translateOn ? ' on' : '')}
                onClick={() => setTranslateOn((v) => !v)}
              >
                <IconGlobe size={10} /> Translate
              </button>
              {thread.sentiment === 'urgent' && (
                <span
                  className="inbox-ai-chip"
                  style={{
                    background: 'var(--color-bg-danger)',
                    color: 'var(--color-text-danger)',
                  }}
                >
                  <IconBell size={10} /> Urgent
                </span>
              )}
            </div>
            {summaryOn && thread.summary && (
              <div
                className={
                  'inbox-ai-summary' + (isMobile && summaryCollapsed ? ' collapsed' : '')
                }
              >
                <div
                  className="inbox-ai-summary-label"
                  style={{ cursor: isMobile ? 'pointer' : 'default' }}
                  onClick={() => isMobile && setSummaryCollapsed((v) => !v)}
                >
                  Summary · auto
                </div>
                {thread.summary}
              </div>
            )}
            {summaryOn && thread.summary && isMobile && summaryCollapsed && (
              <button
                onClick={() => setSummaryCollapsed(false)}
                style={{
                  marginTop: 6,
                  background: 'transparent',
                  border: '0.5px dashed var(--color-border-tertiary)',
                  padding: '4px 10px',
                  fontSize: 11,
                  color: 'var(--color-brand-accent)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <IconSparkle size={10} /> Show Friday summary
              </button>
            )}
          </div>
          <div className="inbox-thread-body">
            <div className="msg-bubble them">
              <div className="msg-meta">
                {thread.guest} · {thread.time}
                {translateOn && thread.language && thread.language !== 'EN' && (
                  <span style={{ marginLeft: 8, color: 'var(--color-brand-accent)' }}>
                    translated from {thread.language}
                  </span>
                )}
              </div>
              <div className="msg-body">{thread.messages?.[0]?.body || thread.preview}</div>
            </div>
            <div className="msg-bubble us">
              <div className="msg-meta">You · draft</div>
              <div className="msg-body" style={{ fontStyle: 'italic', opacity: 0.85 }}>
                Drafting a reply… use <span className="mono">⌘K</span> to ask Friday to draft.
              </div>
            </div>
          </div>
          {consultOpen && (
            <FridayConsult
              key={selected}
              threadScope={thread.guest}
              autoPrompt="Summarize what this guest is asking and suggest a reply angle"
              onClose={() => setConsultOpen(false)}
            />
          )}
          <div
            className={
              'inbox-compose' + (isMobile && composeCollapsed ? ' mobile-collapsed' : '')
            }
          >
            {isMobile && composeCollapsed && (
              <div
                className="inbox-compose-collapsed-bar"
                onClick={() => setComposeCollapsed(false)}
              >
                <IconSend size={12} />
                <span style={{ flex: 1, marginLeft: 8 }}>Tap to reply to {thread.guest}</span>
                <IconChevron size={10} />
              </div>
            )}
            {isMobile && !composeCollapsed && (
              <button
                className="inbox-compose-collapse-btn"
                onClick={() => setComposeCollapsed(true)}
                title="Minimize"
                style={{ float: 'right', marginBottom: -24 }}
              >
                ×
              </button>
            )}
            <div className="inbox-compose-toolbar">
              <button
                className={'btn ghost sm' + (consultOpen ? ' primary' : '')}
                onClick={() => setConsultOpen((v) => !v)}
              >
                <IconSparkle size={12} /> Friday Consult
              </button>
              <button className="btn ghost sm">
                <IconPaperclip size={12} /> Attach
              </button>
              <span style={{ marginLeft: 'auto' }} className="mono">
                {thread.channel} · reply-all
              </span>
            </div>
            <textarea
              className="inbox-compose-textarea"
              placeholder="Write a reply…"
              defaultValue={
                thread.id === 't1'
                  ? 'Bonjour Thibault — confirming Ravi will meet you at SSR arrivals at 15:20 with a Friday sign. Early check-in 14:30 approved. À tout bientôt, Friday team.'
                  : ''
              }
            />
            <div
              className="inbox-compose-actions"
              style={{ position: 'relative', justifyContent: 'space-between' }}
            >
              <button className="btn ghost">
                <IconAI size={12} /> Polish with Friday
              </button>
              <div className="send-split">
                <button className="send-split-main" onClick={() => setSendMenuOpen(false)}>
                  <IconSend size={12} /> Send
                </button>
                <button
                  className="send-split-caret"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSendMenuOpen((v) => !v);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={sendMenuOpen}
                >
                  ▾
                </button>
                {sendMenuOpen && (
                  <SendByMenu
                    channel={thread.channel}
                    onClose={() => setSendMenuOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={'inbox-right' + (rightCollapsed ? ' collapsed' : '')}>
          <button
            className="inbox-collapse-btn"
            onClick={() => setRightCollapsed((v) => !v)}
            title={rightCollapsed ? 'Show reservation' : 'Collapse reservation'}
          >
            <IconChevron size={12} />
          </button>
          {rightCollapsed && (
            <div className="inbox-right-rail">
              <IconPin size={14} />
              <span>Reservation</span>
            </div>
          )}
          <div className="inbox-right-section">
            <h4>Reservation</h4>
            <div className="inbox-right-row">
              <span className="label">Property</span>
              <span className="value">VAZ</span>
            </div>
            <div className="inbox-right-row">
              <span className="label">Check-in</span>
              <span className="value">Apr 17</span>
            </div>
            <div className="inbox-right-row">
              <span className="label">Check-out</span>
              <span className="value">Apr 24</span>
            </div>
            <div className="inbox-right-row">
              <span className="label">Guests</span>
              <span className="value">2A + 2C</span>
            </div>
            <div className="inbox-right-row">
              <span className="label">Total</span>
              <span className="value">€ 2,940</span>
            </div>
          </div>
          <div className="inbox-right-section">
            <h4>Guest</h4>
            <div className="inbox-right-row">
              <span className="label">Stays with us</span>
              <span className="value">2nd</span>
            </div>
            <div className="inbox-right-row">
              <span className="label">Language</span>
              <span className="value">FR</span>
            </div>
            <div className="inbox-right-row">
              <span className="label">Prev rating</span>
              <span className="value">5.0</span>
            </div>
          </div>
          <div className="inbox-right-section">
            <h4>Suggested actions</h4>
            <button
              className="btn sm"
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}
            >
              <IconCheck size={12} /> Confirm airport transfer
            </button>
            <button
              className="btn sm"
              style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 6 }}
            >
              <IconCheck size={12} /> Approve 14:30 early check-in
            </button>
            <button
              className="btn sm"
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={onAskFriday}
            >
              <IconSparkle size={12} /> Ask Friday to draft reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeGroup({
  label,
  entity,
  entityFilter,
  channelFilter,
  onEntity,
  onChannel,
  count,
  channels,
  channelCounts,
}: {
  label: string;
  entity: InboxEntity;
  entityFilter: 'all' | InboxEntity;
  channelFilter: InboxChannel | null;
  onEntity: (e: InboxEntity) => void;
  onChannel: (c: InboxChannel) => void;
  count: number;
  channels: { key: InboxChannel; label: string }[];
  channelCounts: Partial<Record<InboxChannel, number>>;
}) {
  return (
    <div className="inbox-tree-group">
      <div className="inbox-tree-head">
        <button
          className={
            'inbox-tree-item all' +
            (entityFilter === entity && !channelFilter ? ' active' : '')
          }
          onClick={() => onEntity(entity)}
          style={{ padding: '4px 8px' }}
        >
          <span>{label}</span>
          <span className="count">{count}</span>
        </button>
      </div>
      {channels.map((c) => (
        <button
          key={c.key}
          className={
            'inbox-tree-item' + (channelFilter === c.key ? ' active' : '')
          }
          onClick={() => onChannel(c.key)}
        >
          <span>{c.label}</span>
          <span className="count">{channelCounts[c.key] || 0}</span>
        </button>
      ))}
    </div>
  );
}

function WhatsAppTimer({
  window,
}: {
  window: { open: boolean; expiresInMinutes?: number };
}) {
  if (!window.open) {
    return (
      <div
        style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span className="inbox-wa-timer closed">
          <IconClock size={10} /> Window closed · template required
        </span>
        <button
          style={{
            fontSize: 11,
            color: 'var(--color-brand-accent)',
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Pick template →
        </button>
      </div>
    );
  }
  const mins = window.expiresInMinutes || 0;
  const low = mins < 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span className={'inbox-wa-timer ' + (low ? 'warn' : 'open')}>
        <IconClock size={10} /> Window open · expires in {h > 0 ? `${h}h ` : ''}
        {m}m
      </span>
      {low && (
        <span style={{ fontSize: 11, color: 'var(--color-text-warning)' }}>
          reply soon or template will be needed
        </span>
      )}
    </div>
  );
}

function SendByMenu({ channel, onClose }: { channel: string; onClose: () => void }) {
  void channel;
  const items = [
    {
      icon: IconClock,
      label: 'Schedule send',
      desc: 'Pick a date + time',
    },
    {
      icon: IconSparkle,
      label: 'Send when guest is awake',
      desc: '8am–10pm guest-local time',
    },
  ] as const;
  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 15 }}
        onClick={onClose}
      />
      <div className="send-split-menu" onClick={(e) => e.stopPropagation()}>
        {items.map((it, i) => {
          const I = it.icon;
          return (
            <button key={i} className="send-split-item" onClick={onClose}>
              <I size={14} />
              <div className="lab">
                {it.label}
                <div className="desc">{it.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
