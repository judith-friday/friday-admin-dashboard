'use client'

import React, { useState, useEffect } from 'react'
import { API_BASE } from './types'

type View = 'login' | 'forgot' | 'reset' | 'change-password'
type Theme = 'light' | 'dark'

// FAD design tokens — mirrors src/app/fad/fad.css :root and html.fad-dark blocks.
// Inline here so the login screen (at /, outside the FAD route) doesn't need
// to import fad.css and risk leaking unprefixed FAD classes into legacy GMS.
const TOKENS: Record<Theme, {
  bgPage: string; bgCard: string; border: string; borderStrong: string;
  textPrimary: string; textSecondary: string; textTertiary: string;
  brandAccent: string; brandAccentSoft: string; brandAccentText: string;
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
    brandAccentText: '#0b0d14',
    bgSuccess: 'rgba(92, 179, 124, 0.14)',
    textSuccess: '#5CB37C',
    bgDanger: 'rgba(224, 106, 92, 0.14)',
    textDanger: '#E06A5C',
  },
}

const FONT_SANS = 'Inter, system-ui, -apple-system, sans-serif'
const FONT_FRIDAY = 'Fraunces, "Iowan Old Style", Georgia, serif'

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

export default function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const theme = useFadTheme()
  const t = TOKENS[theme]

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  // Force password change state
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  // Forgot / Reset password state
  const [view, setView] = useState<View>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [resetPw, setResetPw] = useState('')
  const [resetConfirmPw, setResetConfirmPw] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  // Detect reset token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const path = window.location.pathname
    if (token && (path === '/reset-password' || path.includes('reset-password'))) {
      setResetToken(token)
      setView('reset')
    }
  }, [])

  // Shared login flow — used by both the password form and the demo button.
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

  // ───────────────── Style objects ─────────────────

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
    maxWidth: 400,
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
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: t.textSecondary,
    margin: 0,
    marginBottom: 24,
  }

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: t.border,
    margin: '20px 0 16px',
  }

  // Centered page wrapper — used by every view.
  const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      data-testid="container-login-screen"
      style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </div>
  )

  // ───────────────── Welcome flash ─────────────────

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

  // ───────────────── Force password change ─────────────────

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

  // ───────────────── Forgot password ─────────────────

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

  // ───────────────── Reset password (from email link) ─────────────────

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

  // ───────────────── Default: login ─────────────────

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <Page>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={titleStyle}>Friday Admin</h1>
        <p style={subtitleStyle}>Sign in to continue.</p>
        {error && <div style={errorBoxStyle}>{error}</div>}
        <input
          type="text"
          placeholder="you@friday.mu"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="input-login-password"
          style={{ ...inputStyle, marginBottom: 16 }}
        />
        <button
          type="submit"
          disabled={loading}
          data-testid="btn-login"
          style={{ ...primaryBtnStyle, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={() => { setView('forgot'); setError('') }}
          style={{ ...linkBtnStyle, marginTop: 8, textAlign: 'center' }}
        >
          Forgot password?
        </button>

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
