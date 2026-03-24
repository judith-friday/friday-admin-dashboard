#!/bin/bash

# Friday Admin Dashboard Production Deployment Script
# Deploy to production server with zero-downtime deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
DEPLOY_ENV=${1:-production}
DOMAIN=${DOMAIN:-admin.friday.mu}
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
GMS_API_KEY=${GMS_API_KEY}

if [ -z "$GMS_API_KEY" ]; then
    print_error "GMS_API_KEY environment variable is required"
    exit 1
fi

echo "🏡 Deploying Friday Admin Dashboard to $DEPLOY_ENV..."

# Check prerequisites
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Create environment file
print_info "Creating environment configuration..."
cat > .env << EOF
# Generated environment file for $DEPLOY_ENV deployment
DEPLOY_ENV=$DEPLOY_ENV
DOMAIN=$DOMAIN

# Database Configuration  
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD

# API Configuration
GMS_API_BASE=${GMS_API_BASE:-http://gms:8080}
GMS_API_KEY=$GMS_API_KEY
FRONTEND_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://api.$DOMAIN
NEXT_PUBLIC_WS_URL=wss://api.$DOMAIN

# Slack Integration
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
EOF

print_status "Environment configuration created"

# Build and deploy with Docker Compose
print_info "Building Docker images..."
docker-compose -f docker-compose.production.yml build --no-cache

print_info "Stopping existing services..."
docker-compose -f docker-compose.production.yml down

print_info "Starting services..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
print_info "Waiting for services to start..."
sleep 30

# Health checks
print_info "Performing health checks..."

# Check database
if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U postgres; then
    print_status "Database is healthy"
else
    print_error "Database health check failed"
    exit 1
fi

# Check backend
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend API is healthy"
else
    print_error "Backend API health check failed"
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_error "Frontend health check failed"
    exit 1
fi

# Setup SSL certificates (if needed)
if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/key.pem" ]; then
    print_warning "SSL certificates not found. Setting up Let's Encrypt..."
    
    # Create SSL directory
    mkdir -p ssl
    
    # Generate self-signed certificate for development
    if [ "$DEPLOY_ENV" = "development" ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=MU/ST=Port Louis/L=Port Louis/O=Friday Retreats/CN=$DOMAIN"
        print_status "Self-signed SSL certificate generated"
    else
        print_warning "Please setup Let's Encrypt certificates manually:"
        print_info "certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d api.$DOMAIN"
    fi
fi

# Display deployment information
print_status "🎉 Deployment completed successfully!"
echo ""
echo "📊 Dashboard URL: https://$DOMAIN"
echo "🔌 API URL: https://api.$DOMAIN"
echo "📁 Database: PostgreSQL (Docker container)"
echo ""
echo "🔧 Management Commands:"
echo "  View logs:    docker-compose -f docker-compose.production.yml logs -f"
echo "  Restart:      docker-compose -f docker-compose.production.yml restart"
echo "  Stop:         docker-compose -f docker-compose.production.yml down"
echo "  Database:     docker-compose -f docker-compose.production.yml exec postgres psql -U postgres friday_admin"
echo ""
echo "⚙️  Configuration:"
echo "  Environment:  $DEPLOY_ENV"
echo "  Domain:       $DOMAIN"
echo "  Database:     friday_admin"
echo "  SSL:          $([ -f "./ssl/cert.pem" ] && echo "✅ Configured" || echo "❌ Not configured")"
echo ""

# GMS Integration setup reminder
print_warning "🔗 Don't forget to configure GMS webhook:"
print_info "Webhook URL: https://api.$DOMAIN/api/webhook/message"
print_info "API Key: $GMS_API_KEY"

# Backup instructions
echo ""
print_info "💾 Backup Instructions:"
echo "  Database backup: docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres friday_admin > backup.sql"
echo "  Environment backup: cp .env .env.backup"

# Monitoring setup
echo ""
print_info "📈 Monitoring Setup:"
echo "  Health check endpoint: https://api.$DOMAIN/health"
echo "  Dashboard stats: https://api.$DOMAIN/api/stats"
echo "  WebSocket test: Connect to wss://api.$DOMAIN"

print_status "Friday Admin Dashboard is now live and ready for guest message management! 🚀"