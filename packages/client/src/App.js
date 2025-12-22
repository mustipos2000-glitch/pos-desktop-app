import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { VersionProvider, useVersion } from './context/VersionContext';
import VersionSelectionScreen from './pages/VersionSelectionScreen';
import POSApp from './apps/POSApp';
import MosqueApp from './apps/MosqueApp';

// Component to handle automatic mosque redirect
const MosqueRedirect = () => {
  const { changeVersion } = useVersion();
  
  useEffect(() => {
    // Automatically set version to mosque
    changeVersion('mosque');
  }, [changeVersion]);
  
  return <Navigate to="/mosque" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <VersionProvider>
        <Router>
          <Routes>
            {/* Automatically redirect to mosque */}
            <Route path="/" element={<MosqueRedirect />} />
            
            {/* Version selection screen (accessible via /versions) */}
            <Route path="/versions" element={<VersionSelectionScreen />} />
            
            {/* Regular POS Application Routes */}
            <Route path="/pos/*" element={<POSApp />} />
            
            {/* Mosque Application Routes */}
            <Route path="/mosque/*" element={<MosqueApp />} />
            
            {/* Catch-all route: redirect to mosque */}
            <Route path="*" element={<Navigate to="/mosque" replace />} />
          </Routes>
        </Router>
      </VersionProvider>
    </ThemeProvider>
  );
}

export default App;
