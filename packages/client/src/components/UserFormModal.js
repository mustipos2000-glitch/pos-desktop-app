import { useState, useEffect } from 'react';
import KeypadNumpad from './KeypadNumpad';

const UserFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user = null 
}) => {
  const [userForm, setUserForm] = useState({
    name: '',
    pincode: '',
    social_security: '',
    identification: '',
    role: 'User',
    avatar_color: '#3b82f6'
  });

  const [showPincode, setShowPincode] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeField, setActiveField] = useState('name');
  const [showKeypad, setShowKeypad] = useState(true);

  const avatarColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4'
  ];

  useEffect(() => {
    if (user) {
      // Edit mode - populate form with user data
      setUserForm({
        name: user.name,
        pincode: user.pincode,
        social_security: user.social_security || '',
        identification: user.identification || '',
        role: user.role,
        avatar_color: user.avatar_color
      });
    } else {
      // Add mode - reset form
      setUserForm({
        name: '',
        pincode: '',
        social_security: '',
        identification: '',
        role: 'User',
        avatar_color: '#3b82f6'
      });
    }
    setShowPincode(false);
    setErrors({});
    setActiveField('name');
  }, [user, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
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
      setUserForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setUserForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setUserForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    // Keep keypad visible, just blur the active field
    setActiveField(null);
  };

  const handleSubmit = () => {
    onSubmit(userForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-tertiary" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text-primary">
            {user ? 'Edit User' : 'Add New User'}
          </h3>
          <button 
            onClick={onClose}
            className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Modal Body - Form Section */}
        <div className="px-4 py-2 mb-3" style={{maxWidth:"30rem"}}>
          {errors.general && (
            <div className="bg-pos-error bg-opacity-10 border border-pos-error text-pos-error px-3 py-2 rounded-lg mb-3 text-sm">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Name <span className="text-pos-error">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={userForm.name}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('name')}
                className={`w-full bg-pos-bg-primary border ${errors.name ? 'border-pos-error' : activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="Enter user name"
                autoComplete="off"
              />
              {errors.name && <p className="text-pos-error text-xs mt-0.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">
                Pincode <span className="text-pos-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPincode ? "text" : "password"}
                  name="pincode"
                  maxLength="4"
                  placeholder="4-digit code"
                  value={userForm.pincode}
                  onChange={handleInputChange}
                  onFocus={() => handleFieldFocus('pincode')}
                  className={`w-full bg-pos-bg-primary border ${errors.pincode ? 'border-pos-error' : activeField === 'pincode' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors pr-8`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text-primary transition-colors"
                  onClick={() => setShowPincode(!showPincode)}
                  title={showPincode ? "Hide pincode" : "Show pincode"}
                >
                  {showPincode ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.pincode && <p className="text-pos-error text-xs mt-0.5">{errors.pincode}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Role</label>
              <select
                name="role"
                value={userForm.role}
                onChange={handleInputChange}
                className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-2">
            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Social Security Number</label>
              <input
                type="text"
                name="social_security"
                placeholder="XXX-XX-XXXX"
                value={userForm.social_security}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('social_security')}
                className={`w-full bg-pos-bg-primary border ${errors.social_security ? 'border-pos-error' : activeField === 'social_security' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                autoComplete="off"
              />
              {errors.social_security && <p className="text-pos-error text-xs mt-0.5">{errors.social_security}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Identification</label>
              <input
                type="text"
                name="identification"
                value={userForm.identification}
                onChange={handleInputChange}
                onFocus={() => handleFieldFocus('identification')}
                className={`w-full bg-pos-bg-primary border ${activeField === 'identification' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                placeholder="ID number"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-pos-text-muted mb-1">Avatar Color</label>
              <div className="flex gap-1.5 mt-1">
                {avatarColors.map(color => (
                  <div
                    key={color}
                    className={`w-6 h-6 cursor-pointer border-2 flex items-center justify-center ${userForm.avatar_color === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setUserForm({ ...userForm, avatar_color: color })}
                  >
                    {userForm.avatar_color === color && <span className="text-white text-xs">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Keypad Section */}
        {showKeypad && (
          <div className="px-4 py-2 flex-1 flex flex-col items-center justify-center" style={{marginTop:"-2rem"}}>
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
              className="px-5 py-1.5 bg-pos-bg-primary text-white text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
            >
              {user ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
