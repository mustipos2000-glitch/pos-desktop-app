import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Check if user is logged in
  if (!currentUser || !currentUser.id) {
    return <Navigate to="/" replace />;
  }

  // Super Admin has all permissions
  if (currentUser.role === 'Super Admin') {
    return children;
  }

  // Check specific permission
  if (requiredPermission) {
    let userPermissions = [];
    try {
      userPermissions = currentUser.permissions ? JSON.parse(currentUser.permissions) : [];
    } catch (e) {
      userPermissions = [];
    }

    // Check if user has the required permission
    if (!userPermissions.includes(requiredPermission)) {
      // Redirect to POS screen if no permission
      return <Navigate to="/pos" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
