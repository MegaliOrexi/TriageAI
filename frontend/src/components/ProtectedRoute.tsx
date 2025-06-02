import type { FC } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  session: Session | null;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children, session }) => {
  if (!session) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
