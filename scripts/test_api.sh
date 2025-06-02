#!/bin/bash

# TriageAI API Test Script

# Set environment variables
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_SERVICE_KEY="your-supabase-service-key"
export PORT=5000
export FLASK_ENV=development

# Start backend API server
echo "Starting backend API server for testing..."
cd /home/ubuntu/triageai/backend/api
source venv/bin/activate || python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m src.main &
BACKEND_PID=$!
sleep 3  # Give the backend time to start

echo "Backend API running on http://localhost:5000"
echo "Running API tests..."

# Test API endpoints
echo "Testing GET /api/health endpoint..."
curl -s http://localhost:5000/api/health | grep "healthy" && echo "✅ Health check passed" || echo "❌ Health check failed"

echo "Testing GET /api/triage/settings endpoint..."
curl -s http://localhost:5000/api/triage/settings | grep "risk_level_weight" && echo "✅ Triage settings endpoint passed" || echo "❌ Triage settings endpoint failed"

echo "Testing POST /api/patients endpoint..."
curl -s -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"Patient","date_of_birth":"1990-01-01","chief_complaint":"Test complaint","risk_level":2,"status":"waiting"}' \
  | grep "id" && echo "✅ Patient creation endpoint passed" || echo "❌ Patient creation endpoint failed"

echo "Testing GET /api/triage/queue endpoint..."
curl -s http://localhost:5000/api/triage/queue | grep "priority_score" && echo "✅ Triage queue endpoint passed" || echo "❌ Triage queue endpoint failed"

# Clean up
echo "Stopping backend API server..."
kill $BACKEND_PID

echo "API tests completed"
