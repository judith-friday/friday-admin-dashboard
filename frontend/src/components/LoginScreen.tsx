'use client'

import React, { useState } from 'react'
import { API_BASE } from './types'

const TAGLINES = [
  'Your AI-powered guest experience engine',
  'Judith is ready. Let\u2019s delight some guests.',
  'Smarter replies. Happier guests. Less effort.',
  'Where hospitality meets intelligence',
  'The future of guest communication starts here',
]

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

  // Welcome flash screen
  if (welcomeName) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)'}}>
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
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)'}}>
        <form onSubmit={handlePasswordChange} className="p-6 sm:p-8 rounded-xl w-full max-w-sm mx-4 sm:mx-auto" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)'}}>
          <h1 className="text-xl font-bold mb-1" style={{color: '#f1f5f9'}}>Change Your Password</h1>
          <p className="text-xs mb-5" style={{color: '#64748b'}}>For security, please set a new password before continuing.</p>
          {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
          <input type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={e => setNewPw(e.target.value)}
            className="w-full mb-3 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} autoFocus />
          <input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
            className="w-full mb-4 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
          <button type="submit" disabled={changingPw}
            className="w-full py-2 rounded-lg font-medium disabled:opacity-50" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>
            {changingPw ? 'Changing...' : 'Set New Password'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="container-login-screen" style={{background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)', animation: 'gradientShift 20s ease infinite', backgroundSize: '200% 200%'}}>
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-xl w-full max-w-sm mx-4 sm:mx-auto" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)'}}>
        <h1 className="text-2xl font-bold mb-1" style={{color: '#f1f5f9'}}>Friday Admin</h1>
        <p className="text-sm mb-6 h-5" style={{color: '#6395ff', opacity: 0.8}}>{tagline}</p>
        {error && <div className="mb-4 p-3 rounded text-sm" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{error}</div>}
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full mb-3 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} autoFocus />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          data-testid="input-login-password"
          className="w-full mb-4 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}} />
        <button type="submit" disabled={loading}
          data-testid="btn-login"
          className="w-full py-2 rounded-lg font-medium disabled:opacity-50" style={{background: 'rgba(99,149,255,0.2)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)'}}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
