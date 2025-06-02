#!/bin/bash

# TriageAI Backend Deployment Script

# Set up environment variables
export SUPABASE_URL="https://your-project-id.supabase.co"
export SUPABASE_SERVICE_KEY="your-supabase-service-key"
export PORT=5000
export FLASK_ENV=production
export CORS_ORIGIN="*"

# Create and activate virtual environment
cd /home/ubuntu/triageai/backend/api
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the application with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
