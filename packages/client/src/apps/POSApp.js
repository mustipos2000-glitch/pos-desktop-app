import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useVersion } from '../context/VersionContext';
import UserLoginScreen from '../pages/pos/UserLoginScreen';
import POSScreen from '../pages/pos/POSScreen';
import AdminPanel from '../pages/pos/AdminPanel';
import ReportsPage from '../pages/pos/ReportsPage';
import ProtectedRoute from '../components/ProtectedRoute';

const POSApp = () => {
  const { version } = useVersion();
  
  // Redirect mosque version to mosque app
  if (version === 'mosque') {
    return <Navigate to="/mosque" replace />;
  }

  return (
    <Routes>
      {/* POS Authentication */}
      <Route path="/login" element={<UserLoginScreen />} />
      
      {/* Main POS Screen */}
      <Route 
        path="/main" 
        element={
          <ProtectedRoute>
            <POSScreen />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Panel */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredPermission="admin">
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      
      {/* Reports */}
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/pos/login" replace />} />
      <Route path="*" element={<Navigate to="/pos/login" replace />} />
    </Routes>
  );
};

export default POSApp;