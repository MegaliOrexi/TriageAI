# TriageAI System Test Plan

## 1. Frontend Testing

### 1.1 Patient View
- [ ] Verify patient queue displays correctly
- [ ] Confirm real-time updates when patient status changes
- [ ] Test responsive design on different screen sizes
- [ ] Validate waiting time calculation and display

### 1.2 Admin Authentication
- [ ] Test login functionality
- [ ] Verify protected routes redirect unauthenticated users
- [ ] Test session persistence after page refresh
- [ ] Validate logout functionality

### 1.3 Admin Dashboard
- [ ] Verify statistics display correctly
- [ ] Test navigation between different sections
- [ ] Confirm real-time updates of statistics

### 1.4 Patient Management
- [ ] Test adding new patients
- [ ] Verify patient list displays correctly
- [ ] Test updating patient status (waiting → in treatment → treated → discharged)
- [ ] Validate form validation for required fields

### 1.5 Staff Management
- [ ] Test adding new staff members
- [ ] Verify staff list displays correctly
- [ ] Test updating staff availability status
- [ ] Validate form validation for required fields

### 1.6 Resource Management
- [ ] Test adding new resources
- [ ] Verify resource list displays correctly
- [ ] Test updating resource status and capacity
- [ ] Validate form validation for required fields

### 1.7 System Settings
- [ ] Test updating triage algorithm parameters
- [ ] Verify settings are saved and persisted
- [ ] Test validation of weight parameters (sum to 1.0)

## 2. Backend API Testing

### 2.1 Patients API
- [ ] Test GET /api/patients endpoint
- [ ] Test GET /api/patients/:id endpoint
- [ ] Test POST /api/patients endpoint
- [ ] Test PUT /api/patients/:id endpoint
- [ ] Test PUT /api/patients/:id/status endpoint
- [ ] Test DELETE /api/patients/:id endpoint

### 2.2 Staff API
- [ ] Test GET /api/staff endpoint
- [ ] Test GET /api/staff/:id endpoint
- [ ] Test POST /api/staff endpoint
- [ ] Test PUT /api/staff/:id endpoint
- [ ] Test PUT /api/staff/:id/availability endpoint
- [ ] Test DELETE /api/staff/:id endpoint

### 2.3 Resources API
- [ ] Test GET /api/resources endpoint
- [ ] Test GET /api/resources/:id endpoint
- [ ] Test POST /api/resources endpoint
- [ ] Test PUT /api/resources/:id endpoint
- [ ] Test PUT /api/resources/:id/status endpoint
- [ ] Test DELETE /api/resources/:id endpoint

### 2.4 Triage API
- [ ] Test GET /api/triage/queue endpoint
- [ ] Test POST /api/triage/calculate endpoint
- [ ] Test GET /api/triage/settings endpoint
- [ ] Test PUT /api/triage/settings endpoint
- [ ] Test GET /api/triage/statistics endpoint

## 3. Integration Testing

### 3.1 Triage Logic
- [ ] Verify priority calculation with different patient parameters
- [ ] Test exponential waiting time weighting
- [ ] Validate resource and staff availability factors
- [ ] Test priority updates when patient parameters change

### 3.2 Real-time Updates
- [ ] Verify Supabase real-time subscriptions work for patients
- [ ] Test real-time updates for staff status changes
- [ ] Validate real-time updates for resource availability
- [ ] Test queue reordering when priorities change

### 3.3 Error Handling
- [ ] Test API error responses
- [ ] Verify frontend error handling and display
- [ ] Test network failure scenarios
- [ ] Validate form validation error handling

## 4. Performance Testing

### 4.1 Load Testing
- [ ] Test system with large number of patients (100+)
- [ ] Verify response times remain acceptable under load
- [ ] Test concurrent API requests
- [ ] Validate real-time updates under load

### 4.2 Database Performance
- [ ] Test query performance with large datasets
- [ ] Verify index usage for common queries
- [ ] Test transaction handling

## 5. Security Testing

### 5.1 Authentication
- [ ] Verify admin-only routes are protected
- [ ] Test invalid login credentials
- [ ] Validate session timeout handling
- [ ] Test CSRF protection

### 5.2 Authorization
- [ ] Verify row-level security policies in Supabase
- [ ] Test API endpoint authorization
- [ ] Validate data access restrictions

### 5.3 Input Validation
- [ ] Test SQL injection prevention
- [ ] Verify XSS protection
- [ ] Test with malformed input data
- [ ] Validate file upload security (if applicable)

## 6. Deployment Testing

### 6.1 Environment Configuration
- [ ] Verify environment variables are correctly set
- [ ] Test with production Supabase project
- [ ] Validate API URL configuration
- [ ] Test CORS configuration

### 6.2 Build Process
- [ ] Verify frontend build process
- [ ] Test backend deployment
- [ ] Validate static file serving
- [ ] Test with production database

### 6.3 Monitoring
- [ ] Set up error logging
- [ ] Configure performance monitoring
- [ ] Test alerting mechanisms
- [ ] Validate audit logging

## 7. User Acceptance Testing

### 7.1 Patient Workflow
- [ ] Test end-to-end patient journey
- [ ] Verify queue display accuracy
- [ ] Validate waiting time estimates
- [ ] Test with different patient scenarios

### 7.2 Admin Workflow
- [ ] Test end-to-end admin workflows
- [ ] Verify dashboard usability
- [ ] Validate patient management process
- [ ] Test resource allocation scenarios

## 8. Documentation

### 8.1 User Documentation
- [ ] Create admin user guide
- [ ] Document system settings configuration
- [ ] Provide troubleshooting guide
- [ ] Document API endpoints

### 8.2 Technical Documentation
- [ ] Document system architecture
- [ ] Create database schema documentation
- [ ] Document deployment process
- [ ] Provide maintenance procedures
