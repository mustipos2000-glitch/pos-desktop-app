import { useState, useEffect } from 'react';
import KeypadNumpad from './KeypadNumpad';

const PromotionFormModal = ({ isOpen, onClose, onSubmit, promotion, products }) => {
  const [formData, setFormData] = useState({
    name: '',
    product_ids: [],
    discount_type: 'percentage',
    discount_value: 0,
    start_date: '',
    end_date: '',
    is_active: 1
  });

  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        console.log('Editing promotion:', promotion);
        setFormData({
          name: promotion.name || '',
          product_ids: promotion.product_ids || [],
          discount_type: promotion.discount_type || 'percentage',
          discount_value: promotion.discount_value || 0,
          start_date: promotion.start_date || '',
          end_date: promotion.end_date || '',
          is_active: promotion.is_active !== undefined ? promotion.is_active : 1
        });
      } else {
        setFormData({
          name: '',
          product_ids: [],
          discount_type: 'percentage',
          discount_value: 0,
          start_date: '',
          end_date: '',
          is_active: 1
        });
      }
    }
  }, [isOpen, promotion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const toggleProduct = (productId) => {
    setFormData(prev => {
      const isSelected = prev.product_ids.includes(productId);
      return {
        ...prev,
        product_ids: isSelected
          ? prev.product_ids.filter(id => id !== productId)
          : [...prev.product_ids, productId]
      };
    });
  };

  const selectAllProducts = () => {
    setFormData(prev => ({
      ...prev,
      product_ids: products.map(p => p.id)
    }));
  };

  const clearAllProducts = () => {
    setFormData(prev => ({
      ...prev,
      product_ids: []
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Please enter a promotion name');
      return;
    }
    if (formData.product_ids.length === 0) {
      alert('Please select at least one product');
      return;
    }
    if (!formData.discount_value || formData.discount_value <= 0) {
      alert('Please enter a valid discount value');
      return;
    }
    console.log('Submitting promotion:', formData);
    onSubmit(formData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: activeField === 'discount_value' ? 0 : ''
      }));
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-pos-bg-tertiary rounded-lg max-h-[90vh] overflow-y-auto max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-2 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-pos-text-primary">
            {promotion ? 'Edit Promotion' : 'Add New Promotion'}
          </h3>
          <button
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form Section */}
        <div className="px-6 py-2">
          {/* Row 1: Name, Discount Type, Discount Value */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-pos-text-muted mb-2">
                Promotion Name <span className="text-pos-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => handleFieldFocus('name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter promotion name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-pos-text-muted mb-2">
                Discount Type <span className="text-pos-error">*</span>
              </label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-pos-text-muted mb-2">
                Discount Value <span className="text-pos-error">*</span>
              </label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                onFocus={() => handleFieldFocus('discount_value')}
                min="0"
                step="0.01"
                className={`w-full bg-pos-bg-primary border ${activeField === 'discount_value' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Products Multi-Select Dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-pos-text-muted mb-2">
              Products <span className="text-pos-error">*</span> ({formData.product_ids.length} selected)
            </label>
            <div className="relative">
              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors text-left flex items-center justify-between"
              >
                <span className={formData.product_ids.length === 0 ? 'text-pos-text-muted' : ''}>
                  {formData.product_ids.length === 0 
                    ? 'Select products...' 
                    : `${formData.product_ids.length} product${formData.product_ids.length > 1 ? 's' : ''} selected`
                  }
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProductDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-pos-bg-primary border border-pos-border-secondary rounded-xl shadow-lg max-h-[300px] overflow-hidden">
                  {/* Quick Actions */}
                  <div className="flex gap-2 p-2 border-b border-pos-border-secondary bg-pos-bg-secondary">
                    <button
                      type="button"
                      onClick={selectAllProducts}
                      className="flex-1 text-xs px-3 py-1.5 bg-pos-info text-white rounded-lg hover:bg-pos-info/80 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAllProducts}
                      className="flex-1 text-xs px-3 py-1.5 bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary rounded-lg hover:bg-pos-interactive-primary transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Product List */}
                  <div className="overflow-y-auto max-h-[240px] p-2">
                    {products.map(product => (
                      <label
                        key={product.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1 ${
                          formData.product_ids.includes(product.id)
                            ? 'bg-pos-info/20 border border-pos-info'
                            : 'hover:bg-pos-bg-tertiary'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.product_ids.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary rounded focus:ring-pos-info focus:ring-2"
                        />
                        <span className="text-sm text-pos-text-primary flex-1">
                          {product.name}
                        </span>
                        {formData.product_ids.includes(product.id) && (
                          <svg className="w-4 h-4 text-pos-info" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Products Tags */}
            
          </div>

          {/* Row 2: Start Date, End Date, Active */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm ps-2 font-medium text-pos-text-muted mb-1.5">
                Start Date
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm ps-2 font-medium text-pos-text-muted mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 text-sm rounded-xl focus:outline-none focus:border-pos-info transition-colors"
              />
            </div>

            <div className="flex items-end">
              <label className="flex ps-2 items-center cursor-pointer px-3 py-2.5">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active === 1}
                  onChange={handleChange}
                  className="w-4 h-4 text-pos-info bg-pos-bg-primary border-pos-border-secondary rounded-md focus:ring-pos-info focus:ring-2"
                />
                <span className="ml-2 text-sm text-pos-text-primary">
                  Active
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Keypad Section */}
        {showKeypad && (
          <div className="px-6 py-2 border-t border-pos-border-secondary">
            <div className="mb-2 text-sm text-pos-text-muted text-center">
              Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
            </div>
            <div className="flex justify-center w-full">
              <div className="w-full max-w-md">
                <KeypadNumpad
                  onInput={handleKeypadInput}
                  onEnter={handleKeypadEnter}
                  onBackspace={handleKeypadBackspace}
                  onClear={handleKeypadClear}
                  defaultMode="keypad"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}
          >
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium rounded-xl hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || formData.product_ids.length === 0}
              className="px-6 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {promotion ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionFormModal;
