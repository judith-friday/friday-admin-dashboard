'use client';

import { useState } from 'react';
import { ModuleHeader } from '../ModuleHeader';
import { useCurrentRole } from '../usePermissions';
import { SavedRepliesImport } from './properties/SavedRepliesImport';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const SECTIONS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'account', label: 'Account' },
  { id: 'team', label: 'Team' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'bugs', label: 'Bug reports' },
  { id: 'billing', label: 'Billing' },
];

// Field staff get a slimmed Settings — only personal-scope sections.
const FIELD_SECTION_IDS = new Set(['appearance', 'account']);

export function SettingsModule({ theme, onToggleTheme }: Props) {
  const role = useCurrentRole();
  const sections = role === 'field' ? SECTIONS.filter((s) => FIELD_SECTION_IDS.has(s.id)) : SECTIONS;
  const [section, setSection] = useState(sections[0]?.id ?? 'appearance');
  return (
    <>
      <ModuleHeader title="Settings" subtitle="Your profile, team, GMS, and system preferences" />
      <div className="fad-module-body">
        <div className="settings-layout">
          <div className="settings-nav">
            {sections.map((s) => (
              <button
                key={s.id}
                className={'settings-nav-item' + (section === s.id ? ' active' : '')}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div>
            {section === 'appearance' && <Appearance theme={theme} onToggleTheme={onToggleTheme} />}
            {section === 'account' && <Account />}
            {section === 'team' && <Team />}
            {section === 'integrations' && <Integrations />}
            {section === 'bugs' && <BugReports />}
            {section === 'billing' && <Billing />}
          </div>
        </div>
      </div>
    </>
  );
}

function Appearance({ theme, onToggleTheme }: Props) {
  return (
    <div className="card settings-section">
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 500 }}>Appearance</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        Light, dark, or follow your system.
      </p>
      <div className="settings-row">
        <div>
          <h5>Dark mode</h5>
          <p>Currently: {theme}. FAD follows your OS preference by default.</p>
        </div>
        <div className={'toggle' + (theme === 'dark' ? ' on' : '')} onClick={onToggleTheme} />
      </div>
      <div className="settings-row">
        <div>
          <h5>Density</h5>
          <p>Dense is standard for Inbox; comfy on large displays.</p>
        </div>
        <span className="settings-value">Dense</span>
      </div>
      <div className="settings-row">
        <div>
          <h5>Sidebar</h5>
          <p>Remembered per device.</p>
        </div>
        <span className="settings-value">Expanded</span>
      </div>
    </div>
  );
}

function Account() {
  return (
    <div className="card settings-section">
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 500 }}>Account</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        How Friday addresses you.
      </p>
      <div className="settings-row">
        <div>
          <h5>Name</h5>
          <p>Shown on messages and threads.</p>
        </div>
        <span className="settings-value">Ishant Sagoo</span>
      </div>
      <div className="settings-row">
        <div>
          <h5>Email</h5>
          <p>Login + notifications.</p>
        </div>
        <span className="settings-value">ishant@friday.mu</span>
      </div>
      <div className="settings-row">
        <div>
          <h5>Role</h5>
          <p>Admin sees all, writes all.</p>
        </div>
        <span className="chip info">Admin</span>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div className="card settings-section">
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 500 }}>Team & roles</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        Role-scoped visibility, multi-team membership.
      </p>
      {[
        { name: 'Ishant Sagoo', role: 'Admin', teams: ['all'] },
        { name: 'Franny Reyes', role: 'Manager', teams: ['ops', 'gs'] },
        { name: 'Mathias Chen', role: 'Manager', teams: ['gs', 'ops'] },
        { name: 'Mary Nunes', role: 'Manager · until May', teams: ['admin'] },
        { name: 'Bryan Patel', role: 'Contributor', teams: ['ops'] },
        { name: 'Alex Rivera', role: 'Contributor', teams: ['ops'] },
      ].map((p, i) => (
        <div key={i} className="settings-row">
          <div>
            <h5>{p.name}</h5>
            <p>{p.teams.join(' · ')}</p>
          </div>
          <span className="chip">{p.role}</span>
        </div>
      ))}
    </div>
  );
}

function Integrations() {
  const [importOpen, setImportOpen] = useState(false);
  return (
    <div className="card settings-section">
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 500 }}>Integrations</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        Connected services. Google is per-user — each teammate links their own account.
      </p>

      <div className="settings-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 8, paddingBottom: 16, borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: 12 }}>
        <div>
          <h5>Guesty saved replies → Property Cards</h5>
          <p>One-time portfolio-wide migration · imports every per-listing + cross-listing reply as a Property Card. Per-property imports also live in each property's Operational tab.</p>
        </div>
        <button className="btn ghost sm" onClick={() => setImportOpen(true)}>
          ↓ Run portfolio import
        </button>
      </div>
      {importOpen && <SavedRepliesImport onClose={() => setImportOpen(false)} />}

      {[
        { name: 'Google (Gmail · Drive · Calendar)', status: 'Connected · Ishant', meta: 'Per-user · attribution preserved' },
        { name: 'Guesty', status: 'Connected', meta: 'Channel manager · reservations + threads' },
        { name: 'Breezeway', status: 'Connected', meta: 'Housekeeping + maintenance · two-way task sync' },
        { name: 'WhatsApp Business API', status: 'Blocked', meta: 'Waiting on Guesty MFA + Meta BM admin access' },
        { name: 'Stripe', status: 'Connected', meta: 'Direct bookings · refund automation' },
        { name: 'Xero', status: 'Not connected', meta: 'Ships with Finance Apr' },
        { name: 'Slack', status: 'Connected', meta: 'Bidirectional approvals · ops channel' },
        { name: 'Airbnb (direct)', status: 'Via Guesty', meta: 'Direct integration later' },
        { name: 'Twilio (SMS fallback)', status: 'Not connected', meta: 'Low priority — WhatsApp covers' },
      ].map((it, i) => (
        <div key={i} className="settings-row">
          <div>
            <h5>{it.name}</h5>
            <p>{it.meta}</p>
          </div>
          <span
            className={
              'chip ' +
              (it.status.startsWith('Connected') ? 'info' : it.status === 'Blocked' ? 'warn' : '')
            }
          >
            {it.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function BugReports() {
  return (
    <div className="card settings-section">
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 500 }}>Bug reports</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        Admin-only view. Team-submitted bugs via the header ? menu land here.
      </p>
      {[
        { title: 'Calendar event popover clips off-screen on narrow viewports', reporter: 'Mathias', date: 'Apr 17', status: 'open' },
        { title: 'Task drawer backdrop blocks sidebar clicks', reporter: 'Franny', date: 'Apr 14', status: 'open' },
        { title: 'Dark mode toggle persists across reload — verified', reporter: 'Ishant', date: 'Apr 12', status: 'fixed' },
      ].map((b, i) => (
        <div key={i} className="settings-row">
          <div>
            <h5>{b.title}</h5>
            <p>
              {b.reporter} · {b.date}
            </p>
          </div>
          <span className={'chip ' + (b.status === 'fixed' ? 'info' : 'warn')}>{b.status}</span>
        </div>
      ))}
    </div>
  );
}

function Billing() {
  return (
    <div className="card settings-section">
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 500 }}>Billing</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        Admin-only view. FridayOS + integration subscriptions.
      </p>
      <div className="settings-row">
        <div>
          <h5>Plan</h5>
          <p>Friday Internal · unmetered</p>
        </div>
        <span className="chip info">Active</span>
      </div>
      <div className="settings-row">
        <div>
          <h5>Next invoice</h5>
          <p>May 1, 2026</p>
        </div>
        <span className="settings-value">€ 0 — internal</span>
      </div>
    </div>
  );
}
