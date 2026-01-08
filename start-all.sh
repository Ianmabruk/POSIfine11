#!/bin/bash

# Universal POS - Start Script
# This script starts both frontend and backend servers

echo "🚀 Starting Universal POS System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from my-react-app directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}📦 Starting Backend API (Port 5001)...${NC}"
cd src/backend
PORT=5001 python3 app.py &
BACKEND_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 2

# Check if backend started
if ! lsof -ti:5001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend may not have started properly${NC}"
else
    echo -e "${GREEN}✅ Backend running on http://localhost:5001${NC}"
fi

# Start frontend
echo -e "${BLUE}🎨 Starting Frontend Dev Server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Find which port Vite is using
VITE_PORT=$(lsof -ti:5173 2>/dev/null || lsof -ti:3004 2>/dev/null || lsof -ti:3002 2>/dev/null || echo "")

if [ -n "$VITE_PORT" ]; then
    # Get the actual port number
    ACTUAL_PORT=$(lsof -i :$VITE_PORT -sTCP:LISTEN -t | head -1 | xargs -I {} lsof -p {} -sTCP:LISTEN -P -n | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
    if [ -z "$ACTUAL_PORT" ]; then
        # Fallback to common ports
        if lsof -ti:5173 > /dev/null 2>&1; then
            ACTUAL_PORT=5173
        elif lsof -ti:3004 > /dev/null 2>&1; then
            ACTUAL_PORT=3004
        elif lsof -ti:3002 > /dev/null 2>&1; then
            ACTUAL_PORT=3002
        fi
    fi
    echo -e "${GREEN}✅ Frontend running on http://localhost:${ACTUAL_PORT}${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may not have started properly${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Universal POS System is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC} http://localhost:${ACTUAL_PORT:-3004}"
echo -e "  ${BLUE}Backend:${NC}  http://localhost:5001"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait