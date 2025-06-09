import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { Resource } from '../lib/supabase';
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

const ResourceManagement: FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    capacity: '1'
  });
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
    
    // Set up polling to refresh data periodically
    const interval = setInterval(fetchResources, 100000); // Poll every 10 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/resources');
      setResources(response.data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Create resource object
      const resourceData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        capacity: parseInt(formData.capacity),
      };
      
      // Send to backend API
      await api.post('/api/resources', resourceData);
      
      // Reset form and show success message
      setFormData({
        name: '',
        type: '',
        description: '',
        capacity: '1'
      });
      
      setSuccessMessage('Resource added successfully!');
      setIsAddingResource(false);
      
      // Refresh resource list
      fetchResources();
    } catch (err) {
      console.error('Error adding resource:', err);
      setError('Failed to add resource. Please try again.');
    }
  };

  const updateResourceStatus = async (resourceId: string, newStatus: string) => {
    try {
      await api.put(`/api/resources/${resourceId}/status`, { status: newStatus });
      
      // Refresh resource list
      fetchResources();
    } catch (err) {
      console.error('Error updating resource status:', err);
      setError('Failed to update resource status. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await api.post('/api/auth/signout');
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
            <li>
              <Link to="/admin/patients">Patients</Link>
            </li>
            <li>
              <Link to="/admin/staff">Staff</Link>
            </li>
            <li className="active">
              <Link to="/admin/resources">Resources</Link>
            </li>
            <li>
              <Link to="/admin/settings">Settings</Link>
            </li>
          </ul>
        </nav>
        
        <main className="dashboard-main">
          <div className="resource-management">
            <header className="section-header">
              <h2>Resource Management</h2>
              <button 
                className="add-resource-btn"
                onClick={() => setIsAddingResource(!isAddingResource)}
              >
                {isAddingResource ? 'Cancel' : 'Add New Resource'}
              </button>
            </header>
            
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            {isAddingResource && (
              <div className="add-resource-form">
                <h3>Add New Resource</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Resource Name*</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="type">Resource Type*</label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="x_ray">X-Ray</option>
                        <option value="mri">MRI</option>
                        <option value="ct_scan">CT Scan</option>
                        <option value="ultrasound">Ultrasound</option>
                        <option value="room">Treatment Room</option>
                        <option value="icu_bed">ICU Bed</option>
                        <option value="bed">Regular Bed</option>
                        <option value="lab">Lab Equipment</option>
                        <option value="ekg">EKG Machine</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="capacity">Capacity*</label>
                      <input
                        type="number"
                        id="capacity"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" onClick={() => setIsAddingResource(false)} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      Add Resource
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="resource-list">
              <h3>Current Resources</h3>
              
              {loading ? (
                <div className="loading-spinner">Loading resources...</div>
              ) : resources.length === 0 ? (
                <div className="empty-list">No resources in the system</div>
              ) : (
                <table className="resource-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Capacity</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(resource => (
                      <tr key={resource.id} className={`status-${resource.status}`}>
                        <td>{resource.name}</td>
                        <td className="capitalize">
                          {resource.type.replace(/_/g, ' ')}
                        </td>
                        <td>
                          <span className={`status-badge ${resource.status}`}>
                            {resource.status === 'available' ? 'Available' :
                             resource.status === 'in_use' ? 'In Use' : 'Maintenance'}
                          </span>
                        </td>
                        <td>
                          <div>{resource.available_capacity} / {resource.capacity}</div>
                          <div className="time-small">Available / Total</div>
                        </td>
                        <td className="description-cell">
                          {resource.description || 'No description'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {resource.status !== 'available' && (
                              <button 
                                onClick={() => updateResourceStatus(resource.id, 'available')}
                                className="start-treatment-btn"
                              >
                                Set Available
                              </button>
                            )}
                            {resource.status !== 'in_use' && resource.available_capacity > 0 && (
                              <button 
                                onClick={() => updateResourceStatus(resource.id, 'in_use')}
                                className="complete-treatment-btn"
                              >
                                Set In Use
                              </button>
                            )}
                            {resource.status !== 'maintenance' && (
                              <button 
                                onClick={() => updateResourceStatus(resource.id, 'maintenance')}
                                className="discharge-btn"
                              >
                                Set Maintenance
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

export default ResourceManagement;
