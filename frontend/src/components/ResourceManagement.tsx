import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Resource } from '../lib/supabase';

const ResourceManagement: FC = () => {
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
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('public:resources')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'resources'
      }, fetchResources)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('type', { ascending: true });
      
      if (error) throw error;
      setResources(data || []);
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
        available_capacity: parseInt(formData.capacity),
        status: 'available'
      };
      
      // Insert resource into database
      const { error } = await supabase
        .from('resources')
        .insert([resourceData]);
      
      if (error) throw error;
      
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
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;
      
      let availableCapacity = resource.available_capacity;
      
      // Update available capacity based on status change
      if (resource.status === 'available' && newStatus === 'in_use') {
        availableCapacity = Math.max(0, resource.available_capacity - 1);
      } else if (resource.status === 'in_use' && newStatus === 'available') {
        availableCapacity = Math.min(resource.capacity, resource.available_capacity + 1);
      }
      
      const { error } = await supabase
        .from('resources')
        .update({ 
          status: newStatus, 
          available_capacity: availableCapacity,
          updated_at: new Date().toISOString() 
        })
        .eq('id', resourceId);
      
      if (error) throw error;
      
      // Refresh resource list
      fetchResources();
    } catch (err) {
      console.error('Error updating resource status:', err);
      setError('Failed to update resource status. Please try again.');
    }
  };

  return (
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
                <th>Capacity</th>
                <th>Status</th>
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
                    {resource.available_capacity} / {resource.capacity}
                  </td>
                  <td>
                    <span className={`status-badge ${resource.status}`}>
                      {resource.status === 'available' ? 'Available' :
                       resource.status === 'in_use' ? 'In Use' : 'Maintenance'}
                    </span>
                  </td>
                  <td className="description-cell">
                    {resource.description || 'No description'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {resource.status !== 'available' && (
                        <button 
                          onClick={() => updateResourceStatus(resource.id, 'available')}
                          className="set-available-btn"
                        >
                          Set Available
                        </button>
                      )}
                      {resource.status !== 'in_use' && resource.available_capacity > 0 && (
                        <button 
                          onClick={() => updateResourceStatus(resource.id, 'in_use')}
                          className="set-in-use-btn"
                        >
                          Set In Use
                        </button>
                      )}
                      {resource.status !== 'maintenance' && (
                        <button 
                          onClick={() => updateResourceStatus(resource.id, 'maintenance')}
                          className="set-maintenance-btn"
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
  );
};

export default ResourceManagement;
