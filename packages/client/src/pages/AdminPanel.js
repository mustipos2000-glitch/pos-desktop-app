import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([
    { id: 1, name: 'Coca-Cola', price: 23.09, category: 'Starter' },
    { id: 2, name: 'Orange Juice', price: 3.00, category: 'Starter' },
  ]);
  const [categories, setCategories] = useState(['Starter', 'Drinks', 'Food']);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });
  const [newCategory, setNewCategory] = useState('');

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

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
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
    </div>
  );
};

export default AdminPanel;
