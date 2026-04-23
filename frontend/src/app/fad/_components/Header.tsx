'use client';

import type { MouseEvent } from 'react';
import {
  IconBell,
  IconBook,
  IconChat,
  IconHelp,
  IconMoon,
  IconRoad,
  IconSearch,
  IconSidebar,
  IconSpark,
  IconSparkle,
  IconSun,
  IconTool,
} from './icons';

interface Props {
  onOpenPalette: () => void;
  onOpenFriday: () => void;
  fridayOpen: boolean;
  onToggleSidebar: () => void;
  onGoHome?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenBell: (e: MouseEvent) => void;
  bellOpen: boolean;
  onOpenHelp: (e: MouseEvent) => void;
  helpOpen: boolean;
  onOpenAvatar: (e: MouseEvent) => void;
  avatarOpen: boolean;
}

export function Header({
  onOpenPalette,
  onOpenFriday,
  fridayOpen,
  onToggleSidebar,
  onGoHome,
  theme,
  onToggleTheme,
  onOpenBell,
  bellOpen,
  onOpenHelp,
  helpOpen,
  onOpenAvatar,
  avatarOpen,
}: Props) {
  return (
    <header className="fad-header">
      <div className="fad-brand">
        <button
          className="fad-util-btn"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
          style={{ marginRight: 4 }}
        >
          <IconSidebar />
        </button>
        <button
          className="fad-brand-link"
          onClick={onGoHome}
          title="Home · Inbox"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/friday-logo.jpg"
            alt="Friday"
            className="fad-brand-logo"
            width={32}
            height={32}
          />
          <span className="fad-brand-name">
            Friday
            <span className="fad-brand-sub">Admin</span>
          </span>
        </button>
      </div>

      <div className="fad-ask-wrap">
        <button className="fad-ask-pill" onClick={onOpenPalette}>
          <IconSearch size={14} />
          <span className="ask-label">
            Search or <span className="ask-friday">Ask Friday</span>…
          </span>
          <span className="kbd">⌘K</span>
        </button>
      </div>

      <div className="fad-utilities">
        <button
          className={'fad-util-btn' + (fridayOpen ? ' active' : '')}
          onClick={onOpenFriday}
          title="Ask Friday  ⌘/"
        >
          <IconSparkle />
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className={'fad-util-btn' + (bellOpen ? ' active' : '')}
            onClick={onOpenBell}
            title="Notifications"
          >
            <IconBell />
            <span className="fad-util-dot" />
          </button>
          {bellOpen && <NotificationsDropdown />}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className={'fad-util-btn' + (helpOpen ? ' active' : '')}
            onClick={onOpenHelp}
            title="Help"
          >
            <IconHelp />
          </button>
          {helpOpen && <HelpDropdown />}
        </div>
        <button
          className="fad-util-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={onOpenAvatar} className="fad-avatar" title="Account">
            IS
          </button>
          {avatarOpen && <AvatarDropdown />}
        </div>
      </div>
    </header>
  );
}

function NotificationsDropdown() {
  const items = [
    { t: 'Thibault Marchand replied', s: 'Villa Azur — transfer confirmation', time: '08:14' },
    { t: 'Payout settled', s: 'Airbnb batch · €48,220', time: '07:30' },
    { t: 'Breezeway invoice due', s: 'Apr cleaner run · €4,320', time: 'Wed' },
    { t: 'Owner agreement renewal', s: 'Harrington · Blue Bay House', time: 'Tue' },
  ];
  return (
    <div className="fad-dropdown" style={{ width: 320 }}>
      <div className="fad-dropdown-header">Notifications</div>
      {items.map((it, i) => (
        <button className="fad-dropdown-item" key={i}>
          <span className="dot accent" />
          <span style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500 }}>{it.t}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{it.s}</div>
          </span>
          <span className="meta">{it.time}</span>
        </button>
      ))}
    </div>
  );
}

function HelpDropdown() {
  const items = [
    { t: 'Help docs', I: IconBook },
    { t: 'Report a bug', I: IconTool },
    { t: "What's new", I: IconSpark },
    { t: 'Roadmap', I: IconRoad },
    { t: 'Feedback', I: IconChat },
  ];
  return (
    <div className="fad-dropdown" style={{ width: 220 }}>
      {items.map((it, i) => {
        const I = it.I;
        return (
          <button className="fad-dropdown-item" key={i}>
            <I size={14} />
            <span>{it.t}</span>
          </button>
        );
      })}
    </div>
  );
}

function AvatarDropdown() {
  return (
    <div className="fad-dropdown" style={{ width: 220 }}>
      <div style={{ padding: '10px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ fontWeight: 500, fontSize: 13 }}>Ishant Sagoo</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Admin · friday.mu</div>
      </div>
      <button className="fad-dropdown-item">Profile</button>
      <button className="fad-dropdown-item">Preferences</button>
      <div className="fad-dropdown-divider" />
      <button className="fad-dropdown-item">Log out</button>
    </div>
  );
}
