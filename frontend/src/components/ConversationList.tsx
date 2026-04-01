'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  ChatBubbleLeftRightIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { Conversation, InboxStats } from './types'
import PendingActionsTab from './PendingActions'

interface ConversationListProps {
  conversations: Conversation[]
  filteredConversations: Conversation[]
  selectedConvId: string | null
  activeTab: 'all' | 'unread' | 'review' | 'open' | 'done' | 'actions'
  setActiveTab: (tab: 'all' | 'unread' | 'review' | 'open' | 'done' | 'actions') => void
  unreadCount: number
  stats: InboxStats | null
  token: string
  mobileView: 'list' | 'detail' | 'info'
  selectConversation: (conv: Conversation) => void
  handleMarkUnread: (convId: string, e?: React.MouseEvent) => void
  fetchPropertyCard: (code: string | undefined) => void
  statusBadge: (conv: Conversation) => React.ReactNode
  channelBadge: (ch?: string) => React.ReactNode
}

export default function ConversationList({
  filteredConversations, selectedConvId, activeTab, setActiveTab,
  unreadCount, stats, token, mobileView,
  selectConversation, handleMarkUnread, fetchPropertyCard,
  statusBadge, channelBadge,
}: ConversationListProps) {
  return (
    <div data-testid="container-inbox" className={`w-80 flex flex-col ${mobileView !== 'list' ? 'hidden md:flex' : 'w-full md:w-80'}`} style={{background: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)'}}>
      {/* Tabs */}
      <div className="flex text-xs tabs-scroll" style={{borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        {([
          ['all', 'All'],
          ['unread', 'Unread'],
          ['review', 'Review'],
          ['open', 'Open'],
          ['done', 'Done'],
          ['actions', 'Actions'],
        ] as [string, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className="flex-1 py-2 text-center transition-all duration-200 ease-in-out hover:bg-white/5" style={{borderBottom: activeTab === key ? '2px solid #6395ff' : '2px solid transparent', color: activeTab === key ? '#6395ff' : '#64748b', fontWeight: activeTab === key ? 500 : 400}}>
            {label}
            {key === 'unread' && unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{background: '#3b82f6', color: 'white'}}>{unreadCount}</span>
            )}
            {key === 'actions' && stats && stats.pending_actions_count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{background: stats.overdue_actions_count > 0 ? '#ef4444' : 'rgba(245,158,11,0.15)', color: stats.overdue_actions_count > 0 ? 'white' : '#fbbf24'}}>
                {stats.pending_actions_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'actions' ? (
        <PendingActionsTab token={token} />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center" style={{color: '#64748b'}}>
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2" style={{color: '#334155'}} />
              <p>No conversations</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div key={conv.id} data-testid={`conversation-${conv.id}`} onClick={() => selectConversation(conv)}
                className="group relative p-3 cursor-pointer transition-all duration-200 ease-in-out" style={{borderBottom: '1px solid rgba(255,255,255,0.03)', background: selectedConvId === conv.id ? 'linear-gradient(90deg, rgba(30,58,95,0.4), transparent)' : 'transparent', borderLeft: selectedConvId === conv.id ? '2px solid #6395ff' : '2px solid transparent', fontWeight: conv.is_unread ? 600 : 400}}>
                {/* Hover action: mark as unread */}
                {!conv.is_unread && (
                  <button onClick={(e) => handleMarkUnread(conv.id, e)}
                    title="Mark as unread"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full z-10" style={{background: 'rgba(255,255,255,0.06)'}}>
                    <EyeSlashIcon className="h-3.5 w-3.5" style={{color: '#64748b'}} />
                  </button>
                )}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    {conv.is_unread && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>}
                    <span className="text-sm truncate" style={{color: '#f1f5f9'}}>{conv.guest_name}</span>
                    {conv.sentiment && conv.sentiment !== 'neutral' && (
                      <span title={conv.sentiment === 'upset' ? 'Guest is upset' : conv.sentiment === 'frustrated' ? 'Guest seems frustrated' : conv.sentiment === 'positive' ? 'Positive sentiment' : conv.sentiment} className="flex-shrink-0 inline-block w-2 h-2 rounded-full" style={{marginLeft: '4px', backgroundColor: conv.sentiment === 'upset' ? '#ef4444' : conv.sentiment === 'frustrated' ? '#f59e0b' : conv.sentiment === 'positive' ? '#22c55e' : '#64748b'}} />
                    )}
                    {conv.channel && channelBadge(conv.channel)}
                  </div>
                  {conv.last_message_at && (
                    <span className="text-xs flex-shrink-0 ml-1" style={{color: '#64748b'}}>
                      {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5 mb-1">
                  {conv.property_name && (
                    <span className="text-xs" style={{color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px'}} onClick={(e) => { e.stopPropagation(); fetchPropertyCard(conv.property_name); }}>{conv.property_name}</span>
                  )}
                  {statusBadge(conv)}
                  {conv.latest_draft_confidence && (() => {
                    const c = Number(conv.latest_draft_confidence)
                    const cbg = c >= 80 ? 'rgba(34,197,94,0.15)' : c >= 60 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
                    const cclr = c >= 80 ? '#4ade80' : c >= 60 ? '#fbbf24' : '#f87171'
                    return <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{background: cbg, color: cclr}}>{c}%</span>
                  })()}
                </div>
                {conv.last_message_body && (
                  <p className="text-xs truncate" style={{color: '#64748b'}}>
                    {conv.last_message_direction === 'outbound' ? '> ' : ''}{conv.last_message_body}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
