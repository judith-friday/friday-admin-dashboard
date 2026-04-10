'use client'

import React, { useState, useEffect } from 'react'
import { API_BASE } from './types'

const TAGLINES = [
  'Your AI-powered guest experience engine',
  'Friday is ready. Let\u2019s delight some guests.',
  'Smarter replies. Happier guests. Less effort.',
  'Where hospitality meets intelligence',
  'The future of guest communication starts here',
]

type View = 'login' | 'forgot' | 'reset' | 'change-password'

export default function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])

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

  // Check URL for reset token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const path = window.location.pathname
    if (token && (path === '/reset-password' || path.includes('reset-password'))) {
      setResetToken(token)
      setView('reset')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      localStorage.setItem('gms_display_name', data.display_name || data.username)
      localStorage.setItem('gms_role', data.role || 'agent')
      if (data.user_id) localStorage.setItem('gms_user_id', data.user_id)

      if (data.must_change_password) {
        setTempToken(data.token)
        setCurrentPw(password)
        setMustChangePassword(true)
        return
      }

      // Welcome flash
      setWelcomeName(data.display_name || data.username)
      setTimeout(() => onLogin(data.token), 1200)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
      setTimeout(() => onLogin(tempToken!), 1200)
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
      // Clean URL and redirect to login after 3s
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

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
  }
  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9',
  }
  const btnStyle = {
    background: 'rgba(99,149,255,0.2)',
    color: '#6395ff',
    border: '1px solid rgba(99,149,255,0.3)',
  }

  // Welcome flash screen
  if (welcomeName) {
    return (
      <div className="flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)', minHeight: '100dvh'}}>
        <div className="text-center animate-fade-in">
          <div className="text-3xl font-bold mb-2" style={{color: '#f1f5f9'}}>Welcome back, {welcomeName} &#x1F44B;</div>
          <div className="text-sm" style={{color: '#64748b'}}>Loading your inbox...</div>
        </div>
      </div>
    )
  }

  // Force password change modal
  if (mustChangePassword) {
    return (
      <div className="flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)', minHeight: '100dvh'}}>
        <form onSubmit={handlePasswordChange} className="p-6 sm:p-8 rounded-xl w-full max-w-sm mx-4 sm:mx-auto" style={cardStyle}>
          <h1 className="text-xl font-bold mb-1" style={{color: '#f1f5f9'}}>Change Your Password</h1>
          <p className="text-xs mb-5" style={{color: '#64748b'}}>For security, please set a new password before continuing.</p>
          {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
          <input type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)}
            className="w-full mb-3 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} autoFocus />
          <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} />
          <button type="submit" disabled={changingPw}
            className="w-full py-2 rounded-lg font-medium disabled:opacity-50" style={btnStyle}>
            {changingPw ? 'Changing...' : 'Set New Password'}
          </button>
        </form>
      </div>
    )
  }

  const bgStyle = {
    background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)',
    animation: 'gradientShift 20s ease infinite',
    backgroundSize: '200% 200%',
    minHeight: '100dvh',
  }

  // Forgot password view
  if (view === 'forgot') {
    return (
      <div className="flex items-center justify-center" style={bgStyle}>
        <div className="p-6 sm:p-8 rounded-xl w-full max-w-sm mx-4 sm:mx-auto" style={cardStyle}>
          <h1 className="text-xl font-bold mb-1" style={{color: '#f1f5f9'}}>Reset Password</h1>
          <p className="text-xs mb-5" style={{color: '#64748b'}}>Enter your email to receive a reset link.</p>
          {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
          {forgotSent ? (
            <div>
              <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>
                If that email is registered, you'll receive a reset link shortly.
              </div>
              <button onClick={() => { setView('login'); setForgotSent(false); setForgotEmail(''); setError('') }}
                className="w-full py-2 rounded-lg font-medium" style={btnStyle}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <input type="email" placeholder="Email (e.g. ishant@friday.mu)" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                className="w-full mb-4 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} autoFocus />
              <button type="submit" disabled={loading || !forgotEmail}
                className="w-full py-2 rounded-lg font-medium disabled:opacity-50 mb-3" style={btnStyle}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setView('login'); setError('') }}
                className="w-full py-2 rounded-lg font-medium text-sm" style={{color: '#64748b'}}>
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Reset password view (from email link)
  if (view === 'reset') {
    return (
      <div className="flex items-center justify-center" style={bgStyle}>
        <div className="p-6 sm:p-8 rounded-xl w-full max-w-sm mx-4 sm:mx-auto" style={cardStyle}>
          <h1 className="text-xl font-bold mb-1" style={{color: '#f1f5f9'}}>Set New Password</h1>
          <p className="text-xs mb-5" style={{color: '#64748b'}}>Choose a new password for your account.</p>
          {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
          {resetSuccess ? (
            <div>
              <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(34,197,94,0.15)', color: '#4ade80'}}>
                Password reset successfully! Redirecting to sign in...
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              <input type="password" placeholder="New password (min 8 chars)" value={resetPw} onChange={e => setResetPw(e.target.value)}
                className="w-full mb-3 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} autoFocus />
              <input type="password" placeholder="Confirm new password" value={resetConfirmPw} onChange={e => setResetConfirmPw(e.target.value)}
                className="w-full mb-4 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} />
              <button type="submit" disabled={loading}
                className="w-full py-2 rounded-lg font-medium disabled:opacity-50" style={btnStyle}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Login view (default)
  return (
    <div className="flex items-center justify-center" data-testid="container-login-screen" style={bgStyle}>
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-xl w-full max-w-sm mx-4 sm:mx-auto" style={cardStyle}>
        <h1 className="text-2xl font-bold mb-1" style={{color: '#f1f5f9'}}>Friday Admin</h1>
        <p className="text-sm mb-6 h-5" style={{color: '#6395ff', opacity: 0.8}}>{tagline}</p>
        {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
        <input type="text" placeholder="Email (e.g. ishant@friday.mu)" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} autoFocus />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          data-testid="input-login-password"
          className="w-full mb-4 px-4 py-2 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={inputStyle} />
        <button type="submit" disabled={loading}
          data-testid="btn-login"
          className="w-full py-2 rounded-lg font-medium disabled:opacity-50" style={btnStyle}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button type="button" onClick={() => { setView('forgot'); setError('') }}
          className="w-full mt-3 py-1 text-sm font-medium" style={{color: '#64748b', background: 'none', border: 'none'}}>
          Forgot password?
        </button>
      </form>
    </div>
  )
}
