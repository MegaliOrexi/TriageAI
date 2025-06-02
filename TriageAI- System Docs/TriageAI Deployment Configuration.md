# TriageAI Deployment Configuration

## Frontend Deployment

```bash
# Build the frontend
cd /home/ubuntu/triageai/frontend
npm run build

# Deploy to static hosting service
# Replace with your actual deployment command
# Example for Netlify:
# netlify deploy --prod --dir=dist
```

## Backend Deployment

```bash
# Set up the backend
cd /home/ubuntu/triageai/backend/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the backend with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=https://your-backend-api-url.com
```

### Backend (.env)
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
PORT=5000
FLASK_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

## Supabase Setup Instructions

1. Create a new Supabase project at https://supabase.com
2. Create the following tables:
   - patients
   - staff
   - resources
   - system_settings
   - priority_logs
3. Set up Row Level Security (RLS) policies
4. Get your API keys from the Supabase dashboard
5. Update the environment variables in both frontend and backend

## Deployment Checklist

- [ ] Frontend build successful
- [ ] Backend dependencies installed
- [ ] Environment variables configured
- [ ] Supabase project set up
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] CORS settings configured
- [ ] SSL certificates set up (for production)
- [ ] Monitoring and logging configured
