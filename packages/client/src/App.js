import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import POSScreen from './pages/POSScreen';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<POSScreen />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
