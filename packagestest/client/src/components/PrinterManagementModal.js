import React, { useState, useEffect } from 'react';
import { printerService } from '../services/printerService';

const PrinterManagementModal = ({ isOpen, onClose }) => {
  const [printers, setPrinters] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EPSON',
    connection_string: 'tcp://localhost:9100',
    is_main: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isOpen) {
      fetchPrinters();
    }
  }, [isOpen]);

  const fetchPrinters = async () => {
    try {
      const response = await printerService.getAllPrinters();
      setPrinters(response.data || []);
    } catch (error) {
      showMessage('error', 'Failed to load printers');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPrinter) {
        await printerService.updatePrinter(editingPrinter.id, formData);
        showMessage('success', 'Printer updated successfully');
      } else {
        await printerService.createPrinter(formData);
        showMessage('success', 'Printer created successfully');
      }
      
      fetchPrinters();
      resetForm();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (printer) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      type: printer.type,
      connection_string: printer.connection_string,
      is_main: printer.is_main === 1 || printer.is_main === true
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this printer?')) return;

    try {
      await printerService.deletePrinter(id);
      showMessage('success', 'Printer deleted successfully');
      fetchPrinters();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleTest = async (id) => {
    setLoading(true);
    try {
      const response = await printerService.testPrinter(id);
      if (response.success) {
        showMessage('success', 'Test print sent successfully');
      } else {
        showMessage('error', response.error || 'Test print failed');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'EPSON',
      connection_string: 'tcp://localhost:9100',
      is_main: false
    });
    setEditingPrinter(null);
    setIsFormOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Printer Management</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!isFormOpen ? (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add New Printer
                </button>
              </div>

              {/* Printers List */}
              <div className="space-y-4">
                {printers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No printers configured</p>
                ) : (
                  printers.map(printer => (
                    <div key={printer.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${printer.is_main ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{printer.name}</h3>
                            {printer.is_main === 1 && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Main Printer</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Type: {printer.type}</p>
                          <p className="text-sm text-gray-600">Connection: {printer.connection_string}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTest(printer.id)}
                            disabled={loading}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            Test
                          </button>
                          <button
                            onClick={() => handleEdit(printer)}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(printer.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Printer Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                {editingPrinter ? 'Edit Printer' : 'Add New Printer'}
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">Printer Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Printer Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="EPSON">EPSON</option>
                  <option value="STAR">STAR</option>
                  <option value="TANCA">TANCA</option>
                  <option value="DARUMA">DARUMA</option>
                  <option value="BROTHER">BROTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Connection String</label>
                <input
                  type="text"
                  value={formData.connection_string}
                  onChange={(e) => setFormData({ ...formData, connection_string: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="tcp://192.168.1.100:9100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: tcp://192.168.1.100:9100 or \\.\COM3 (Windows) or /dev/usb/lp0 (Linux)
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                <input
                  type="checkbox"
                  id="is_main"
                  checked={formData.is_main}
                  onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_main" className="text-sm font-medium cursor-pointer">
                  Set as Main Printer
                  <span className="block text-xs text-gray-600 font-normal">
                    Only one printer can be main. Setting this will unmark the current main printer.
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingPrinter ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrinterManagementModal;
