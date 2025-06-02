# TriageAI Backend Deployment Guide

## Setup Instructions

### 1. Environment Setup
```bash
# Create and activate virtual environment
cd /home/ubuntu/triageai/backend/api
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Environment Variables
Create a `.env` file in the backend/api directory with the following variables:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
PORT=5000
FLASK_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

### 3. Production Deployment
```bash
# Start the application with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

## Database Setup

### Supabase Tables
The following tables need to be created in your Supabase project:

1. `patients` - Stores patient information and triage status
2. `staff` - Stores staff information and availability
3. `resources` - Stores resource information and availability
4. `system_settings` - Stores system configuration settings
5. `priority_logs` - Logs priority calculation history

### Row-Level Security Policies
Implement the following RLS policies for security:

1. Admin users can read/write all tables
2. Public users can only read the patients table with status='waiting'
3. Authenticated staff can only update their own availability

## API Testing

Use the following curl commands to test the API endpoints:

```bash
# Get patient queue
curl -X GET http://localhost:5000/api/triage/queue

# Add a new patient
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","date_of_birth":"1990-01-01","chief_complaint":"Fever","risk_level":2}'

# Update triage settings
curl -X PUT http://localhost:5000/api/triage/settings \
  -H "Content-Type: application/json" \
  -d '{"risk_level_weight":0.5,"waiting_time_weight":0.3,"resource_availability_weight":0.1,"staff_availability_weight":0.1,"waiting_time_exponent_base":1.05,"waiting_time_constant":30}'
```

## Monitoring and Maintenance

1. Set up logging to monitor API usage and errors
2. Implement regular database backups
3. Monitor system performance and scale as needed
4. Regularly update dependencies for security patches
