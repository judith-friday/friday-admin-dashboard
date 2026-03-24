'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  message_id: string;
  timestamp: string;
  message_text: string;
  guest_info: {
    name?: string;
    email?: string;
    phone?: string;
    language_preference?: string;
  };
  booking_context: {
    booking_id?: string;
    property_id?: string;
    check_in_date?: string;
    check_out_date?: string;
  };
  ai_scores: {
    urgency: number;
    complexity: number;
    emotion: number;
    priority: number;
  };
  suggested_reply?: string;
  conversation_id: string;
}

interface Conversation {
  conversation_id: string;
  messages: Message[];
  latest_message: Message;
  guest_info: any;
  booking_context: any;
  urgency_score: number;
}

interface MessageManagerProps {
  backendUrl?: string;
}

const MessageManager: React.FC<MessageManagerProps> = ({ 
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001' 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Form states
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Available languages (fallback list)
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected to backend');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from backend');
      setIsConnected(false);
    });

    newSocket.on('update', (data) => {
      console.log('[WebSocket] Received update:', data.type);
      handleRealtimeUpdate(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [backendUrl]);

  // Handle real-time updates from WebSocket
  const handleRealtimeUpdate = useCallback((data: any) => {
    switch (data.type) {
      case 'new_messages':
        console.log(`[Update] ${data.data.count} new messages received`);
        fetchPendingMessages(); // Refresh the list
        break;
      case 'message_approved':
        console.log(`[Update] Message ${data.data.messageId} approved`);
        fetchPendingMessages();
        break;
      case 'message_edited':
        console.log(`[Update] Message ${data.data.messageId} edited`);
        fetchPendingMessages();
        break;
      case 'message_rejected':
        console.log(`[Update] Message ${data.data.messageId} rejected`);
        fetchPendingMessages();
        break;
      case 'message_sent':
        console.log(`[Update] Message sent to conversation ${data.data.conversationId}`);
        fetchPendingMessages();
        break;
    }
  }, []);

  // Fetch pending messages from backend
  const fetchPendingMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${backendUrl}/api/messages/pending`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data.messages);
      } else {
        throw new Error(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('[API Error] Failed to fetch pending messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Join/leave conversation rooms for targeted updates
  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join_conversation', selectedConversation.conversation_id);
      return () => {
        socket.emit('leave_conversation', selectedConversation.conversation_id);
      };
    }
  }, [socket, selectedConversation]);

  // Load messages on component mount
  useEffect(() => {
    fetchPendingMessages();
  }, []);

  // Message action handlers
  const handleApprove = async (messageId: string, modifications?: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/messages/approve/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      console.log(`[Action] Message ${messageId} approved`);
      // Real-time update will refresh the list
    } catch (err) {
      console.error('[Action Error] Failed to approve message:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve message');
    }
  };

  const handleEdit = async (messageId: string, newText: string, language: string = 'en') => {
    try {
      const response = await fetch(`${backendUrl}/api/messages/edit/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newText, language })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      console.log(`[Action] Message ${messageId} edited`);
      setEditingMessage(null);
      setEditText('');
      // Real-time update will refresh the list
    } catch (err) {
      console.error('[Action Error] Failed to edit message:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    }
  };

  const handleReject = async (messageId: string, reason?: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/messages/reject/${messageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      console.log(`[Action] Message ${messageId} rejected`);
      // Real-time update will refresh the list
    } catch (err) {
      console.error('[Action Error] Failed to reject message:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject message');
    }
  };

  const handleSendCustom = async () => {
    if (!selectedConversation || !customMessage.trim()) return;

    try {
      setSendingMessage(true);
      
      const response = await fetch(`${backendUrl}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.conversation_id,
          message: customMessage.trim(),
          language: selectedLanguage,
          urgency: 5
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      console.log(`[Action] Custom message sent to ${selectedConversation.conversation_id}`);
      setCustomMessage('');
      // Real-time update will refresh the list
    } catch (err) {
      console.error('[Action Error] Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 8) return 'bg-red-500';
    if (urgency >= 6) return 'bg-orange-500';
    if (urgency >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading messages from GMS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button 
          onClick={() => { setError(null); fetchPendingMessages(); }}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Connection Status */}
      <div className="lg:col-span-3 mb-4">
        <div className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-lg ${
          isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected to GMS' : 'Disconnected from GMS'}</span>
          <button 
            onClick={fetchPendingMessages}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#1A2B4C] text-white p-4">
          <h2 className="text-lg font-semibold">Pending Conversations ({conversations.length})</h2>
        </div>
        <div className="overflow-y-auto h-full">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No pending messages</p>
              <p className="text-sm mt-1">All caught up! 🎉</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.conversation_id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.conversation_id === conv.conversation_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {conv.guest_info?.name || 'Unknown Guest'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {conv.booking_context?.property_id || 'No Property ID'}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getUrgencyColor(conv.urgency_score)}`}></div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {conv.latest_message?.message_text}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{formatTimestamp(conv.latest_message?.timestamp)}</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail and Actions */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
        {selectedConversation ? (
          <div className="flex flex-col h-full">
            {/* Conversation Header */}
            <div className="bg-[#1A2B4C] text-white p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedConversation.guest_info?.name || 'Unknown Guest'}
                  </h2>
                  <p className="text-sm opacity-75">
                    {selectedConversation.guest_info?.email} • {selectedConversation.booking_context?.property_id}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${getUrgencyColor(selectedConversation.urgency_score)} text-white`}>
                  Urgency: {selectedConversation.urgency_score}/10
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div key={message.message_id} className="border rounded-lg p-4">
                  {/* Message Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Guest Message</span>
                      <span className="mx-2">•</span>
                      <span>{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div className="flex space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded ${getUrgencyColor(message.ai_scores?.urgency || 0)} text-white`}>
                        U: {message.ai_scores?.urgency || 0}
                      </span>
                      <span className="px-2 py-1 rounded bg-gray-500 text-white">
                        C: {message.ai_scores?.complexity || 0}
                      </span>
                      <span className="px-2 py-1 rounded bg-purple-500 text-white">
                        E: {message.ai_scores?.emotion || 0}
                      </span>
                    </div>
                  </div>

                  {/* Original Message */}
                  <div className="mb-3">
                    <p className="text-gray-800 bg-gray-50 p-3 rounded">
                      {message.message_text}
                    </p>
                  </div>

                  {/* Suggested Reply */}
                  {message.suggested_reply && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">AI Suggested Reply:</h4>
                      {editingMessage === message.message_id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Edit the suggested reply..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(message.message_id, editText, selectedLanguage)}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Save Edit
                            </button>
                            <button
                              onClick={() => { setEditingMessage(null); setEditText(''); }}
                              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-gray-800">{message.suggested_reply}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {editingMessage !== message.message_id && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleApprove(message.message_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        ✅ Approve & Send
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessage(message.message_id);
                          setEditText(message.suggested_reply || '');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleReject(message.message_id, 'Rejected from dashboard')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Send Custom Message */}
            <div className="border-t bg-gray-50 p-4">
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type a custom message to send..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <button
                    onClick={handleSendCustom}
                    disabled={!customMessage.trim() || sendingMessage}
                    className="px-6 py-2 bg-[#1A2B4C] text-white rounded hover:bg-[#2A3B5C] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? '⏳' : '📤'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the left to view and manage messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageManager;