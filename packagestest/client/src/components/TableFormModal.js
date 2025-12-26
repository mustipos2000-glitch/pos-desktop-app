import { useState, useEffect } from 'react';
import KeypadNumpad from './KeypadNumpad';

const TableFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  table = null,
  rooms = [],
  selectedRoomId = null
}) => {
  const [tableForm, setTableForm] = useState({
    table_no: '',
    room_id: '',
    order_id: '',
    status: 'available',
    description: '',
    customer_name: '',
    waiter_name: '',
    table_size: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [activeField, setActiveField] = useState('table_no');
  const [showKeypad, setShowKeypad] = useState(true);

  useEffect(() => {
    if (table) {
      // Edit mode - populate form with table data
      setTableForm({
        table_no: table.table_no || '',
        room_id: table.room_id || '',
        order_id: table.order_id || '',
        status: table.status || 'available',
        description: table.description || '',
        customer_name: table.customer_name || '',
        waiter_name: table.waiter_name || '',
        table_size: table.table_size || ''
      });
    } else {
      // Add mode - reset form
      setTableForm({
        table_no: '',
        room_id: selectedRoomId || '',
        order_id: '',
        status: 'available',
        description: '',
        customer_name: '',
        waiter_name: '',
        table_size: ''
      });
    }
    setFieldErrors({});
    setActiveField('table_no');
  }, [table, selectedRoomId, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTableForm(prev => ({
      ...prev,
      [name]: value
    }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setTableForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setTableForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setTableForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleSubmit = () => {
    const errors = {};
    if (!tableForm.table_no) {
      errors.table_no = 'Table number is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    onSubmit(tableForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text-primary">
            {table ? 'Edit Table' : 'Add New Table'}
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
          <div className="grid grid-cols-3 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Table Number <span className="text-pos-error">*</span>
              </label>
              <input
                type="text"
                name="table_no"
                value={tableForm.table_no}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('table_no')}
                className={`w-full bg-pos-bg-primary border ${fieldErrors.table_no ? 'border-pos-error' : activeField === 'table_no' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter table number"
              />
              {fieldErrors.table_no && <p className="text-pos-error text-xs mt-0.5">{fieldErrors.table_no}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Room
              </label>
              <select
                name="room_id"
                value={tableForm.room_id}
                onChange={handleInputChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Status
              </label>
              <select
                name="status"
                value={tableForm.status}
                onChange={handleInputChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Table Size
              </label>
              <select
                name="table_size"
                value={tableForm.table_size}
                onChange={handleInputChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
              >
                <option value="">Select size</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Customer Name
              </label>
              <input
                type="text"
                name="customer_name"
                value={tableForm.customer_name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('customer_name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'customer_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Waiter Name
              </label>
              <input
                type="text"
                name="waiter_name"
                value={tableForm.waiter_name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('waiter_name')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'waiter_name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter waiter name"
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-medium text-pos-text-muted mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={tableForm.description}
              onChange={handleInputChange}
              onFocus={() => handleFieldFocus('description')}
              className={`w-full bg-pos-bg-primary border ${activeField === 'description' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
              placeholder="Enter description (optional)"
              rows="2"
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
              className="px-6 py-2 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary  text-sm font-medium hover:bg-pos-interactive-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {table ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableFormModal;
