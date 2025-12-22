import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../ConfirmationModal';
import MessageModal from '../MessageModal';
import IconButton from '../IconButton';
import { useMessageModal } from '../../hooks/useMessageModal';
import PaymentTerminalManager from '../PaymentTerminalManager';
import KeypadNumpad from '../KeypadNumpad';


const SettingsModal = ({ onClose, initialTab = 'general', limitedTabs = null }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [rolePermissions, setRolePermissions] = useState({
    'Super Admin': { admin: true, settings: true, reports: true },
    'Admin': { admin: false, settings: false, reports: false },
    'User': { admin: false, settings: false, reports: false }
  });
  const [printers, setPrinters] = useState([]);
  const [showAddPrinter, setShowAddPrinter] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [printerForm, setPrinterForm] = useState({
    name: '',
    type: 'EPSON',
    connection_string: 'tcp://192.168.1.100:9100',
    is_main: false
  });
  const { messageModal, showError, showInfo, closeModal } = useMessageModal();
  const [printerFormErrors, setPrinterFormErrors] = useState({});
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    printerId: null,
    printerName: ''
  });
  const [testingPrinter, setTestingPrinter] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isSuperAdmin = currentUser.role === 'Super Admin';
  const [showKeypad, setShowKeypad] = useState(true);
  const [activeField, setActiveField] = useState(null);
  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'My POS Store',
    taxRate: '8',
    currency: 'USD',
    language: 'en'
  });

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'permissions') {
      fetchRolePermissions();
    }
    if (activeTab === 'printer') {
      fetchPrinters();
    }
  }, [activeTab, isSuperAdmin]);

  const fetchPrinters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/printers');
      const result = await response.json();
      setPrinters(result.data || []);
    } catch (error) {
      console.error('Error fetching printers:', error);
    }
  };

  const handlePrinterFormChange = (e) => {
    const { name, value } = e.target;
    setPrinterForm({
      ...printerForm,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (printerFormErrors[name]) {
      setPrinterFormErrors({
        ...printerFormErrors,
        [name]: ''
      });
    }
  };

  const handleKeypadInput = (input) => {
    if (activeField) {
      // Check if we're in printer form or general settings
      if (activeField === 'name' || activeField === 'connection_string') {
        setPrinterForm(prev => ({
          ...prev,
          [activeField]: prev[activeField] + input
        }));
      } else if (activeField === 'storeName' || activeField === 'taxRate') {
        setGeneralSettings(prev => ({
          ...prev,
          [activeField]: prev[activeField] + input
        }));
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (activeField) {
      if (activeField === 'name' || activeField === 'connection_string') {
        setPrinterForm(prev => ({
          ...prev,
          [activeField]: prev[activeField].toString().slice(0, -1)
        }));
      } else if (activeField === 'storeName' || activeField === 'taxRate') {
        setGeneralSettings(prev => ({
          ...prev,
          [activeField]: prev[activeField].toString().slice(0, -1)
        }));
      }
    }
  };

  const handleKeypadClear = () => {
    if (activeField) {
      if (activeField === 'name' || activeField === 'connection_string') {
        setPrinterForm(prev => ({
          ...prev,
          [activeField]: ""
        }));
      } else if (activeField === 'storeName' || activeField === 'taxRate') {
        setGeneralSettings(prev => ({
          ...prev,
          [activeField]: ""
        }));
      }
    }
  };

  const handleKeypadEnter = () => {
    setActiveField(null);
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleGeneralSettingsChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddPrinter = async () => {
    // Validate form
    const errors = {};
    if (!printerForm.name.trim()) {
      errors.name = 'Printer name is required';
    }
    if (!printerForm.type) {
      errors.type = 'Printer type is required';
    }

    if (Object.keys(errors).length > 0) {
      setPrinterFormErrors(errors);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerForm)
      });

      if (response.ok) {
        await fetchPrinters();
        setShowAddPrinter(false);
        setPrinterForm({ name: '', type: 'EPSON', connection_string: 'tcp://192.168.1.100:9100', is_main: false });
        setPrinterFormErrors({});
      }
    } catch (error) {
      console.error('Error adding printer:', error);
    }
  };

  const handleEditPrinter = (printer) => {
    setEditingPrinter(printer);
    setPrinterForm({
      name: printer.name,
      type: printer.type,
      connection_string: printer.connection_string || '',
      is_main: printer.is_main === 1 || printer.is_main === true
    });
    setPrinterFormErrors({});
    setShowAddPrinter(true);
  };

  const handleUpdatePrinter = async () => {
    // Validate form
    const errors = {};
    if (!printerForm.name.trim()) {
      errors.name = 'Printer name is required';
    }
    if (!printerForm.type) {
      errors.type = 'Printer type is required';
    }

    if (Object.keys(errors).length > 0) {
      setPrinterFormErrors(errors);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/printers/${editingPrinter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerForm)
      });

      if (response.ok) {
        await fetchPrinters();
        setShowAddPrinter(false);
        setEditingPrinter(null);
        setPrinterForm({ name: '', type: 'EPSON', connection_string: 'tcp://192.168.1.100:9100', is_main: false });
        setPrinterFormErrors({});
      }
    } catch (error) {
      console.error('Error updating printer:', error);
    }
  };

  const openDeleteConfirmation = (printer) => {
    setDeleteConfirmation({
      isOpen: true,
      printerId: printer.id,
      printerName: printer.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      printerId: null,
      printerName: ''
    });
  };

  const handleDeletePrinter = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/printers/${deleteConfirmation.printerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPrinters();
        closeDeleteConfirmation();
      }
    } catch (error) {
      console.error('Error deleting printer:', error);
      closeDeleteConfirmation();
    }
  };

  const handleTestPrinter = async (printerId) => {
    setTestingPrinter(printerId);
    try {
      const response = await fetch(`http://localhost:5000/api/printers/${printerId}/test`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.success) {
        showInfo('Test print sent successfully! Check your printer.', '✅ Success');
      } else {
        showError('Test print failed: ' + (result.error || 'Unknown error'), '❌ Test Failed');
      }
    } catch (error) {
      console.error('Error testing printer:', error);
      showError('Test print failed: ' + error.message, '❌ Test Failed');
    } finally {
      setTestingPrinter(null);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      
      // Get default permissions for Admin and User roles from first user of each role
      const newRolePerms = {
        'Super Admin': { admin: true, settings: true, reports: true },
        'Admin': { admin: false, settings: false, reports: false },
        'User': { admin: false, settings: false, reports: false }
      };
      
      data.forEach(user => {
        if (user.role === 'Admin' || user.role === 'User') {
          try {
            const perms = user.permissions ? JSON.parse(user.permissions) : [];
            newRolePerms[user.role] = {
              admin: perms.includes('admin'),
              settings: perms.includes('settings'),
              reports: perms.includes('reports')
            };
          } catch (e) {
            // Keep defaults
          }
        }
      });
      
      setRolePermissions(newRolePerms);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const toggleRolePermission = async (role, permission) => {
    if (role === 'Super Admin') return; // Cannot modify Super Admin
    
    const newValue = !rolePermissions[role][permission];
    
    setRolePermissions({
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [permission]: newValue
      }
    });

    // Update all users with this role
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      
      const usersWithRole = data.filter(user => user.role === role);
      
      for (const user of usersWithRole) {
        let perms = [];
        try {
          perms = user.permissions ? JSON.parse(user.permissions) : [];
        } catch (e) {
          perms = [];
        }
        
        if (newValue) {
          // Add permission if not exists
          if (!perms.includes(permission)) {
            perms.push(permission);
          }
        } else {
          // Remove permission
          perms = perms.filter(p => p !== permission);
        }
        
        await fetch(`http://localhost:5000/api/users/${user.id}/permissions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: JSON.stringify(perms) })
        });
      }
    } catch (error) {
      console.error('Error updating role permissions:', error);
    }
  };

  // Function to generate connection string examples based on type
  const getConnectionExamples = () => {
    return [
      { type: 'Network (LAN)', example: 'tcp://192.168.1.100:9100' },
      { type: 'USB (Windows)', example: '\\\\.\\COM3' },
      { type: 'USB (Linux/Mac)', example: '/dev/usb/lp0' }
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-pos-bg-secondary rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-pos-border-primary">
          <h2 className="text-pos-text-primary text-xl font-semibold">Settings</h2>
          <button className="text-pos-text-muted hover:text-pos-text-primary text-2xl" onClick={onClose}>×</button>
        </div>

        <div className="flex border-b pb-1 mt-1 border-pos-border-primary">
          {(!limitedTabs || limitedTabs.includes('general')) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'general' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
          )}
          {(!limitedTabs || limitedTabs.includes('display')) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'display' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('display')}
            >
              Display
            </button>
          )}
          {(!limitedTabs || limitedTabs.includes('printer')) && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'printer' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('printer')}
            >
              Printer
            </button>
          )}
          {(!limitedTabs || limitedTabs.includes('payment')) && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'payment' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('payment')}
            >
              Payment
            </button>
          )}

          {(!limitedTabs || limitedTabs.includes('permissions')) && isSuperAdmin && (
            <button
              className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'permissions' 
                  ? 'bg-pos-bg-primary text-pos-text-primary' 
                  : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
              }`}
              onClick={() => setActiveTab('permissions')}
            >
              Permissions
            </button>
          )}
        </div>

        <div className="px-4 py-2 overflow-y-auto max-h-[60vh] scrollbar-custom">
          {activeTab === 'general' && (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Store Name</label>
                  <input 
                    type="text" 
                    name="storeName"
                    value={generalSettings.storeName}
                    onChange={handleGeneralSettingsChange}
                    onFocus={() => handleFieldFocus('storeName')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'storeName' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Tax Rate (%)</label>
                  <input 
                    type="text" 
                    name="taxRate"
                    value={generalSettings.taxRate}
                    onChange={handleGeneralSettingsChange}
                    onFocus={() => handleFieldFocus('taxRate')}
                    className={`w-full bg-pos-bg-primary border ${activeField === 'taxRate' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Currency</label>
                  <select 
                    name="currency"
                    value={generalSettings.currency}
                    onChange={handleGeneralSettingsChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-pos-text-muted mb-1">Language</label>
                  <select 
                    name="language"
                    value={generalSettings.language}
                    onChange={handleGeneralSettingsChange}
                    className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="nl">Nederlands</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              {/* Keypad Section for General Tab */}
              {showKeypad && (
                <div style={{marginTop:"-1rem"}}>
                  <div className="mb-1 text-sm text-pos-text-muted text-center">
                    Active Field: <span className="text-pos-text-primary font-medium">{activeField || 'None'}</span>
                  </div>
                  <KeypadNumpad
                    onInput={handleKeypadInput}
                    onEnter={handleKeypadEnter}
                    onBackspace={handleKeypadBackspace}
                    onClear={handleKeypadClear}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'display' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-pos-text-muted mb-1">Theme</label>
                <select defaultValue="dark" className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-pos-text-muted mb-1">Font Size</label>
                <select defaultValue="medium" className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="show-images" defaultChecked className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="show-images" className="text-pos-text-primary text-sm">Show Product Images</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="compact-mode" className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="compact-mode" className="text-pos-text-primary text-sm">Compact Mode</label>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-pos-text-primary text-base font-semibold">Manage Printers</h3>
                <button 
                  onClick={() => {
                    setShowAddPrinter(true);
                    setEditingPrinter(null);
                    setPrinterForm({ name: '', type: 'EPSON', connection_string: 'tcp://192.168.1.100:9100', is_main: false });
                  }}
                  className="btn-primary py-1.5"
                >
                  + Add Printer
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-48">Printer Name</th>
                      <th className="w-32">Type</th>
                      <th className="w-64">Connection String</th>
                      <th className="w-32 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-pos-text-muted">
                          No printers configured. Click "Add Printer" to get started.
                        </td>
                      </tr>
                    ) : (
                      printers.map(printer => (
                        <tr key={printer.id} className={printer.is_main ? 'bg-blue-900 bg-opacity-20' : ''}>
                          <td className="font-medium text-pos-text-primary">
                            <div className="flex items-center gap-2">
                              {printer.name}
                              {printer.is_main === 1 && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Main</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              printer.type === 'serial'
                                ? 'bg-pos-info bg-opacity-20 text-pos-info'
                                : printer.type === 'windows'
                                  ? 'bg-purple-500 bg-opacity-20 text-purple-400'
                                  : 'bg-pos-warning bg-opacity-20 text-pos-warning'
                            }`}>
                              {printer.type.charAt(0).toUpperCase() + printer.type.slice(1)}
                            </span>
                          </td>
                          <td className="text-pos-text-secondary font-mono text-sm">
                            {printer.connection_string || '-'}
                          </td>
                          <td>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleTestPrinter(printer.id)}
                                disabled={testingPrinter === printer.id}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Test printer"
                              >
                                {testingPrinter === printer.id ? '⏳ Testing...' : '🖨️ Test'}
                              </button>
                              <IconButton
                                icon="✏️"
                                className="edit"
                                onClick={() => handleEditPrinter(printer)}
                                title="Edit printer"
                              />
                              <IconButton
                                icon="🗑️"
                                className="delete"
                                onClick={() => openDeleteConfirmation(printer)}
                                title="Delete printer"
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {showAddPrinter && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => {
                  setShowAddPrinter(false);
                  setPrinterFormErrors({});
                  setActiveField(null);
                }}>
                  <div className="bg-pos-bg-tertiary rounded-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-pos-bg-tertiary border-b border-pos-border-secondary px-4 py-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-pos-text-primary">
                        {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
                      </h3>
                      <button 
                        onClick={() => {
                          setShowAddPrinter(false);
                          setPrinterFormErrors({});
                          setActiveField(null);
                        }}
                        className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="px-4 py-2" style={{maxWidth:"30rem"}}>
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Printer Name <span className="text-pos-error">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="name"
                            value={printerForm.name}
                            onChange={handlePrinterFormChange}
                            onFocus={() => handleFieldFocus('name')}
                            className={`w-full bg-pos-bg-primary border ${printerFormErrors.name ? 'border-pos-error' : activeField === 'name' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                            placeholder="e.g., Kitchen Printer"
                          />
                          {printerFormErrors.name && (
                            <p className="text-pos-error text-xs mt-1">{printerFormErrors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Printer Type <span className="text-pos-error">*</span>
                          </label>
                          <select 
                            name="type"
                            value={printerForm.type}
                            onChange={handlePrinterFormChange}
                            className={`w-full bg-pos-bg-primary border ${printerFormErrors.type ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                          >
                            <option value="EPSON">EPSON </option>
                            <option value="STAR">STAR Micronics</option>
                            <option value="TANCA">TANCA</option>
                            <option value="DARUMA">DARUMA</option>
                            <option value="BROTHER">BROTHER</option>
                          </select>
                          {printerFormErrors.type && (
                            <p className="text-pos-error text-xs mt-1">{printerFormErrors.type}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-pos-text-muted mb-1">
                            Connection String <span className="text-pos-error">*</span>
                          </label>
                          <input 
                            type="text" 
                            name="connection_string"
                            value={printerForm.connection_string}
                            onChange={handlePrinterFormChange}
                            onFocus={() => handleFieldFocus('connection_string')}
                            className={`w-full bg-pos-bg-primary border ${activeField === 'connection_string' ? 'border-pos-info' : 'border-pos-border-secondary'} text-pos-text-primary px-2 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors`}
                            placeholder="tcp://192.168.1.100:9100"
                          />
                        </div>
                      </div>
                      <div className="text-pos-text-muted text-xs space-y-1">
                        <p className="font-medium">Connection Examples:</p>
                        {getConnectionExamples().map((example, index) => (
                          <p key={index}><strong>{example.type}:</strong> {example.example}</p>
                        ))}
                      </div>

                      {/* Main Printer Checkbox */}
                      <div className="px-4 py-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={printerForm.is_main}
                            onChange={(e) => setPrinterForm({ ...printerForm, is_main: e.target.checked })}
                            className="w-5 h-5 mt-0.5 text-blue-600 bg-pos-bg-primary border-blue-500 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div>
                            <span className="text-pos-text-primary font-medium text-sm">Set as Main Printer</span>
                            <p className="text-pos-text-muted text-xs mt-1">
                              Only one printer can be main. Setting this will unmark the current main printer.
                            </p>
                          </div>
                        </label>
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
                    
                    <div className="bg-pos-bg-tertiary border-t border-pos-border-secondary px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
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
                            setShowAddPrinter(false);
                            setPrinterFormErrors({});
                            setActiveField(null);
                          }}
                          className="px-4 py-1.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={editingPrinter ? handleUpdatePrinter : handleAddPrinter}
                          className="px-5 py-1.5 bg-pos-bg-primary text-pos-text-primary text-sm font-medium hover:bg-pos-interactive-primary transition-colors shadow-lg"
                        >
                          {editingPrinter ? 'Update' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <PaymentTerminalManager />
          )}



          {activeTab === 'permissions' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="mb-4">
                <p className="text-pos-text-muted text-sm">Manage user permissions for Admin Panel, Settings, and Reports access</p>
              </div>

              {/* Role Permissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-pos-bg-tertiary border-b-2 border-pos-border-primary">
                      <th className="text-left py-3 px-4 text-pos-text-primary text-sm font-semibold">Role</th>
                      <th className="text-center py-3 px-4 text-pos-text-primary text-sm font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <span>🔌</span>
                          <span>Admin Panel</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-pos-text-primary text-sm font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <span>⚙️</span>
                          <span>Settings</span>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 text-pos-text-primary text-sm font-semibold">
                        <div className="flex items-center justify-center gap-1">
                          <span>📊</span>
                          <span>Reports</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Super Admin Role */}
                    <tr className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500 bg-opacity-20 text-purple-400">
                          Super Admin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-pos-text-muted text-xs">Always</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-pos-text-muted text-xs">Always</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-pos-text-muted text-xs">Always</span>
                        </div>
                      </td>
                    </tr>

                    {/* Admin Role */}
                    <tr className="border-b border-pos-border-secondary hover:bg-pos-bg-tertiary transition-colors bg-pos-bg-secondary">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pos-error bg-opacity-20 text-pos-error">
                          Admin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('Admin', 'admin')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['Admin'].admin
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['Admin'].admin ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('Admin', 'settings')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['Admin'].settings
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['Admin'].settings ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('Admin', 'reports')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['Admin'].reports
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['Admin'].reports ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                    </tr>

                    {/* User Role */}
                    <tr className="hover:bg-pos-bg-tertiary transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pos-info bg-opacity-20 text-pos-light">
                          User
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('User', 'admin')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['User'].admin
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['User'].admin ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('User', 'settings')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['User'].settings
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['User'].settings ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleRolePermission('User', 'reports')}
                          className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
                            rolePermissions['User'].reports
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 hover:bg-opacity-30'
                              : 'bg-pos-bg-tertiary text-pos-text-muted border border-pos-border-secondary hover:border-pos-info'
                          }`}
                        >
                          {rolePermissions['User'].reports ? '✓ Assigned' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Toggle Button - Only show for General tab */}
        {activeTab === 'general' && (
          <div className="px-4 py-2 border-t border-pos-border-primary flex justify-center">
            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${showKeypad
                ? 'bg-pos-info text-white'
                : 'bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary hover:bg-pos-interactive-primary'
                }`}>
              {showKeypad ? 'Hide Keyboard' : 'Show Keyboard'} ⌨️
            </button>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeletePrinter}
        title="Delete Printer"
        message={`Are you sure you want to delete "${deleteConfirmation.printerName}"? This action cannot be undone.`}
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

export default SettingsModal;