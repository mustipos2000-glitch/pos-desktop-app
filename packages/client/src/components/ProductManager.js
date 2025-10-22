import { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';
import './css/ProductManager.css';

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    productId: null,
    productName: ''
  });
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  // Form state for product data
  const [productForm, setProductForm] = useState({
    name: '',
    button_name: '',
    production_name: '',
    price: '',
    vat_takeout: '',
    vat_eat_in: '',
    barcode: '',
    category_id: '',
    addition_type: '',
    display_index: '',
    in_web_shop: false,
    printer1: '',
    printer2: '',
    printer3: '',
    image: ''
  });
  
  // State for file inputs
  const [imageFile, setImageFile] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/products');
      const result = await response.json();
      setProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Failed to fetch products. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      const result = await response.json();
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Failed to fetch categories.', 'Connection Error');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };
  
  // Handle file input changes separately
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    
    // Store file name for display purposes
    if (file) {
      setProductForm({
        ...productForm,
        image: file.name
      });
    } else {
      setProductForm({
        ...productForm,
        image: ''
      });
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      button_name: '',
      production_name: '',
      price: '',
      vat_takeout: '',
      vat_eat_in: '',
      barcode: '',
      category_id: '',
      addition_type: '',
      display_index: '',
      in_web_shop: false,
      printer1: '',
      printer2: '',
      printer3: '',
      image: ''
    });
    setImageFile(null);
    setFieldErrors({});
  };

  const handleAddProduct = async () => {
    // Validate required fields
    const errors = {};
    if (!productForm.name) {
      errors.name = 'Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Append all product data to FormData
      formData.append('name', productForm.name);
      formData.append('button_name', productForm.button_name || '');
      formData.append('production_name', productForm.production_name || '');
      formData.append('price', parseFloat(productForm.price) || 0);
      formData.append('vat_takeout', parseFloat(productForm.vat_takeout) || 0);
      formData.append('vat_eat_in', parseFloat(productForm.vat_eat_in) || 0);
      formData.append('barcode', productForm.barcode || '');
      formData.append('category_id', productForm.category_id ? parseInt(productForm.category_id) : '');
      formData.append('addition_type', productForm.addition_type || '');
      formData.append('display_index', parseInt(productForm.display_index) || 0);
      formData.append('in_web_shop', productForm.in_web_shop ? 1 : 0);
      formData.append('printer1', productForm.printer1 || '');
      formData.append('printer2', productForm.printer2 || '');
      formData.append('printer3', productForm.printer3 || '');
      
      // Append image file if selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        body: formData, // Send FormData instead of JSON
      });

      if (response.ok) {
        // Refresh the product list
        await fetchProducts();
        resetForm();
        setShowAddProduct(false);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showError('Failed to create product. Please try again.');
    }
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setProductForm({
      name: product.name || '',
      button_name: product.button_name || '',
      production_name: product.production_name || '',
      price: product.price || '',
      vat_takeout: product.vat_takeout || '',
      vat_eat_in: product.vat_eat_in || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      addition_type: product.addition_type || '',
      display_index: product.display_index || '',
      in_web_shop: product.in_web_shop === 1,
      printer1: product.printer1 || '',
      printer2: product.printer2 || '',
      printer3: product.printer3 || '',
      image: product.image || ''
    });
    setImageFile(null); // Reset file input
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    // Validate required fields
    const errors = {};
    if (!productForm.name) {
      errors.name = 'Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();
      
      // Append all product data to FormData
      formData.append('name', productForm.name);
      formData.append('button_name', productForm.button_name || '');
      formData.append('production_name', productForm.production_name || '');
      formData.append('price', parseFloat(productForm.price) || 0);
      formData.append('vat_takeout', parseFloat(productForm.vat_takeout) || 0);
      formData.append('vat_eat_in', parseFloat(productForm.vat_eat_in) || 0);
      formData.append('barcode', productForm.barcode || '');
      formData.append('category_id', productForm.category_id ? parseInt(productForm.category_id) : '');
      formData.append('addition_type', productForm.addition_type || '');
      formData.append('display_index', parseInt(productForm.display_index) || 0);
      formData.append('in_web_shop', productForm.in_web_shop ? 1 : 0);
      formData.append('printer1', productForm.printer1 || '');
      formData.append('printer2', productForm.printer2 || '');
      formData.append('printer3', productForm.printer3 || '');
      
      // Append image file if selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`http://localhost:5000/api/products/${currentProduct.id}`, {
        method: 'PUT',
        body: formData, // Send FormData instead of JSON
      });

      if (response.ok) {
        // Refresh the product list
        await fetchProducts();
        resetForm();
        setShowEditProduct(false);
        setCurrentProduct(null);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
        closeDeleteConfirmation();
      } else {
        const errorResult = await response.json();
        closeDeleteConfirmation();
        showWarning(errorResult.error || 'Failed to delete product', 'Cannot Delete Product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      closeDeleteConfirmation();
      showError('Failed to delete product. Please try again.');
    }
  };

  const openDeleteConfirmation = (product) => {
    setDeleteConfirmation({
      isOpen: true,
      productId: product.id,
      productName: product.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      productId: null,
      productName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.productId) {
      handleDeleteProduct(deleteConfirmation.productId);
    }
  };

  // Get category name by ID for display
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Products</h2>
        <button className="add-btn" onClick={() => {
          resetForm();
          setShowAddProduct(true);
        }}>
          + Add Product
        </button>
      </div>
      
      {loading && <div className="loading">Loading...</div>}
      
      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Button Name</th>
              <th>Price</th>
              <th>VAT Takeout</th>
              <th>VAT Eat-in</th>
              <th>Category</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.button_name || '-'}</td>
                <td>${parseFloat(product.price).toFixed(2)}</td>
                <td>{product.vat_takeout}%</td>
                <td>{product.vat_eat_in}%</td>
                <td>{getCategoryName(product.category_id)}</td>
                <td>
                  {product.image ? (
                    <img src={`http://localhost:5000${product.image}`} alt={product.name} style={{ maxWidth: '50px', maxHeight: '50px' }} />
                  ) : (
                    'No Image'
                  )}
                </td>
                <td style={{ display: 'flex'}}>
                  <IconButton 
                    icon="✏️" 
                    className="edit" 
                    onClick={() => handleEditProduct(product)} 
                    title="Edit product"
                  />
                  <IconButton 
                    icon="🗑️" 
                    className="delete" 
                    onClick={() => openDeleteConfirmation(product)} 
                    title="Delete product"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Product</h3>
            <div className="form-container">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleInputChange}
                  style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                />
                {fieldErrors.name && <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.name}</small>}
              </div>
              
              <div className="form-group">
                <label>Button Name</label>
                <input
                  type="text"
                  name="button_name"
                  value={productForm.button_name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Production Name</label>
                <input
                  type="text"
                  name="production_name"
                  value={productForm.production_name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={productForm.price}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>VAT Takeout (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_takeout"
                  value={productForm.vat_takeout}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>VAT Eat-in (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_eat_in"
                  value={productForm.vat_eat_in}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={productForm.barcode}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category_id"
                  value={productForm.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Addition Type</label>
                <input
                  type="text"
                  name="addition_type"
                  value={productForm.addition_type}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* <div className="form-group">
                <label>Display Index</label>
                <input
                  type="number"
                  name="display_index"
                  value={productForm.display_index}
                  onChange={handleInputChange}
                />
              </div> */}
              
              {/* <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="in_web_shop"
                    checked={productForm.in_web_shop}
                    onChange={handleInputChange}
                  />
                  Available in Web Shop
                </label>
              </div>
              
              <div className="form-group">
                <label>Printer 1</label>
                <input
                  type="text"
                  name="printer1"
                  value={productForm.printer1}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Printer 2</label>
                <input
                  type="text"
                  name="printer2"
                  value={productForm.printer2}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Printer 3</label>
                <input
                  type="text"
                  name="printer3"
                  value={productForm.printer3}
                  onChange={handleInputChange}
                />
              </div> */}
              
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {/* {productForm.image && <small>Selected: {productForm.image}</small>} */}
              </div>
              
              <div className="modal-actions full-width">
                <button className="cancel-btn" onClick={() => setShowAddProduct(false)}>Cancel</button>
                <button className="add-btn" onClick={handleAddProduct}>Add Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && (
        <div className="modal-overlay" onClick={() => setShowEditProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Product</h3>
            <div className="form-container">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleInputChange}
                  style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                />
                {fieldErrors.name && <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '1px' }}>{fieldErrors.name}</small>}
              </div>
              
              <div className="form-group">
                <label>Button Name</label>
                <input
                  type="text"
                  name="button_name"
                  value={productForm.button_name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Production Name</label>
                <input
                  type="text"
                  name="production_name"
                  value={productForm.production_name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={productForm.price}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>VAT Takeout (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_takeout"
                  value={productForm.vat_takeout}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>VAT Eat-in (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_eat_in"
                  value={productForm.vat_eat_in}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={productForm.barcode}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category_id"
                  value={productForm.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Addition Type</label>
                <input
                  type="text"
                  name="addition_type"
                  value={productForm.addition_type}
                  onChange={handleInputChange}
                />
              </div>
{/*               
              <div className="form-group">
                <label>Display Index</label>
                <input
                  type="number"
                  name="display_index"
                  value={productForm.display_index}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="in_web_shop"
                    checked={productForm.in_web_shop}
                    onChange={handleInputChange}
                  />
                  Available in Web Shop
                </label>
              </div>
              
              <div className="form-group">
                <label>Printer 1</label>
                <input
                  type="text"
                  name="printer1"
                  value={productForm.printer1}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Printer 2</label>
                <input
                  type="text"
                  name="printer2"
                  value={productForm.printer2}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Printer 3</label>
                <input
                  type="text"
                  name="printer3"
                  value={productForm.printer3}
                  onChange={handleInputChange}
                />
              </div> */}
              
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {/* {productForm.image && <small>Current/Selected: {productForm.image}</small>} */}
              </div>
              
              <div className="modal-actions full-width">
                <button className="cancel-btn" onClick={() => setShowEditProduct(false)}>Cancel</button>
                <button className="save-btn" onClick={handleUpdateProduct}>Update Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirmation.productName}"? This action cannot be undone.`}
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

export default ProductManager;