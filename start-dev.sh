#!/bin/bash

# Start DevArena development servers
# This script starts both backend and frontend servers concurrently

echo "Starting DevArena development environment..."

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down servers..."
  kill $(jobs -p) 2>/dev/null
  exit
}

# Trap CTRL+C and cleanup
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ Backend running on http://localhost:3000"
echo "✓ Frontend running on http://localhost:5173"
echo ""
echo "Press CTRL+C to stop both servers"

# Wait for both processes
wait
