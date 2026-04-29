'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { API_BASE } from './types'

type View = 'login' | 'forgot' | 'reset' | 'change-password'
type Theme = 'light' | 'dark'

// ─────────────────────────────── Team roster ───────────────────────────────
// Drives the chip selector. Edit when team membership changes — emails follow
// the firstname@friday.mu convention. Leftmost chip rendered first; first-time
// visitors with no last-used email see this row in declared order.
const TEAM = [
  { firstName: 'Ishant',    email: 'ishant@friday.mu' },
  { firstName: 'Mathias',   email: 'mathias@friday.mu' },
  { firstName: 'Franny',    email: 'franny@friday.mu' },
  { firstName: 'Mary',      email: 'mary@friday.mu' },
  { firstName: 'Bryan',     email: 'bryan@friday.mu' },
  { firstName: 'Alexandra', email: 'alexandra@friday.mu' },
  { firstName: 'Catherine', email: 'catherine@friday.mu' },
] as const

// ─────────────────────────────── Greetings ─────────────────────────────────
// One pulled at random per page load. Replaces the static "Sign in to continue."
// subtitle. Add lines freely — Friday's voice trends curious + dry.
const FUNNY_GREETINGS = [
  "Wait a second… who are you? 0.0",
  "Hark, traveler. Identify thyself.",
  "Friday squints. Who goes there?",
  "🤨 Suspicious. Name?",
  "Beep boop. Authentication required.",
  "Knock knock. Who's there?",
  "Hello hello. Which one of you is it?",
  "Halt! Whomst arrives?",
  "*peers over glasses* And you are?",
  "Ahem. Speak, mortal.",
  "Friday wakes up. Mumbles. Who's this?",
  "Identify yourself or the AI gets it.",
  "Right then. Which one of you scallywags is it?",
  "Knockety knock. State your business.",
]

// ─────────────────────────────── Tip pool ──────────────────────────────────
// One shown below the form, in tertiary text with a 💡. Random per page load.
// Two flavors: 'admin' (FAD product knowledge) + 'str' (industry edge).
// Add freely — keep each line tight (<90 chars), claim-shaped, no fluff.
const TIPS = [
  // Friday admin tips
  { kind: 'admin', text: "Cmd+K opens the command palette anywhere in the FAD." },
  { kind: 'admin', text: "Sub-pages keep their filter state when you deep-link." },
  { kind: 'admin', text: "Sidebar badges are role-aware — what you see is what's actionable for you." },
  { kind: 'admin', text: "Bell icon → AI priority toggle reorders by what'll bite next." },
  { kind: 'admin', text: "Notifications can be snoozed per-item — 1h / 4h / Tomorrow." },
  { kind: 'admin', text: "Property chips are clickable everywhere — quick-view popover, no nav reset." },
  // STR / hospitality tips
  { kind: 'str',   text: "First-reply under 1 hour lifts review scores ~0.3 stars." },
  { kind: 'str',   text: "Listings with 30+ reviews convert ~2× better than fewer." },
  { kind: 'str',   text: "Cleaning-fee transparency cuts booking abandonment by ~8%." },
  { kind: 'str',   text: "Saturday check-ins outperform on stays longer than 5 nights." },
  { kind: 'str',   text: "Video tours raise click-through ~10%." },
  { kind: 'str',   text: "Same-day bookings tend to be your highest-margin segment." },
] as const

// ─────────────────────────────── Design tokens ─────────────────────────────
// Mirrors src/app/fad/fad.css :root + html.fad-dark blocks. Inlined here
// because login lives at / outside the FAD route — importing fad.css globally
// would leak unprefixed FAD classes (.cal-cell, .msg-bubble, etc.) into legacy GMS.
const TOKENS: Record<Theme, {
  bgPage: string; bgCard: string; border: string; borderStrong: string;
  textPrimary: string; textSecondary: string; textTertiary: string;
  brandAccent: string; brandAccentSoft: string; brandAccentSofter: string; brandAccentText: string;
  bgSuccess: string; textSuccess: string;
  bgDanger: string; textDanger: string;
}> = {
  light: {
    bgPage: '#efede8',
    bgCard: '#ffffff',
    border: 'rgba(15, 24, 54, 0.08)',
    borderStrong: 'rgba(15, 24, 54, 0.16)',
    textPrimary: '#1a1917',
    textSecondary: '#55534d',
    textTertiary: '#8a8780',
    brandAccent: '#2B4A93',
    brandAccentSoft: 'rgba(43, 74, 147, 0.08)',
    brandAccentSofter: 'rgba(43, 74, 147, 0.04)',
    brandAccentText: '#ffffff',
    bgSuccess: 'rgba(47, 125, 79, 0.10)',
    textSuccess: '#2F7D4F',
    bgDanger: 'rgba(180, 56, 42, 0.09)',
    textDanger: '#B4382A',
  },
  dark: {
    bgPage: '#141620',
    bgCard: '#1a1d28',
    border: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    textPrimary: '#e8e9ec',
    textSecondary: '#a8abb6',
    textTertiary: '#6b6e7a',
    brandAccent: '#5680CA',
    brandAccentSoft: 'rgba(86, 128, 202, 0.14)',
    brandAccentSofter: 'rgba(86, 128, 202, 0.06)',
    brandAccentText: '#0b0d14',
    bgSuccess: 'rgba(92, 179, 124, 0.14)',
    textSuccess: '#5CB37C',
    bgDanger: 'rgba(224, 106, 92, 0.14)',
    textDanger: '#E06A5C',
  },
}

const FONT_SANS = 'Inter, system-ui, -apple-system, sans-serif'
const FONT_FRIDAY = 'Fraunces, "Iowan Old Style", Georgia, serif'

// ─────────────────────────────── Helpers ───────────────────────────────────

function useFadTheme(): Theme {
  const [theme, setTheme] = useState<Theme>('light')
  useEffect(() => {
    const saved = localStorage.getItem('fad:theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    } else if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])
  return theme
}

// Pick once on mount and don't re-pick — flicker-free.
function pickOnce<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─────────────────────────────── Component ─────────────────────────────────

export default function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const theme = useFadTheme()
  const t = TOKENS[theme]

  // Random greeting + tip pinned per page load.
  const greeting = useMemo(() => pickOnce(FUNNY_GREETINGS), [])
  const tip = useMemo(() => pickOnce(TIPS), [])

  // Wordmark fade-in: opacity 0 → 1 on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Chip selector state.
  const [chosenMember, setChosenMember] = useState<typeof TEAM[number] | null>(null)
  const [manualMode, setManualMode] = useState(false)

  // Form state.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  // Force password change.
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  // Forgot / reset.
  const [view, setView] = useState<View>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetPw, setResetPw] = useState('')
  const [resetConfirmPw, setResetConfirmPw] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  // On mount: detect reset token in URL + auto-select last-used member.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const path = window.location.pathname
    if (token && (path === '/reset-password' || path.includes('reset-password'))) {
      setResetToken(token)
      setView('reset')
      return
    }
    // Auto-select last-used team member if recognizable.
    const lastEmail = localStorage.getItem('gms_last_email')
    if (lastEmail) {
      const match = TEAM.find((m) => m.email === lastEmail)
      if (match) {
        setChosenMember(match)
        setUsername(match.email)
      } else {
        // Email not in team list (e.g. ex-employee, demo account) — manual mode pre-filled.
        setManualMode(true)
        setUsername(lastEmail)
      }
    }
  }, [])

  // ─────────────────────── Handlers ───────────────────────

  const doLogin = async (email: string, pw: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password: pw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('gms_display_name', data.display_name || data.username)
      localStorage.setItem('gms_role', data.role || 'agent')
      localStorage.setItem('gms_last_email', email) // remember for next time
      if (data.user_id) localStorage.setItem('gms_user_id', data.user_id)

      if (data.must_change_password) {
        setTempToken(data.token)
        setCurrentPw(pw)
        setMustChangePassword(true)
        return
      }

      setWelcomeName(data.display_name || data.username)
      setTimeout(() => onLogin(data.token), 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doLogin(username, password)
  }

  const handleDemoLogin = () => {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD
    if (!demoEmail || !demoPassword) {
      setError('Demo creds missing — set NEXT_PUBLIC_DEMO_EMAIL and NEXT_PUBLIC_DEMO_PASSWORD in frontend/.env.local')
      return
    }
    setUsername(demoEmail)
    setPassword(demoPassword)
    doLogin(demoEmail, demoPassword)
  }

  const pickMember = (m: typeof TEAM[number]) => {
    setChosenMember(m)
    setUsername(m.email)
    setManualMode(false)
    setError('')
    // Defer focus until the password input renders.
    setTimeout(() => {
      const pw = document.querySelector('input[name="password"]') as HTMLInputElement | null
      pw?.focus()
    }, 50)
  }

  const goManual = () => {
    setManualMode(true)
    setChosenMember(null)
    setUsername('')
    setPassword('')
    setError('')
    setTimeout(() => {
      const em = document.querySelector('input[name="email"]') as HTMLInputElement | null
      em?.focus()
    }, 50)
  }

  const goBackToChips = () => {
    setChosenMember(null)
    setManualMode(false)
    setUsername('')
    setPassword('')
    setError('')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match'); return }
    setChangingPw(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/me/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tempToken}` },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      const dn = localStorage.getItem('gms_display_name') || username
      setMustChangePassword(false)
      setWelcomeName(dn)
      setTimeout(() => onLogin(tempToken!), 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setChangingPw(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setForgotSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (resetPw.length < 8) { setError('Password must be at least 8 characters'); return }
    if (resetPw !== resetConfirmPw) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: resetPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setResetSuccess(true)
      window.history.replaceState({}, '', '/')
      setTimeout(() => {
        setView('login')
        setResetSuccess(false)
        setResetToken('')
        setResetPw('')
        setResetConfirmPw('')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─────────────────────── Style objects ───────────────────────

  const pageStyle: React.CSSProperties = {
    background: t.bgPage,
    color: t.textPrimary,
    fontFamily: FONT_SANS,
    minHeight: '100dvh',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    paddingTop: 'env(safe-area-inset-top, 0px)',
  }

  const cardStyle: React.CSSProperties = {
    background: t.bgCard,
    border: `0.5px solid ${t.border}`,
    borderRadius: 12,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    margin: '0 16px',
    boxShadow: theme === 'light'
      ? '0 1px 2px rgba(15, 24, 54, 0.04), 0 8px 24px rgba(15, 24, 54, 0.04)'
      : '0 1px 2px rgba(0, 0, 0, 0.30), 0 8px 24px rgba(0, 0, 0, 0.30)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'inherit',
    background: t.bgCard,
    border: `0.5px solid ${t.border}`,
    borderRadius: 6,
    color: t.textPrimary,
    outline: 'none',
    transition: 'border-color 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const primaryBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    background: t.brandAccent,
    color: t.brandAccentText,
    border: `0.5px solid ${t.brandAccent}`,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'opacity 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const ghostBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    background: 'transparent',
    color: t.textSecondary,
    border: 0,
    cursor: 'pointer',
  }

  const linkBtnStyle: React.CSSProperties = {
    ...ghostBtnStyle,
    color: t.textTertiary,
    fontSize: 12,
    padding: '6px 0',
  }

  const errorBoxStyle: React.CSSProperties = {
    background: t.bgDanger,
    color: t.textDanger,
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  }

  const successBoxStyle: React.CSSProperties = {
    background: t.bgSuccess,
    color: t.textSuccess,
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  }

  const titleStyle: React.CSSProperties = {
    fontFamily: FONT_FRIDAY,
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: t.textPrimary,
    margin: 0,
    marginBottom: 4,
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(6px)',
    transition: 'opacity 700ms cubic-bezier(0.4, 0, 0.2, 1), transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: t.textSecondary,
    margin: 0,
    marginBottom: 20,
    minHeight: 18, // reserve space so layout doesn't shift on greeting load
  }

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: t.border,
    margin: '20px 0 14px',
  }

  // Chip selector styles.
  const chipsRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  }

  const chipStyle = (highlighted: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    fontSize: 13,
    fontFamily: 'inherit',
    fontWeight: 500,
    background: highlighted ? t.brandAccentSoft : t.bgCard,
    color: highlighted ? t.brandAccent : t.textPrimary,
    border: `0.5px solid ${highlighted ? t.brandAccent : t.border}`,
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'background 100ms ease, border-color 100ms ease, transform 60ms ease',
  })

  const tipStyle: React.CSSProperties = {
    fontSize: 12,
    color: t.textTertiary,
    lineHeight: 1.5,
    marginTop: 18,
    marginBottom: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
  }

  // Centered page wrapper.
  const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      data-testid="container-login-screen"
      style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </div>
  )

  // ─────────────────────── Welcome flash ───────────────────────

  if (welcomeName) {
    return (
      <Page>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_FRIDAY, fontSize: 24, fontWeight: 500, color: t.textPrimary, marginBottom: 6 }}>
            Welcome back, {welcomeName}
          </div>
          <div style={{ fontSize: 13, color: t.textSecondary }}>Loading your inbox…</div>
        </div>
      </Page>
    )
  }

  // ─────────────────────── Force password change ───────────────────────

  if (mustChangePassword) {
    return (
      <Page>
        <form onSubmit={handlePasswordChange} style={cardStyle}>
          <h1 style={titleStyle}>Change your password</h1>
          <p style={subtitleStyle}>For security, please set a new password before continuing.</p>
          {error && <div style={errorBoxStyle}>{error}</div>}
          <input
            type="password"
            placeholder="New password (min 8 chars)"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }}
            autoFocus
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            style={{ ...inputStyle, marginBottom: 16 }}
          />
          <button type="submit" disabled={changingPw} style={{ ...primaryBtnStyle, opacity: changingPw ? 0.5 : 1 }}>
            {changingPw ? 'Changing…' : 'Set new password'}
          </button>
        </form>
      </Page>
    )
  }

  // ─────────────────────── Forgot password ───────────────────────

  if (view === 'forgot') {
    return (
      <Page>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Reset password</h1>
          <p style={subtitleStyle}>Enter your email to receive a reset link.</p>
          {error && <div style={errorBoxStyle}>{error}</div>}
          {forgotSent ? (
            <div>
              <div style={successBoxStyle}>
                If that email is registered, you'll receive a reset link shortly.
              </div>
              <button
                type="button"
                onClick={() => { setView('login'); setForgotSent(false); setForgotEmail(''); setError('') }}
                style={primaryBtnStyle}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="you@friday.mu"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={{ ...inputStyle, marginBottom: 16 }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !forgotEmail}
                style={{ ...primaryBtnStyle, opacity: (loading || !forgotEmail) ? 0.5 : 1, marginBottom: 8 }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button
                type="button"
                onClick={() => { setView('login'); setError('') }}
                style={ghostBtnStyle}
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </Page>
    )
  }

  // ─────────────────────── Reset password (from email link) ───────────────────────

  if (view === 'reset') {
    return (
      <Page>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Set new password</h1>
          <p style={subtitleStyle}>Choose a new password for your account.</p>
          {error && <div style={errorBoxStyle}>{error}</div>}
          {resetSuccess ? (
            <div style={successBoxStyle}>
              Password reset. Redirecting to sign in…
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={resetConfirmPw}
                onChange={(e) => setResetConfirmPw(e.target.value)}
                style={{ ...inputStyle, marginBottom: 16 }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ ...primaryBtnStyle, opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </Page>
    )
  }

  // ─────────────────────── Default: login ───────────────────────

  const isDev = process.env.NODE_ENV === 'development'
  const showFields = chosenMember !== null || manualMode
  const tipIcon = tip.kind === 'admin' ? '✦' : '💡' // admin gets the FAD glyph, STR gets the lightbulb

  return (
    <Page>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={titleStyle}>Friday Admin</h1>
        <p style={subtitleStyle}>{greeting}</p>

        {error && <div style={errorBoxStyle}>{error}</div>}

        {!showFields && (
          <>
            <div style={chipsRowStyle}>
              {TEAM.map((m) => {
                const lastEmail = typeof window !== 'undefined' ? localStorage.getItem('gms_last_email') : null
                const isLast = m.email === lastEmail
                return (
                  <button
                    key={m.email}
                    type="button"
                    onClick={() => pickMember(m)}
                    style={chipStyle(isLast)}
                    title={m.email}
                    data-testid={`chip-login-${m.firstName.toLowerCase()}`}
                  >
                    {m.firstName}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={goManual}
              style={{ ...linkBtnStyle, textAlign: 'left', padding: '4px 0' }}
            >
              or type your email
            </button>
          </>
        )}

        {showFields && (
          <>
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@friday.mu"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-login-password"
              style={{ ...inputStyle, marginBottom: 16 }}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="btn-login"
              style={{ ...primaryBtnStyle, opacity: loading ? 0.5 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <button
                type="button"
                onClick={goBackToChips}
                style={{ ...linkBtnStyle, padding: '6px 0' }}
              >
                ← not me
              </button>
              <button
                type="button"
                onClick={() => { setView('forgot'); setError('') }}
                style={{ ...linkBtnStyle, padding: '6px 0' }}
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        <p style={tipStyle}>
          <span aria-hidden="true" style={{ color: t.brandAccent, fontSize: 11, lineHeight: '18px' }}>{tipIcon}</span>
          <span>{tip.text}</span>
        </p>

        {isDev && (
          <>
            <div style={dividerStyle} />
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'inherit',
                fontWeight: 500,
                background: t.brandAccentSoft,
                color: t.brandAccent,
                border: `0.5px solid ${t.border}`,
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              title="Sign in using NEXT_PUBLIC_DEMO_EMAIL / NEXT_PUBLIC_DEMO_PASSWORD"
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  padding: '2px 5px',
                  borderRadius: 3,
                  background: t.brandAccent,
                  color: t.brandAccentText,
                }}
              >
                DEV
              </span>
              <span>Sign in as demo user</span>
            </button>
          </>
        )}
      </form>
    </Page>
  )
}
