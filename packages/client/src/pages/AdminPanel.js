import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductManager from '../components/ProductManager';
import CategoryManager from '../components/CategoryManager';
import UserManager from '../components/UserManager';
import './css/AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="back-btn" onClick={() => navigate('/pos')}>
            ← Back to POS
          </button>
          <h1>Admin Panel</h1>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          {/* <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button> */}
        </div>

        <div className="admin-body">
          {activeTab === 'products' && <ProductManager />}

          {activeTab === 'categories' && <CategoryManager />}

          {activeTab === 'users' && <UserManager />}

          {activeTab === 'settings' && (
            <div className="admin-section">
              <h2>System Settings</h2>
              <div className="settings-form">
                <div className="form-group">
                  <label>Store Name</label>
                  <input type="text" defaultValue="My POS Store" />
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input type="number" defaultValue="8" />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select defaultValue="USD">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <button className="save-btn">Save Settings</button>
              </div>
            </div>
          )}
        </div>
      </div>




    </div>
  );
};

export default AdminPanel;
