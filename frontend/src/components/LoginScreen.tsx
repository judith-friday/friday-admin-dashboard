'use client'

// @demo:auth — ENTIRE FILE is fake authentication. Accepts any input,
// fakes a "Welcome" flash, navigates to /fad. No real auth flow.
// Tag: PROD-AUTH-1 — see frontend/DEMO_CRUFT.md
// Replace with real OAuth/JWT flow. handleSubmit → POST /api/auth/login,
// store token, redirect on success.

// Demo-mode login screen. No real authentication — clicking a name (or any
// manual Sign-in path) simply navigates to /fad. The FAD shell manages its
// own role + identity state independently, so no localStorage writes are
// required here. Pure UI: wordmark, greeting, name chips, cycling tip.

import React, { useState, useEffect, useMemo } from 'react'

type Theme = 'light' | 'dark'

// ─────────────────────────────── Team roster ───────────────────────────────
// Drives the chip selector. Edit when team membership changes.
const TEAM: Array<{ firstName: string; email: string }> = []

// ─────────────────────────────── Greetings ─────────────────────────────────
// One pulled at random per page load. Friday's voice trends curious + dry.
// @demo:ui — Tag: PROD-UI-2 — see frontend/DEMO_CRUFT.md
// Optional keep: drop for a conventional production login, or keep if
// Friday's voice on a real login screen is still playful.
const FUNNY_GREETINGS: string[] = ['Sign in to continue.']

// ─────────────────────────────── Tip pool ──────────────────────────────────
// One shown below the form, in tertiary text. Random per page load.
// 'admin' = FAD product knowledge (✦), 'str' = hospitality stats (💡).
// @demo:ui — Tag: PROD-UI-3 — see frontend/DEMO_CRUFT.md
// Optional keep: could become GET /api/login-tips, or drop entirely.
const TIPS: Array<{ kind: string; text: string }> = []

// ─────────────────────────────── Design tokens ─────────────────────────────
// Mirrors src/app/fad/fad.css :root + html.fad-dark blocks. Inlined here
// because login lives at / outside the FAD route.
const TOKENS: Record<Theme, {
  bgPage: string; bgCard: string; border: string;
  textPrimary: string; textSecondary: string; textTertiary: string;
  brandAccent: string; brandAccentSoft: string; brandAccentText: string;
}> = {
  light: {
    bgPage: '#efede8',
    bgCard: '#ffffff',
    border: 'rgba(15, 24, 54, 0.08)',
    textPrimary: '#1a1917',
    textSecondary: '#55534d',
    textTertiary: '#8a8780',
    brandAccent: '#2B4A93',
    brandAccentSoft: 'rgba(43, 74, 147, 0.08)',
    brandAccentText: '#ffffff',
  },
  dark: {
    bgPage: '#141620',
    bgCard: '#1a1d28',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#e8e9ec',
    textSecondary: '#a8abb6',
    textTertiary: '#6b6e7a',
    brandAccent: '#5680CA',
    brandAccentSoft: 'rgba(86, 128, 202, 0.14)',
    brandAccentText: '#0b0d14',
  },
}

const FONT_SANS = 'Inter, system-ui, -apple-system, sans-serif'
const FONT_FRIDAY = 'Fraunces, "Iowan Old Style", Georgia, serif'

const FAD_DESTINATION = '/fad'

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

function pickOnce<T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ─────────────────────────────── Component ─────────────────────────────────

// Prop kept for backward compatibility with app/page.tsx — never invoked in
// demo mode (we navigate away instead of upgrading the parent's auth state).
export default function LoginScreen({ onLogin: _onLogin }: { onLogin: (token: string) => void }) {
  const theme = useFadTheme()
  const t = TOKENS[theme]

  const greeting = useMemo(() => pickOnce(FUNNY_GREETINGS), [])
  const tip = useMemo(() => pickOnce(TIPS), [])

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Form state — fields are always rendered and accept anything (or nothing).
  // Chip click pre-fills email + focuses password. Sign-in succeeds regardless
  // of what's typed — the screen is the production layout, the auth is fake.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [lastEmail, setLastEmail] = useState<string | null>(null)

  useEffect(() => {
    setLastEmail(localStorage.getItem('fad:last-email'))
  }, [])

  // Demo "sign in" — write the email so chip auto-highlights next visit, flash
  // a welcome, then navigate to the FAD shell. No tokens, no API, no auth.
  const enterAs = (firstName: string, emailUsed: string) => {
    try { localStorage.setItem('fad:last-email', emailUsed) } catch {}
    setWelcomeName(firstName)
    setTimeout(() => {
      window.location.href = FAD_DESTINATION
    }, 700)
  }

  // Click a chip → fill email, focus password (mirrors the production flow
  // where the OS password manager would now pop in the saved password).
  const pickMember = (m: typeof TEAM[number]) => {
    setEmail(m.email)
    setTimeout(() => {
      const pw = document.querySelector('input[name="password"]') as HTMLInputElement | null
      pw?.focus()
    }, 30)
  }

  // Form submit — accept anything. Resolve a display name in best-effort order:
  //   1. Match against TEAM by exact email
  //   2. Fall back to the email-prefix (Capitalized)
  //   3. Final fallback "Demo"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    const matched = TEAM.find((m) => m.email === trimmed)
    let niceName: string
    if (matched) {
      niceName = matched.firstName
    } else if (trimmed) {
      const stub = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed
      niceName = stub.charAt(0).toUpperCase() + stub.slice(1)
    } else {
      niceName = 'Demo'
    }
    enterAs(niceName, trimmed || 'demo@friday.mu')
  }

  // ─────────────────────── Style objects ───────────────────────

  const pageStyle: React.CSSProperties = {
    background: t.bgPage,
    color: t.textPrimary,
    fontFamily: FONT_SANS,
    minHeight: '100dvh',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 18,
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
    marginTop: 22,
    marginBottom: 0,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
  }

  const demoPillStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: t.textTertiary,
    background: t.brandAccentSoft,
    border: `0.5px solid ${t.border}`,
    borderRadius: 999,
    marginBottom: 12,
  }

  // ─────────────────────── Welcome flash ───────────────────────

  if (welcomeName) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FONT_FRIDAY, fontSize: 24, fontWeight: 500, color: t.textPrimary, marginBottom: 6 }}>
            Welcome, {welcomeName}.
          </div>
          <div style={{ fontSize: 13, color: t.textSecondary }}>Setting things up…</div>
        </div>
      </div>
    )
  }

  // ─────────────────────── Default: sign-in screen ───────────────────────

  const tipIcon = tip?.kind === 'admin' ? '✦' : '💡'

  return (
    <div data-testid="container-login-screen" style={pageStyle}>
      <div style={cardStyle}>
                <h1 style={titleStyle}>Friday Admin</h1>
        <p style={subtitleStyle}>{greeting}</p>

        <div style={chipsRowStyle}>
          {TEAM.map((m) => {
            // Prefer "picked now" over "last-used"; only fall back to last-used
            // when no email is currently set.
            const isPicked = m.email === email
            const isLast = !email && m.email === lastEmail
            return (
              <button
                key={m.email}
                type="button"
                onClick={() => pickMember(m)}
                style={chipStyle(isPicked || isLast)}
                title={m.email}
                data-testid={`chip-login-${m.firstName.toLowerCase()}`}
              >
                {m.firstName}
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            name="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@friday.mu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          />
          <button
            type="submit"
            data-testid="btn-login"
            style={primaryBtnStyle}
          >
            Sign in
          </button>
        </form>

        {tip && (
          <p style={tipStyle}>
            <span aria-hidden="true" style={{ color: t.brandAccent, fontSize: 11, lineHeight: '18px' }}>{tipIcon}</span>
            <span>{tip.text}</span>
          </p>
        )}
      </div>
    </div>
  )
}
