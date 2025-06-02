# TriageAI Database Schema

## Overview
This document details the database schema for the TriageAI system using Supabase (PostgreSQL). The schema is designed to support all the functionality required for patient triage, staff management, resource tracking, and the rule-based prioritization system.

## Tables

### 1. patients

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Patient Demographics
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  contact_number TEXT,
  
  -- Vital Signs
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  pulse_rate INTEGER,
  respiratory_rate INTEGER,
  spo2 DECIMAL(5,2),
  temperature DECIMAL(5,2),
  avpu TEXT,
  
  -- Medical History
  diabetes BOOLEAN DEFAULT FALSE,
  hypertension BOOLEAN DEFAULT FALSE,
  copd BOOLEAN DEFAULT FALSE,
  
  -- Additional Metrics
  shock_index DECIMAL(5,2),
  news2 INTEGER,
  lactate DECIMAL(5,2),
  
  -- Triage Information
  chief_complaint TEXT NOT NULL,
  symptom_duration TEXT,
  ambulance_arrival BOOLEAN DEFAULT FALSE,
  arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Classification Results
  risk_level INTEGER NOT NULL, -- 1: Low, 2: Medium, 3: High
  
  -- Status
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_treatment', 'treated', 'discharged'
  priority_score DECIMAL(10,2),
  last_priority_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster querying of waiting patients by priority
CREATE INDEX idx_patients_waiting_priority ON patients(status, priority_score) 
WHERE status = 'waiting'; 

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
```

### 2. staff

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Staff Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'doctor', 'nurse', 'technician', etc.
  specialty TEXT NOT NULL,
  
  -- Availability
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'busy', 'off_duty'
  current_patient_id UUID REFERENCES patients(id),
  
  -- Authentication (linked to Supabase auth)
  auth_id UUID UNIQUE,
  
  -- Contact Information
  email TEXT UNIQUE,
  phone TEXT
);

-- Index for faster querying of available staff by specialty
CREATE INDEX idx_staff_available_specialty ON staff(status, specialty) 
WHERE status = 'available';

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
```

### 3. resources

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Resource Information
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'x_ray', 'mri', 'ct_scan', 'room', 'bed', etc.
  description TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'in_use', 'maintenance'
  current_patient_id UUID REFERENCES patients(id),
  
  -- Capacity (if applicable)
  capacity INTEGER DEFAULT 1,
  available_capacity INTEGER DEFAULT 1
);

-- Index for faster querying of available resources by type
CREATE INDEX idx_resources_available_type ON resources(status, type) 
WHERE status = 'available';

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
```

### 4. patient_resource_requirements

```sql
CREATE TABLE patient_resource_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  
  -- Priority
  is_critical BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_fulfilled BOOLEAN DEFAULT FALSE,
  
  UNIQUE(patient_id, resource_type)
);

-- Index for faster querying of unfulfilled requirements
CREATE INDEX idx_patient_resource_unfulfilled ON patient_resource_requirements(patient_id, is_fulfilled) 
WHERE is_fulfilled = FALSE;
```

### 5. patient_specialty_requirements

```sql
CREATE TABLE patient_specialty_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  
  -- Priority
  is_critical BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_fulfilled BOOLEAN DEFAULT FALSE,
  
  UNIQUE(patient_id, specialty)
);

-- Index for faster querying of unfulfilled requirements
CREATE INDEX idx_patient_specialty_unfulfilled ON patient_specialty_requirements(patient_id, is_fulfilled) 
WHERE is_fulfilled = FALSE;
```

### 6. treatments

```sql
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id),
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  
  -- Details
  notes TEXT,
  outcome TEXT
);

-- Index for faster querying of active treatments
CREATE INDEX idx_treatments_active ON treatments(patient_id, end_time) 
WHERE end_time IS NULL;

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON treatments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
```

### 7. treatment_resources

```sql
CREATE TABLE treatment_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id),
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(treatment_id, resource_id)
);

-- Index for faster querying of active resource usage
CREATE INDEX idx_treatment_resources_active ON treatment_resources(resource_id, end_time) 
WHERE end_time IS NULL;
```

### 8. system_settings

```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Settings
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT
);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
```

### 9. priority_logs

```sql
CREATE TABLE priority_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relationships
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Priority Information
  previous_score DECIMAL(10,2),
  new_score DECIMAL(10,2),
  waiting_time_minutes INTEGER,
  risk_level INTEGER,
  resource_availability_factor DECIMAL(5,2),
  staff_availability_factor DECIMAL(5,2),
  
  -- Additional Information
  reason TEXT
);

-- Index for faster querying of logs by patient
CREATE INDEX idx_priority_logs_patient ON priority_logs(patient_id, created_at);
```

## Functions and Triggers

### 1. set_updated_at_timestamp()

```sql
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. update_resource_availability()

```sql
CREATE OR REPLACE FUNCTION update_resource_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_use' AND OLD.status = 'available' THEN
    NEW.available_capacity = NEW.available_capacity - 1;
  ELSIF NEW.status = 'available' AND OLD.status = 'in_use' THEN
    NEW.available_capacity = NEW.available_capacity + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resource_availability_trigger
BEFORE UPDATE ON resources
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION update_resource_availability();
```

### 3. update_patient_status_on_treatment()

```sql
CREATE OR REPLACE FUNCTION update_patient_status_on_treatment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a treatment starts, update patient status to 'in_treatment'
  IF TG_OP = 'INSERT' THEN
    UPDATE patients SET status = 'in_treatment' WHERE id = NEW.patient_id;
  
  -- When a treatment ends, update patient status to 'treated'
  ELSIF TG_OP = 'UPDATE' AND NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    UPDATE patients SET status = 'treated' WHERE id = NEW.patient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_patient_status_trigger
AFTER INSERT OR UPDATE ON treatments
FOR EACH ROW
EXECUTE FUNCTION update_patient_status_on_treatment();
```

## Row Level Security Policies

### 1. patients Table

```sql
-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Public can only view limited patient information
CREATE POLICY patients_view_public ON patients
FOR SELECT
USING (TRUE);

-- Only authenticated users can modify patient data
CREATE POLICY patients_modify_auth ON patients
FOR ALL
USING (auth.role() = 'authenticated');
```

### 2. staff Table

```sql
-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Public can view staff information
CREATE POLICY staff_view_public ON staff
FOR SELECT
USING (TRUE);

-- Only authenticated users can modify staff data
CREATE POLICY staff_modify_auth ON staff
FOR ALL
USING (auth.role() = 'authenticated');

-- Staff can only modify their own data
CREATE POLICY staff_modify_own ON staff
FOR UPDATE
USING (auth.uid() = auth_id);
```

### 3. resources Table

```sql
-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public can view resource information
CREATE POLICY resources_view_public ON resources
FOR SELECT
USING (TRUE);

-- Only authenticated users can modify resource data
CREATE POLICY resources_modify_auth ON resources
FOR ALL
USING (auth.role() = 'authenticated');
```

## Initial Data

### 1. System Settings

```sql
INSERT INTO system_settings (key, value, description)
VALUES 
('priority_calculation', 
 '{
    "risk_level_weight": 0.5,
    "waiting_time_weight": 0.3,
    "resource_availability_weight": 0.1,
    "staff_availability_weight": 0.1,
    "waiting_time_exponent_base": 1.05,
    "waiting_time_constant": 30
  }',
 'Weights and parameters for the priority calculation algorithm'
),
('display_settings',
 '{
    "patient_view_refresh_rate": 10,
    "admin_view_refresh_rate": 5,
    "show_estimated_wait_time": true,
    "max_queue_display": 20
  }',
 'Settings for the user interface displays'
);
```

### 2. Resource Types

```sql
INSERT INTO resources (name, type, description)
VALUES 
('X-Ray Room 1', 'x_ray', 'Main X-Ray room'),
('X-Ray Room 2', 'x_ray', 'Secondary X-Ray room'),
('MRI Scanner', 'mri', 'Magnetic Resonance Imaging scanner'),
('CT Scanner', 'ct_scan', 'Computed Tomography scanner'),
('Ultrasound 1', 'ultrasound', 'Ultrasound machine 1'),
('Ultrasound 2', 'ultrasound', 'Ultrasound machine 2'),
('Treatment Room 1', 'room', 'General treatment room'),
('Treatment Room 2', 'room', 'General treatment room'),
('Treatment Room 3', 'room', 'General treatment room'),
('Treatment Room 4', 'room', 'General treatment room'),
('ICU Bed 1', 'icu_bed', 'Intensive Care Unit bed'),
('ICU Bed 2', 'icu_bed', 'Intensive Care Unit bed'),
('ICU Bed 3', 'icu_bed', 'Intensive Care Unit bed'),
('Regular Bed 1', 'bed', 'Regular hospital bed'),
('Regular Bed 2', 'bed', 'Regular hospital bed'),
('Regular Bed 3', 'bed', 'Regular hospital bed'),
('Regular Bed 4', 'bed', 'Regular hospital bed'),
('Regular Bed 5', 'bed', 'Regular hospital bed'),
('Lab Equipment', 'lab', 'Laboratory testing equipment'),
('EKG Machine', 'ekg', 'Electrocardiogram machine');
```

## Indexes for Performance

```sql
-- For patient queue display (ordered by priority)
CREATE INDEX idx_patient_queue ON patients(status, priority_score DESC)
WHERE status = 'waiting';

-- For staff availability
CREATE INDEX idx_staff_availability ON staff(status, specialty)
WHERE status = 'available';

-- For resource availability
CREATE INDEX idx_resource_availability ON resources(status, type)
WHERE status = 'available';

-- For patient history
CREATE INDEX idx_patient_history ON treatments(patient_id, start_time DESC);
```

## Views

### 1. patient_queue_view

```sql
CREATE VIEW patient_queue_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.risk_level,
  p.chief_complaint,
  p.arrival_time,
  p.priority_score,
  EXTRACT(EPOCH FROM (NOW() - p.arrival_time))/60 AS waiting_time_minutes,
  p.status
FROM 
  patients p
WHERE 
  p.status = 'waiting'
ORDER BY 
  p.priority_score DESC;
```

### 2. resource_status_view

```sql
CREATE VIEW resource_status_view AS
SELECT 
  r.id,
  r.name,
  r.type,
  r.status,
  r.available_capacity,
  r.capacity,
  p.first_name || ' ' || p.last_name AS current_patient_name
FROM 
  resources r
LEFT JOIN 
  patients p ON r.current_patient_id = p.id;
```

### 3. staff_status_view

```sql
CREATE VIEW staff_status_view AS
SELECT 
  s.id,
  s.first_name,
  s.last_name,
  s.role,
  s.specialty,
  s.status,
  p.first_name || ' ' || p.last_name AS current_patient_name
FROM 
  staff s
LEFT JOIN 
  patients p ON s.current_patient_id = p.id;
```

### 4. patient_requirements_view

```sql
CREATE VIEW patient_requirements_view AS
SELECT 
  p.id AS patient_id,
  p.first_name,
  p.last_name,
  p.risk_level,
  p.status,
  
  -- Resource requirements
  ARRAY_AGG(DISTINCT prr.resource_type) FILTER (WHERE prr.id IS NOT NULL) AS required_resources,
  ARRAY_AGG(DISTINCT prr.resource_type) FILTER (WHERE prr.id IS NOT NULL AND prr.is_fulfilled = FALSE) AS unfulfilled_resources,
  
  -- Specialty requirements
  ARRAY_AGG(DISTINCT psr.specialty) FILTER (WHERE psr.id IS NOT NULL) AS required_specialties,
  ARRAY_AGG(DISTINCT psr.specialty) FILTER (WHERE psr.id IS NOT NULL AND psr.is_fulfilled = FALSE) AS unfulfilled_specialties
  
FROM 
  patients p
LEFT JOIN 
  patient_resource_requirements prr ON p.id = prr.patient_id
LEFT JOIN 
  patient_specialty_requirements psr ON p.id = psr.patient_id
GROUP BY 
  p.id, p.first_name, p.last_name, p.risk_level, p.status;
```
