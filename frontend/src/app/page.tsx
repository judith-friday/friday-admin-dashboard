'use client'

import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast, Toaster } from 'react-hot-toast'
import axios from 'axios'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XMarkIcon,
  PencilSquareIcon,
  TranslateIcon,
  UserIcon,
  CalendarIcon,
  HomeIcon,
  GlobeAltIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Conversation {
  id: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  reservation_id?: string
  property_name?: string
  check_in?: string
  check_out?: string
  conversation_summary?: string
  language_detected: string
  status: string
  created_at: string
  updated_at: string
  latest_message?: string
  latest_direction?: 'inbound' | 'outbound'
  latest_message_time?: string
  unread_count: number
  messages?: Message[]
}

interface Message {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  content: string
  content_translated?: string
  language: string
  platform: string
  status: string
  ai_suggested_reply?: string
  ai_suggested_reply_translated?: string
  staff_comment?: string
  created_at: string
  sent_at?: string
  workflow_status?: string
  staff_member?: string
  workflow_comment?: string
  workflow_timestamp?: string
}

interface DashboardStats {
  total_conversations: number
  unread_messages: number
  approved_pending: number
  today_conversations: number
}

export default function MessageDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [staffComment, setStaffComment] = useState('')
  const [generatingReply, setGeneratingReply] = useState<string | null>(null)

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE)
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to server')
      toast.success('Connected to real-time updates')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      toast.error('Lost real-time connection')
    })

    newSocket.on('new_conversation', (conversation: Conversation) => {
      setConversations(prev => [conversation, ...prev])
      toast.success(`New conversation from ${conversation.guest_name}`)
    })

    newSocket.on('new_message', (message: Message) => {
      if (selectedConversation?.id === message.conversation_id) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...(prev.messages || []), message]
        } : null)
      }
      
      // Update conversation list
      setConversations(prev => prev.map(conv => 
        conv.id === message.conversation_id 
          ? { 
              ...conv, 
              latest_message: message.content,
              latest_direction: message.direction,
              latest_message_time: message.created_at,
              unread_count: message.direction === 'inbound' ? conv.unread_count + 1 : conv.unread_count
            }
          : conv
      ))

      if (message.direction === 'inbound') {
        toast.success(`New message from ${conversations.find(c => c.id === message.conversation_id)?.guest_name || 'Guest'}`)
      }
    })

    newSocket.on('ai_reply_generated', ({ messageId, ai_suggested_reply, ai_suggested_reply_translated }) => {
      if (selectedConversation) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages?.map(msg => 
            msg.id === messageId 
              ? { ...msg, ai_suggested_reply, ai_suggested_reply_translated }
              : msg
          )
        } : null)
      }
    })

    newSocket.on('message_workflow_updated', (updatedMessage: Message) => {
      if (selectedConversation) {
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages?.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        } : null)
      }
    })

    return () => newSocket.close()
  }, [])

  // Fetch initial data
  useEffect(() => {
    fetchConversations()
    fetchStats()
  }, [])

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversation && socket) {
      socket.emit('join_conversation', selectedConversation.id)
    }
  }, [selectedConversation, socket])

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/conversations`)
      setConversations(response.data)
    } catch (error) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/stats`)
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    try {
      const response = await axios.get(`${API_BASE}/api/conversations/${conversation.id}`)
      setSelectedConversation(response.data)
      
      // Mark conversation as read
      setConversations(prev => prev.map(conv => 
        conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
      ))
    } catch (error) {
      toast.error('Failed to load conversation details')
    }
  }

  const generateAIReply = async (messageId: string) => {
    setGeneratingReply(messageId)
    try {
      await axios.post(`${API_BASE}/api/messages/${messageId}/generate-reply`)
      toast.success('AI reply generated')
    } catch (error) {
      toast.error('Failed to generate AI reply')
    } finally {
      setGeneratingReply(null)
    }
  }

  const handleWorkflowAction = async (messageId: string, action: string, editedContent?: string) => {
    try {
      await axios.post(`${API_BASE}/api/messages/${messageId}/workflow`, {
        action,
        staff_member: 'Current User', // TODO: Get from auth
        comment: staffComment,
        edited_content: editedContent
      })
      
      toast.success(`Message ${action} successfully`)
      setStaffComment('')
      setEditingMessage(null)
      setEditDraft('')
      
      // Refresh conversation
      if (selectedConversation) {
        selectConversation(selectedConversation)
      }
    } catch (error) {
      toast.error(`Failed to ${action} message`)
    }
  }

  const getLanguageFlag = (language: string) => {
    const flags: { [key: string]: string } = {
      'en': '🇺🇸',
      'fr': '🇫🇷',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'ru': '🇷🇺'
    }
    return flags[language] || '🌍'
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, 'HH:mm')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Friday Message Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Friday Message Center</h1>
              <p className="text-sm text-gray-600">Real-time guest communication dashboard</p>
            </div>
            
            {stats && (
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.unread_messages}</div>
                  <div className="text-xs text-gray-500">Unread</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved_pending}</div>
                  <div className="text-xs text-gray-500">Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.today_conversations}</div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Conversation List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Conversations
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">{conversation.guest_name}</h3>
                      <span className="text-lg">{getLanguageFlag(conversation.language_detected)}</span>
                      {conversation.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    {conversation.latest_message_time && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.latest_message_time), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {conversation.property_name && (
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <HomeIcon className="h-3 w-3 mr-1" />
                      {conversation.property_name}
                    </div>
                  )}
                  
                  {conversation.latest_message && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.latest_direction === 'outbound' && '✓ '}
                      {conversation.latest_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-xl font-semibold text-gray-900">{selectedConversation.guest_name}</h2>
                      <span className="text-2xl">{getLanguageFlag(selectedConversation.language_detected)}</span>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                      {selectedConversation.property_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <HomeIcon className="h-4 w-4 mr-2" />
                          {selectedConversation.property_name}
                        </div>
                      )}
                      
                      {selectedConversation.reservation_id && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Reservation: {selectedConversation.reservation_id}
                        </div>
                      )}
                      
                      {selectedConversation.check_in && selectedConversation.check_out && (
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {format(new Date(selectedConversation.check_in), 'MMM dd')} - {format(new Date(selectedConversation.check_out), 'MMM dd')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Language: {selectedConversation.language_detected.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Started: {format(new Date(selectedConversation.created_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {selectedConversation.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-2xl ${message.direction === 'outbound' ? 'order-2' : 'order-1'}`}>
                      {/* Message bubble */}
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          message.direction === 'outbound'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Original message */}
                          <div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                          
                          {/* Translation (if available) */}
                          {message.content_translated && message.content_translated !== message.content && (
                            <div className={`text-xs border-t pt-2 ${
                              message.direction === 'outbound' ? 'border-blue-500 text-blue-100' : 'border-gray-200 text-gray-600'
                            }`}>
                              <div className="flex items-center space-x-1 mb-1">
                                <TranslateIcon className="h-3 w-3" />
                                <span>Translation:</span>
                              </div>
                              <p>{message.content_translated}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex justify-between items-center mt-2 text-xs ${
                          message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span>{formatMessageTime(message.created_at)}</span>
                          {message.workflow_status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium status-${message.workflow_status}`}>
                              {message.workflow_status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Suggestions and Actions for inbound messages */}
                      {message.direction === 'inbound' && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                          {/* AI suggested reply */}
                          {message.ai_suggested_reply ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                                  AI Suggested Reply
                                </h4>
                                <button
                                  onClick={() => generateAIReply(message.id)}
                                  disabled={generatingReply === message.id}
                                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                  {generatingReply === message.id ? 'Regenerating...' : 'Regenerate'}
                                </button>
                              </div>
                              
                              {editingMessage === message.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    rows={3}
                                    placeholder="Edit the reply..."
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        handleWorkflowAction(message.id, 'edited', editDraft)
                                      }}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                    >
                                      Save Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingMessage(null)
                                        setEditDraft('')
                                      }}
                                      className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="bg-white p-3 rounded border text-sm">
                                    {message.ai_suggested_reply}
                                  </div>
                                  
                                  {message.ai_suggested_reply_translated && 
                                   message.ai_suggested_reply_translated !== message.ai_suggested_reply && (
                                    <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
                                      <div className="flex items-center space-x-1 text-blue-600 mb-1">
                                        <TranslateIcon className="h-3 w-3" />
                                        <span className="text-xs font-medium">Translated Version:</span>
                                      </div>
                                      {message.ai_suggested_reply_translated}
                                    </div>
                                  )}
                                  
                                  {/* Staff Comment */}
                                  <div>
                                    <textarea
                                      value={staffComment}
                                      onChange={(e) => setStaffComment(e.target.value)}
                                      placeholder="Add a comment (optional)..."
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                      rows={2}
                                    />
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleWorkflowAction(message.id, 'sent')}
                                      className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                    >
                                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                                      Approve & Send
                                    </button>
                                    
                                    <button
                                      onClick={() => handleWorkflowAction(message.id, 'approved')}
                                      className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                    >
                                      <CheckIcon className="h-4 w-4 mr-2" />
                                      Approve
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setEditingMessage(message.id)
                                        setEditDraft(message.ai_suggested_reply || '')
                                      }}
                                      className="flex items-center px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                                    >
                                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                    
                                    <button
                                      onClick={() => handleWorkflowAction(message.id, 'rejected')}
                                      className="flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                    >
                                      <XMarkIcon className="h-4 w-4 mr-2" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <button
                                onClick={() => generateAIReply(message.id)}
                                disabled={generatingReply === message.id}
                                className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors disabled:opacity-50 mx-auto"
                              >
                                {generatingReply === message.id ? (
                                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                                )}
                                {generatingReply === message.id ? 'Generating...' : 'Generate AI Reply'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-24 w-24 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Friday Message Center
                </h3>
                <p className="text-gray-600 max-w-md">
                  Select a conversation to start managing guest messages with real-time translation and AI assistance.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <TranslateIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Auto-translation
                  </div>
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-green-500" />
                    AI replies
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-purple-500" />
                    Real-time updates
                  </div>
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 mr-2 text-orange-500" />
                    Approval workflow
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}