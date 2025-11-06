import { useState, useEffect } from 'react';
import KeypadNumpad from './KeypadNumpad';

const ProductFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product = null, 
  categories = [],
  selectedCategoryId = null 
}) => {
  const [productForm, setProductForm] = useState({
    name: '',
    button_name: '',
    production_name: '',
    price: '',
    vat_takeout: '',
    vat_eat_in: '',
    barcode: '',
    category_id: selectedCategoryId || '',
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

  const [imageFile, setImageFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);

  // Color options for product color picker
  const productColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#ef4444', // Red
    '#ec4899', // Pink
    '#fbbf24', // Yellow
    '#fb923c'  // Orange
  ];

  useEffect(() => {
    if (product) {
      // Edit mode - populate form with product data
      setProductForm({
        name: product.name || '',
        button_name: product.button_name || '',
        production_name: product.production_name || '',
        price: product.price || '',
        vat_takeout: product.vat_takeout || '',
        vat_eat_in: product.vat_eat_in || '',
        barcode: product.barcode || '',
        category_id: product.category_id || selectedCategoryId || '',
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
      setImageFile(null);
    } else {
      // Add mode - reset form
      setProductForm({
        name: '',
        button_name: '',
        production_name: '',
        price: '',
        vat_takeout: '',
        vat_eat_in: '',
        barcode: '',
        category_id: selectedCategoryId || '',
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
    }
    setFieldErrors({});
  }, [product, selectedCategoryId, isOpen]);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

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

  const handleSubmit = () => {
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
    onSubmit(productForm, imageFile);
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setProductForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setProductForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setProductForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    // Keep keypad visible, just blur the active field
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[600px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-semibold text-pos-text-primary">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button 
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="px-6 py-4">
          {/* <div className=""> */}
            {/* Form Fields */}
            <div className="flex-1">
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
                    onFocus={() => handleFieldFocus('name')}
                    className={`w-full bg-pos-bg-primary border ${fieldErrors.name ? 'border-pos-error' : activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('button_name')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'button_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('production_name')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'production_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('price')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'price' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('price_vat_inc')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'price_vat_inc' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('barcode')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'barcode' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('vat_takeout')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'vat_takeout' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('vat_eat_in')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'vat_eat_in' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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
                    onFocus={() => handleFieldFocus('addition_type')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'addition_type' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
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

            {/* Keypad */}
            {showKeypad && (
              <div className="w-80">
                <div className="mb-2 text-sm text-pos-text-muted">
                  Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                </div>
                <KeypadNumpad
                  onInput={handleKeypadInput}
                  onEnter={handleKeypadEnter}
                  onBackspace={handleKeypadBackspace}
                  onClear={handleKeypadClear}
                  defaultMode="keypad"
                  showDecimal={['price', 'price_vat_inc', 'vat_takeout', 'vat_eat_in'].includes(activeField)}
                />
              </div>
            )}
          {/* </div> */}
        </div>
        
        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-between gap-3">
           {/* Keypad Toggle Button */}
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}>
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className='flex gap-3'>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-pos-info text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg"
            >
              {product ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormModal;
