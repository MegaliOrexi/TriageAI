# TriageAI System - Comprehensive Implementation Plan

## 1. System Architecture Overview

### 1.1 High-Level Architecture
The TriageAI system will follow a modern web application architecture with the following components:

- **Frontend**: React-based web application with separate views for patients and administrators
- **Backend**: Node.js server providing RESTful API endpoints
- **Database**: Supabase (PostgreSQL) for data storage and authentication
- **AI Component**: Local integration of the pre-built classification model
- **Rule Engine**: Custom rule-based/fuzzy logic system for patient prioritization

### 1.2 System Flow
1. Patient data is entered into the system (via admin interface)
2. Classification model assigns risk level (High, Medium, Low)
3. Rule-based system determines patient priority based on:
   - Risk level from classification model
   - Waiting time (exponentially weighted)
   - Resource availability
   - Staff availability
4. Patient view displays the prioritized queue
5. Admin view allows management of patients, staff, and resources

## 2. Technology Stack Details

### 2.1 Frontend
- **Framework**: React with TypeScript
- **UI Components**: Tailwind CSS with shadcn/ui
- **State Management**: React Context API or Redux
- **Data Visualization**: Recharts for dashboards
- **API Communication**: Axios for HTTP requests

### 2.2 Backend
- **Runtime**: Node.js
- **API Framework**: Express.js
- **Authentication**: Supabase Auth
- **Validation**: Joi or Zod

### 2.3 Database
- **Platform**: Supabase (PostgreSQL)
- **ORM**: Prisma or Supabase client
- **Authentication**: Supabase Auth with Row-Level Security

### 2.4 AI & Rule Engine
- **Classification Model**: Local integration of pre-built model
- **Rule Engine**: Custom JavaScript implementation of fuzzy logic system

## 3. Database Schema Design

### 3.1 Core Tables
- **Patients**
  - PatientID (PK)
  - Demographics (Age, etc.)
  - Vital Signs (BP, Pulse, etc.)
  - Medical History (Diabetes, Hypertension, etc.)
  - Risk Level (from classification model)
  - Arrival Time
  - Status (Waiting, In Treatment, Treated)
  - Required Resources
  - Required Specialties

- **Staff**
  - StaffID (PK)
  - Name
  - Specialty
  - Availability Schedule
  - Status (Available, Busy, Off-duty)

- **Resources**
  - ResourceID (PK)
  - Type (X-ray, MRI, Room, etc.)
  - Status (Available, In Use)
  - Capacity (if applicable)

- **Treatments**
  - TreatmentID (PK)
  - PatientID (FK)
  - StaffID (FK)
  - ResourceIDs (FK)
  - Start Time
  - End Time
  - Notes

### 3.2 Relationships
- Patients can require multiple Resources
- Patients can require multiple Staff specialties
- Treatments connect Patients, Staff, and Resources

## 4. API Endpoints Design

### 4.1 Patient Management
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Add new patient
- `PUT /api/patients/:id` - Update patient information
- `PUT /api/patients/:id/status` - Update patient status
- `DELETE /api/patients/:id` - Remove patient

### 4.2 Staff Management
- `GET /api/staff` - List all staff
- `GET /api/staff/:id` - Get staff details
- `POST /api/staff` - Add new staff
- `PUT /api/staff/:id` - Update staff information
- `PUT /api/staff/:id/availability` - Update staff availability
- `DELETE /api/staff/:id` - Remove staff

### 4.3 Resource Management
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get resource details
- `POST /api/resources` - Add new resource
- `PUT /api/resources/:id` - Update resource information
- `PUT /api/resources/:id/status` - Update resource status
- `DELETE /api/resources/:id` - Remove resource

### 4.4 Triage System
- `GET /api/triage/queue` - Get prioritized patient queue
- `POST /api/triage/calculate` - Calculate priority for a patient
- `GET /api/triage/statistics` - Get triage system statistics

## 5. Rule-Based/Fuzzy Logic System

### 5.1 Input Variables
- **Risk Level** (from classification model)
  - High: 3
  - Medium: 2
  - Low: 1

- **Waiting Time**
  - Exponential weighting: `weight = baseWeight * e^(waitTime/timeConstant)`
  - Time measured in minutes since arrival

- **Resource Availability**
  - Percentage of required resources available
  - Weighted by necessity of resource

- **Staff Availability**
  - Percentage of required staff specialties available
  - Weighted by necessity of specialty

### 5.2 Rule System Design
- Fuzzy membership functions for each input variable
- Rule base combining input variables
- Defuzzification to produce final priority score
- Dynamic recalculation as conditions change

### 5.3 Priority Calculation
- Combined weighted score from all factors
- Exponential increase in priority based on waiting time
- Adjustment based on resource and staff availability
- Final normalized score (0-100) for queue positioning

## 6. User Interface Design

### 6.1 Patient View
- Large display showing patient queue
- Patient ID/Name (partial for privacy)
- Estimated waiting time
- Current status
- Simple, clean interface optimized for visibility

### 6.2 Admin Dashboard
- Secure login with Supabase authentication
- Patient management interface
  - Add/edit patient information
  - Update patient status
  - View patient details
- Staff management interface
  - Add/edit staff information
  - Update staff availability
  - Assign staff to patients
- Resource management interface
  - Add/edit resource information
  - Update resource status
  - Allocate resources to patients
- System statistics and metrics
  - Average waiting times
  - Resource utilization
  - Staff workload

## 7. Integration Strategy

### 7.1 Classification Model Integration
- Local model integration via JavaScript
- Input: Patient vital signs and medical history
- Output: Risk level classification
- Integration point: Patient registration/update

### 7.2 Supabase Integration
- Database setup with appropriate tables and relationships
- Authentication system for admin access
- Real-time updates using Supabase subscriptions

### 7.3 Frontend-Backend Integration
- RESTful API communication
- Real-time updates for queue changes
- Secure authentication for admin functions

## 8. Implementation Phases

### 8.1 Phase 1: Foundation
- Set up project structure
- Configure Supabase
- Implement database schema
- Create basic API endpoints

### 8.2 Phase 2: Core Functionality
- Implement rule-based/fuzzy logic system
- Integrate classification model
- Develop priority calculation algorithm
- Create basic UI components

### 8.3 Phase 3: User Interfaces
- Develop patient view
- Implement admin dashboard
- Connect interfaces to backend APIs
- Add authentication for admin access

### 8.4 Phase 4: Testing and Refinement
- Test with sample data
- Refine rule-based system
- Optimize performance
- Enhance UI/UX

## 9. Deployment Strategy
- Local development and testing
- Supabase project setup
- Frontend deployment options
- Backend deployment options
- Integration testing in production environment

## 10. Future Enhancements
- Mobile application for staff
- SMS notifications for patients
- Integration with hospital information systems
- Advanced analytics dashboard
- Machine learning for wait time prediction
