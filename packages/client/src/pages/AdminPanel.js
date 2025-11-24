import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductManager from '../components/ProductManager';
import SubProductManager from '../components/SubProductManager';
import CategoryManager from '../components/CategoryManager';
import GroupManager from '../components/GroupManager';
import UserManager from '../components/UserManager';
import RoomManager from '../components/RoomManager';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      <div className="bg-pos-bg-primary border-b border-pos-border-primary p-4 h-full">
        <div className="flex items-center gap-4 bg-pos-bg-secondary rounded-lg p-1">
          <button className="btn-secondary flex items-center gap-2" onClick={() => navigate('/pos')}>
            POS
          </button>
          <div className="flex gap-1">
            <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${activeTab === 'categories'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('categories')}
            >
              Product
            </button>
            {/* <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${
                activeTab === 'groups' 
                  ? 'bg-pos-interactive-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('groups')}
            >
              Groups
            </button> */}
            {/* <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${
                activeTab === 'products' 
                  ? 'bg-pos-interactive-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button> */}
            <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${activeTab === 'sub-products'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('sub-products')}
            >
              Sub-Products
            </button>
            {/* <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${
                activeTab === 'groups' 
                  ? 'bg-pos-interactive-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('groups')}
            >
              Groups
            </button> */}
            <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${activeTab === 'users'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              className={`px-3 py-2 btn-secondary text-sm font-medium ${activeTab === 'rooms'
                ? 'bg-pos-interactive-primary text-pos-text-primary'
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
                }`}
              onClick={() => setActiveTab('rooms')}
            >
              Rooms & Tables
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {/* {activeTab === 'products' && <ProductManager />} */}
            {activeTab === 'sub-products' && <SubProductManager />}
            {activeTab === 'categories' && <CategoryManager />}
            {activeTab === 'groups' && <GroupManager />}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'rooms' && <RoomManager />}

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
