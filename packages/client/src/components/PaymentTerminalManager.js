import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import ConfirmationModal from './ConfirmationModal';
import IconButton from './IconButton';
import KeypadNumpad from './KeypadNumpad';

const PaymentTerminalManager = () => {
  const [terminals, setTerminals] = useState([]);
  const [showAddTerminal, setShowAddTerminal] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  const [terminalForm, setTerminalForm] = useState({
    name: '',
    type: 'cashmatic',
    connection_type: 'tcp',
    connection_string: 'tcp://192.168.1.100:9100',
    enabled: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    terminalId: null,
    terminalName: ''
  });
  const [testingTerminal, setTestingTerminal] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showKeypad, setShowKeypad] = useState(true);
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    fetchTerminals();
  }, []);

  const fetchTerminals = async () => {
    try {
      const response = await ApiService.getPaymentTerminals();
      setTerminals(response.data || []);
    } catch (error) {
      console.error('Error fetching payment terminals:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTerminalForm({
      ...terminalForm,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      setTerminalForm(prev => ({
        ...prev,
        [activeField]: prev[activeField] + input
      }));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      setTerminalForm(prev => ({
        ...prev,
        [activeField]: prev[activeField].toString().slice(0, -1)
      }));
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      setTerminalForm(prev => ({
        ...prev,
        [activeField]: ""
      }));
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!terminalForm.name.trim()) {
      errors.name = 'Terminal name is required';
    }
    
    if (!terminalForm.type) {
      errors.type = 'Terminal type is required';
    }
    
    if (!terminalForm.connection_type) {
      errors.connection_type = 'Connection type is required';
    }
    
    if (!terminalForm.connection_string.trim()) {
      errors.connection_string = 'Connection string is required';
    } else {
      // Validate connection string format based on type
      if (terminalForm.connection_type === 'tcp') {
        const tcpPattern = /^tcp:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;
        if (!tcpPattern.test(terminalForm.connection_string)) {
          errors.connection_string = 'Invalid TCP format. Use: tcp://192.168.1.100:9100';
        }
      } else if (terminalForm.connection_type === 'serial') {
        if (!terminalForm.connection_string.includes('COM') && !terminalForm.connection_string.includes('/dev/')) {
          errors.connection_string = 'Invalid serial port format';
        }
      } else if (terminalForm.connection_type === 'api') {
        try {
          new URL(terminalForm.connection_string);
        } catch {
          errors.connection_string = 'Invalid API URL format';
        }
      }
    }
    
    return errors;
  };

  const handleAddTerminal = async () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await ApiService.createPaymentTerminal(terminalForm);
      await fetchTerminals();
      setShowAddTerminal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding terminal:', error);
      setFormErrors({ submit: 'Failed to add terminal. Please try again.' });
    }
  };

  const handleEditTerminal = (terminal) => {
    setEditingTerminal(terminal);
    setTerminalForm({
      name: terminal.name,
      type: terminal.type,
      connection_type: terminal.connection_type,
      connection_string: terminal.connection_string,
      enabled: terminal.enabled === 1
    });
    setFormErrors({});
    setShowAddTerminal(true);
  };

  const handleUpdateTerminal = async () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await ApiService.updatePaymentTerminal(editingTerminal.id, {
        ...terminalForm,
        enabled: terminalForm.enabled ? 1 : 0
      });
      await fetchTerminals();
      setShowAddTerminal(false);
      setEditingTerminal(null);
      resetForm();
    } catch (error) {
      console.error('Error updating terminal:', error);
      setFormErrors({ submit: 'Failed to update terminal. Please try again.' });
    }
  };

  const resetForm = () => {
    setTerminalForm({
      name: '',
      type: 'cashmatic',
      connection_type: 'tcp',
      connection_string: 'tcp://192.168.1.100:9100',
      enabled: true
    });
    setFormErrors({});
  };

  const openDeleteConfirmation = (terminal) => {
    setDeleteConfirmation({
      isOpen: true,
      terminalId: terminal.id,
      terminalName: terminal.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      terminalId: null,
      terminalName: ''
    });
  };

  const handleDeleteTerminal = async () => {
    try {
      await ApiService.deletePaymentTerminal(deleteConfirmation.terminalId);
      await fetchTerminals();
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Error deleting terminal:', error);
      closeDeleteConfirmation();
    }
  };

  const handleTestTerminal = async (terminalId) => {
    setTestingTerminal(terminalId);
    setTestResult(null);
    
    try {
      const response = await ApiService.testPaymentTerminal(terminalId);
      
      setTestResult({
        success: response.success,
        message: response.message || (response.success ? 'Connection successful!' : 'Connection failed')
      });
      
      // Auto-hide success message after 3 seconds
      if (response.success) {
        setTimeout(() => {
          setTestResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error testing terminal:', error);
      setTestResult({
        success: false,
        message: 'Test failed: ' + (error.message || 'Unknown error')
      });
    } finally {
      setTestingTerminal(null);
    }
  };

  const getConnectionExamples = () => {
    const type = terminalForm.connection_type;
    
    if (type === 'tcp') {
      return [
        { label: 'Network (LAN)', example: 'tcp://192.168.1.100:9100' },
        { label: 'Network (WiFi)', example: 'tcp://192.168.0.50:9100' }
      ];
    } else if (type === 'serial') {
      return [
        { label: 'Windows', example: 'COM3' },
        { label: 'Linux/Mac', example: '/dev/ttyUSB0' }
      ];
    } else if (type === 'api') {
      return [
        { label: 'HTTP API', example: 'http://192.168.1.100:8080' },
        { label: 'HTTPS API', example: 'https://payment-api.example.com' }
      ];
    }
    
    return [];
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-pos-text-primary text-base font-semibold">Payment Terminals</h3>
          <p className="text-pos-text-muted text-xs mt-1">
            Configure Cashmatic and Bancontact payment machines
          </p>
        </div>
        <button 
          onClick={() => {
            setShowAddTerminal(true);
            setEditingTerminal(null);
            resetForm();
          }}
          className="btn-primary py-1.5"
        >
          + Add Terminal
        </button>
      </div>

      {testResult && (
        <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-500 bg-opacity-20 border border-green-500' : 'bg-red-500 bg-opacity-20 border border-red-500'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{testResult.success ? '✅' : '❌'}</span>
            <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
              {testResult.message}
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-48">Terminal Name</th>
              <th className="w-32">Type</th>
              <th className="w-32">Connection</th>
              <th className="w-64">Connection String</th>
              <th className="w-24 text-center">Status</th>
              <th className="w-40 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {terminals.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-pos-text-muted">
                  No payment terminals configured. Click "Add Terminal" to get started.
                </td>
              </tr>
            ) : (
              terminals.map(terminal => (
                <tr key={terminal.id}>
                  <td className="font-medium text-pos-text-primary">{terminal.name}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      terminal.type === 'cashmatic'
                        ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                        : 'bg-blue-500 bg-opacity-20 text-blue-400'
                    }`}>
                      {terminal.type === 'cashmatic' ? '💰 Cashmatic' : '🏦 Bancontact'}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      terminal.connection_type === 'tcp'
                        ? 'bg-green-500 bg-opacity-20 text-green-400'
                        : terminal.connection_type === 'serial'
                          ? 'bg-purple-500 bg-opacity-20 text-purple-400'
                          : 'bg-blue-500 bg-opacity-20 text-blue-400'
                    }`}>
                      {terminal.connection_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-pos-text-secondary font-mono text-sm">
                    {terminal.connection_string}
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      terminal.enabled
                        ? 'bg-green-500 bg-opacity-20 text-green-400'
                        : 'bg-red-500 bg-opacity-20 text-red-400'
                    }`}>
                      {terminal.enabled ? '✓ Enabled' : '✕ Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleTestTerminal(terminal.id)}
                        disabled={testingTerminal === terminal.id}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Test connection"
                      >
                        {testingTerminal === terminal.id ? '⏳ Testing...' : '🔌 Test'}
                      </button>
                      <IconButton
                        icon="✏️"
                        className="edit"
                        onClick={() => handleEditTerminal(terminal)}
                        title="Edit terminal"
                      />
                      <IconButton
                        icon="🗑️"
                        className="delete"
                        onClick={() => openDeleteConfirmation(terminal)}
                        title="Delete terminal"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Terminal Modal */}
      {showAddTerminal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => {
          setShowAddTerminal(false);
          setFormErrors({});
          setActiveField(null);
        }}>
          <div className="bg-pos-bg-tertiary rounded-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-lg font-semibold text-pos-text-primary">
                {editingTerminal ? 'Edit Payment Terminal' : 'Add Payment Terminal'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddTerminal(false);
                  setFormErrors({});
                  setActiveField(null);
                }}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
              {formErrors.submit && (
                <div className="p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-400 text-xs mb-2">
                  {formErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">
                    Terminal Name <span className="text-pos-error">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="name"
                    value={terminalForm.name}
                    onChange={handleFormChange}
                    onFocus={() => handleFieldFocus('name')}
                    className={`w-full bg-pos-bg-primary border ${formErrors.name ? 'border-pos-error' : activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                    placeholder="e.g., Main Cashmatic"
                  />
                  {formErrors.name && (
                    <p className="text-pos-error text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">
                    Terminal Type <span className="text-pos-error">*</span>
                  </label>
                  <select 
                    name="type"
                    value={terminalForm.type}
                    onChange={handleFormChange}
                    className={`w-full bg-pos-bg-primary border ${formErrors.type ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  >
                    <option value="cashmatic">💰 Cashmatic</option>
                    <option value="bancontact">🏦 Bancontact</option>
                  </select>
                  {formErrors.type && (
                    <p className="text-pos-error text-xs mt-1">{formErrors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">
                    Connection Type <span className="text-pos-error">*</span>
                  </label>
                  <select 
                    name="connection_type"
                    value={terminalForm.connection_type}
                    onChange={handleFormChange}
                    className={`w-full bg-pos-bg-primary border ${formErrors.connection_type ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  >
                    <option value="tcp">TCP/IP</option>
                    <option value="serial">Serial Port</option>
                    <option value="api">HTTP API</option>
                  </select>
                  {formErrors.connection_type && (
                    <p className="text-pos-error text-xs mt-1">{formErrors.connection_type}</p>
                  )}
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">
                    Connection String <span className="text-pos-error">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="connection_string"
                    value={terminalForm.connection_string}
                    onChange={handleFormChange}
                    onFocus={() => handleFieldFocus('connection_string')}
                    className={`w-full bg-pos-bg-primary border ${formErrors.connection_string ? 'border-pos-error' : activeField === 'connection_string' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors font-mono`}
                    placeholder="tcp://192.168.1.100:9100"
                  />
                  {formErrors.connection_string && (
                    <p className="text-pos-error text-xs mt-1">{formErrors.connection_string}</p>
                  )}
                </div>

                <div className="flex items-center pt-6">
                  <input 
                    type="checkbox" 
                    id="enabled"
                    name="enabled"
                    checked={terminalForm.enabled}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" 
                  />
                  <label htmlFor="enabled" className="ml-2 text-pos-text-primary text-xs">
                    Enable terminal
                  </label>
                </div>
              </div>

              <div className="text-pos-text-muted text-xs space-y-1">
                <p className="font-medium">Examples for {terminalForm.connection_type.toUpperCase()}:</p>
                {getConnectionExamples().map((example, index) => (
                  <p key={index}>
                    <strong>{example.label}:</strong> 
                    <code className="ml-1 px-1 py-0.5 bg-pos-bg-primary rounded">{example.example}</code>
                  </p>
                ))}
              </div>

              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 rounded p-2 text-xs text-blue-400 mt-2">
                <p className="font-medium mb-1">💡 Tips:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Ensure terminal is powered on and connected</li>
                  <li>Check IP address in terminal settings</li>
                  <li>Default port is usually 9100</li>
                  <li>Use Test button to verify connection</li>
                </ul>
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
            
            <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0 sticky bottom-0">
              <button
                type="button"
                onClick={() => setShowKeypad(!showKeypad)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${showKeypad
                  ? 'bg-pos-info text-white'
                  : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                  }`}>
                {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowAddTerminal(false);
                    setFormErrors({});
                    setActiveField(null);
                  }}
                  className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={editingTerminal ? handleUpdateTerminal : handleAddTerminal}
                  className="px-5 py-1.5 bg-pos-bg-primary text-pos-text-primary text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
                >
                  {editingTerminal ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteTerminal}
        title="Delete Payment Terminal"
        message={`Are you sure you want to delete "${deleteConfirmation.terminalName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default PaymentTerminalManager;
