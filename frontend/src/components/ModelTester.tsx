import { useState } from 'react';
import type { FC } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

interface PredictionResult {
  risk_level: number;
  risk_level_text: string;
  shock_index: number;
  news2_score: number;
}

const ModelTester: FC = () => {
  const [formData, setFormData] = useState({
    systolic_bp: '',
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

  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setPredictionResult(null);
    setIsLoading(true);
    
    try {
      // Convert form data to match backend expectations
      const testData = {
        Systolic_BP: Number(formData.systolic_bp),
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

      const response = await api.post('/triage/test', testData);
      setPredictionResult(response.data);
    } catch (error: any) {
      console.error('Error testing model:', error);
      const errorMessage = error.response?.data?.error || 'Failed to test model. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="model-tester">
      <header>
        <h1>Triage AI Model Tester</h1>
        <p>Test the AI model by entering patient vital signs and medical history.</p>
      </header>

      <div className="tester-container">
        <form onSubmit={handleSubmit} className="test-form">
          <div className="form-section">
            <h2>Vital Signs</h2>
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
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-row">
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
            <h2>Medical History</h2>
            <div className="form-row checkbox-row">
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
            <h2>Triage Information</h2>
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
            <button type="submit" className="test-btn" disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Model'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {predictionResult && (
          <div className="prediction-result">
            <h2>Prediction Results</h2>
            <div className={`risk-level risk-${predictionResult.risk_level}`}>
              <h3>Risk Level</h3>
              <div className="value">{predictionResult.risk_level_text}</div>
            </div>
            <div className="scores">
              <div className="score-item">
                <label>Shock Index:</label>
                <span>{predictionResult.shock_index.toFixed(2)}</span>
              </div>
              <div className="score-item">
                <label>NEWS2 Score:</label>
                <span>{predictionResult.news2_score}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelTester; 