'use client'
import React from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

interface SendConfirmData {
  draftId: string
  guestName: string
  property: string
  channel: string
  preview: string
}

interface SendConfirmModalProps {
  sendConfirm: SendConfirmData | null
  setSendConfirm: (v: SendConfirmData | null) => void
  sendChannel: string
  setSendChannel: (v: string) => void
  executeSend: (draftId: string) => void
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
  return (
    <>
      {/* Send confirmation modal */}
      {sendConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'}}>
          <div className="rounded-xl p-6 max-w-md mx-4" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center mb-3">
              <PaperAirplaneIcon className="h-6 w-6 mr-2" style={{color: '#4ade80'}} />
              <h3 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>Confirm Send</h3>
            </div>
            <p className="text-sm mb-3" style={{color: '#94a3b8'}}>
              Send this reply to <strong style={{color: '#f1f5f9'}}>{sendConfirm.guestName}</strong> at <strong style={{color: '#f1f5f9'}}>{sendConfirm.property}</strong>?
            </p>
            <div className="mb-3">
              <label className="text-xs font-medium block mb-1" style={{color: '#64748b'}}>Send via:</label>
              <select value={sendChannel} onChange={e => setSendChannel(e.target.value)}
                className="w-full text-sm rounded px-2 py-1.5 outline-none" style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9'}}>
                <option value="airbnb" style={{background: '#1a1a2e'}}>Airbnb</option>
                <option value="booking" style={{background: '#1a1a2e'}}>Booking.com</option>
                <option value="whatsapp" style={{background: '#1a1a2e'}}>WhatsApp</option>
                <option value="email" style={{background: '#1a1a2e'}}>Email</option>
                <option value="direct" style={{background: '#1a1a2e'}}>Direct</option>
              </select>
              {sendChannel === 'booking' && <p className="text-xs mt-1" style={{color: '#64748b'}}>Booking.com messages delivered via Guesty email integration</p>}
              {sendChannel === 'direct' && <p className="text-xs mt-1" style={{color: '#64748b'}}>Direct booking guests receive message via email</p>}
            </div>
            <div className="p-2 rounded text-xs mb-4" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0'}}>
              {sendConfirm.preview}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => executeSend(sendConfirm.draftId)}
                className="flex-1 px-3 py-2 text-sm rounded-lg font-medium" style={{background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)'}}>
                Confirm Send
              </button>
              <button onClick={() => setSendConfirm(null)}
                className="flex-1 px-3 py-2 text-sm rounded-lg" style={{background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo send countdown bar */}
      {undoDraftId && undoCountdown > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl flex items-center space-x-4" style={{background: 'rgba(15,25,50,0.95)', border: '1px solid rgba(245,158,11,0.3)', backdropFilter: 'blur(12px)'}}>
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
