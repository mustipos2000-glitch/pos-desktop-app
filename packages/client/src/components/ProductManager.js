import React, { useState, useEffect } from 'react';

const ProductManager = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Coca-Cola', price: 23.09, category: 'Starter' },
    { id: 2, name: 'Orange Juice', price: 3.00, category: 'Starter' },
  ]);
  const [categories, setCategories] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const result = await response.json();
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.category) {
      setProducts([...products, { ...newProduct, id: Date.now(), price: parseFloat(newProduct.price) }]);
      setNewProduct({ name: '', price: '', category: '' });
      setShowAddProduct(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
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
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
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
    </div>
  );
};

export default ProductManager;