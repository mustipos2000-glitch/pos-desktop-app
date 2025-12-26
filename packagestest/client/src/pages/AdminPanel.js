import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useVersion } from '../context/VersionContext';
import ProductManager from '../components/ProductManager';
import SubProductManager from '../components/SubProductManager';
import CategoryManager from '../components/CategoryManager';
import GroupManager from '../components/GroupManager';
import UserManager from '../components/UserManager';
import RoomManager from '../components/RoomManager';
import CustomerManager from '../components/CustomerManager';
import InventoryManager from '../components/InventoryManager';
import PromotionManager from '../components/PromotionManager';


const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { version, hasFeature } = useVersion();
  const type = localStorage.getItem('posVersion');

  
  // Set default tab based on available features
  const getDefaultTab = () => {
    if (hasFeature('categoryProducts')) return 'categories';
    return 'users';
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      <div className="bg-pos-bg-primary border-b border-pos-border-primary p-4 h-full">
        <div className="flex items-center justify-between gap-4 bg-pos-bg-secondary rounded-lg p-1 py-1.5 mb-1">
          <div className="flex items-center gap-4">
            <button className="btn-secondary flex items-center gap-2 px-4" onClick={() => navigate('/pos')}>
              POS
            </button>
            <div className="flex gap-1">
            {hasFeature('categoryProducts') && (
              <button
                className={`btn-secondary text-base font-medium ${activeTab === 'categories'
                  ? 'bg-pos-interactive-primary text-pos-text-primary'
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                  }`}
                onClick={() => setActiveTab('categories')}
              >
                Product
              </button>
            )}
            {hasFeature('categoryProducts') && (
              <button
                className={`btn-secondary text-base font-medium ${activeTab === 'sub-products'
                  ? 'bg-pos-interactive-primary text-pos-text-primary'
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                  }`}
                onClick={() => setActiveTab('sub-products')}
              >
                Sub-Products
              </button>
            )}
            <button
              className={`btn-secondary text-base font-medium ${activeTab === 'users'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            {hasFeature('tables') && (
              <button
                className={`btn-secondary text-base font-medium ${activeTab === 'rooms'
                  ? 'bg-pos-interactive-primary text-pos-text-primary'
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                  }`}
                onClick={() => setActiveTab('rooms')}
              >
                Rooms & Tables
              </button>
            )}
            <button
              className={`btn-secondary text-base font-medium ${activeTab === 'customers'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('customers')}
            >
              Customers
            </button>
            <button
              className={`btn-secondary text-base font-medium ${activeTab === 'promotions'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('promotions')}
            >
              Promotions
            </button>
          {type === 'retail' && (
  <button
    className={`btn-secondary text-base font-medium ${
      activeTab === 'inventory'
        ? 'bg-pos-interactive-primary text-pos-text-primary'
        : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
    }`}
    onClick={() => setActiveTab('inventory')}
  >
    Inventory
  </button>
)}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-lg flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white rounded-lg"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {/* {activeTab === 'products' && <ProductManager />} */}
            {activeTab === 'sub-products' && <SubProductManager />}
            {activeTab === 'categories' && <CategoryManager />}
            {activeTab === 'groups' && <GroupManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'rooms' && <RoomManager />}
            {activeTab === 'customers' && <CustomerManager />}
            {activeTab === 'promotions' && <PromotionManager />}
            {activeTab === 'inventory' && <InventoryManager />}

            {activeTab === 'settings' && (
              <div className="p-6 overflow-y-auto scrollbar-custom">
                <h2 className="text-pos-text-primary text-xl font-semibold mb-6">System Settings</h2>
                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-pos-text-primary text-sm font-medium mb-2">Store Name</label>
                    <input type="text" defaultValue="My POS Store" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info" />
                  </div>
                  <div>
                    <label className="block text-pos-text-primary text-sm font-medium mb-2">Tax Rate (%)</label>
                    <input type="number" defaultValue="8" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info" />
                  </div>
                  <div>
                    <label className="block text-pos-text-primary text-sm font-medium mb-2">Currency</label>
                    <select defaultValue="USD" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <button className="btn-success">Save Settings</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminPanel;
