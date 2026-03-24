# Friday Admin Dashboard - GMS v8.3 Enhanced Integration

Complete real-time message management interface for Friday Retreats, seamlessly integrated with the GMS (Guest Messaging System) v8.3 Enhanced backend.

## 🚀 Overview

This dashboard provides a comprehensive interface for managing guest communications with:

- **Real-time message updates** via WebSocket connections
- **GMS v8.3 Enhanced integration** for message processing
- **Multi-language translation** support (62+ languages)
- **AI-powered message analysis** and reply generation
- **Team workflow management** (approve/edit/send/reject)
- **Live conversation synchronization** across all connected users

## 🏗 Architecture

```
┌─────────────────────┐    WebSocket    ┌──────────────────────┐    HTTP API    ┌─────────────────────┐
│                     │ ◄──────────────► │                      │ ◄─────────────► │                     │
│   Frontend          │                  │   Dashboard Backend  │                 │   GMS v8.3          │
│   (Next.js)         │                  │   (Node.js/Express)  │                 │   Enhanced          │
│   Port: 3000        │                  │   Port: 3001         │                 │   Port: 8080        │
│                     │                  │                      │                 │                     │
└─────────────────────┘                  └──────────────────────┘                 └─────────────────────┘
```

## 📡 Real-time Integration Points

### 1. WebSocket Communication
- **Live message updates** without page refresh
- **Conversation room management** for targeted updates
- **Broadcast system** for team-wide notifications
- **Connection status monitoring** with auto-reconnection

### 2. GMS API Bridge
- **Message polling** every 30 seconds for new messages
- **Workflow command routing** (approve/edit/reject/send)
- **Translation service** integration
- **Conversation state synchronization**

### 3. Data Flow
```
Guest Message → GMS Processing → Dashboard Display → Staff Action → GMS Execution → Slack Notification
```

## 🛠 Setup & Installation

### Quick Start (Development)

```bash
# Clone and navigate to dashboard directory
cd friday-admin-dashboard

# Start integrated development environment
./start-integrated-dashboard.sh
```

This will:
- Install all dependencies automatically
- Start backend on port 3001
- Start frontend on port 3000
- Establish GMS connection on admin.friday.mu:8080
- Enable real-time WebSocket updates

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your GMS configuration
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with backend URL
npm run dev
```

### Production Deployment

```bash
# Deploy to production environment
./deploy-production.sh
```

Includes:
- Docker containerization
- Nginx reverse proxy
- SSL/HTTPS configuration
- Health monitoring
- Log management

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# GMS Integration
GMS_BASE_URL=http://admin.friday.mu:8080
GMS_AUTH_TOKEN=your_gms_auth_token_here

# WebSocket Configuration
WEBSOCKET_ENABLED=true
POLL_INTERVAL=30000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## 📊 API Integration

### GMS Endpoint Mapping

| Dashboard Endpoint | GMS Endpoint | Purpose |
|-------------------|--------------|---------|
| `GET /api/conversations` | `GET /pending` | Fetch pending messages |
| `POST /api/messages/:id/workflow` | `POST /approve/:id` | Approve messages |
| `POST /api/messages/:id/workflow` | `POST /edit/:id` | Edit messages |
| `POST /api/messages/:id/workflow` | `POST /reject/:id` | Reject messages |
| `POST /api/messages/send` | `POST /command` | Send custom messages |
| `GET /api/translation/languages` | `GET /translation/languages` | Get supported languages |

### Data Transformation

The dashboard transforms GMS message data into conversation-based UI:

```javascript
// GMS Message Format
{
  message_id: "msg_123",
  timestamp: "2024-03-23T18:30:00Z",
  message_text: "The wifi password is not working",
  guest_info: { name: "John Doe", email: "john@example.com" },
  suggested_reply: "I'll help you with the wifi password...",
  ai_scores: { urgency: 8, complexity: 5, emotion: 6 }
}

// Dashboard Conversation Format
{
  id: "conv_123",
  guest_name: "John Doe",
  latest_message: "The wifi password is not working",
  unread_count: 1,
  messages: [...] // Array of message objects
}
```

## 🔄 Real-time Features

### WebSocket Events

#### Client → Server
```javascript
socket.emit('join_conversation', conversationId);
socket.emit('leave_conversation', conversationId);
```

#### Server → Client
```javascript
socket.on('update', (data) => {
  // data.type: 'new_messages' | 'message_approved' | 'message_edited' | 'message_rejected' | 'message_sent'
  // data.data: relevant update data
  // data.timestamp: ISO timestamp
});
```

### Update Types

1. **new_messages**: New messages received from GMS
2. **message_approved**: Message approved and sent to guest
3. **message_edited**: Message edited by staff
4. **message_rejected**: Message rejected by staff
5. **message_sent**: Custom message sent through workflow

## 🌐 Multi-language Support

### Translation Integration
- **62+ supported languages** via GMS translation service
- **Auto-detection** of guest language preference
- **Real-time translation** of messages and replies
- **Fallback language list** when service unavailable

### Language Features
```javascript
// Available in UI
languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  // ... 60+ more languages
]
```

## 🧪 Testing & Validation

### Integration Testing
```bash
# Run comprehensive integration tests
node test-integration.js

# Test specific components
npm test
```

### Health Monitoring
- **Dashboard health**: `http://localhost:3001/health`
- **Connection status**: Real-time indicator in UI
- **GMS connectivity**: Automatic monitoring and alerts

### Test Coverage
✅ WebSocket connection and real-time updates  
✅ GMS API connectivity and data flow  
✅ Message workflow operations  
✅ Translation service integration  
✅ Frontend rendering and navigation  
✅ Error handling and recovery  

## 📈 Performance & Scalability

### Optimization Features
- **Connection pooling** for GMS API requests
- **Rate limiting** (100 requests/15 minutes per IP)
- **WebSocket connection management** with auto-cleanup
- **Efficient polling** (30-second intervals, only when clients connected)
- **Message caching** and deduplication

### Scalability
- **Horizontal scaling** ready (stateless backend)
- **Load balancer** compatible
- **Database-ready** (Redis/PostgreSQL support)
- **Multi-instance** WebSocket synchronization

## 🚨 Error Handling

### Automatic Recovery
- **GMS connection failures**: Automatic retry with exponential backoff
- **WebSocket disconnections**: Auto-reconnection with state preservation  
- **API timeouts**: Graceful fallback and user notifications
- **Translation failures**: Fallback to original language

### Error Monitoring
```javascript
// Error types automatically handled
- Network connectivity issues
- GMS server unavailability  
- WebSocket connection drops
- Translation service failures
- Rate limit exceeded
- Invalid message formats
```

## 🔒 Security Features

### Request Security
- **Rate limiting** on all API endpoints
- **CORS configuration** for trusted origins
- **Request validation** and sanitization
- **Authentication tokens** for GMS communication

### WebSocket Security
- **Origin validation** for WebSocket connections
- **Room-based access** control
- **Connection limits** and cleanup
- **Message validation** before broadcast

## 📋 Success Criteria

✅ **Live message updates** in dashboard without refresh  
✅ **Seamless approve/edit/send** command execution  
✅ **Real-time conversation** synchronization  
✅ **Multi-language translation** integration  
✅ **Team workflow notifications** and status updates  

## 🔧 Maintenance & Operations

### Log Management
```bash
# View logs
tail -f logs/backend.log
tail -f logs/frontend.log

# Production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Monitoring Dashboards
- **Real-time connection count**: Available in health endpoint
- **Message processing rate**: Tracked in logs
- **Error rates**: Monitored via WebSocket events
- **GMS integration status**: Live status indicator

### Backup & Recovery
- **Configuration backup**: Environment files and certificates
- **Log rotation**: Automatic cleanup of old log files  
- **State recovery**: Stateless design enables quick recovery
- **Rollback capability**: Docker-based deployment supports easy rollbacks

## 🤝 Support & Troubleshooting

### Common Issues

1. **GMS Connection Failed**
   - Check if GMS v8.3 Enhanced is running on admin.friday.mu:8080
   - Verify GMS_AUTH_TOKEN in environment
   - Check firewall/network connectivity

2. **WebSocket Not Connecting**
   - Verify FRONTEND_URL matches actual frontend URL
   - Check CORS configuration in backend
   - Ensure ports 3000/3001 are available

3. **Messages Not Updating**
   - Check GMS /pending endpoint accessibility
   - Verify polling interval configuration
   - Review backend logs for API errors

### Development Support
- **Debug mode**: Set DEBUG=friday:* environment variable
- **Verbose logging**: Set LOG_LEVEL=debug
- **Test suite**: Run integration tests for diagnostics

---

## 🎯 Next Steps

The Friday Admin Dashboard is now fully integrated with GMS v8.3 Enhanced. Key achievements:

- ✅ **Real-time WebSocket communication** established
- ✅ **Complete GMS API integration** implemented
- ✅ **Message workflow system** operational  
- ✅ **Multi-language translation** connected
- ✅ **Team collaboration features** enabled

**Ready for production deployment** with full real-time message management capabilities.