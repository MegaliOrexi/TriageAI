import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  session: Session | null;
  currentPage: 'dashboard' | 'patients' | 'staff' | 'resources' | 'settings';
}

const Navbar: FC<NavbarProps> = ({ session, currentPage }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="admin-navbar">
      <div className="navbar-brand">
        <h1>TriageAI</h1>
      </div>
      
      <div className="navbar-links">
        <Link 
          to="/admin" 
          className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/admin/patients" 
          className={`nav-link ${currentPage === 'patients' ? 'active' : ''}`}
        >
          Patients
        </Link>
        <Link 
          to="/admin/staff" 
          className={`nav-link ${currentPage === 'staff' ? 'active' : ''}`}
        >
          Staff
        </Link>
        <Link 
          to="/admin/resources" 
          className={`nav-link ${currentPage === 'resources' ? 'active' : ''}`}
        >
          Resources
        </Link>
        <Link 
          to="/admin/settings" 
          className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
        >
          Settings
        </Link>
      </div>
      
      <div className="navbar-user">
        {session && (
          <>
            <span className="user-email">{session.user.email}</span>
            <button onClick={handleSignOut} className="sign-out-button">
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
