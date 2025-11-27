import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomBar = ({ onOpenSettings }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = currentUser.role || 'User';

  // Parse user permissions
  let userPermissions = [];
  try {
    userPermissions = currentUser.permissions ? JSON.parse(currentUser.permissions) : [];
  } catch (e) {
    userPermissions = [];
  }

  // Super Admin: always show everything
  // Admin & User: show buttons only if permission granted
  const showAdminButton = userRole === 'Super Admin' ||
    userPermissions.includes('admin');

  const showSettingsButton = userRole === 'Super Admin' ||
    userPermissions.includes('settings');

  return (
    <div className="flex gap-2 ml-2 mb-1 mr-2 rounded-lg p-2 bg-pos-bg-primary border-t bg-pos-bg-tertiary">
      {showAdminButton && (
        <button className="btn-primary py-1 flex items-center gap-2" onClick={() => navigate('/admin')}>
          🔌 admin
        </button>
      )}
      {showSettingsButton && (
        <button className="btn-primary py-1 flex items-center gap-2" onClick={onOpenSettings}>
          ⚙️ Settings
        </button>
      )}
      {/* <button className="btn-primary">Eat In</button>
      <button className="btn-primary">New Return</button>
      <button className="btn-primary">Customer</button>
      <button className="btn-primary">Drawer</button>
      <button className="btn-primary flex items-center gap-2">💳 Card</button> */}
    </div>
  );
};

export default BottomBar;
