#!/bin/bash

# Friday Admin Dashboard - GMS Integration Startup Script
# This script starts both the backend and frontend with GMS integration

echo "🚀 Starting Friday Admin Dashboard with GMS v8.3 Enhanced Integration"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Are you in the friday-admin-dashboard directory?"
    exit 1
fi

# Check if GMS is running
echo "🔍 Checking GMS availability..."
if ! curl -s http://admin.friday.mu:8080/health > /dev/null 2>&1; then
    echo "⚠️  Warning: GMS server at admin.friday.mu:8080 is not responding"
    echo "   The dashboard will still start, but GMS integration features may not work"
    echo "   Please ensure GMS v8.3 Enhanced is running on admin.friday.mu:8080"
fi

# Check for required environment files
echo "📋 Checking configuration..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found, using defaults"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local not found, using defaults"
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."

# Backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "  📥 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Frontend dependencies  
if [ ! -d "frontend/node_modules" ]; then
    echo "  📥 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start the services
echo "🎯 Starting services..."

# Start backend
echo "  🔧 Starting backend on port 3001..."
cd backend && npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "  🎨 Starting frontend on port 3000..."
cd frontend && npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo "✅ Friday Admin Dashboard Started Successfully!"
echo "=================================================="
echo "🎨 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:3001"
echo "🔗 GMS:       http://admin.friday.mu:8080"
echo ""
echo "📊 Features Available:"
echo "  • Real-time message updates via WebSocket"
echo "  • GMS v8.3 Enhanced API integration"
echo "  • Multi-language translation (62+ languages)"
echo "  • AI-powered message analysis and replies"
echo "  • Team workflow (approve/edit/send/reject)"
echo "  • Live conversation synchronization"
echo ""
echo "📝 Logs:"
echo "  • Backend:  tail -f logs/backend.log"
echo "  • Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: pkill -f 'npm run dev' or Ctrl+C"

# Keep script running
echo "Press Ctrl+C to stop all services..."
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Wait for processes
wait