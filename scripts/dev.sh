#!/bin/bash
echo "🚀 Starting Naath Archive in development mode..."

# Start backend
echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
