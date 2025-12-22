import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { VersionProvider } from './context/VersionContext';
import VersionSelectionScreen from './pages/VersionSelectionScreen';
import POSApp from './apps/POSApp';
import MosqueApp from './apps/MosqueApp';

function App() {
  return (
    <ThemeProvider>
      <VersionProvider>
        <Router>
          <Routes>
            <Route path="/" element={<VersionSelectionScreen />} />
            
            {/* Regular POS Application Routes */}
            <Route path="/pos/*" element={<POSApp />} />
            
            {/* Mosque Application Routes */}
            <Route path="/mosque/*" element={<MosqueApp />} />
            
            {/* Catch-all route: redirect any invalid URL to version selection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </VersionProvider>
    </ThemeProvider>
  );
}

export default App;
