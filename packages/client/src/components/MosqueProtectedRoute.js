import { useVersion } from '../context/VersionContext';

const MosqueProtectedRoute = ({ children }) => {
  const { version } = useVersion();
  
  // If mosque version, bypass normal authentication
  // Create a temporary user session for mosque kiosk
  if (version === 'mosque') {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      // Create a temporary mosque user session
      const mosqueUser = {
        id: 'mosque-kiosk',
        name: 'Mosque Kiosk',
        role: 'User',
        permissions: '[]'
      };
      localStorage.setItem('currentUser', JSON.stringify(mosqueUser));
    }
  }
  
  return children;
};

export default MosqueProtectedRoute;
