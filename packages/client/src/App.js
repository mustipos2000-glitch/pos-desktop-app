import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import UserLoginScreen from './pages/UserLoginScreen';
import POSScreen from './pages/POSScreen';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
// import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<UserLoginScreen />} />
          <Route 
            path="/pos" 
            element={
              <ProtectedRoute>
                <POSScreen />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredPermission="admin">
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          {/* Catch-all route: redirect any invalid URL to /pos */}
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
