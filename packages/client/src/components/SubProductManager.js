import { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';
import './css/ProductManager.css';

const SubProductManager = () => {
  const [subProducts, setSubProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddSubProduct, setShowAddSubProduct] = useState(false);
  const [showEditSubProduct, setShowEditSubProduct] = useState(false);
  const [currentSubProduct, setCurrentSubProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    subProductId: null,
    subProductName: ''
  });
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  // Form state for sub-product data
  const [subProductForm, setSubProductForm] = useState({
    product_id: '',
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

  const fetchSubProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/sub-products');
      const result = await response.json();
      setSubProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching sub-products:', error);
      showError('Failed to fetch sub-products. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      const result = await response.json();
      setProducts(result.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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
    fetchSubProducts();
    fetchProducts();
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubProductForm({
      ...subProductForm,
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
      setSubProductForm({
        ...subProductForm,
        image: file.name
      });
    } else {
      setSubProductForm({
        ...subProductForm,
        image: ''
      });
    }
  };

  const resetForm = () => {
    setSubProductForm({
      product_id: '',
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

  const handleAddSubProduct = async () => {
    // Validate required fields
    const errors = {};
    if (!subProductForm.product_id) {
      errors.product_id = 'Parent Product is required';
    }
    if (!subProductForm.name) {
      errors.name = 'Sub-Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();

      // Append all sub-product data to FormData
      formData.append('product_id', parseInt(subProductForm.product_id));
      formData.append('name', subProductForm.name);
      formData.append('button_name', subProductForm.button_name || '');
      formData.append('production_name', subProductForm.production_name || '');
      formData.append('price', parseFloat(subProductForm.price) || 0);
      formData.append('vat_takeout', parseFloat(subProductForm.vat_takeout) || 0);
      formData.append('vat_eat_in', parseFloat(subProductForm.vat_eat_in) || 0);
      formData.append('barcode', subProductForm.barcode || '');
      formData.append('category_id', subProductForm.category_id ? parseInt(subProductForm.category_id) : '');
      formData.append('addition_type', subProductForm.addition_type || '');
      formData.append('display_index', parseInt(subProductForm.display_index) || 0);
      formData.append('in_web_shop', subProductForm.in_web_shop ? 1 : 0);
      formData.append('printer1', subProductForm.printer1 || '');
      formData.append('printer2', subProductForm.printer2 || '');
      formData.append('printer3', subProductForm.printer3 || '');

      // Append image file if selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch('http://localhost:5000/api/sub-products', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await fetchSubProducts();
        resetForm();
        setShowAddSubProduct(false);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to create sub-product');
      }
    } catch (error) {
      console.error('Error creating sub-product:', error);
      showError('Failed to create sub-product. Please try again.');
    }
  };

  const handleEditSubProduct = (subProduct) => {
    setCurrentSubProduct(subProduct);
    setSubProductForm({
      product_id: subProduct.parent_id || subProduct.product_id || '',
      name: subProduct.name || '',
      button_name: subProduct.button_name || '',
      production_name: subProduct.production_name || '',
      price: subProduct.price || '',
      vat_takeout: subProduct.vat_takeout || '',
      vat_eat_in: subProduct.vat_eat_in || '',
      barcode: subProduct.barcode || '',
      category_id: subProduct.category_id || '',
      addition_type: subProduct.addition_type || '',
      display_index: subProduct.display_index || '',
      in_web_shop: subProduct.in_web_shop === 1,
      printer1: subProduct.printer1 || '',
      printer2: subProduct.printer2 || '',
      printer3: subProduct.printer3 || '',
      image: subProduct.image || ''
    });
    setImageFile(null);
    setShowEditSubProduct(true);
  };

  const handleUpdateSubProduct = async () => {
    // Validate required fields
    const errors = {};
    if (!subProductForm.product_id) {
      errors.product_id = 'Parent Product is required';
    }
    if (!subProductForm.name) {
      errors.name = 'Sub-Product name is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      const formData = new FormData();

      formData.append('product_id', parseInt(subProductForm.product_id));
      formData.append('name', subProductForm.name);
      formData.append('button_name', subProductForm.button_name || '');
      formData.append('production_name', subProductForm.production_name || '');
      formData.append('price', parseFloat(subProductForm.price) || 0);
      formData.append('vat_takeout', parseFloat(subProductForm.vat_takeout) || 0);
      formData.append('vat_eat_in', parseFloat(subProductForm.vat_eat_in) || 0);
      formData.append('barcode', subProductForm.barcode || '');
      formData.append('category_id', subProductForm.category_id ? parseInt(subProductForm.category_id) : '');
      formData.append('addition_type', subProductForm.addition_type || '');
      formData.append('display_index', parseInt(subProductForm.display_index) || 0);
      formData.append('in_web_shop', subProductForm.in_web_shop ? 1 : 0);
      formData.append('printer1', subProductForm.printer1 || '');
      formData.append('printer2', subProductForm.printer2 || '');
      formData.append('printer3', subProductForm.printer3 || '');

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`http://localhost:5000/api/sub-products/${currentSubProduct.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        await fetchSubProducts();
        resetForm();
        setShowEditSubProduct(false);
        setCurrentSubProduct(null);
      } else {
        const errorResult = await response.json();
        showError(errorResult.error || 'Failed to update sub-product');
      }
    } catch (error) {
      console.error('Error updating sub-product:', error);
      showError('Failed to update sub-product. Please try again.');
    }
  };

  const handleDeleteSubProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sub-products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchSubProducts();
        closeDeleteConfirmation();
      } else {
        const errorResult = await response.json();
        closeDeleteConfirmation();
        showWarning(errorResult.error || 'Failed to delete sub-product', 'Cannot Delete Sub-Product');
      }
    } catch (error) {
      console.error('Error deleting sub-product:', error);
      closeDeleteConfirmation();
      showError('Failed to delete sub-product. Please try again.');
    }
  };

  const openDeleteConfirmation = (subProduct) => {
    setDeleteConfirmation({
      isOpen: true,
      subProductId: subProduct.id,
      subProductName: subProduct.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      subProductId: null,
      subProductName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.subProductId) {
      handleDeleteSubProduct(deleteConfirmation.subProductId);
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Sub Products</h2>
        <button className="add-btn" onClick={() => {
          resetForm();
          setShowAddSubProduct(true);
        }}>
          + Add Sub Product
        </button>
      </div>
      {loading && <div className="loading">Loading...</div>}

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Parent Product</th>
              <th>Name</th>
              <th>Button Name</th>
              <th>Price</th>
              <th>VAT Takeout</th>
              <th>VAT Eat-in</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subProducts.map(subProduct => (
              <tr key={subProduct.id}>
                <td>{subProduct.parent_name || getProductName(subProduct.parent_id)}</td>
                <td>{subProduct.name}</td>
                <td>{subProduct.button_name || '-'}</td>
                <td>${parseFloat(subProduct.price).toFixed(2)}</td>
                <td>{subProduct.vat_takeout}%</td>
                <td>{subProduct.vat_eat_in}%</td>
                <td>
                  {subProduct.image ? (
                    <img src={`http://localhost:5000${subProduct.image}`} alt={subProduct.name} style={{ maxWidth: '50px', maxHeight: '50px' }} />
                  ) : (
                    'No Image'
                  )}
                </td>
                <td style={{ display: 'flex' }}>
                  <IconButton
                    icon="✏️"
                    className="edit"
                    onClick={() => handleEditSubProduct(subProduct)}
                    title="Edit sub-product"
                  />
                  <IconButton
                    icon="🗑️"
                    className="delete"
                    onClick={() => openDeleteConfirmation(subProduct)}
                    title="Delete sub-product"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Sub-Product Modal */}
      {showAddSubProduct && (
        <div className="modal-overlay" onClick={() => setShowAddSubProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Sub-Product</h3>
            <div className="form-container">
              <div className="form-group">
                <label>Parent Product *</label>
                <select
                  name="product_id"
                  value={subProductForm.product_id}
                  onChange={handleInputChange}
                  style={fieldErrors.product_id ? { borderColor: '#ef4444' } : {}}
                >
                  <option value="">Select Parent Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                {fieldErrors.product_id && <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '1px' }}>{fieldErrors.product_id}</small>}
              </div>

              <div className="form-group">
                <label>Sub-Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={subProductForm.name}
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
                  value={subProductForm.button_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Production Name</label>
                <input
                  type="text"
                  name="production_name"
                  value={subProductForm.production_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={subProductForm.price}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>VAT Takeout (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_takeout"
                  value={subProductForm.vat_takeout}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>VAT Eat-in (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_eat_in"
                  value={subProductForm.vat_eat_in}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={subProductForm.barcode}
                  onChange={handleInputChange}
                />
              </div>



              <div className="form-group">
                <label>Addition Type</label>
                <input
                  type="text"
                  name="addition_type"
                  value={subProductForm.addition_type}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="modal-actions full-width">
                <button className="cancel-btn" onClick={() => setShowAddSubProduct(false)}>Cancel</button>
                <button className="add-btn" onClick={handleAddSubProduct}>Add Sub-Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sub-Product Modal */}
      {showEditSubProduct && (
        <div className="modal-overlay" onClick={() => setShowEditSubProduct(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Sub-Product</h3>
            <div className="form-container">
              <div className="form-group">
                <label>Parent Product *</label>
                <select
                  name="product_id"
                  value={subProductForm.product_id}
                  onChange={handleInputChange}
                  style={fieldErrors.product_id ? { borderColor: '#ef4444' } : {}}
                >
                  <option value="">Select Parent Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                {fieldErrors.product_id && <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{fieldErrors.product_id}</small>}
              </div>

              <div className="form-group">
                <label>Sub Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={subProductForm.name}
                  onChange={handleInputChange}
                  style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                />
                {fieldErrors.name && <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{fieldErrors.name}</small>}
              </div>

              <div className="form-group">
                <label>Button Name</label>
                <input
                  type="text"
                  name="button_name"
                  value={subProductForm.button_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Production Name</label>
                <input
                  type="text"
                  name="production_name"
                  value={subProductForm.production_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={subProductForm.price}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>VAT Takeout (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_takeout"
                  value={subProductForm.vat_takeout}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>VAT Eat-in (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="vat_eat_in"
                  value={subProductForm.vat_eat_in}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  name="barcode"
                  value={subProductForm.barcode}
                  onChange={handleInputChange}
                />
              </div>



              <div className="form-group">
                <label>Addition Type</label>
                <input
                  type="text"
                  name="addition_type"
                  value={subProductForm.addition_type}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="modal-actions full-width">
                <button className="cancel-btn" onClick={() => setShowEditSubProduct(false)}>Cancel</button>
                <button className="save-btn" onClick={handleUpdateSubProduct}>Update Sub Product</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Sub Product"
        message={`Are you sure you want to delete "${deleteConfirmation.subProductName}"? This action cannot be undone.`}
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

export default SubProductManager;
