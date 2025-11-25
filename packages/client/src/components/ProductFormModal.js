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
        // price_vat_inc: product.price_vat_inc || '',
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
        // price_vat_inc: '',
        sub_product_group: false
      });
      setImageFile(null);
      setFieldErrors({});
      setHasEditedButtonOrProduction(false);
    }
    setFieldErrors({});
  }, [product, selectedCategoryId, isOpen]);


  const [hasEditedButtonOrProduction, setHasEditedButtonOrProduction] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setProductForm((prevForm) => {
      // Only sync fields if adding a new product (not editing)
      // and user hasn't edited button_name or production_name manually
      if (name === "name" && !product && !hasEditedButtonOrProduction) {
        return {
          ...prevForm,
          name: newValue,
          button_name: newValue,
          production_name: newValue,
        };
      }

      // If user edits button_name or production_name manually, stop syncing
      if (name === "button_name" || name === "production_name") {
        setHasEditedButtonOrProduction(true);
      }

      return {
        ...prevForm,
        [name]: newValue,
      };
    });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
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
      <div className="bg-pos-bg-tertiary rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text-primary">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form Section */}
        <div className="px-4 py-2" style={{ maxWidth: "30rem" }}>
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Product Name <span className="text-pos-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('name')}
                className={`w-full bg-pos-bg-primary border ${fieldErrors.name ? 'border-pos-error' : activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter product name"
              />
              {fieldErrors.name && <p className="text-pos-error text-xs mt-0.5">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Button Name</label>
              <input
                type="text"
                name="button_name"
                value={productForm.button_name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('button_name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'button_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Display name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Production Name</label>
              <input
                type="text"
                name="production_name"
                value={productForm.production_name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('production_name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'production_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Production name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Price vat inc</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={productForm.price}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('price')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'price' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Barcode</label>
              <input
                type="text"
                name="barcode"
                value={productForm.barcode}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('barcode')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'barcode' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Barcode"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">VAT Takeout (%)</label>
              <input
                type="number"
                step="0.01"
                name="vat_takeout"
                value={productForm.vat_takeout}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('vat_takeout')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'vat_takeout' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">VAT Eat-in (%)</label>
              <input
                type="number"
                step="0.01"
                name="vat_eat_in"
                value={productForm.vat_eat_in}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('vat_eat_in')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'vat_eat_in' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Category</label>
              <select
                name="category_id"
                value={productForm.category_id}
                onChange={handleInputChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Product Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1  text-xs focus:outline-none focus:border-pos-info transition-colors file:mr-2 file:py-0.5 file:px-2 file: file:border-0 file:text-xs file:bg-pos-interactive-primary file:text-pos-text-primary hover:file:bg-pos-interactive-hover file:cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Addition Type</label>
              <input
                type="text"
                name="addition_type"
                value={productForm.addition_type}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('addition_type')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'addition_type' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5  text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Addition type"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Product Color</label>
              <div className="flex gap-1 mt-2">
                {productColors.map(color => (
                  <div
                    key={color}
                    className={`w-6 h-6  cursor-pointer border-2 flex items-center justify-center ${productForm.color === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setProductForm({ ...productForm, color })}
                  >
                    {productForm.color === color && <span className="text-white text-xs">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer mt-4">
                <input
                  type="checkbox"
                  name="sub_product_group"
                  checked={productForm.sub_product_group}
                  onChange={handleInputChange}
                  className="w-3 h-3 text-pos-info bg-pos-bg-primary border-pos-border-secondary  focus:ring-pos-info focus:ring-1"
                />
                <span className="ml-2 text-xs text-pos-text-primary">Sub-Product Group</span>
              </label>
            </div>
          </div>
        </div>

        {/* Keypad Section */}
        {showKeypad && (
          <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" >
            <div className="mb-1 text-sm text-pos-text-muted text-center">
              Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
            </div>
            <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
              <KeypadNumpad
                onInput={handleKeypadInput}
                onEnter={handleKeypadEnter}
                onBackspace={handleKeypadBackspace}
                onClear={handleKeypadClear}
                defaultMode="keypad"
                showDecimal={['price', 'vat_takeout', 'vat_eat_in'].includes(activeField)}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Keypad Toggle Button */}
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-3 py-1.5  text-sm font-medium transition-colors ${showKeypad
              ? 'bg-pos-info text-white'
              : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
              }`}>
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className='flex gap-2'>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary  text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-pos-bg-primary text-white  text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
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
