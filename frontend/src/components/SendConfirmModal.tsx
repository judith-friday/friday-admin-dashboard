'use client'
import React, { useState } from 'react'

export type LearnMode = 'learn' | 'no_learn' | 'normal'
export type LearnScope = 'global' | 'property'

interface LearnDecisionData {
  draftId: string
  guestName: string
  property: string
  channel: string
  preview: string
}

interface SendConfirmModalProps {
  sendConfirm: LearnDecisionData | null
  setSendConfirm: (v: LearnDecisionData | null) => void
  sendChannel: string
  setSendChannel: (v: string) => void
  executeSend: (draftId: string, learnMode: LearnMode, scope?: LearnScope) => void
  undoDraftId: string | null
  undoCountdown: number
  cancelSend: () => void
}

export default function SendConfirmModal({
  sendConfirm,
  setSendConfirm,
  sendChannel,
  setSendChannel,
  executeSend,
  undoDraftId,
  undoCountdown,
  cancelSend,
}: SendConfirmModalProps) {
  const [step, setStep] = useState<'decide' | 'scope'>('decide')

  const handleClose = () => {
    setSendConfirm(null)
    setStep('decide')
  }

  const handleLearn = () => {
    setStep('scope')
  }

  const handleScopeSelect = (scope: LearnScope) => {
    if (!sendConfirm) return
    executeSend(sendConfirm.draftId, 'learn', scope)
    setStep('decide')
  }

  const handleNoLearn = () => {
    if (!sendConfirm) return
    executeSend(sendConfirm.draftId, 'no_learn')
    setStep('decide')
  }

  const handleJustSend = () => {
    if (!sendConfirm) return
    executeSend(sendConfirm.draftId, 'normal')
    setStep('decide')
  }

  return (
    <>
      {/* Learn Decision Modal */}
      {sendConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}>
          <div className="rounded-xl p-6 max-w-md mx-4 w-full" data-testid="modal-learn-decision" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}}>

            {step === 'decide' ? (
              <>
                <p className="text-sm mb-4" style={{color: '#94a3b8'}}>
                  Before sending to <strong style={{color: '#f1f5f9'}}>{sendConfirm.guestName}</strong>, should Judith learn from how this draft was handled?
                </p>
                <div className="flex flex-col gap-2 mb-3">
                  <button
                    data-testid="btn-learn"
                    onClick={handleLearn}
                    className="w-full px-4 py-3 text-sm rounded-lg text-left font-medium"
                    style={{background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'}}>
                    📚 Learn from this
                  </button>
                  <button
                    data-testid="btn-no-learn"
                    onClick={handleNoLearn}
                    className="w-full px-4 py-3 text-sm rounded-lg text-left font-medium"
                    style={{background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)'}}>
                    🚫 Don't learn
                  </button>
                  <button
                    data-testid="btn-just-send"
                    onClick={handleJustSend}
                    className="w-full px-4 py-3 text-sm rounded-lg text-left font-medium"
                    style={{background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)'}}>
                    ✉️ Just send
                  </button>
                </div>
                <button
                  data-testid="btn-cancel-learn"
                  onClick={handleClose}
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)'}}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-sm mb-4" style={{color: '#94a3b8'}}>
                  How should Judith learn this?
                </p>
                <div className="flex flex-col gap-2 mb-3">
                  <button
                    data-testid="btn-scope-global"
                    onClick={() => handleScopeSelect('global')}
                    className="w-full px-4 py-3 text-sm rounded-lg text-left font-medium"
                    style={{background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)'}}>
                    🌍 Apply to all properties
                  </button>
                  <button
                    data-testid="btn-scope-property"
                    onClick={() => handleScopeSelect('property')}
                    className="w-full px-4 py-3 text-sm rounded-lg text-left font-medium"
                    style={{background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)'}}>
                    🏠 Apply to {sendConfirm.property || 'this property'} only
                  </button>
                </div>
                <button
                  data-testid="btn-back-scope"
                  onClick={() => setStep('decide')}
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{background: 'rgba(255,255,255,0.06)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)'}}>
                  ← Back
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* Undo send countdown bar */}
      {undoDraftId && undoCountdown > 0 && (
        <div className="fixed left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl flex items-center space-x-4" style={{bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))', background: 'rgba(15,25,50,0.95)', border: '1px solid rgba(245,158,11,0.3)', backdropFilter: 'blur(12px)'}}>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3" style={{background: 'rgba(245,158,11,0.2)', color: '#fbbf24'}}>{undoCountdown}</div>
            <span className="text-sm" style={{color: '#f1f5f9'}}>Sending in {undoCountdown}s...</span>
          </div>
          <button onClick={cancelSend}
            className="px-4 py-1.5 text-sm rounded-lg font-medium" style={{background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)'}}>
            Undo
          </button>
        </div>
      )}
    </>
  )
}
