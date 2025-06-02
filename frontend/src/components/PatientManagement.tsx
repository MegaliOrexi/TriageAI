import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/supabase';


const PatientManagement: FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    chief_complaint: '',
    systolic_bp: '',
    diastolic_bp: '',
    pulse_rate: '',
    respiratory_rate: '',
    spo2: '',
    temperature: '',
    avpu: 'A',
    diabetes: false,
    hypertension: false,
    copd: false,
    ambulance_arrival: false,
    symptom_duration: '',
    risk_level: '2' // Default to medium risk
  });
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('public:patients')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'patients'
      }, fetchPatients)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('arrival_time', { ascending: false });
      
      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Convert form data to appropriate types
      const patientData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        chief_complaint: formData.chief_complaint,
        systolic_bp: formData.systolic_bp ? parseInt(formData.systolic_bp) : null,
        diastolic_bp: formData.diastolic_bp ? parseInt(formData.diastolic_bp) : null,
        pulse_rate: formData.pulse_rate ? parseInt(formData.pulse_rate) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
        spo2: formData.spo2 ? parseFloat(formData.spo2) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        avpu: formData.avpu,
        diabetes: formData.diabetes,
        hypertension: formData.hypertension,
        copd: formData.copd,
        ambulance_arrival: formData.ambulance_arrival,
        symptom_duration: formData.symptom_duration,
        risk_level: parseInt(formData.risk_level),
        status: 'waiting',
        arrival_time: new Date().toISOString()
      };
      
      // Insert patient into database
      const { error } = await supabase
        .from('patients')
        .insert([patientData]);
      
      if (error) throw error;
      
      // Reset form and show success message
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        chief_complaint: '',
        systolic_bp: '',
        diastolic_bp: '',
        pulse_rate: '',
        respiratory_rate: '',
        spo2: '',
        temperature: '',
        avpu: 'A',
        diabetes: false,
        hypertension: false,
        copd: false,
        ambulance_arrival: false,
        symptom_duration: '',
        risk_level: '2'
      });
      
      setSuccessMessage('Patient added successfully!');
      setIsAddingPatient(false);
      
      // Refresh patient list
      fetchPatients();
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Failed to add patient. Please try again.');
    }
  };

  const updatePatientStatus = async (patientId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', patientId);
      
      if (error) throw error;
      
      // Refresh patient list
      fetchPatients();
    } catch (err) {
      console.error('Error updating patient status:', err);
      setError('Failed to update patient status. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <div className="patient-management">

      
      <header className="section-header">
        <h2>Patient Management</h2>
        <button 
          className="add-patient-btn"
          onClick={() => setIsAddingPatient(!isAddingPatient)}
        >
          {isAddingPatient ? 'Cancel' : 'Add New Patient'}
        </button>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {isAddingPatient && (
        <div className="add-patient-form">
          <h3>Add New Patient</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Patient Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name*</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Last Name*</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date_of_birth">Date of Birth*</label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4>Vital Signs</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="systolic_bp">Systolic BP</label>
                  <input
                    type="number"
                    id="systolic_bp"
                    name="systolic_bp"
                    value={formData.systolic_bp}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="diastolic_bp">Diastolic BP</label>
                  <input
                    type="number"
                    id="diastolic_bp"
                    name="diastolic_bp"
                    value={formData.diastolic_bp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pulse_rate">Pulse Rate</label>
                  <input
                    type="number"
                    id="pulse_rate"
                    name="pulse_rate"
                    value={formData.pulse_rate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="respiratory_rate">Respiratory Rate</label>
                  <input
                    type="number"
                    id="respiratory_rate"
                    name="respiratory_rate"
                    value={formData.respiratory_rate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="spo2">SpO2 (%)</label>
                  <input
                    type="number"
                    id="spo2"
                    name="spo2"
                    value={formData.spo2}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="temperature">Temperature (°C)</label>
                  <input
                    type="number"
                    id="temperature"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="avpu">AVPU</label>
                  <select
                    id="avpu"
                    name="avpu"
                    value={formData.avpu}
                    onChange={handleInputChange}
                  >
                    <option value="A">Alert</option>
                    <option value="V">Verbal</option>
                    <option value="P">Pain</option>
                    <option value="U">Unresponsive</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4>Medical History</h4>
              <div className="form-row checkbox-row">
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="diabetes"
                    name="diabetes"
                    checked={formData.diabetes}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="diabetes">Diabetes</label>
                </div>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="hypertension"
                    name="hypertension"
                    checked={formData.hypertension}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="hypertension">Hypertension</label>
                </div>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="copd"
                    name="copd"
                    checked={formData.copd}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="copd">COPD</label>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h4>Triage Information</h4>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="chief_complaint">Chief Complaint*</label>
                  <textarea
                    id="chief_complaint"
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="symptom_duration">Symptom Duration</label>
                  <input
                    type="text"
                    id="symptom_duration"
                    name="symptom_duration"
                    value={formData.symptom_duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 2 days"
                  />
                </div>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="ambulance_arrival"
                    name="ambulance_arrival"
                    checked={formData.ambulance_arrival}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="ambulance_arrival">Arrived by Ambulance</label>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="risk_level">Risk Level*</label>
                  <select
                    id="risk_level"
                    name="risk_level"
                    value={formData.risk_level}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="1">Low Risk</option>
                    <option value="2">Medium Risk</option>
                    <option value="3">High Risk</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={() => setIsAddingPatient(false)} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Add Patient
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="patients-list">
        <h3>Current Patients</h3>
        
        {loading ? (
          <div className="loading-spinner">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="empty-list">No patients in the system</div>
        ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Risk Level</th>
                <th>Chief Complaint</th>
                <th>Arrival Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(patient => (
                <tr key={patient.id} className={`status-${patient.status}`}>
                  <td>{patient.first_name} {patient.last_name}</td>
                  <td className={`risk-${patient.risk_level}`}>
                    {patient.risk_level === 3 ? 'High' : 
                     patient.risk_level === 2 ? 'Medium' : 'Low'}
                  </td>
                  <td>{patient.chief_complaint}</td>
                  <td>
                    <div>{formatDate(patient.arrival_time)}</div>
                    <div className="time-small">{formatTime(patient.arrival_time)}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${patient.status}`}>
                      {patient.status === 'waiting' ? 'Waiting' :
                       patient.status === 'in_treatment' ? 'In Treatment' :
                       patient.status === 'treated' ? 'Treated' : 'Discharged'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {patient.status === 'waiting' && (
                        <button 
                          onClick={() => updatePatientStatus(patient.id, 'in_treatment')}
                          className="start-treatment-btn"
                        >
                          Start Treatment
                        </button>
                      )}
                      {patient.status === 'in_treatment' && (
                        <button 
                          onClick={() => updatePatientStatus(patient.id, 'treated')}
                          className="complete-treatment-btn"
                        >
                          Complete Treatment
                        </button>
                      )}
                      {patient.status === 'treated' && (
                        <button 
                          onClick={() => updatePatientStatus(patient.id, 'discharged')}
                          className="discharge-btn"
                        >
                          Discharge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PatientManagement;
