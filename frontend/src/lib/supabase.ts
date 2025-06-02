import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our database tables
export type Patient = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  contact_number?: string;
  systolic_bp?: number;
  diastolic_bp?: number;
  pulse_rate?: number;
  respiratory_rate?: number;
  spo2?: number;
  temperature?: number;
  avpu?: string;
  diabetes: boolean;
  hypertension: boolean;
  copd: boolean;
  shock_index?: number;
  news2?: number;
  lactate?: number;
  chief_complaint: string;
  symptom_duration?: string;
  ambulance_arrival: boolean;
  arrival_time: string;
  risk_level: number;
  status: 'waiting' | 'in_treatment' | 'treated' | 'discharged';
  priority_score?: number;
  last_priority_update?: string;
  waiting_time_minutes?: number;
  treatment_start_time?: string;
};

export type Staff = {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  role: string;
  specialty: string;
  status: 'available' | 'busy' | 'off_duty';
  current_patient_id?: string | null;
  auth_id?: string;
  email?: string;
  phone?: string;
};

export type Resource = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  type: string;
  description?: string;
  status: 'available' | 'in_use' | 'maintenance';
  current_patient_id?: string | null;
  capacity: number;
  available_capacity: number;
};

export type PatientResourceRequirement = {
  id: string;
  created_at: string;
  patient_id: string;
  resource_type: string;
  is_critical: boolean;
  is_fulfilled: boolean;
};

export type PatientSpecialtyRequirement = {
  id: string;
  created_at: string;
  patient_id: string;
  specialty: string;
  is_critical: boolean;
  is_fulfilled: boolean;
};

export type Treatment = {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  staff_id: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  outcome?: string;
};

export type TreatmentResource = {
  id: string;
  created_at: string;
  treatment_id: string;
  resource_id: string;
  start_time: string;
  end_time?: string;
};

export type SystemSetting = {
  id: string;
  created_at: string;
  updated_at: string;
  key: string;
  value: any;
  description?: string;
};

export type PriorityLog = {
  id: string;
  created_at: string;
  patient_id: string;
  previous_score?: number;
  new_score?: number;
  waiting_time_minutes?: number;
  risk_level?: number;
  resource_availability_factor?: number;
  staff_availability_factor?: number;
  reason?: string;
};

// Helper functions for database operations

// Patients
export const getPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('priority_score', { ascending: false });
  
  if (error) throw error;
  return data as Patient[];
};

export const getPatientQueue = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('status', 'waiting')
    .order('priority_score', { ascending: false });
  
  if (error) throw error;
  return data as Patient[];
};

export const getPatient = async (id: string) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Patient;
};

export const createPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select();
  
  if (error) throw error;
  return data[0] as Patient;
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0] as Patient;
};

export const updatePatientStatus = async (id: string, status: Patient['status']) => {
  const updates: Partial<Patient> = { status };
  
  // If status is changing to in_treatment, record treatment start time
  if (status === 'in_treatment') {
    updates.treatment_start_time = new Date().toISOString();
  }
  
  return updatePatient(id, updates);
};

// Staff
export const getStaff = async () => {
  const { data, error } = await supabase
    .from('staff')
    .select('*');
  
  if (error) throw error;
  return data as Staff[];
};

export const getAvailableStaff = async () => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('status', 'available');
  
  if (error) throw error;
  return data as Staff[];
};

export const getStaffMember = async (id: string) => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Staff;
};

export const createStaffMember = async (staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('staff')
    .insert([staff])
    .select();
  
  if (error) throw error;
  return data[0] as Staff;
};

export const updateStaffMember = async (id: string, updates: Partial<Staff>) => {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0] as Staff;
};

export const updateStaffAvailability = async (id: string, status: Staff['status'], patientId?: string) => {
  const updates: Partial<Staff> = { status };
  
  if (status === 'busy' && patientId) {
    updates.current_patient_id = patientId;
  } else if (status === 'available') {
    updates.current_patient_id = null;
  }
  
  return updateStaffMember(id, updates);
};

// Resources
export const getResources = async () => {
  const { data, error } = await supabase
    .from('resources')
    .select('*');
  
  if (error) throw error;
  return data as Resource[];
};

export const getAvailableResources = async () => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('status', 'available');
  
  if (error) throw error;
  return data as Resource[];
};

export const getResource = async (id: string) => {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Resource;
};

export const createResource = async (resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('resources')
    .insert([resource])
    .select();
  
  if (error) throw error;
  return data[0] as Resource;
};

export const updateResource = async (id: string, updates: Partial<Resource>) => {
  const { data, error } = await supabase
    .from('resources')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0] as Resource;
};

export const updateResourceStatus = async (id: string, status: Resource['status'], patientId?: string) => {
  // First get the current resource to calculate capacity changes
  const resource = await getResource(id);
  
  const updates: Partial<Resource> = { status };
  
  // Update available capacity based on status change
  if (resource.status === 'available' && status === 'in_use') {
    updates.available_capacity = Math.max(0, resource.available_capacity - 1);
    if (patientId) {
      updates.current_patient_id = patientId;
    }
  } else if (resource.status === 'in_use' && status === 'available') {
    updates.available_capacity = Math.min(resource.capacity, resource.available_capacity + 1);
    updates.current_patient_id = null;
  }
  
  return updateResource(id, updates);
};

// System Settings
export const getSystemSettings = async () => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*');
  
  if (error) throw error;
  return data as SystemSetting[];
};

export const getSystemSetting = async (key: string) => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', key)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data as SystemSetting | null;
};

export const updateSystemSetting = async (key: string, value: any, description?: string) => {
  // Check if setting exists
  const existing = await getSystemSetting(key).catch(() => null);
  
  if (existing) {
    // Update existing setting
    const { data, error } = await supabase
      .from('system_settings')
      .update({ value, description })
      .eq('key', key)
      .select();
    
    if (error) throw error;
    return data[0] as SystemSetting;
  } else {
    // Create new setting
    const { data, error } = await supabase
      .from('system_settings')
      .insert([{ key, value, description }])
      .select();
    
    if (error) throw error;
    return data[0] as SystemSetting;
  }
};

// Triage functions
export const getTriageQueue = async () => {
  // This will call the backend API which handles the priority calculation
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triage/queue`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data as Patient[];
  } catch (error) {
    console.error('Error fetching triage queue:', error);
    
    // Fallback to direct Supabase query if API fails
    const { data, error: supabaseError } = await supabase
      .from('patients')
      .select('*')
      .eq('status', 'waiting')
      .order('priority_score', { ascending: false });
    
    if (supabaseError) throw supabaseError;
    return data as Patient[];
  }
};

export const calculatePatientPriority = async (patientId: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triage/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patient_id: patientId }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calculating patient priority:', error);
    throw error;
  }
};

export const getTriageSettings = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triage/settings`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching triage settings:', error);
    
    // Fallback to direct Supabase query
    const setting = await getSystemSetting('priority_calculation');
    return setting?.value || {
      risk_level_weight: 0.5,
      waiting_time_weight: 0.3,
      resource_availability_weight: 0.1,
      staff_availability_weight: 0.1,
      waiting_time_exponent_base: 1.05,
      waiting_time_constant: 30
    };
  }
};

export const updateTriageSettings = async (settings: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triage/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating triage settings:', error);
    throw error;
  }
};

export const getTriageStatistics = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triage/statistics`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching triage statistics:', error);
    throw error;
  }
};
