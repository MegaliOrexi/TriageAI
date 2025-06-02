# TriageAI System - README

## Project Overview

TriageAI is an emergency room triage system designed to help organize patient treatment priority when ERs have low resource/staff availability and high patient volume. The system uses a classification model to label patients as high, medium, or low risk, combined with a rule-based/fuzzy logic system to determine the optimal waiting order.

## System Components

1. **Classification Model Integration**
   - Pre-built AI classification model for risk level assessment
   - Local integration for efficient processing

2. **Rule-Based/Fuzzy Logic System**
   - Prioritizes patients based on:
     - Risk level from classification model
     - Waiting time (exponentially weighted)
     - Resource availability
     - Staff availability

3. **Web Application**
   - Patient View: Public display of patient queue
   - Admin Dashboard: Secure interface for staff to manage patients, resources, and treatments

4. **Database**
   - Supabase (PostgreSQL) for data storage
   - Authentication system for admin access

## Technical Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure

```
triageai/
├── frontend/                 # React frontend application
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── assets/           # Images and other assets
│   │   ├── components/       # React components
│   │   ├── lib/              # Utility functions and libraries
│   │   │   └── supabase.ts   # Supabase client and database operations
│   │   ├── App.tsx           # Main application component
│   │   └── main.tsx          # Entry point
│   └── package.json          # Frontend dependencies
│
└── backend/                  # Flask backend API
    └── api/                  # API application
        ├── src/              # Source code
        │   ├── models/       # Database models
        │   ├── routes/       # API routes
        │   │   ├── patients.py   # Patient endpoints
        │   │   ├── staff.py      # Staff endpoints
        │   │   ├── resources.py  # Resource endpoints
        │   │   └── triage.py     # Triage logic endpoints
        │   └── main.py       # Entry point
        ├── venv/             # Virtual environment
        └── requirements.txt  # Backend dependencies
```

## Installation and Setup

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Supabase account

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd triageai/frontend
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```
   pnpm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd triageai/backend/api
   ```

2. Activate the virtual environment:
   ```
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the development server:
   ```
   python src/main.py
   ```

## Database Setup

1. Create a new Supabase project
2. Execute the SQL scripts in the `database_schema.md` file to create the necessary tables, views, and functions
3. Set up Row Level Security policies as specified in the schema

## Usage

### Patient View
- Access the public patient queue display at the root URL
- Patients are displayed in priority order with estimated wait times

### Admin Dashboard
- Access the admin dashboard at `/admin`
- Login with authorized credentials
- Manage patients, staff, and resources
- View system statistics and metrics

## API Endpoints

### Patient Management
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Add new patient
- `PUT /api/patients/:id` - Update patient information
- `PUT /api/patients/:id/status` - Update patient status
- `DELETE /api/patients/:id` - Remove patient

### Staff Management
- `GET /api/staff` - List all staff
- `GET /api/staff/:id` - Get staff details
- `POST /api/staff` - Add new staff
- `PUT /api/staff/:id` - Update staff information
- `PUT /api/staff/:id/availability` - Update staff availability
- `DELETE /api/staff/:id` - Remove staff

### Resource Management
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get resource details
- `POST /api/resources` - Add new resource
- `PUT /api/resources/:id` - Update resource information
- `PUT /api/resources/:id/status` - Update resource status
- `DELETE /api/resources/:id` - Remove resource

### Triage System
- `GET /api/triage/queue` - Get prioritized patient queue
- `POST /api/triage/calculate` - Calculate priority for a patient
- `GET /api/triage/statistics` - Get triage system statistics
- `GET /api/triage/settings` - Get triage system settings
- `PUT /api/triage/settings` - Update triage system settings

## Fuzzy Logic System

The rule-based/fuzzy logic system calculates patient priority based on:

1. **Risk Level** (from classification model)
   - High: 3
   - Medium: 2
   - Low: 1

2. **Waiting Time**
   - Exponentially weighted: `weight = baseWeight * e^(waitTime/timeConstant)`
   - Ensures patients don't wait indefinitely

3. **Resource Availability**
   - Percentage of required resources available
   - Weighted by necessity

4. **Staff Availability**
   - Percentage of required staff specialties available
   - Weighted by necessity

The system combines these factors to produce a priority score (0-100) that determines the patient's position in the queue.

## Future Enhancements

- Mobile application for staff
- SMS notifications for patients
- Integration with hospital information systems
- Advanced analytics dashboard
- Machine learning for wait time prediction

## Support

For questions or issues, please contact the development team.
