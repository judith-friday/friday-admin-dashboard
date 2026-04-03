'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'

export interface Notification {
  id: string
  type: 'new_message' | 'draft_ready' | 'pending_action' | 'reservation'
  title: string
  subtitle: string
  preview: string
  conversationId: string
  timestamp: number
  read: boolean
}

interface NotificationBellProps {
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

export default function NotificationBell({ notifications, onNotificationClick, onMarkAllRead }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleClick = useCallback((n: Notification) => {
    onNotificationClick(n)
    setOpen(false)
  }, [onNotificationClick])

  return (
    <div ref={ref} className="relative" style={{ zIndex: 100 }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded"
        style={{ color: '#64748b' }}
        title="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full text-white font-bold"
            style={{
              top: '4px',
              right: '4px',
              minWidth: '18px',
              height: '18px',
              fontSize: '11px',
              padding: '0 4px',
              background: '#ef4444',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden"
          style={{
            background: 'rgba(15, 25, 50, 0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            width: 'min(380px, calc(100vw - 32px))',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs"
                style={{ color: '#6395ff' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: '#64748b' }}>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(99,149,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(99,149,255,0.05)')}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{ICON_MAP[n.type] || '\u{1F514}'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: n.read ? '#94a3b8' : '#f1f5f9' }}>
                        {n.title}
                      </span>
                      <span className="text-xs flex-shrink-0" style={{ color: '#64748b' }}>
                        {timeAgo(n.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{n.subtitle}</div>
                    {n.preview && (
                      <div className="text-xs truncate mt-0.5" style={{ color: '#94a3b8' }}>
                        {n.preview}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: '#6395ff' }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
