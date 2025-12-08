import { useState, useEffect } from 'react';
import KeypadNumpad from './KeypadNumpad';

const CustomerFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  customer = null 
}) => {
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);

  useEffect(() => {
    if (customer) {
      // Edit mode - populate form with customer data
      setCustomerForm({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      // Add mode - reset form
      setCustomerForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
    setActiveField('name');
  }, [customer, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setCustomerForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setCustomerForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setCustomerForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleSubmit = () => {
    if (!customerForm.name) {
      return;
    }
    onSubmit(customerForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-tertiary rounded-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text-primary">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button 
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form Section */}
        <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Name <span className="text-pos-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={customerForm.name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={customerForm.phone}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('phone')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'phone' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Email
              </label>
              <input
                type="text"
                name="email"
                value={customerForm.email}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('email')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'email' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Email address"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={customerForm.address}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('address')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'address' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Customer address"
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-medium text-pos-text-muted mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={customerForm.notes}
              onChange={handleInputChange}
              onFocus={() => handleFieldFocus('notes')}
              rows="2"
              className={`w-full bg-pos-bg-primary border ${activeField === 'notes' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
              placeholder="Additional notes"
            />
          </div>
        </div>

        {/* Keypad Section */}
        {showKeypad && (
          <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{marginTop:"-1rem"}}>
            <div className="mb-1 text-sm text-pos-text-muted text-center">
              Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
            </div>
            <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
              <KeypadNumpad
                onInput={handleKeypadInput}
                onEnter={handleKeypadEnter}
                onBackspace={handleKeypadBackspace}
                onClear={handleKeypadClear}
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
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
            }`}>
            {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
          </button>
          <div className='flex gap-2'>
            <button 
              onClick={onClose}
              className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-5 py-1.5 bg-pos-bg-primary  text-pos-text-primary text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
            >
              {customer ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormModal;
