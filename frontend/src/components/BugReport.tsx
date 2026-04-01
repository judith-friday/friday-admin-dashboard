'use client'

import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import { apiFetch } from './types'

interface BugReportProps {
  selectedConvId: string | null
  displayName: string
}

export default function BugReport({ selectedConvId, displayName }: BugReportProps) {
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [bugWhat, setBugWhat] = useState('')
  const [bugExpect, setBugExpect] = useState('')
  const [bugCopied, setBugCopied] = useState(false)
  const [bugSubmitting, setBugSubmitting] = useState(false)

  return (
    <>
      {/* Floating bug report button */}
      <button
        onClick={() => { setBugReportOpen(true); setBugWhat(''); setBugExpect(''); setBugCopied(false); }}
        className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{background: 'rgba(99,149,255,0.15)', border: '1px solid rgba(99,149,255,0.3)', color: '#6395ff', fontSize: '18px'}}
        title="Report a bug"
      >🐛</button>

      {/* Bug report modal */}
      {bugReportOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}} onClick={() => setBugReportOpen(false)}>
          <div className="rounded-xl p-6 max-w-md mx-4 w-full" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>🐛 Report a Bug</h3>
              <button onClick={() => setBugReportOpen(false)} className="text-sm" style={{color: '#64748b'}}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>What happened? *</label>
                <input type="text" value={bugWhat} onChange={e => setBugWhat(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoComplete="off"
                  placeholder="e.g. Draft didn't generate for new message"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>What did you expect? (optional)</label>
                <input type="text" value={bugExpect} onChange={e => setBugExpect(e.target.value)}
                  onKeyDown={e => e.stopPropagation()}
                  autoComplete="off"
                  placeholder="e.g. A draft should have appeared in the review panel"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9'}} />
              </div>
              <div style={{display: bugWhat.length > 0 ? 'block' : 'none'}}>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{color: '#94a3b8'}}>Bug Report (copy and paste in #fr-gms-feedback)</label>
                  <textarea readOnly value={[
                    '🐛 BUG REPORT',
                    '─'.repeat(30),
                    'What happened: ' + bugWhat,
                    bugExpect ? 'Expected: ' + bugExpect : '',
                    '─'.repeat(30),
                    'Page: ' + (typeof window !== 'undefined' ? window.location.href : 'unknown'),
                    'User: ' + (displayName || 'unknown'),
                    'Conversation: ' + (selectedConvId || 'none'),
                    'Time: ' + new Date().toISOString(),
                    'Browser: ' + (typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown'),
                  ].filter(Boolean).join('\n')}
                    className="w-full text-xs font-mono rounded-lg p-3" rows={8}
                    style={{background: 'rgba(0,0,0,0.3)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)', resize: 'none'}} />
                  <button onClick={() => {
                    const report = [
                      '🐛 BUG REPORT',
                      '─'.repeat(30),
                      'What happened: ' + bugWhat,
                      bugExpect ? 'Expected: ' + bugExpect : '',
                      '─'.repeat(30),
                      'Page: ' + (typeof window !== 'undefined' ? window.location.href : 'unknown'),
                      'User: ' + (displayName || 'unknown'),
                      'Conversation: ' + (selectedConvId || 'none'),
                      'Time: ' + new Date().toISOString(),
                      'Browser: ' + (typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown'),
                    ].filter(Boolean).join('\n');
                    navigator.clipboard.writeText(report);
                    setBugCopied(true);
                    setTimeout(() => setBugCopied(false), 2000);
                  }} className="mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{background: bugCopied ? 'rgba(34,197,94,0.2)' : 'rgba(99,149,255,0.15)', color: bugCopied ? '#22c55e' : '#6395ff', border: bugCopied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(99,149,255,0.3)'}}>
                    {bugCopied ? '✅ Copied! Paste in #fr-gms-feedback' : '📋 Copy to clipboard'}
                  </button>
                  <button disabled={bugSubmitting} onClick={async () => {
                    setBugSubmitting(true);
                    try {
                      await apiFetch('/api/bug-reports', {
                        method: 'POST',
                        body: JSON.stringify({
                          what: bugWhat,
                          expected: bugExpect || null,
                          page: typeof window !== 'undefined' ? window.location.href : 'unknown',
                          conversation_id: selectedConvId || null,
                          browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'unknown',
                        })
                      });
                      toast.success('Bug report sent \u2014 Ishant has been notified');
                      setBugReportOpen(false);
                    } catch (err: any) {
                      toast.error('Failed to submit: ' + err.message);
                    } finally {
                      setBugSubmitting(false);
                    }
                  }} className="mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff', border: '1px solid rgba(99,149,255,0.3)', opacity: bugSubmitting ? 0.5 : 1}}>
                    {bugSubmitting ? 'Sending...' : '📨 Submit & Notify Ishant'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
