import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([
    { id: 1, name: 'Coca-Cola', price: 23.09, category: 'Starter' },
    { id: 2, name: 'Orange Juice', price: 3.00, category: 'Starter' },
  ]);
  const [categories, setCategories] = useState(['Starter', 'Drinks', 'Food']);
  const [users, setUsers] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });
  const [newCategory, setNewCategory] = useState('');
  const [userForm, setUserForm] = useState({
    name: '',
    pincode: '',
    social_security: '',
    identification: '',
    role: 'User',
    avatar_color: '#3b82f6'
  });

  const avatarColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#f97316'
  ];

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.category) {
      setProducts([...products, { ...newProduct, id: Date.now(), price: parseFloat(newProduct.price) }]);
      setNewProduct({ name: '', price: '', category: '' });
      setShowAddProduct(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleDeleteCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.pincode) {
      alert('Name and pincode are required');
      return;
    }

    try {
      const url = editingUser 
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : 'http://localhost:5000/api/users';
      
      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        fetchUsers();
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({
          name: '',
          pincode: '',
          social_security: '',
          identification: '',
          role: 'User',
          avatar_color: '#3b82f6'
        });
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      pincode: user.pincode,
      social_security: user.social_security || '',
      identification: user.identification || '',
      role: user.role,
      avatar_color: user.avatar_color
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

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
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="admin-body">
          {activeTab === 'products' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Products</h2>
                <button className="add-btn" onClick={() => setShowAddProduct(true)}>
                  + Add Product
                </button>
              </div>
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>{product.category}</td>
                        <td>
                          <button className="delete-btn" onClick={() => handleDeleteProduct(product.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Categories</h2>
                <button className="add-btn" onClick={() => setShowAddCategory(true)}>
                  + Add Category
                </button>
              </div>
              <div className="categories-grid">
                {categories.map(cat => (
                  <div key={cat} className="category-card">
                    <span>{cat}</span>
                    <button className="delete-btn-small" onClick={() => handleDeleteCategory(cat)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="section-header">
                <h2>Manage Users</h2>
                <button className="add-btn" onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    name: '',
                    pincode: '',
                    social_security: '',
                    identification: '',
                    role: 'User',
                    avatar_color: '#3b82f6'
                  });
                  setShowUserModal(true);
                }}>
                  + Add User
                </button>
              </div>
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Avatar</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Pincode</th>
                      <th>SSN</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-avatar-small" style={{ backgroundColor: user.avatar_color }}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                        </td>
                        <td>{user.name}</td>
                        <td>{user.role}</td>
                        <td>••••</td>
                        <td>{user.social_security || '-'}</td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditUser(user)}>
                            Edit
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Product</h3>
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddProduct(false)}>Cancel</button>
              <button className="add-btn" onClick={handleAddProduct}>Add Product</button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Category</h3>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddCategory(false)}>Cancel</button>
              <button className="add-btn" onClick={handleAddCategory}>Add Category</button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal user-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            
            <div className="modal-tabs">
              <div className="tab active">General</div>
              <div className="tab">Privileges</div>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="password"
                maxLength="4"
                value={userForm.pincode}
                onChange={(e) => setUserForm({ ...userForm, pincode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Social Security Number</label>
              <input
                type="text"
                value={userForm.social_security}
                onChange={(e) => setUserForm({ ...userForm, social_security: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Identification</label>
              <input
                type="text"
                value={userForm.identification}
                onChange={(e) => setUserForm({ ...userForm, identification: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            <div className="form-group">
              <label>Avatar Color</label>
              <div className="color-picker">
                {avatarColors.map(color => (
                  <div
                    key={color}
                    className={`color-option ${userForm.avatar_color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setUserForm({ ...userForm, avatar_color: color })}
                  >
                    {userForm.avatar_color === color && '✓'}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="add-btn" onClick={handleAddUser}>
                {editingUser ? 'Update User' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
