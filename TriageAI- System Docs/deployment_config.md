# TriageAI Deployment Configuration

## Frontend Environment Variables
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://your-api-url.com
```

## Backend Environment Variables
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

## Deployment Instructions

### Frontend Deployment
1. Build the React application
2. Deploy the static files to a hosting service
3. Configure environment variables
4. Set up proper CORS headers

### Backend Deployment
1. Install dependencies
2. Configure environment variables
3. Start the Flask application with gunicorn
4. Set up proper CORS configuration

## Post-Deployment Verification
1. Verify frontend can access backend API
2. Confirm Supabase connectivity
3. Test authentication flow
4. Validate triage queue functionality
