#!/bin/bash

# Friday Admin Dashboard Setup Script
# This script sets up the complete message management system

set -e

echo "🏡 Setting up Friday Admin Dashboard..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Create database if it doesn't exist
print_info "Setting up database..."
DB_NAME="friday_admin"
DB_USER="postgres"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    print_warning "Database '$DB_NAME' already exists"
else
    print_info "Creating database '$DB_NAME'..."
    createdb "$DB_NAME" 2>/dev/null || print_warning "Could not create database (may already exist)"
fi

# Run database schema
print_info "Setting up database schema..."
psql -d "$DB_NAME" -f backend/src/database/schema.sql > /dev/null 2>&1
print_status "Database schema applied"

# Setup backend
print_info "Setting up backend..."
cd backend

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    print_status "Created backend .env file"
    print_warning "Please update the .env file with your actual configuration"
fi

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install
print_status "Backend dependencies installed"

# Build backend
print_info "Building backend..."
npm run build
print_status "Backend built successfully"

# Setup frontend
print_info "Setting up frontend..."
cd ../frontend

# Copy environment file
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    print_status "Created frontend .env.local file"
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."
npm install
print_status "Frontend dependencies installed"

# Build frontend
print_info "Building frontend..."
npm run build
print_status "Frontend built successfully"

cd ..

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Friday Admin Dashboard..."

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Services started!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start.sh

print_status "Setup completed successfully!"
echo ""
echo "🎉 Friday Admin Dashboard is ready!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your GMS API configuration"
echo "2. Update frontend/.env.local if needed"
echo "3. Run './start.sh' to start both services"
echo ""
echo "Dashboard will be available at: http://localhost:3000"
echo "API will be available at: http://localhost:3001"
echo ""
echo "📚 Features included:"
echo "  • Real-time message display with WebSocket"
echo "  • Automatic translation detection and display"
echo "  • AI-powered reply suggestions"
echo "  • Complete approval workflow (Edit → Approve → Send)"
echo "  • Reservation context and guest details"
echo "  • Mobile-responsive design"
echo "  • Integration with GMS v8.3 Enhanced APIs"
echo ""
print_warning "Don't forget to configure your GMS webhook to point to:"
print_info "http://your-dashboard-url:3001/api/webhook/message"