import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useVersion } from '../context/VersionContext';
import MosquePaymentScreen from '../pages/mosque/MosquePaymentScreen';
import MemberSelectionPage from '../pages/mosque/MemberSelectionPage';
import SadakaSelectionPage from '../pages/mosque/SadakaSelectionPage';
import SadakaGoalPage from '../pages/mosque/SadakaGoalPage';
import RentDateTimePage from '../pages/mosque/RentDateTimePage';
import AmountEntryPage from '../pages/mosque/AmountEntryPage';
import PaymentMethodPage from '../pages/mosque/PaymentMethodPage';
import TicketSelectionPage from '../pages/mosque/TicketSelectionPage';
import MosqueAdminPanel from '../pages/mosque/MosqueAdminPanel';
import { MosqueProtectedRoute } from '../components/mosque';

const MosqueApp = () => {
  const { version } = useVersion();
  
  // Redirect non-mosque versions to POS app
  if (version && version !== 'mosque') {
    return <Navigate to="/pos" replace />;
  }

  return (
    <MosqueProtectedRoute>
      <Routes>
        {/* Main Mosque Payment Screen */}
        <Route path="/" element={<MosquePaymentScreen />} />
        <Route path="/payment" element={<MosquePaymentScreen />} />
        
        {/* Member Selection Flow */}
        <Route path="/member-selection" element={<MemberSelectionPage />} />
        
        {/* Sadaka Flow */}
        <Route path="/sadaka-selection" element={<SadakaSelectionPage />} />
        <Route path="/sadaka-goal" element={<SadakaGoalPage />} />
        
        {/* Rent Flow */}
        <Route path="/rent-datetime" element={<RentDateTimePage />} />
        
        {/* Payment Flow */}
        <Route path="/amount-entry" element={<AmountEntryPage />} />
        <Route path="/payment-method" element={<PaymentMethodPage />} />
        
        {/* Final Step */}
        <Route path="/ticket-selection" element={<TicketSelectionPage />} />
        
        {/* Admin Panel */}
        <Route path="/admin" element={<MosqueAdminPanel />} />
        
        {/* Catch-all - redirect to main payment screen */}
        <Route path="*" element={<Navigate to="/mosque" replace />} />
      </Routes>
    </MosqueProtectedRoute>
  );
};

export default MosqueApp;