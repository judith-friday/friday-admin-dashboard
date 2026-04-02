'use client'

import React, { useState } from 'react'
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { InboxStats, clearToken } from './types'

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
}

function rtColor(mins?: number) {
  if (!mins && mins !== 0) return '#64748b'
  if (mins <= 15) return '#4ade80'
  if (mins <= 60) return '#fbbf24'
  return '#f87171'
}

export default function DashboardStats({
  stats, pollerStatus, displayName, setTokenState,
  toggleMute, isMuted, showTeachingsPanel, setShowTeachingsPanel,
  fetchTeachings, setShowHelp,
}: DashboardStatsProps) {
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false)

  return (
    <header data-testid="container-stats-bar" style={{background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
      <div className="px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-base sm:text-xl font-bold" style={{color: '#f1f5f9'}}>Friday GMS</h1>
              <p className="text-xs hidden sm:block" style={{color: '#64748b'}}>Guest Messaging System</p>
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
                  {stats.avg_response_time_minutes != null ? `${stats.avg_response_time_minutes} min` : '\u2014'}
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
              <button data-testid="btn-help" onClick={() => setShowHelp(true)} className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>?</button>
            </div>
          )}

          {/* Mobile action buttons (always visible) */}
          <div className="flex sm:hidden items-center gap-1">
            <button onClick={toggleMute} className="p-1.5 rounded" style={{color: '#64748b'}} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
            </button>
            <button onClick={() => { clearToken(); setTokenState(null) }}
              className="text-xs px-2 py-1 rounded" style={{color: '#64748b'}}>Logout</button>
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
                {stats.avg_response_time_minutes != null ? `${stats.avg_response_time_minutes}m` : '\u2014'}
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
            <div className="col-span-4 flex justify-center gap-2 mt-1">
              <button onClick={() => { setShowTeachingsPanel(!showTeachingsPanel); if (!showTeachingsPanel) fetchTeachings() }} className="px-2 py-1 rounded text-xs" style={{background: 'rgba(168,85,247,0.1)', color: '#c084fc'}}>{'\uD83E\uDDE0'} Teachings</button>
              <button data-testid="btn-help-mobile" onClick={() => setShowHelp(true)} className="px-2 py-1 rounded text-xs" style={{background: 'rgba(99,149,255,0.15)', color: '#6395ff'}}>? Help</button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
