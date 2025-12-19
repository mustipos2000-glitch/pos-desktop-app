import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVersion } from '../context/VersionContext';
import ApiService from '../services/api';

const BottomBar = ({ onOpenSettings, onBarcodeSearch }) => {
  const navigate = useNavigate();
  const { version } = useVersion();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userRole = currentUser.role || 'User';
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false);

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

  // Hide settings for mosque version
  const showSettingsButton = version !== 'mosque' && (
    userRole === 'Super Admin' ||
    userPermissions.includes('settings')
  );

  const showReportsButton = userRole === 'Super Admin' ||
    userPermissions.includes('reports');

  const showCashDrawerButton = userRole === 'Super Admin' ||
    userPermissions.includes('cash_drawer');

  /**
   * Handle cash drawer open
   */
  const handleOpenCashDrawer = async () => {
    if (isOpeningDrawer) return;

    setIsOpeningDrawer(true);
    try {
      const result = await ApiService.openCashDrawer();
      
      if (result.success) {
        alert('✅ Cash drawer opened successfully!');
      } else {
        alert(`❌ Failed to open cash drawer: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Cash drawer error:', error);
      alert(`❌ Error: ${error.message || 'Failed to open cash drawer'}`);
    } finally {
      setIsOpeningDrawer(false);
    }
  };

  return (
    <div className="flex gap-2 ml-2 mb-1 mr-2 rounded-lg p-2 bg-pos-bg-primary border-t bg-pos-bg-tertiary">
      {/* Original Action Buttons - Keep on Left */}
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
      {showReportsButton && (
        <button className="btn-primary py-1 flex items-center gap-2" onClick={() => navigate('/reports')}>
          📊 Reports
        </button>
      )}
      {/* Barcode Search Button */}
      {onBarcodeSearch && (
        <button className="btn-primary py-1 flex items-center gap-2" onClick={onBarcodeSearch}>
          📷 Barcode
        </button>
      )}
      {/* Cash Drawer Button */}
      {showCashDrawerButton && (
        <button 
          className="btn-primary py-1 flex items-center gap-2" 
          onClick={handleOpenCashDrawer}
          disabled={isOpeningDrawer}
        >
          💰 {isOpeningDrawer ? 'Opening...' : 'Cash Drawer'}
        </button>
      )}
    </div>
  );
};

export default BottomBar;
