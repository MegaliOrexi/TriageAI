import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/supabase';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import AddPatientForm from './AddPatientForm';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    // Initial fetch only
    fetchPatients(true);
  }, []);

  const fetchPatients = async (isInitialFetch: boolean = false) => {
    try {
      const response = await api.get('/api/patients');
      setPatients(response.data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again later.');
    } finally {
      if (isInitialFetch) {
        setInitialLoading(false);
      }
    }
  };

  const handleSubmit = async (patientData: Partial<Patient>) => {
    setError(null);
    setSuccessMessage(null);
    setPredicting(true);
    
    try {
      const response = await api.post('/api/patients', patientData);

      if (response.status === 201) {
        setSuccessMessage('Patient added successfully!');
        setIsAddingPatient(false);
        fetchPatients(false);
      } else {
        setError('Failed to add patient. Please try again.');
      }
    } catch (error: any) {
      console.error('Error adding patient:', error);
      // Show the specific error message from the backend if available
      const errorMessage = error.response?.data?.error || 'Failed to add patient. Please try again.';
      setError(errorMessage);
    } finally {
      setPredicting(false);
    }
  };

  const updatePatientStatus = async (patientId: string, newStatus: string) => {
    try {
      await api.put(`/api/patients/${patientId}/status`, { status: newStatus });
      
      // Refresh patient list
      fetchPatients(false);
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
              <AddPatientForm
                onSubmit={handleSubmit}
                onCancel={() => setIsAddingPatient(false)}
                isSubmitting={predicting}
              />
            )}
            
            <div className="patients-list">
              <h3>Current Patients</h3>
              
              {initialLoading ? (
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
