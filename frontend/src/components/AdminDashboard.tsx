import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AdminDashboard: FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patientCounts: {
      total: 0,
      waiting: 0,
      inTreatment: 0,
      treated: 0
    },
    staffCounts: {
      total: 0,
      available: 0
    },
    resourceCounts: {
      total: 0,
      available: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch patient statistics
        const { data: patients, error: patientsError } = await supabase
          .from('patients')
          .select('status');
        
        if (patientsError) throw patientsError;
        
        // Fetch staff statistics
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('status');
        
        if (staffError) throw staffError;
        
        // Fetch resource statistics
        const { data: resources, error: resourcesError } = await supabase
          .from('resources')
          .select('status');
        
        if (resourcesError) throw resourcesError;
        
        // Calculate statistics
        const patientStats = {
          total: patients?.length || 0,
          waiting: patients?.filter(p => p.status === 'waiting').length || 0,
          inTreatment: patients?.filter(p => p.status === 'in_treatment').length || 0,
          treated: patients?.filter(p => p.status === 'treated' || p.status === 'discharged').length || 0
        };
        
        const staffStats = {
          total: staff?.length || 0,
          available: staff?.filter(s => s.status === 'available').length || 0
        };
        
        const resourceStats = {
          total: resources?.length || 0,
          available: resources?.filter(r => r.status === 'available').length || 0
        };
        
        setStats({
          patientCounts: patientStats,
          staffCounts: staffStats,
          resourceCounts: resourceStats
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up real-time subscriptions for updates
    const patientsSubscription = supabase
      .channel('public:patients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, fetchDashboardData)
      .subscribe();
      
    const staffSubscription = supabase
      .channel('public:staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, fetchDashboardData)
      .subscribe();
      
    const resourcesSubscription = supabase
      .channel('public:resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, fetchDashboardData)
      .subscribe();
    
    return () => {
      patientsSubscription.unsubscribe();
      staffSubscription.unsubscribe();
      resourcesSubscription.unsubscribe();
    };
  }, []);
  
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
            <li className="active">
              <Link to="/admin">Dashboard</Link>
            </li>
            <li>
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
          <h2>System Overview</h2>
          
          {loading ? (
            <div className="loading-spinner">Loading dashboard data...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card patients">
                <h3>Patients</h3>
                <div className="stat-value">{stats.patientCounts.total}</div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span className="label">Waiting:</span>
                    <span className="value">{stats.patientCounts.waiting}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">In Treatment:</span>
                    <span className="value">{stats.patientCounts.inTreatment}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Treated:</span>
                    <span className="value">{stats.patientCounts.treated}</span>
                  </div>
                </div>
                <Link to="/admin/patients" className="stat-action">Manage Patients</Link>
              </div>
              
              <div className="stat-card staff">
                <h3>Staff</h3>
                <div className="stat-value">{stats.staffCounts.total}</div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span className="label">Available:</span>
                    <span className="value">{stats.staffCounts.available}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Busy:</span>
                    <span className="value">{stats.staffCounts.total - stats.staffCounts.available}</span>
                  </div>
                </div>
                <Link to="/admin/staff" className="stat-action">Manage Staff</Link>
              </div>
              
              <div className="stat-card resources">
                <h3>Resources</h3>
                <div className="stat-value">{stats.resourceCounts.total}</div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span className="label">Available:</span>
                    <span className="value">{stats.resourceCounts.available}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">In Use:</span>
                    <span className="value">{stats.resourceCounts.total - stats.resourceCounts.available}</span>
                  </div>
                </div>
                <Link to="/admin/resources" className="stat-action">Manage Resources</Link>
              </div>
            </div>
          )}
          
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <Link to="/admin/patients" className="action-button add-patient">
                Add New Patient
              </Link>
              <Link to="/admin/staff" className="action-button update-staff">
                Update Staff Availability
              </Link>
              <Link to="/admin/resources" className="action-button update-resources">
                Update Resource Status
              </Link>
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

export default AdminDashboard;
