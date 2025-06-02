import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import './index.css';
// Import components but remove unused App import
import PatientView from './components/PatientView';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import PatientManagement from './components/PatientManagement';
import StaffManagement from './components/StaffManagement';
import ResourceManagement from './components/ResourceManagement';
import SystemSettings from './components/SystemSettings';
import ProtectedRoute from './components/ProtectedRoute';

const Root = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        Loading TriageAI...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PatientView />} />
        <Route path="/login" element={<AdminLogin session={session} />} />
        
        {/* Protected admin routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute session={session}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/patients" 
          element={
            <ProtectedRoute session={session}>
              <PatientManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/staff" 
          element={
            <ProtectedRoute session={session}>
              <StaffManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/resources" 
          element={
            <ProtectedRoute session={session}>
              <ResourceManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute session={session}>
              <SystemSettings />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
