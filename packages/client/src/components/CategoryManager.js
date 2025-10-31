import { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';
import './css/CategoryManager.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    next_course: 0,
    in_web_shop: 0,
    is_visible: 1
  });
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category_id: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: '',
    productId: null,
    productName: ''
  });
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/categories');
      const result = await response.json();
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Failed to load categories. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId) => {
    if (!categoryId) {
      setProducts([]);
      return;
    }

    try {
      setLoadingProducts(true);
      const response = await fetch(`http://localhost:5000/api/products?category_id=${categoryId}`);
      const result = await response.json();
      // Filter products by category_id on client side as well to ensure only category products are shown
      const filteredProducts = (result.data || []).filter(product => product.category_id === categoryId);
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Failed to load products. Please check your connection.', 'Connection Error');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory.id);
      setSelectedProduct(null);
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      return;
    }

    try {
      const url = editingCategory
        ? `http://localhost:5000/api/categories/${editingCategory.id}`
        : 'http://localhost:5000/api/categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        fetchCategories();
        setShowAddCategory(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', next_course: 0, in_web_shop: 0, is_visible: 1 });
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Error saving category. Please try again.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      next_course: Number(category.next_course) || 0,
      in_web_shop: Number(category.in_web_shop) || 0,
      is_visible: Number(category.is_visible) !== undefined ? Number(category.is_visible) : 1
    });
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
        closeDeleteConfirmation();
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showWarning(error.error || 'Failed to delete category', 'Cannot Delete Category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      closeDeleteConfirmation();
      showError('Error deleting category. Please try again.');
    }
  };

  const openDeleteConfirmation = (category) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      productId: null,
      productName: ''
    });
  };

  const openDeleteProductConfirmation = (product) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: null,
      categoryName: '',
      productId: product.id,
      productName: product.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      categoryId: null,
      categoryName: '',
      productId: null,
      productName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.categoryId) {
      handleDeleteCategory(deleteConfirmation.categoryId);
    } else if (deleteConfirmation.productId) {
      handleDeleteProduct(deleteConfirmation.productId);
    }
  };

  const handleMoveUp = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}/move-up`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        showWarning(error.error || 'Cannot move up', 'Cannot Move');
      }
    } catch (error) {
      console.error('Error moving category:', error);
      showError('Error moving category. Please try again.');
    }
  };

  const handleMoveDown = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}/move-down`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        showWarning(error.error || 'Cannot move down', 'Cannot Move');
      }
    } catch (error) {
      console.error('Error moving category:', error);
      showError('Error moving category. Please try again.');
    }
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.price) {
      showWarning('Please fill in all required fields', 'Missing Information');
      return;
    }

    try {
      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : 'http://localhost:5000/api/products';

      const productData = {
        ...productForm,
        category_id: selectedCategory.id,
        price: parseFloat(productForm.price)
      };

      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        fetchProducts(selectedCategory.id);
        setShowAddProduct(false);
        setEditingProduct(null);
        setProductForm({ name: '', price: '', category_id: '' });
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showError('Error saving product. Please try again.');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      price: product.price || '',
      category_id: product.category_id || selectedCategory?.id || ''
    });
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchProducts(selectedCategory.id);
        closeDeleteConfirmation();
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showWarning(error.error || 'Failed to delete product', 'Cannot Delete Product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      closeDeleteConfirmation();
      showError('Error deleting product. Please try again.');
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Categories & Products</h2>
        <div className='flex gap-2'>
          <button className="btn-primary" onClick={() => {
            setEditingCategory(null);
            setCategoryForm({ name: '', next_course: 0, in_web_shop: 0 });
            setShowAddCategory(true);
          }}>
            Add Category
          </button>
          <button
            className="btn-primary"
            onClick={() => handleEditCategory(selectedCategory)}
            disabled={!selectedCategory}
          >
            Edit Category
          </button>
          <button
            className="btn-primary"
            onClick={() => openDeleteConfirmation(selectedCategory)}
            disabled={!selectedCategory}
          >
            Delete Category
          </button>
          <div className='flex gap-2'>
            <button
              className="btn-primary"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({ name: '', price: '', category_id: selectedCategory?.id || '' });
                setShowAddProduct(true);
              }}
              disabled={!selectedCategory}
            >
              Add Product
            </button>
            <button
              className="btn-primary"
              onClick={() => handleEditProduct(selectedProduct)}
              disabled={!selectedProduct}
            >
              Edit Product
            </button>
            <button
              className="btn-primary"
              onClick={() => openDeleteProductConfirmation(selectedProduct)}
              disabled={!selectedProduct}
            >
              Delete Product
            </button>
          </div>
        </div>
      </div>

      <div className="columns-layout">
        {/* This is category Column  */}
        <div className="categories-section">
          <h3>Categories</h3>
          {loading ? (
            <div className="loading-state">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state border p-2">
              No categories found. Click "Add Category" to create your first category.
            </div>
          ) : (
            <div className="categories-column border p-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`category-item flex text-base mt-1 ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="category-order flex">
                    <button
                      className="arrow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(category.id);
                      }}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      className="arrow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(category.id);
                      }}
                      disabled={index === categories.length - 1}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="category-name px-1">
                    {category.name || 'Unnamed Category'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* This is product Column */}
        <div className="products-section">
            <h3>Products</h3>
          
          {!selectedCategory ? (
            <div className="empty-state border p-2 text-sm text-pos-error">
              Select a category to view its products
            </div>
          ) : loadingProducts ? (
            <div className="loading-state">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="empty-state border p-2 text-pos-error text-sm">
              No products 
            </div>
          ) : (
            <div className="products-column border p-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`product-item flex text-base mt-1 ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-name px-1 flex-1">
                    {product.name || 'Unnamed Product'}
                  </div>
                  {/* <div className="product-price px-1">
                    ${parseFloat(product.price || 0).toFixed(2)} */}
                  {/* </div> */}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* This is sub-product Column */}
        <div className='sub-product-section'> 
          <h3> Attached Sub-products</h3>
        </div>
        
      </div>

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowAddCategory(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[500px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button 
                onClick={() => setShowAddCategory(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-pos-text-muted mb-2">
                  Category Name <span className="text-pos-error">*</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  placeholder="Enter category name"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_visible === 1}
                    onChange={(e) => setCategoryForm({ ...categoryForm, is_visible: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary rounded focus:ring-pos-info focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-pos-text-primary">Visible</span>
                </label>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowAddCategory(false)}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCategory}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>

            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddProduct(false)}>
                Cancel
              </button>
              <button className="add-btn" onClick={handleAddProduct}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title={deleteConfirmation.categoryId ? "Delete Category" : "Delete Product"}
        message={deleteConfirmation.categoryId
          ? `Are you sure you want to delete "${deleteConfirmation.categoryName}"? This action cannot be undone.`
          : `Are you sure you want to delete "${deleteConfirmation.productName}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default CategoryManager;