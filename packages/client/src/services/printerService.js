const API_URL = 'http://localhost:5000/api';

export const printerService = {
  // Get all printers
  getAllPrinters: async () => {
    const response = await fetch(`${API_URL}/printers`);
    if (!response.ok) throw new Error('Failed to fetch printers');
    return response.json();
  },

  // Get printer by ID
  getPrinterById: async (id) => {
    const response = await fetch(`${API_URL}/printers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch printer');
    return response.json();
  },

  // Create printer
  createPrinter: async (printerData) => {
    const response = await fetch(`${API_URL}/printers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printerData)
    });
    if (!response.ok) throw new Error('Failed to create printer');
    return response.json();
  },

  // Update printer
  updatePrinter: async (id, printerData) => {
    const response = await fetch(`${API_URL}/printers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printerData)
    });
    if (!response.ok) throw new Error('Failed to update printer');
    return response.json();
  },

  // Delete printer
  deletePrinter: async (id) => {
    const response = await fetch(`${API_URL}/printers/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete printer');
    return response.json();
  },

  // Test printer
  testPrinter: async (id) => {
    const response = await fetch(`${API_URL}/printers/${id}/test`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to test printer');
    return response.json();
  },

  // Print receipt
  printReceipt: async (printerId, orderId) => {
    const response = await fetch(`${API_URL}/printers/print-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerId, orderId })
    });
    if (!response.ok) throw new Error('Failed to print receipt');
    return response.json();
  },

  // Print kitchen order
  printKitchenOrder: async (printerId, orderId) => {
    const response = await fetch(`${API_URL}/printers/print-kitchen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerId, orderId })
    });
    if (!response.ok) throw new Error('Failed to print kitchen order');
    return response.json();
  },

  // Print custom text
  printCustom: async (printerId, text) => {
    const response = await fetch(`${API_URL}/printers/print-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerId, text })
    });
    if (!response.ok) throw new Error('Failed to print custom text');
    return response.json();
  }
};
