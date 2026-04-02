'use client'

import React, { useState } from 'react'
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { InboxStats, clearToken } from './types'
import { useInstallPrompt } from './useInstallPrompt'
import { toast } from 'react-hot-toast'

interface DashboardStatsProps {
  stats: InboxStats | null
  pollerStatus: {api_down: boolean; send_queue_length: number} | null
  displayName: string
  setTokenState: (v: null) => void
  toggleMute: () => void
  isMuted: boolean
  showTeachingsPanel: boolean
  setShowTeachingsPanel: (v: boolean) => void
  fetchTeachings: () => void
  setShowHelp: (v: boolean) => void
  showBugReportsPanel: boolean
  setShowBugReportsPanel: (v: boolean) => void
  showLearningQueue: boolean
  setShowLearningQueue: (v: boolean) => void
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
  stats, pollerStatus, displayName, setTokenState,
  toggleMute, isMuted, showTeachingsPanel, setShowTeachingsPanel,
  fetchTeachings, setShowHelp, showBugReportsPanel, setShowBugReportsPanel,
  showLearningQueue, setShowLearningQueue,
}: DashboardStatsProps) {
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { canInstall, installed, triggerInstall, resetDismissal } = useInstallPrompt()

  return (
    <header data-testid="container-stats-bar" style={{background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 50}}>
      <div className="px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-base sm:text-xl font-bold" style={{color: '#f1f5f9'}}>Friday Admin Dashboard</h1>
            </div>
            {/* Mobile compact stats: just the review count inline */}
            {stats && (
              <div className="flex sm:hidden items-center gap-2 ml-2">
                <span className="text-sm font-bold" style={{color: '#fbbf24'}}>{stats.needs_review_count}</span>
                <span className="text-xs" style={{color: '#64748b'}}>review</span>
                {stats.pending_actions_count > 0 && (
                  <>
                    <span className="text-sm font-bold" style={{color: stats.overdue_actions_count > 0 ? '#f87171' : '#fbbf24'}}>{stats.pending_actions_count}</span>
                    <span className="text-xs" style={{color: '#64748b'}}>actions</span>
                  </>
                )}
                <button onClick={() => setMobileStatsOpen(!mobileStatsOpen)} className="p-1" style={{color: '#64748b'}}>
                  {mobileStatsOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Desktop stats + controls */}
          {stats && (
            <div className="hidden sm:flex space-x-5 items-center flex-wrap gap-y-1">
              <div className="text-center">
                <div className="text-lg font-bold" style={{color: '#fbbf24'}}>{stats.needs_review_count}</div>
                <div className="text-xs" style={{color: '#64748b'}}>to review</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold" style={{color: stats.avg_response_time_minutes != null ? rtColor(stats.avg_response_time_minutes) : '#64748b'}}>
                  {stats.avg_response_time_minutes != null ? formatResponseTime(stats.avg_response_time_minutes) : '\u2014'}
                </div>
                <div className="text-xs" style={{color: '#64748b'}}>avg response</div>
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
              {pollerStatus && pollerStatus.api_down && (
                <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}} title="Guesty API is down \u2014 messages queued for browser fallback">{'\u26A0'} API Down</span>
              )}
              {pollerStatus && pollerStatus.send_queue_length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(251,191,36,0.15)', color: '#fbbf24'}} title={`${pollerStatus.send_queue_length} message(s) queued for sending`}>{'\uD83D\uDCE4'} {pollerStatus.send_queue_length} queued</span>
              )}
              <button onClick={() => { clearToken(); setTokenState(null) }}
                className="text-xs ml-4" style={{color: '#64748b'}}>{displayName} {'\u00B7'} Logout</button>
              <button onClick={toggleMute} className="ml-2 p-1 rounded" style={{color: '#64748b'}} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
              </button>
              <button onClick={() => { setShowTeachingsPanel(!showTeachingsPanel); if (!showTeachingsPanel) fetchTeachings() }} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(168,85,247,0.1)', color: '#c084fc'}} title="Teachings">{'\uD83E\uDDE0'}</button>
              <button onClick={() => setShowBugReportsPanel(!showBugReportsPanel)} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(239,68,68,0.1)', color: '#f87171'}} title="Bug Reports">{'\u{1F41B}'}</button>
              <button onClick={() => setShowLearningQueue(!showLearningQueue)} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(34,197,94,0.1)', color: '#4ade80'}} title="Learning Queue">{'\u{1F9EA}'}</button>
              <button data-testid="btn-help" onClick={() => setShowHelp(true)} className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>?</button>
              {!installed && (
                <button onClick={async () => { resetDismissal(); if (canInstall) { await triggerInstall() } else { toast('Open in Chrome/Edge on mobile to install as an app', { icon: '📲' }) } }} className="ml-1 px-1.5 py-0.5 rounded text-xs" style={{background: 'rgba(14,165,233,0.1)', color: '#38bdf8'}} title="Install App">{'\u{1F4F2}'}</button>
              )}
            </div>
          )}

          {/* Mobile hamburger menu */}
          <div className="flex sm:hidden items-center relative">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded" style={{color: '#94a3b8'}} title="Menu">
              {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-lg py-1 z-50" style={{background: 'rgba(15,25,50,0.97)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'}}>
                <button onClick={() => { toggleMute(); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#e2e8f0'}}>
                  {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                <button onClick={() => { setShowTeachingsPanel(!showTeachingsPanel); if (!showTeachingsPanel) fetchTeachings(); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#c084fc'}}>
                  <span>{'\uD83E\uDDE0'}</span> Teachings
                </button>
                <button onClick={() => { setShowBugReportsPanel(!showBugReportsPanel); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#f87171'}}>
                  <span>{'\u{1F41B}'}</span> Bug Reports
                </button>
                <button onClick={() => { setShowLearningQueue(!showLearningQueue); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#4ade80'}}>
                  <span>{'\u{1F9EA}'}</span> Learning Queue
                </button>
                <button onClick={() => { setShowHelp(true); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#6395ff'}}>
                  <span>?</span> Help
                </button>
                {!installed && (
                  <button onClick={async () => { resetDismissal(); if (canInstall) await triggerInstall(); setMobileMenuOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2" style={{color: '#38bdf8'}}>
                    <span>{'\u{1F4F2}'}</span> Install App
                  </button>
                )}
                <div style={{borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.25rem 0'}} />
                <button onClick={() => { clearToken(); setTokenState(null) }} className="w-full text-left px-4 py-2.5 text-sm" style={{color: '#f87171'}}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile expanded stats panel */}
        {mobileStatsOpen && stats && (
          <div className="sm:hidden mt-2 pt-2 grid grid-cols-4 gap-2 text-center" style={{borderTop: '1px solid rgba(255,255,255,0.06)'}}>
            <div>
              <div className="text-sm font-bold" style={{color: '#fbbf24'}}>{stats.needs_review_count}</div>
              <div className="text-[10px]" style={{color: '#64748b'}}>review</div>
            </div>
            <div>
              <div className="text-sm font-bold" style={{color: stats.avg_response_time_minutes != null ? rtColor(stats.avg_response_time_minutes) : '#64748b'}}>
                {stats.avg_response_time_minutes != null ? formatResponseTime(stats.avg_response_time_minutes) : '\u2014'}
              </div>
              <div className="text-[10px]" style={{color: '#64748b'}}>avg RT</div>
            </div>
            <div>
              <div className="text-sm font-bold" style={{color: '#6395ff'}}>{stats.messages_today}</div>
              <div className="text-[10px]" style={{color: '#64748b'}}>today</div>
            </div>
            <div>
              <div className="text-sm font-bold" style={{color: stats.overdue_actions_count > 0 ? '#f87171' : stats.pending_actions_count > 0 ? '#fbbf24' : '#4ade80'}}>
                {stats.pending_actions_count}
              </div>
              <div className="text-[10px]" style={{color: '#64748b'}}>actions</div>
            </div>
            {pollerStatus && pollerStatus.api_down && (
              <div className="col-span-4">
                <span className="text-xs px-2 py-0.5 rounded" style={{background: 'rgba(239,68,68,0.15)', color: '#f87171'}}>{'\u26A0'} API Down</span>
              </div>
            )}
            {/* Teachings and Help accessible via hamburger menu */}
          </div>
        )}
      </div>
    </header>
  )
}
