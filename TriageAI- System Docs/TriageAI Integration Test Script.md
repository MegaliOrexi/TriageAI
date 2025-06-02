# TriageAI Integration Test Script

## Frontend-Backend Integration Tests

```bash
#!/bin/bash

# Start backend API server
cd /home/ubuntu/triageai/backend/api
source venv/bin/activate
export FLASK_ENV=development
export PORT=5000
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_SERVICE_KEY="your-supabase-service-key"
python -m src.main &
BACKEND_PID=$!

# Start frontend development server
cd /home/ubuntu/triageai/frontend
export VITE_SUPABASE_URL="https://your-project-id.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
export VITE_API_URL="http://localhost:5000"
npm run dev &
FRONTEND_PID=$!

echo "Integration test environment started"
echo "Backend API running on http://localhost:5000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop"

# Wait for user to stop the test
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

## Integration Test Cases

### 1. Patient Queue Display
- Verify patient queue displays correctly on frontend
- Confirm priority order matches backend calculation
- Test real-time updates when patient status changes

### 2. Admin Authentication
- Test login functionality with Supabase auth
- Verify protected routes redirect unauthenticated users
- Test session persistence after page refresh

### 3. Patient Management
- Test adding new patients via frontend
- Verify patient data is correctly stored in Supabase
- Test updating patient status and confirm real-time updates

### 4. Staff Management
- Test adding new staff members via frontend
- Verify staff availability updates are reflected in triage calculations
- Test staff assignment to patients

### 5. Resource Management
- Test adding new resources via frontend
- Verify resource availability updates are reflected in triage calculations
- Test resource allocation to patients

### 6. Triage Algorithm
- Verify priority calculation with different patient parameters
- Test exponential waiting time weighting
- Validate queue reordering when priorities change

### 7. System Settings
- Test updating triage algorithm parameters
- Verify settings are saved to Supabase
- Confirm algorithm behavior changes according to settings

## API Integration Verification

### Patient API
- GET /api/patients - Returns correct patient list
- POST /api/patients - Creates new patient in Supabase
- PUT /api/patients/:id/status - Updates patient status in Supabase

### Triage API
- GET /api/triage/queue - Returns prioritized patient list
- POST /api/triage/calculate - Correctly calculates patient priority
- GET /api/triage/settings - Returns current algorithm settings

## Supabase Integration
- Verify real-time subscriptions work for all tables
- Test row-level security policies
- Validate authentication flow with Supabase Auth
