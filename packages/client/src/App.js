import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { VersionProvider } from './context/VersionContext';
import VersionSelectionScreen from './pages/VersionSelectionScreen';
import UserLoginScreen from './pages/UserLoginScreen';
import MosquePaymentScreen from './pages/MosquePaymentScreen';
import MemberSelectionPage from './pages/MemberSelectionPage';
import SadakaSelectionPage from './pages/SadakaSelectionPage';
import SadakaGoalPage from './pages/SadakaGoalPage';
import RentDateTimePage from './pages/RentDateTimePage';
import AmountEntryPage from './pages/AmountEntryPage';
import PaymentMethodPage from './pages/PaymentMethodPage';
import TicketSelectionPage from './pages/TicketSelectionPage';
import POSScreen from './pages/POSScreen';
import AdminPanel from './pages/AdminPanel';
import ReportsPage from './pages/ReportsPage';
import CustomerDisplay from './pages/CustomerDisplay';
import ProtectedRoute from './components/ProtectedRoute';
import MosqueProtectedRoute from './components/MosqueProtectedRoute';
// import './App.css';

function App() {
  return (
    <ThemeProvider>
      <VersionProvider>
        <Router>
          <Routes>
            <Route path="/" element={<VersionSelectionScreen />} />
            <Route path="/login" element={<UserLoginScreen />} />
            <Route path="/mosque-payment" element={<MosquePaymentScreen />} />
            <Route path="/member-selection" element={<MemberSelectionPage />} />
            <Route path="/sadaka-selection" element={<SadakaSelectionPage />} />
            <Route path="/sadaka-goal" element={<SadakaGoalPage />} />
            <Route path="/rent-datetime" element={<RentDateTimePage />} />
            <Route path="/amount-entry" element={<AmountEntryPage />} />
            <Route path="/payment-method" element={<PaymentMethodPage />} />
            <Route path="/ticket-selection" element={<TicketSelectionPage />} />
            <Route 
              path="/pos" 
              element={
                <MosqueProtectedRoute>
                  <ProtectedRoute>
                    <POSScreen />
                  </ProtectedRoute>
                </MosqueProtectedRoute>
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
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/customer-display" element={<CustomerDisplay />} />
            {/* Catch-all route: redirect any invalid URL to version selection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </VersionProvider>
    </ThemeProvider>
  );
}

export default App;
