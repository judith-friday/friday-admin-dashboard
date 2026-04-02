'use client'

import React, { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface BugReportProps {
  selectedConvId: string | null
  displayName: string
}

// Global console error capture — last 10 errors
const consoleErrors: string[] = []
if (typeof window !== 'undefined') {
  const origError = console.error
  console.error = (...args: any[]) => {
    consoleErrors.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
    if (consoleErrors.length > 10) consoleErrors.shift()
    origError.apply(console, args)
  }
  window.addEventListener('error', (e) => {
    consoleErrors.push(`${e.message} (${e.filename}:${e.lineno})`)
    if (consoleErrors.length > 10) consoleErrors.shift()
  })
  window.addEventListener('unhandledrejection', (e) => {
    consoleErrors.push(`Unhandled rejection: ${e.reason}`)
    if (consoleErrors.length > 10) consoleErrors.shift()
  })
}

export default function BugReport({ selectedConvId, displayName }: BugReportProps) {
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [bugWhat, setBugWhat] = useState('')
  const [bugExpect, setBugExpect] = useState('')
  const [bugSeverity, setBugSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [bugSubmitting, setBugSubmitting] = useState(false)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Capture screenshot BEFORE opening modal (so the modal overlay isn't in the capture)
  const captureAndOpen = async () => {
    setBugWhat('')
    setBugExpect('')
    setBugSeverity('medium')
    setScreenshotData(null)
    setCapturing(true)
    setBugReportOpen(true)

    try {
      const { toJpeg } = await import('html-to-image')
      // Hide the bug report backdrop before capture
      const backdrop = document.querySelector('[data-testid="bug-report-backdrop"]') as HTMLElement | null
      if (backdrop) backdrop.style.display = 'none'
      const dataUrl = await toJpeg(document.body, {
        quality: 0.6,
        pixelRatio: 0.5,
        backgroundColor: '#0d1117',
      })
      if (backdrop) backdrop.style.display = ''
      setScreenshotData(dataUrl)
    } catch (err) {
      console.error('[BugReport] Screenshot capture failed:', err)
    } finally {
      setCapturing(false)
    }
  }

  const handleSubmit = async () => {
    if (!bugWhat.trim()) return
    setBugSubmitting(true)
    try {
      await apiFetch('/api/bug-reports', {
        method: 'POST',
        body: JSON.stringify({
          what: bugWhat,
          expected: bugExpect || null,
          severity: bugSeverity,
          page: typeof window !== 'undefined' ? window.location.href : 'unknown',
          conversation_id: selectedConvId || null,
          browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown',
          screenshot: screenshotData || null,
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
          console_errors: consoleErrors.length > 0 ? [...consoleErrors] : null,
        })
      })
      toast.success('Bug report sent — Ishant has been notified')
      setBugReportOpen(false)
    } catch (err: any) {
      toast.error('Failed to submit: ' + err.message)
    } finally {
      setBugSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating bug report button */}
      <button
        onClick={captureAndOpen}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{background: 'rgba(99,149,255,0.15)', border: '1px solid rgba(99,149,255,0.3)', color: '#6395ff', fontSize: '18px'}}
        title="Report a bug"
        data-testid="btn-bug-report"
      >🐛</button>

      {/* Bug report modal */}
      {bugReportOpen && (
        <div data-testid="bug-report-backdrop" className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => setBugReportOpen(false)}>
          <div className="rounded-xl p-6 max-w-lg mx-4 w-full max-h-[90vh] overflow-y-auto" data-testid="modal-bug-report" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🐛 Report a Bug</h3>
              <button onClick={() => setBugReportOpen(false)} className="text-sm" data-testid="btn-close-bug" style={{color: '#64748b'}}>✕</button>
            </div>

            {/* Screenshot preview */}
            <div ref={imgRef} className="mb-3 rounded-lg overflow-hidden" style={{border: '1px solid rgba(255,255,255,0.08)', maxHeight: '200px', overflowY: 'auto'}}>
              {capturing ? (
                <div className="flex items-center justify-center py-8" style={{color: '#64748b'}}>
                  <span className="text-sm">📸 Capturing screenshot...</span>
                </div>
              ) : screenshotData ? (
                <img src={screenshotData} alt="Screenshot" className="w-full" style={{display: 'block'}} />
              ) : (
                <div className="flex items-center justify-center py-6" style={{color: '#64748b'}}>
                  <span className="text-xs">Screenshot capture failed — report will be sent without it</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>What happened? *</label>
                <input type="text" value={bugWhat} onChange={e => setBugWhat(e.target.value)}
                  onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && bugWhat.trim()) handleSubmit() }}
                  autoComplete="off"
                  autoFocus
                  data-testid="input-bug-what"
                  placeholder="e.g. Draft didn't generate for new message"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>What did you expect? (optional)</label>
                <input type="text" value={bugExpect} onChange={e => setBugExpect(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoComplete="off"
                  data-testid="input-bug-expect"
                  placeholder="e.g. A draft should have appeared in the review panel"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}} />
              </div>

              {/* Severity */}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>Severity</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'critical'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setBugSeverity(s)}
                      className="flex-1 text-xs py-1.5 rounded-lg transition-all"
                      style={{
                        background: bugSeverity === s ? (s === 'critical' ? 'rgba(239,68,68,0.2)' : s === 'high' ? 'rgba(249,115,22,0.2)' : s === 'medium' ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)') : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${bugSeverity === s ? (s === 'critical' ? 'rgba(239,68,68,0.4)' : s === 'high' ? 'rgba(249,115,22,0.4)' : s === 'medium' ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)') : 'rgba(255,255,255,0.08)'}`,
                        color: bugSeverity === s ? '#f1f5f9' : '#64748b',
                      }}>
                      {s === 'critical' ? '\u{1F534}' : s === 'high' ? '\u{1F7E0}' : s === 'medium' ? '\u{1F7E1}' : '\u{1F7E2}'} {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Context info */}
              <div className="text-xs rounded-lg p-2" style={{background: 'rgba(0,0,0,0.2)', color: '#64748b'}}>
                <div>Page: {typeof window !== 'undefined' ? window.location.pathname : '—'}</div>
                <div>Viewport: {typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : '—'}</div>
                {selectedConvId && <div>Conversation: {selectedConvId.slice(0, 8)}...</div>}
                {consoleErrors.length > 0 && <div>Console errors: {consoleErrors.length} captured</div>}
              </div>

              <button disabled={bugSubmitting || !bugWhat.trim()} data-testid="btn-submit-bug" onClick={handleSubmit}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: bugWhat.trim() ? 'rgba(99,149,255,0.2)' : 'rgba(99,149,255,0.08)',
                  color: bugWhat.trim() ? '#6395ff' : '#475569',
                  border: '1px solid rgba(99,149,255,0.3)',
                  opacity: bugSubmitting ? 0.5 : 1,
                  cursor: bugWhat.trim() && !bugSubmitting ? 'pointer' : 'default',
                }}>
                {bugSubmitting ? 'Sending...' : '📨 Submit Bug Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
