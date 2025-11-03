import { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';
// Converted to use Tailwind CSS

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

  // Color options for product color picker
  const productColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#ef4444', // Red
    '#ec4899', // Pink
    '#fbbf24', // Yellow
    '#fb923c'  // Orange
  ];

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
    image: '',
    color: '#3b82f6',
    price_vat_inc: '',
    sub_product_group: false
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
      image: '',
      color: '#3b82f6',
      price_vat_inc: '',
      sub_product_group: false
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
      formData.append('color', productForm.color || '#3b82f6');
      formData.append('price_vat_inc', parseFloat(productForm.price_vat_inc) || 0);
      formData.append('sub_product_group', productForm.sub_product_group ? 1 : 0);
      
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
      image: product.image || '',
      color: product.color || '#3b82f6',
      price_vat_inc: product.price_vat_inc || '',
      sub_product_group: product.sub_product_group === 1
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
      formData.append('color', productForm.color || '#3b82f6');
      formData.append('price_vat_inc', parseFloat(productForm.price_vat_inc) || 0);
      formData.append('sub_product_group', productForm.sub_product_group ? 1 : 0);
      
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
              <th>Price VAT Inc</th>
              <th>Category</th>
              <th>Color</th>
              <th>Sub-Product Group</th>
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
                <td>${parseFloat(product.price_vat_inc || 0).toFixed(2)}</td>
                <td>{getCategoryName(product.category_id)}</td>
                <td>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    backgroundColor: product.color || '#3b82f6',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}></div>
                </td>
                <td>{product.sub_product_group === 1 ? 'Yes' : 'No'}</td>
                <td>
                  {product.image ? (
                    <img src={`http://localhost:5000${product.image}`} alt={product.name} style={{ maxWidth: '50px', maxHeight: '50px' }} />
                  ) : (
                    'No Image'
                  )}
                </td>
                <td style={{ display: 'flex' }}>
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowAddProduct(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[600px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">Add New Product</h3>
              <button 
                onClick={() => setShowAddProduct(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Product Name <span className="text-pos-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    className={`w-full bg-pos-bg-primary border ${fieldErrors.name ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Enter product name"
                  />
                  {fieldErrors.name && <p className="text-pos-error text-xs mt-1">{fieldErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Button Name</label>
                  <input
                    type="text"
                    name="button_name"
                    value={productForm.button_name}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Production Name</label>
                  <input
                    type="text"
                    name="production_name"
                    value={productForm.production_name}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Production name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={productForm.price}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Price VAT Inc</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_vat_inc"
                    value={productForm.price_vat_inc}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={productForm.barcode}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Barcode"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">VAT Takeout (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vat_takeout"
                    value={productForm.vat_takeout}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">VAT Eat-in (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vat_eat_in"
                    value={productForm.vat_eat_in}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Category</label>
                  <select
                    name="category_id"
                    value={productForm.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Addition Type</label>
                  <input
                    type="text"
                    name="addition_type"
                    value={productForm.addition_type}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Addition type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Product Color</label>
                  <div className="flex gap-2 mt-1">
                    {productColors.map(color => (
                      <div
                        key={color}
                        className={`w-8 h-8 rounded cursor-pointer border-2 flex items-center justify-center ${productForm.color === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setProductForm({ ...productForm, color })}
                      >
                        {productForm.color === color && <span className="text-white text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Product Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-pos-interactive-primary file:text-pos-text-primary hover:file:bg-pos-interactive-hover file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="sub_product_group"
                    checked={productForm.sub_product_group}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary rounded focus:ring-pos-info focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-pos-text-primary">Sub-Product Group</span>
                </label>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowAddProduct(false)}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddProduct}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setShowEditProduct(false)}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[600px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">Edit Product</h3>
              <button 
                onClick={() => setShowEditProduct(false)}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">
                    Product Name <span className="text-pos-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    className={`w-full bg-pos-bg-primary border ${fieldErrors.name ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="Enter product name"
                  />
                  {fieldErrors.name && <p className="text-pos-error text-xs mt-1">{fieldErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Button Name</label>
                  <input
                    type="text"
                    name="button_name"
                    value={productForm.button_name}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Production Name</label>
                  <input
                    type="text"
                    name="production_name"
                    value={productForm.production_name}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Production name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={productForm.price}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Price VAT Inc</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price_vat_inc"
                    value={productForm.price_vat_inc}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={productForm.barcode}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Barcode"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">VAT Takeout (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vat_takeout"
                    value={productForm.vat_takeout}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">VAT Eat-in (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="vat_eat_in"
                    value={productForm.vat_eat_in}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Category</label>
                  <select
                    name="category_id"
                    value={productForm.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Addition Type</label>
                  <input
                    type="text"
                    name="addition_type"
                    value={productForm.addition_type}
                    onChange={handleInputChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    placeholder="Addition type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Product Color</label>
                  <div className="flex gap-2 mt-1">
                    {productColors.map(color => (
                      <div
                        key={color}
                        className={`w-8 h-8 rounded cursor-pointer border-2 flex items-center justify-center ${productForm.color === color ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setProductForm({ ...productForm, color })}
                      >
                        {productForm.color === color && <span className="text-white text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-pos-text-muted mb-2">Product Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-pos-interactive-primary file:text-pos-text-primary hover:file:bg-pos-interactive-hover file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="sub_product_group"
                    checked={productForm.sub_product_group}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary rounded focus:ring-pos-info focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-pos-text-primary">Sub-Product Group</span>
                </label>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowEditProduct(false)}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProduct}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Update
              </button>
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