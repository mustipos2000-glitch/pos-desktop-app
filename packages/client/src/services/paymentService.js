const API_URL = 'http://localhost:5000/api';

// Helper function to handle fetch requests with better error handling
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
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
      throw new Error('Request timeout - payment terminal may be disconnected');
    }
    throw error;
  }
};

export const paymentService = {
  // Process Cashmatic payment
  processCashmaticPayment: async (paymentData) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/cashmatic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Return the error from server response
        return { success: false, message: data.error || data.message || 'Failed to process Cashmatic payment' };
      }
      
      return data;
    } catch (error) {
      console.error('Payment service error - processCashmaticPayment:', error);
      return { success: false, message: error.message };
    }
  },

  // Process Bancontact payment
  processBancontactPayment: async (paymentData) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/bancontact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Return the error from server response
        return { success: false, message: data.error || data.message || 'Failed to process Bancontact payment' };
      }
      
      return data;
    } catch (error) {
      console.error('Payment service error - processBancontactPayment:', error);
      return { success: false, message: error.message };
    }
  },

  // Get payment status
  getPaymentStatus: async (transactionId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/status/${transactionId}`);
      if (!response.ok) throw new Error('Failed to get payment status');
      return response.json();
    } catch (error) {
      console.error('Payment service error - getPaymentStatus:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel payment
  cancelPayment: async (transactionId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/cancel/${transactionId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to cancel payment');
      return response.json();
    } catch (error) {
      console.error('Payment service error - cancelPayment:', error);
      return { success: false, error: error.message };
    }
  }
};
