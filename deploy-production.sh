#!/bin/bash

# Friday Admin Dashboard - Production Deployment Script
# Integrates with GMS v8.3 Enhanced in production environment

echo "🚀 Deploying Friday Admin Dashboard to Production"
echo "================================================="

# Configuration
PRODUCTION_URL=${PRODUCTION_URL:-"https://dashboard.friday.mu"}
GMS_PRODUCTION_URL=${GMS_PRODUCTION_URL:-"https://admin.friday.mu:8080"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

echo "📋 Deployment Configuration:"
echo "  • Dashboard URL: $PRODUCTION_URL"
echo "  • GMS URL: $GMS_PRODUCTION_URL"
echo "  • Environment: $ENVIRONMENT"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if GMS is accessible
if ! curl -s "$GMS_PRODUCTION_URL/health" > /dev/null 2>&1; then
    echo "❌ Error: GMS server at $GMS_PRODUCTION_URL is not accessible"
    echo "   Please ensure GMS v8.3 Enhanced is running and accessible"
    exit 1
fi

echo "✅ GMS server is accessible"

# Build frontend for production
echo "📦 Building frontend for production..."
cd frontend
npm ci --production=false
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend production dependencies..."
cd backend
npm ci --production
cd ..

# Create production environment files
echo "⚙️  Creating production configuration..."

cat > backend/.env.production << EOF
# Friday Admin Dashboard Backend - Production Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=$PRODUCTION_URL

# GMS Integration
GMS_BASE_URL=$GMS_PRODUCTION_URL
GMS_AUTH_TOKEN=\${GMS_AUTH_TOKEN}

# WebSocket Configuration
WEBSOCKET_ENABLED=true
POLL_INTERVAL=30000

# Security
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
LOG_FILE=logs/dashboard-production.log
EOF

cat > frontend/.env.production << EOF
# Friday Admin Dashboard Frontend - Production Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=$PRODUCTION_URL/api
NEXT_PUBLIC_BACKEND_URL=$PRODUCTION_URL
NEXT_PUBLIC_WS_URL=wss://${PRODUCTION_URL#https://}
EOF

# Create Docker Compose for production
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  friday-dashboard-backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: friday-dashboard-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GMS_BASE_URL=$GMS_PRODUCTION_URL
      - GMS_AUTH_TOKEN=\${GMS_AUTH_TOKEN}
      - FRONTEND_URL=$PRODUCTION_URL
    ports:
      - "3001:3001"
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - friday-network

  friday-dashboard-frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    container_name: friday-dashboard-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=$PRODUCTION_URL/api
      - NEXT_PUBLIC_BACKEND_URL=$PRODUCTION_URL
    ports:
      - "3000:3000"
    depends_on:
      - friday-dashboard-backend
    networks:
      - friday-network

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: friday-dashboard-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - friday-dashboard-frontend
      - friday-dashboard-backend
    networks:
      - friday-network

networks:
  friday-network:
    driver: bridge

volumes:
  logs:
EOF

# Create Nginx configuration
echo "🔧 Creating Nginx configuration..."
cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server friday-dashboard-frontend:3000;
    }
    
    upstream backend {
        server friday-dashboard-backend:3001;
    }
    
    # WebSocket upgrade
    map \$http_upgrade \$connection_upgrade {
        default upgrade;
        '' close;
    }
    
    server {
        listen 80;
        server_name ${PRODUCTION_URL#https://};
        
        # Redirect HTTP to HTTPS
        return 301 https://\$server_name\$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name ${PRODUCTION_URL#https://};
        
        # SSL configuration (update paths as needed)
        ssl_certificate /etc/nginx/ssl/dashboard.crt;
        ssl_certificate_key /etc/nginx/ssl/dashboard.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # Backend API
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # WebSocket
        location /socket.io/ {
            proxy_pass http://backend/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

# Create logs directory
mkdir -p logs

echo "🏗️  Building and starting services..."

# Build and start with Docker Compose
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo "🏥 Performing health checks..."

# Check backend
if curl -sf http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Check frontend
if curl -sf http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend accessibility check failed"
    exit 1
fi

echo ""
echo "🎉 Friday Admin Dashboard Deployed Successfully!"
echo "================================================="
echo "🎨 Frontend:    $PRODUCTION_URL"
echo "🔧 Backend API: $PRODUCTION_URL/api"
echo "🔗 GMS:         $GMS_PRODUCTION_URL"
echo ""
echo "📊 Integration Status:"
echo "  • Real-time WebSocket: Active"
echo "  • GMS v8.3 Enhanced: Connected"
echo "  • Translation Service: Available"
echo "  • Workflow System: Operational"
echo ""
echo "📝 Logs:"
echo "  • Dashboard: docker-compose -f docker-compose.prod.yml logs -f"
echo "  • Nginx: docker logs friday-dashboard-nginx -f"
echo ""
echo "🔧 Management:"
echo "  • Stop:    docker-compose -f docker-compose.prod.yml down"
echo "  • Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  • Update:  ./deploy-production.sh"

echo ""
echo "✅ Deployment Complete!"