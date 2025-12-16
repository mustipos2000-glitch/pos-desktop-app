const API_URL = 'http://localhost:5000/api';

// Helper function to handle fetch requests with better error handling
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - printer may be disconnected');
    }
    throw error;
  }
};

export const printerService = {
  // Get all printers
  getAllPrinters: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers`);
      if (!response.ok) throw new Error('Failed to fetch printers');
      return response.json();
    } catch (error) {
      console.error('Printer service error - getAllPrinters:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return { data: [] };
    }
  },

  // Get printer by ID
  getPrinterById: async (id) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch printer');
      return response.json();
    } catch (error) {
      console.error('Printer service error - getPrinterById:', error);
      return null;
    }
  },

  // Create printer
  createPrinter: async (printerData) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerData)
      });
      if (!response.ok) throw new Error('Failed to create printer');
      return response.json();
    } catch (error) {
      console.error('Printer service error - createPrinter:', error);
      throw error;
    }
  },

  // Update printer
  updatePrinter: async (id, printerData) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printerData)
      });
      if (!response.ok) throw new Error('Failed to update printer');
      return response.json();
    } catch (error) {
      console.error('Printer service error - updatePrinter:', error);
      throw error;
    }
  },

  // Delete printer
  deletePrinter: async (id) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete printer');
      return response.json();
    } catch (error) {
      console.error('Printer service error - deletePrinter:', error);
      throw error;
    }
  },

  // Test printer
  testPrinter: async (id) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/${id}/test`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to test printer');
      return response.json();
    } catch (error) {
      console.error('Printer service error - testPrinter:', error);
      // Return structured error instead of throwing
      return { success: false, error: error.message };
    }
  },

  // Print receipt
  printReceipt: async (printerId, orderId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/print-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, orderId })
      });
      if (!response.ok) throw new Error('Failed to print receipt');
      
      const result = await response.json();
      
      // If backend returns success: false, throw error to trigger fallback
      if (!result.success) {
        throw new Error(result.error || result.message || 'Print failed');
      }
      
      return result;
    } catch (error) {
      console.error('Printer service error - printReceipt:', error);
      // Re-throw error so OrderPanel can catch it and trigger window.print()
      throw error;
    }
  },

  // Print kitchen order
  printKitchenOrder: async (printerId, orderId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/print-kitchen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, orderId })
      });
      if (!response.ok) throw new Error('Failed to print kitchen order');
      
      const result = await response.json();
      
      // If backend returns success: false, throw error
      if (!result.success) {
        throw new Error(result.error || result.message || 'Print failed');
      }
      
      return result;
    } catch (error) {
      console.error('Printer service error - printKitchenOrder:', error);
      // Re-throw error
      throw error;
    }
  },

  // Print kitchen order to multiple printers (batch)
  printKitchenOrderBatch: async (printerIds, orderId) => {
    const response = await fetch(`${API_URL}/printers/print-kitchen-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printerIds, orderId })
    });
    if (!response.ok) throw new Error('Failed to print kitchen order batch');
    return response.json();
  },

  // Print custom text
  printCustom: async (printerId, text) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/printers/print-custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId, text })
      });
      if (!response.ok) throw new Error('Failed to print custom text');
      return response.json();
    } catch (error) {
      console.error('Printer service error - printCustom:', error);
      // Return structured error instead of throwing
      return { success: false, error: error.message };
    }
  }
};