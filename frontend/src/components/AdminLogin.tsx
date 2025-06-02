import type { FC } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import type { Session } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AdminLoginProps {
  session: Session | null;
}

const AdminLogin: FC<AdminLoginProps> = ({ session }) => {
  // If already logged in, redirect to admin dashboard
  if (session) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <h1>TriageAI Admin</h1>
        <p>Please sign in to access the admin dashboard</p>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={window.location.origin + '/admin'}
          theme="dark"
        />
      </div>
    </div>
  );
};

export default AdminLogin;
