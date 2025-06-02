#!/bin/bash

# TriageAI Integration Test Script

# Set environment variables
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_SERVICE_KEY="your-supabase-service-key"
export VITE_SUPABASE_URL="https://your-project-id.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
export VITE_API_URL="http://localhost:5000"
export PORT=5000
export FLASK_ENV=development

# Start backend API server
echo "Starting backend API server..."
cd /home/ubuntu/triageai/backend/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m src.main &
BACKEND_PID=$!
sleep 3  # Give the backend time to start

# Start frontend development server
echo "Starting frontend development server..."
cd /home/ubuntu/triageai/frontend
npm run dev &
FRONTEND_PID=$!
sleep 3  # Give the frontend time to start

echo "Integration test environment started"
echo "Backend API running on http://localhost:5000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop"

# Wait for user to stop the test
trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Stopping integration test environment'; exit" INT
wait
