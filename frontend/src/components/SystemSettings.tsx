import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';

const SystemSettings: FC = () => {
  const [settings, setSettings] = useState({
    priority_calculation: {
      risk_level_weight: 0.5,
      waiting_time_weight: 0.3,
      resource_availability_weight: 0.1,
      staff_availability_weight: 0.1,
      waiting_time_exponent_base: 1.05,
      waiting_time_constant: 30
    },
    display_settings: {
      patient_view_refresh_rate: 10,
      admin_view_refresh_rate: 5,
      show_estimated_wait_time: true,
      max_queue_display: 20
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch priority calculation settings
      const { data: priorityData, error: priorityError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'priority_calculation')
        .single();
      
      if (priorityError && priorityError.code !== 'PGRST116') throw priorityError;
      
      // Fetch display settings
      const { data: displayData, error: displayError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'display_settings')
        .single();
      
      if (displayError && displayError.code !== 'PGRST116') throw displayError;
      
      // Update state with fetched settings
      const newSettings = { ...settings };
      
      if (priorityData) {
        newSettings.priority_calculation = priorityData.value;
      }
      
      if (displayData) {
        newSettings.display_settings = displayData.value;
      }
      
      setSettings(newSettings);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load system settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      priority_calculation: {
        ...prev.priority_calculation,
        [name]: parseFloat(value)
      }
    }));
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      display_settings: {
        ...prev.display_settings,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Save priority calculation settings
      const { error: priorityError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'priority_calculation',
          value: settings.priority_calculation,
          description: 'Weights and parameters for the priority calculation algorithm'
        });
      
      if (priorityError) throw priorityError;
      
      // Save display settings
      const { error: displayError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'display_settings',
          value: settings.display_settings,
          description: 'Settings for the user interface displays'
        });
      
      if (displayError) throw displayError;
      
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="system-settings">
      <header className="section-header">
        <h2>System Settings</h2>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {loading ? (
        <div className="loading-spinner">Loading settings...</div>
      ) : (
        <div className="settings-container">
          <div className="settings-section">
            <h3>Priority Calculation Settings</h3>
            <p className="section-description">
              These settings control how patient priority is calculated in the triage system.
            </p>
            
            <div className="setting-group">
              <h4>Component Weights</h4>
              <p className="setting-description">
                Weights determine how much each factor contributes to the final priority score.
                All weights should sum to 1.0.
              </p>
              
              <div className="setting-item">
                <label htmlFor="risk_level_weight">Risk Level Weight</label>
                <input
                  type="number"
                  id="risk_level_weight"
                  name="risk_level_weight"
                  value={settings.priority_calculation.risk_level_weight}
                  onChange={handlePriorityChange}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              
              <div className="setting-item">
                <label htmlFor="waiting_time_weight">Waiting Time Weight</label>
                <input
                  type="number"
                  id="waiting_time_weight"
                  name="waiting_time_weight"
                  value={settings.priority_calculation.waiting_time_weight}
                  onChange={handlePriorityChange}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              
              <div className="setting-item">
                <label htmlFor="resource_availability_weight">Resource Availability Weight</label>
                <input
                  type="number"
                  id="resource_availability_weight"
                  name="resource_availability_weight"
                  value={settings.priority_calculation.resource_availability_weight}
                  onChange={handlePriorityChange}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
              
              <div className="setting-item">
                <label htmlFor="staff_availability_weight">Staff Availability Weight</label>
                <input
                  type="number"
                  id="staff_availability_weight"
                  name="staff_availability_weight"
                  value={settings.priority_calculation.staff_availability_weight}
                  onChange={handlePriorityChange}
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
            </div>
            
            <div className="setting-group">
              <h4>Waiting Time Exponential Parameters</h4>
              <p className="setting-description">
                These parameters control how waiting time priority increases exponentially over time.
              </p>
              
              <div className="setting-item">
                <label htmlFor="waiting_time_exponent_base">Exponent Base</label>
                <input
                  type="number"
                  id="waiting_time_exponent_base"
                  name="waiting_time_exponent_base"
                  value={settings.priority_calculation.waiting_time_exponent_base}
                  onChange={handlePriorityChange}
                  min="1"
                  max="2"
                  step="0.01"
                />
                <div className="setting-help">
                  Higher values cause priority to increase more rapidly with time.
                  Recommended range: 1.01 - 1.10
                </div>
              </div>
              
              <div className="setting-item">
                <label htmlFor="waiting_time_constant">Time Constant (minutes)</label>
                <input
                  type="number"
                  id="waiting_time_constant"
                  name="waiting_time_constant"
                  value={settings.priority_calculation.waiting_time_constant}
                  onChange={handlePriorityChange}
                  min="1"
                  max="120"
                  step="1"
                />
                <div className="setting-help">
                  Controls how quickly waiting time priority increases.
                  Lower values cause faster priority increases.
                </div>
              </div>
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Display Settings</h3>
            <p className="section-description">
              These settings control how information is displayed in the user interfaces.
            </p>
            
            <div className="setting-group">
              <h4>Refresh Rates</h4>
              
              <div className="setting-item">
                <label htmlFor="patient_view_refresh_rate">Patient View Refresh Rate (seconds)</label>
                <input
                  type="number"
                  id="patient_view_refresh_rate"
                  name="patient_view_refresh_rate"
                  value={settings.display_settings.patient_view_refresh_rate}
                  onChange={handleDisplayChange}
                  min="5"
                  max="60"
                  step="1"
                />
              </div>
              
              <div className="setting-item">
                <label htmlFor="admin_view_refresh_rate">Admin View Refresh Rate (seconds)</label>
                <input
                  type="number"
                  id="admin_view_refresh_rate"
                  name="admin_view_refresh_rate"
                  value={settings.display_settings.admin_view_refresh_rate}
                  onChange={handleDisplayChange}
                  min="1"
                  max="30"
                  step="1"
                />
              </div>
            </div>
            
            <div className="setting-group">
              <h4>Display Options</h4>
              
              <div className="setting-item checkbox">
                <input
                  type="checkbox"
                  id="show_estimated_wait_time"
                  name="show_estimated_wait_time"
                  checked={settings.display_settings.show_estimated_wait_time}
                  onChange={handleDisplayChange}
                />
                <label htmlFor="show_estimated_wait_time">Show Estimated Wait Time</label>
              </div>
              
              <div className="setting-item">
                <label htmlFor="max_queue_display">Maximum Patients to Display in Queue</label>
                <input
                  type="number"
                  id="max_queue_display"
                  name="max_queue_display"
                  value={settings.display_settings.max_queue_display}
                  onChange={handleDisplayChange}
                  min="5"
                  max="100"
                  step="1"
                />
              </div>
            </div>
          </div>
          
          <div className="settings-actions">
            <button 
              className="save-settings-btn"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
