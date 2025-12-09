import { useState, useEffect, useRef, useCallback } from 'react';
import ApiService from '../services/api';

const CustomerSelector = ({ selectedCustomer, onSelectCustomer, onCreateCustomer }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const dropdownRef = useRef(null);

  const searchCustomers = useCallback(async () => {
    if (!searchTerm || searchTerm.length === 0) {
      setCustomers([]);
      return;
    }

    try {
      const response = await ApiService.searchCustomers(searchTerm);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    searchCustomers();
  }, [searchCustomers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClearCustomer = () => {
    onSelectCustomer(null);
    setSearchTerm('');
  };

  const handleQuickAdd = async () => {
    if (!searchTerm.trim()) {
      return;
    }

    try {
      const response = await ApiService.createCustomer({
        name: searchTerm,
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      
      if (response.data) {
        onSelectCustomer(response.data);
        if (onCreateCustomer) {
          onCreateCustomer(response.data);
        }
      }
      
      setSearchTerm('');
      setShowDropdown(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer');
    }
  };

  return (
    <div className="relative h-full" ref={dropdownRef}>
      {selectedCustomer ? (
        <div className="flex items-center justify-between bg-pos-bg-tertiary border border-pos-border-secondary rounded px-2 py-1 h-full">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-pos-text-primary truncate">{selectedCustomer.name}</div>
          </div>
          <button
            onClick={handleClearCustomer}
            className="text-pos-danger hover:text-pos-danger-hover ml-1 text-xs flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative h-full">
          <div className="relative flex items-center h-full">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full h-full px-2 py-1 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info text-xs pr-12"
            />
            
            {searchTerm.length > 0 && customers.length === 0 && (
              <button
                onClick={handleQuickAdd}
                className="absolute right-1 px-2 py-0.5 bg-pos-success hover:bg-pos-success-hover text-white rounded text-[10px] font-medium transition-colors"
              >
                + Add
              </button>
            )}
          </div>
          
          {showDropdown && customers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-pos-bg-secondary border border-pos-border-secondary rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full px-3 py-2 text-left hover:bg-pos-bg-tertiary border-b border-pos-border-secondary last:border-b-0"
                >
                  <div className="text-sm font-medium text-pos-text-primary">{customer.name}</div>
                  {customer.phone && (
                    <div className="text-xs text-pos-text-muted">{customer.phone}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default CustomerSelector;
