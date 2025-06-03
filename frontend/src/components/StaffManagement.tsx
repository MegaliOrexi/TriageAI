import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Staff } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

const StaffManagement: FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    specialty: '',
    email: '',
    phone: ''
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('public:staff')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'staff'
      }, fetchStaff)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Create staff object
      const staffData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        specialty: formData.specialty,
        email: formData.email,
        phone: formData.phone,
        status: 'available'
      };
      
      // Insert staff into database
      const { error } = await supabase
        .from('staff')
        .insert([staffData]);
      
      if (error) throw error;
      
      // Reset form and show success message
      setFormData({
        first_name: '',
        last_name: '',
        role: '',
        specialty: '',
        email: '',
        phone: ''
      });
      
      setSuccessMessage('Staff member added successfully!');
      setIsAddingStaff(false);
      
      // Refresh staff list
      fetchStaff();
    } catch (err) {
      console.error('Error adding staff:', err);
      setError('Failed to add staff member. Please try again.');
    }
  };

  const updateStaffStatus = async (staffId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', staffId);
      
      if (error) throw error;
      
      // Refresh staff list
      fetchStaff();
    } catch (err) {
      console.error('Error updating staff status:', err);
      setError('Failed to update staff status. Please try again.');
    }
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
            <li>
              <Link to="/admin/patients">Patients</Link>
            </li>
            <li className="active">
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
          <div className="staff-management">
            <header className="section-header">
              <h2>Staff Management</h2>
              <button 
                className="add-staff-btn"
                onClick={() => setIsAddingStaff(!isAddingStaff)}
              >
                {isAddingStaff ? 'Cancel' : 'Add New Staff'}
              </button>
            </header>
            
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            {isAddingStaff && (
              <div className="add-staff-form">
                <h3>Add New Staff Member</h3>
                <form onSubmit={handleSubmit}>
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
                      <label htmlFor="role">Role*</label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Role</option>
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="technician">Technician</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specialty">Specialty*</label>
                      <select
                        id="specialty"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Specialty</option>
                        <option value="emergency">Emergency Medicine</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="neurology">Neurology</option>
                        <option value="orthopedics">Orthopedics</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" onClick={() => setIsAddingStaff(false)} className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      Add Staff Member
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="staff-list">
              <h3>Current Staff</h3>
              
              {loading ? (
                <div className="loading-spinner">Loading staff...</div>
              ) : staff.length === 0 ? (
                <div className="empty-list">No staff members in the system</div>
              ) : (
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Specialty</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(member => (
                      <tr key={member.id} className={`status-${member.status}`}>
                        <td>
                          <div>{member.first_name} {member.last_name}</div>
                          <div className="time-small">ID: {member.id}</div>
                        </td>
                        <td className="capitalize">
                          <div>{member.role}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${member.status}`}>
                            {member.status === 'available' ? 'Available' :
                             member.status === 'busy' ? 'Busy' : 'Off Duty'}
                          </span>
                        </td>
                        <td className="capitalize">
                          <div>{member.specialty}</div>
                          <div className="time-small">Department</div>
                        </td>
                        <td>
                          {member.email && <div>{member.email}</div>}
                          {member.phone && <div className="time-small">{member.phone}</div>}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {member.status !== 'available' && (
                              <button 
                                onClick={() => updateStaffStatus(member.id, 'available')}
                                className="start-treatment-btn"
                              >
                                Set Available
                              </button>
                            )}
                            {member.status !== 'busy' && (
                              <button 
                                onClick={() => updateStaffStatus(member.id, 'busy')}
                                className="complete-treatment-btn"
                              >
                                Set Busy
                              </button>
                            )}
                            {member.status !== 'off_duty' && (
                              <button 
                                onClick={() => updateStaffStatus(member.id, 'off_duty')}
                                className="discharge-btn"
                              >
                                Set Off Duty
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

export default StaffManagement;
