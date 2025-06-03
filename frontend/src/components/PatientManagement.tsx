import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/supabase';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    return Promise.reject(error);
  }
);

const PatientManagement: FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Patient Info
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    // Triage Data
    Systolic_BP: '',
    Diastolic_BP: '',
    Pulse_Rate: '',
    Respiratory_Rate: '',
    SPO2: '',
    Temperature: '',
    Age: '',
    Lactate: '',
    Shock_Index: '',
    NEWS2: '',
    Ambulance_Arrival: false,
    Diabetes: false,
    Hypertension: false,
    COPD: false,
    AVPU: 'Alert',
    Chief_Complaint: 'Other',
    Symptom_Duration: '2-6h'
  });

  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);

  const chiefComplaints = [
    'Abdominal Pain',
    'Chest Pain',
    'Dyspnea',
    'Neurological',
    'Other',
    'Trauma'
  ];

  const symptomDurations = ['<2h', '2-6h', '>6h'];
  const avpuOptions = ['Alert', 'Voice', 'Pain', 'Unresponsive'];

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
      const response = await api.get('api/patients');
      setPatients(response.data || []);
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
      setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setPredicting(true);
    
    try {
      // Prepare patient data with triage information
      const patientData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        // Include all triage data
        Systolic_BP: Number(formData.Systolic_BP),
        Diastolic_BP: Number(formData.Diastolic_BP),
        Pulse_Rate: Number(formData.Pulse_Rate),
        Respiratory_Rate: Number(formData.Respiratory_Rate),
        SPO2: Number(formData.SPO2),
        Temperature: Number(formData.Temperature),
        Age: Number(formData.Age),
        Lactate: Number(formData.Lactate),
        Shock_Index: Number(formData.Shock_Index),
        NEWS2: Number(formData.NEWS2),
        Ambulance_Arrival: formData.Ambulance_Arrival ? 1 : 0,
        Diabetes: formData.Diabetes ? 1 : 0,
        Hypertension: formData.Hypertension ? 1 : 0,
        COPD: formData.COPD ? 1 : 0,
        AVPU: formData.AVPU,
        Chief_Complaint: formData.Chief_Complaint,
        Symptom_Duration: formData.Symptom_Duration
      };

      // Send data to backend API using the configured axios instance
      const response = await api.post('api/patients', patientData);
      
      if (response.data) {
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          date_of_birth: '',
          gender: '',
          Systolic_BP: '',
          Diastolic_BP: '',
          Pulse_Rate: '',
          Respiratory_Rate: '',
          SPO2: '',
          Temperature: '',
          Age: '',
          Lactate: '',
          Shock_Index: '',
          NEWS2: '',
          Ambulance_Arrival: false,
          Diabetes: false,
          Hypertension: false,
          COPD: false,
          AVPU: 'Alert',
          Chief_Complaint: 'Other',
          Symptom_Duration: '2-6h'
        });
        
        setSuccessMessage('Patient added successfully!');
        setIsAddingPatient(false);
        
        // Refresh patient list
        fetchPatients();
      }
    } catch (error) {
      console.error('Error adding patient:', error);
      setError('Failed to add patient. Please try again.');
    } finally {
      setPredicting(false);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>TriageAI Admin Dashboard</h1>
        <div className="header-actions">
          <button className="view-patient-queue" onClick={() => window.open('/', '_blank')}>
            View Patient Queue
          </button>
          <button className="sign-out" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <nav className="dashboard-nav">
          <ul>
            <li>
              <Link to="/admin">Dashboard</Link>
            </li>
            <li className="active">
              <Link to="/admin/patients">Patients</Link>
            </li>
            <li>
              <Link to="/admin/staff">Staff</Link>
            </li>
            <li>
              <Link to="/admin/resources">Resources</Link>
            </li>
            <li>
              <Link to="/admin/settings">Settings</Link>
            </li>
          </ul>
        </nav>
        
        <main className="dashboard-main">
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
                    <h4>Vital Signs & Triage Data</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="Systolic_BP">Systolic BP*</label>
                        <input
                          type="number"
                          id="Systolic_BP"
                          name="Systolic_BP"
                          value={formData.Systolic_BP}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="Diastolic_BP">Diastolic BP*</label>
                        <input
                          type="number"
                          id="Diastolic_BP"
                          name="Diastolic_BP"
                          value={formData.Diastolic_BP}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="Pulse_Rate">Pulse Rate*</label>
                        <input
                          type="number"
                          id="Pulse_Rate"
                          name="Pulse_Rate"
                          value={formData.Pulse_Rate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="Respiratory_Rate">Respiratory Rate*</label>
                        <input
                          type="number"
                          id="Respiratory_Rate"
                          name="Respiratory_Rate"
                          value={formData.Respiratory_Rate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="SPO2">SpO2 (%)*</label>
                        <input
                          type="number"
                          id="SPO2"
                          name="SPO2"
                          value={formData.SPO2}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="Temperature">Temperature (°C)*</label>
                        <input
                          type="number"
                          id="Temperature"
                          name="Temperature"
                          value={formData.Temperature}
                          onChange={handleInputChange}
                          required
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="Age">Age*</label>
                        <input
                          type="number"
                          id="Age"
                          name="Age"
                          value={formData.Age}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="Lactate">Lactate*</label>
                        <input
                          type="number"
                          id="Lactate"
                          name="Lactate"
                          value={formData.Lactate}
                          onChange={handleInputChange}
                          required
                          step="0.1"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="Shock_Index">Shock Index*</label>
                        <input
                          type="number"
                          id="Shock_Index"
                          name="Shock_Index"
                          value={formData.Shock_Index}
                          onChange={handleInputChange}
                          required
                          step="0.01"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="NEWS2">NEWS2*</label>
                        <input
                          type="number"
                          id="NEWS2"
                          name="NEWS2"
                          value={formData.NEWS2}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h4>Medical History</h4>
                    <div className="form-row checkbox-row">
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="Diabetes"
                          name="Diabetes"
                          checked={!!formData.Diabetes}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="Diabetes">Diabetes</label>
                      </div>
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="Hypertension"
                          name="Hypertension"
                          checked={!!formData.Hypertension}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="Hypertension">Hypertension</label>
                      </div>
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="COPD"
                          name="COPD"
                          checked={!!formData.COPD}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="COPD">COPD</label>
                      </div>
                      <div className="form-group checkbox">
                        <input
                          type="checkbox"
                          id="Ambulance_Arrival"
                          name="Ambulance_Arrival"
                          checked={!!formData.Ambulance_Arrival}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="Ambulance_Arrival">Arrived by Ambulance</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-section">
                    <h4>Triage Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="AVPU">AVPU*</label>
                        <select
                          id="AVPU"
                          name="AVPU"
                          value={formData.AVPU}
                          onChange={handleInputChange}
                          required
                        >
                          {avpuOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="Chief_Complaint">Chief Complaint*</label>
                        <select
                          id="Chief_Complaint"
                          name="Chief_Complaint"
                          value={formData.Chief_Complaint}
                          onChange={handleInputChange}
                          required
                        >
                          {chiefComplaints.map(complaint => (
                            <option key={complaint} value={complaint}>{complaint}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="Symptom_Duration">Symptom Duration*</label>
                        <select
                          id="Symptom_Duration"
                          name="Symptom_Duration"
                          value={formData.Symptom_Duration}
                          onChange={handleInputChange}
                          required
                        >
                          {symptomDurations.map(duration => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" onClick={() => setIsAddingPatient(false)} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={predicting}>
                      {predicting ? 'Processing...' : 'Add Patient'}
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
        </main>
      </div>
      
      <footer className="dashboard-footer">
        <p>TriageAI Admin Dashboard &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default PatientManagement;
