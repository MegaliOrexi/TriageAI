import { useState } from 'react';
import type { FC } from 'react';
import type { Patient } from '../lib/supabase';

interface AddPatientFormProps {
  onSubmit: (patientData: Partial<Patient>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const AddPatientForm: FC<AddPatientFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    systolic_bp: '',
    diastolic_bp: '',
    pulse_rate: '',
    respiratory_rate: '',
    spo2: '',
    temperature: '',
    lactate: '',
    ambulance_arrival: false,
    diabetes: false,
    hypertension: false,
    copd: false,
    AVPU: 'Alert',
    chief_complaint: 'Other',
    symptom_duration: '2-6h'
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    
    // Convert string values to numbers and map field names to match backend expectations
    const patientData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      Systolic_BP: Number(formData.systolic_bp),
      Diastolic_BP: Number(formData.diastolic_bp),
      Pulse_Rate: Number(formData.pulse_rate),
      Respiratory_Rate: Number(formData.respiratory_rate),
      SPO2: Number(formData.spo2),
      Temperature: Number(formData.temperature),
      Lactate: Number(formData.lactate),
      Ambulance_Arrival: formData.ambulance_arrival ? 1 : 0,
      Diabetes: formData.diabetes ? 1 : 0,
      Hypertension: formData.hypertension ? 1 : 0,
      COPD: formData.copd ? 1 : 0,
      AVPU: formData.AVPU,
      Chief_Complaint: formData.chief_complaint,
      Symptom_Duration: formData.symptom_duration
    };

    await onSubmit(patientData);
  };

  return (
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
              <label htmlFor="systolic_bp">Systolic BP*</label>
              <input
                type="number"
                id="systolic_bp"
                name="systolic_bp"
                value={formData.systolic_bp}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="diastolic_bp">Diastolic BP*</label>
              <input
                type="number"
                id="diastolic_bp"
                name="diastolic_bp"
                value={formData.diastolic_bp}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pulse_rate">Pulse Rate*</label>
              <input
                type="number"
                id="pulse_rate"
                name="pulse_rate"
                value={formData.pulse_rate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="respiratory_rate">Respiratory Rate*</label>
              <input
                type="number"
                id="respiratory_rate"
                name="respiratory_rate"
                value={formData.respiratory_rate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="spo2">SpO2 (%)*</label>
              <input
                type="number"
                id="spo2"
                name="spo2"
                value={formData.spo2}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="temperature">Temperature (°C)*</label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                required
                step="0.1"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lactate">Lactate*</label>
              <input
                type="number"
                id="lactate"
                name="lactate"
                value={formData.lactate}
                onChange={handleInputChange}
                required
                step="0.1"
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
              <label htmlFor="chief_complaint">Chief Complaint*</label>
              <select
                id="chief_complaint"
                name="chief_complaint"
                value={formData.chief_complaint}
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
              <label htmlFor="symptom_duration">Symptom Duration*</label>
              <select
                id="symptom_duration"
                name="symptom_duration"
                value={formData.symptom_duration}
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
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Add Patient'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatientForm; 