#!/bin/bash

# Start backend
echo "Starting backend server..."
cd src/backend
python3 app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting frontend server..."
cd ../..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Backend running on http://localhost:5001"
echo "✅ Frontend running on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
