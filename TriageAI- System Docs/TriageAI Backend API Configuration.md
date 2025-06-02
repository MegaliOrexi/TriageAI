# TriageAI Backend API Configuration

## Environment Variables
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
PORT=5000
FLASK_ENV=production
CORS_ORIGIN=*
```

## Production Deployment Configuration
```python
# Production WSGI configuration
workers = 4
bind = "0.0.0.0:5000"
timeout = 120
```

## API Endpoints

### Patient Endpoints
- GET /api/patients - Get all patients
- GET /api/patients/:id - Get a specific patient
- POST /api/patients - Create a new patient
- PUT /api/patients/:id - Update a patient
- PUT /api/patients/:id/status - Update a patient's status
- DELETE /api/patients/:id - Delete a patient

### Staff Endpoints
- GET /api/staff - Get all staff members
- GET /api/staff/:id - Get a specific staff member
- POST /api/staff - Create a new staff member
- PUT /api/staff/:id - Update a staff member
- PUT /api/staff/:id/availability - Update a staff member's availability
- DELETE /api/staff/:id - Delete a staff member

### Resource Endpoints
- GET /api/resources - Get all resources
- GET /api/resources/:id - Get a specific resource
- POST /api/resources - Create a new resource
- PUT /api/resources/:id - Update a resource
- PUT /api/resources/:id/status - Update a resource's status
- DELETE /api/resources/:id - Delete a resource

### Triage Endpoints
- GET /api/triage/queue - Get prioritized patient queue
- POST /api/triage/calculate - Calculate priority for a specific patient
- GET /api/triage/settings - Get triage system settings
- PUT /api/triage/settings - Update triage system settings
- GET /api/triage/statistics - Get triage system statistics
