'use client'

import React, { useState } from 'react'
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { InboxStats, clearToken } from './types'
import { useInstallPrompt } from './useInstallPrompt'
import { toast } from 'react-hot-toast'
import InstallInstructions from './InstallInstructions'
import NotificationBell, { Notification } from './NotificationBell'
import { trackEvent } from '../lib/analytics'

interface DashboardStatsProps {
  stats: InboxStats | null
  pollerStatus: {api_down: boolean; send_queue_length: number} | null
  queueCount: number
  displayName: string
  setTokenState: (v: null) => void
  toggleMute: () => void
  isMuted: boolean
  showTeachingsPanel: boolean
  setShowTeachingsPanel: (v: boolean) => void
  setShowHelp: (v: boolean) => void
  showBugReportsPanel: boolean
  setShowBugReportsPanel: (v: boolean) => void
  notifications: Notification[]
  onNotificationClick: (n: Notification) => void
  onMarkAllRead: () => void
  showNotificationPanel: boolean
  setShowNotificationPanel: (v: boolean) => void
  showAnalytics: boolean
  setShowAnalytics: (v: boolean) => void
  showSendQueue: boolean
  setShowSendQueue: (v: boolean) => void
  setShowUserMgmt: (v: boolean) => void
}

function rtColor(mins?: number) {
  if (!mins && mins !== 0) return '#64748b'
  if (mins <= 15) return '#4ade80'
  if (mins <= 60) return '#fbbf24'
  return '#f87171'
}

function formatResponseTime(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function DashboardStats({
  stats, pollerStatus, queueCount, displayName, setTokenState,
  toggleMute, isMuted, showTeachingsPanel, setShowTeachingsPanel,
  setShowHelp, showBugReportsPanel, setShowBugReportsPanel,
  notifications, onNotificationClick, onMarkAllRead,
  showNotificationPanel, setShowNotificationPanel,
  showAnalytics, setShowAnalytics,
  showSendQueue, setShowSendQueue,
  setShowUserMgmt,
}: DashboardStatsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const { canInstall, installed, triggerInstall, resetDismissal } = useInstallPrompt()

  return (
    <header data-testid="container-stats-bar" style={{background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 50, overflow: 'visible', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)'}}>
      <div className="px-3 sm:px-6 py-1.5 sm:py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <img src="/assets/friday-logo-white.png" alt="Friday" className="h-5 sm:h-7 w-auto" />
            </div>
          </div>

          {/* Desktop stats + controls */}
          {stats && (
            <div className="hidden sm:flex space-x-5 items-center flex-wrap gap-y-1">
              <div className="text-center">
                <div className="text-lg font-bold" style={{color: '#fbbf24'}}>{stats.needs_review_count}</div>
                <div className="text-xs" style={{color: '#64748b'}}>to review</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" title="Median of per-conversation average response times over the last 30 days" style={{color: stats.avg_response_time_minutes != null ? rtColor(stats.avg_response_time_minutes) : '#64748b'}}>
                  {stats.avg_response_time_minutes != null ? formatResponseTime(stats.avg_response_time_minutes) : '\u2014'}
                </div>
                <div className="text-xs" style={{color: '#64748b'}}>Team RT</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{color: '#6395ff'}}>{stats.messages_today}</div>
                <div className="text-xs" style={{color: '#64748b'}}>new today</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{color: stats.overdue_actions_count > 0 ? '#f87171' : stats.pending_actions_count > 0 ? '#fbbf24' : '#4ade80'}}>
                  {stats.pending_actions_count}
                </div>
                <div className="text-xs" style={{color: '#64748b'}}>
                  {stats.pending_actions_count === 1 ? 'action' : 'actions'} {stats.overdue_actions_count > 0 && <span style={{color: '#f87171'}}>({stats.overdue_actions_count} overdue)</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-1">
              {pollerStatus && pollerStatus.api_down && (
                <button onClick={() => setShowSendQueue(true)} className="text-xs px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}} title="Guesty API is down \u2014 click to view send queue">{'\u26A0'} API Down</button>
              )}
              <button onClick={() => setShowSendQueue(true)} className="relative px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{background: queueCount > 0 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', color: queueCount > 0 ? '#fbbf24' : '#64748b'}}
                title="Message queue">
                {'\uD83D\uDCE4'}
                {queueCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center rounded-full text-white font-bold" style={{minWidth: '16px', height: '16px', fontSize: '10px', padding: '0 3px', background: '#f59e0b', lineHeight: 1}}>
                    {queueCount > 99 ? '99+' : queueCount}
                  </span>
                )}
              </button>
              </div>
              <button onClick={() => { clearToken(); setTokenState(null) }}
                className="text-xs ml-4" style={{color: '#64748b'}}>{displayName} {'\u00B7'} Logout</button>
              <NotificationBell notifications={notifications} onNotificationClick={onNotificationClick} onMarkAllRead={onMarkAllRead} />
              {/* M9: Sound toggle hidden until Sprint 6 (push notifications not reliable yet)
              <button onClick={toggleMute} className="ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded" style={{color: '#64748b'}} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
              </button>
              */}
              <button onClick={() => { if (!showTeachingsPanel) trackEvent('panel_opened', { panel: 'teachings' }); setShowTeachingsPanel(!showTeachingsPanel) }} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(168,85,247,0.1)', color: '#c084fc'}} title="Knowledge & Rules">{'\uD83E\uDDE0'}</button>
              <button onClick={() => setShowBugReportsPanel(!showBugReportsPanel)} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.1)', color: '#f87171'}} title="Bug Reports">{'\u{1F41B}'}</button>
              <button onClick={() => { trackEvent('panel_opened', { panel: 'analytics' }); setShowAnalytics(true) }} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.1)', color: '#6395ff'}} title="Analytics">{'\u{1F4CA}'}</button>
              <button onClick={() => setShowUserMgmt(true)} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(99,149,255,0.1)', color: '#94a3b8'}} title="User Management">{'\u{1F465}'}</button>
              <button onClick={() => window.location.reload()} className="ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded" style={{color: '#64748b'}} title="Refresh app">
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button data-testid="btn-help" onClick={() => setShowHelp(true)} className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}} title="Help">?</button>
              {!installed && (
                <span data-install-button><button onClick={async () => { resetDismissal(); if (canInstall) { await triggerInstall() } else { if (!installed) setShowInstallHelp(true) } }} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(14,165,233,0.1)', color: '#38bdf8'}} title="Install App">{'\u{1F4F2}'}</button></span>
              )}
            </div>
          )}

          {/* Mobile hamburger menu */}
          <div className="flex sm:hidden items-center relative">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded" style={{color: '#94a3b8'}} title="Menu">
              {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-lg py-1 z-[999]" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'}}>
                {/* Group 1: Core features */}
                <button onClick={() => { trackEvent('panel_opened', { panel: 'notifications' }); setShowNotificationPanel(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#fbbf24'}}>
                  <span>{'\uD83D\uDD14'}</span> Notifications
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full text-white font-bold" style={{minWidth: '18px', height: '18px', fontSize: '11px', padding: '0 4px', background: '#ef4444', lineHeight: 1}}>
                      {notifications.filter(n => !n.read).length > 99 ? '99+' : notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                <button onClick={() => { if (!showTeachingsPanel) trackEvent('panel_opened', { panel: 'teachings' }); setShowTeachingsPanel(!showTeachingsPanel); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#c084fc'}}>
                  <span>{'\uD83E\uDDE0'}</span> Knowledge & Rules
                </button>
                {/* Group 2: Secondary */}
                <div style={{borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.25rem 0'}} />
                  <button onClick={() => { trackEvent('panel_opened', { panel: 'analytics' }); setShowAnalytics(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#6395ff'}}>
                  <span>{'\u{1F4CA}'}</span> Analytics
                </button>
              <button onClick={() => { setShowSendQueue(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: queueCount > 0 ? '#fbbf24' : '#64748b'}}>
                  <span>{'\uD83D\uDCE4'}</span> {queueCount > 0 ? `Queue (${queueCount})` : 'Queue'}
                </button>
              <button onClick={() => { setShowBugReportsPanel(!showBugReportsPanel); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#f87171'}}>
                  <span>{'\u{1F41B}'}</span> Bug Reports
                </button>
              <button onClick={() => { setShowUserMgmt(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#94a3b8'}}>
                  <span>{'\u{1F465}'}</span> Users
                </button>
                <button onClick={() => { setShowHelp(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#6395ff'}}>
                  <span>?</span> Help
                </button>
                {!installed && (
                  <span data-install-button><button onClick={async () => { resetDismissal(); if (canInstall) { await triggerInstall() } else { if (!installed) setShowInstallHelp(true) }; setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#38bdf8'}}>
                    <span>{'\u{1F4F2}'}</span> Install App
                  </button></span>
                )}
                {/* M9: Sound toggle hidden until Sprint 6 (push notifications not reliable yet)
                <button onClick={() => { toggleMute(); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#e2e8f0'}}>
                  {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                */}
                <button onClick={() => window.location.reload()} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#94a3b8'}}>
                  <ArrowPathIcon className="h-4 w-4" /> Refresh
                </button>
                {/* Group 3: Session */}
                <div style={{borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.25rem 0'}} />
                <button onClick={() => { clearToken(); setTokenState(null) }} className="w-full text-left px-4 py-2.5 text-sm" style={{color: '#f87171'}}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
      <InstallInstructions show={showInstallHelp} onClose={() => setShowInstallHelp(false)} />
    </header>
  )
}
