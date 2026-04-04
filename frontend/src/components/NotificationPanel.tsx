'use client'

import React, { useEffect } from 'react'
import { Notification } from './NotificationBell'

interface NotificationPanelProps {
  show: boolean
  onClose: () => void
  notifications: Notification[]
  onNotificationClick: (n: Notification) => void
  onMarkAllRead: () => void
}

const ICON_MAP: Record<string, string> = {
  new_message: '\u{1F4E9}',
  draft_ready: '\u{1F4DD}',
  pending_action: '\u{26A1}',
  reservation: '\u{1F514}',
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationPanel({ show, onClose, notifications, onNotificationClick, onMarkAllRead }: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [show])

  if (!show) return null

  const handleClick = (n: Notification) => {
    onNotificationClick(n)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex" style={{paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)'}}>
      {/* Backdrop (visible on md+ if ever used there) */}
      <div className="flex-1 hidden md:block" style={{background: 'rgba(0,0,0,0.4)'}} onClick={onClose} />

      {/* Panel - slides in from right */}
      <div
        className="w-full md:w-[480px] h-full overflow-y-auto custom-scrollbar slide-in-right"
        style={{
          background: '#0d1117',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-4" style={{borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117', paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{color: '#f1f5f9'}}>{'\uD83D\uDD14'} Notifications</h2>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-xs" style={{color: '#6395ff'}}>
                  Mark all read
                </button>
              )}
              <button onClick={onClose} className="text-sm" style={{color: '#64748b'}}>{'\u2715'}</button>
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-xs mt-1" style={{color: '#64748b'}}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Notification list */}
        <div>
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm" style={{color: '#64748b'}}>
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 50).map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="w-full text-left px-4 py-4 flex items-start gap-3 transition-colors"
                style={{
                  background: n.read ? 'transparent' : 'rgba(99,149,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{ICON_MAP[n.type] || '\u{1F514}'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium" style={{color: n.read ? '#94a3b8' : '#f1f5f9'}}>
                      {n.title}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{color: '#64748b'}}>
                      {timeAgo(n.timestamp)}
                    </span>
                  </div>
                  <div className="text-xs mt-1" style={{color: '#64748b'}}>{n.subtitle}</div>
                  {n.preview && (
                    <div className="text-xs mt-1 line-clamp-2" style={{color: '#94a3b8'}}>
                      {n.preview}
                    </div>
                  )}
                </div>
                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-2" style={{background: '#6395ff'}} />
                )}
              </button>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
