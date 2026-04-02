'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  const [bugSubmitting, setBugSubmitting] = useState(false)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Capture screenshot when modal opens
  useEffect(() => {
    if (!bugReportOpen) return
    let cancelled = false
    setCapturing(true)
    setScreenshotData(null)

    // Dynamic import to avoid SSR issues
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(document.body, {
        useCORS: true,
        scale: 0.5, // Half resolution to reduce payload
        logging: false,
        backgroundColor: '#0d1117',
      }).then(canvas => {
        if (!cancelled) {
          setScreenshotData(canvas.toDataURL('image/jpeg', 0.6))
          setCapturing(false)
        }
      }).catch(() => {
        if (!cancelled) setCapturing(false)
      })
    }).catch(() => {
      if (!cancelled) setCapturing(false)
    })

    return () => { cancelled = true }
  }, [bugReportOpen])

  const handleSubmit = async () => {
    if (!bugWhat.trim()) return
    setBugSubmitting(true)
    try {
      await apiFetch('/api/bug-reports', {
        method: 'POST',
        body: JSON.stringify({
          what: bugWhat,
          expected: bugExpect || null,
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
        onClick={() => { setBugReportOpen(true); setBugWhat(''); setBugExpect(''); }}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{background: 'rgba(99,149,255,0.15)', border: '1px solid rgba(99,149,255,0.3)', color: '#6395ff', fontSize: '18px'}}
        title="Report a bug"
        data-testid="btn-bug-report"
      >🐛</button>

      {/* Bug report modal */}
      {bugReportOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => setBugReportOpen(false)}>
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
