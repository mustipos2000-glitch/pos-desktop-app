const API_URL = 'http://localhost:5000/api';

// User-friendly error messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to payment machine. Please check your device connection.',
  TIMEOUT: 'Payment request timed out. The terminal may be disconnected or not responding.',
  TERMINAL_NOT_CONFIGURED: 'Payment terminal is not configured. Please check settings.',
  TERMINAL_DISABLED: 'Payment terminal is currently disabled. Please enable it in settings.',
  INVALID_AMOUNT: 'Invalid payment amount. Please check the order total.',
  PAYMENT_FAILED: 'Payment was declined or failed. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again or contact support.'
};

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
      throw new Error(ERROR_MESSAGES.TIMEOUT);
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    throw error;
  }
};

// Helper to parse and format error messages
const formatErrorMessage = (error, defaultMessage) => {
  if (typeof error === 'string') {
    // Check for specific error patterns and return user-friendly messages
    if (error.includes('not configured')) return ERROR_MESSAGES.TERMINAL_NOT_CONFIGURED;
    if (error.includes('disabled')) return ERROR_MESSAGES.TERMINAL_DISABLED;
    if (error.includes('timeout') || error.includes('not responding')) return ERROR_MESSAGES.TIMEOUT;
    if (error.includes('network') || error.includes('connection')) return ERROR_MESSAGES.NETWORK_ERROR;
    return error;
  }
  return defaultMessage;
};

export const paymentService = {
  // Process Cashmatic payment
  
  processCashmaticPayment: async (paymentData) => {
    console.log("called the payemnt Service ", paymentData);
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/cashmatic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = formatErrorMessage(
          data.error || data.message,
          ERROR_MESSAGES.PAYMENT_FAILED
        );
        return { success: false, message: errorMessage };
      }
      
      return data;
    } catch (error) {
      console.error('Payment service error - processCashmaticPayment:', error);
      const errorMessage = formatErrorMessage(error.message, ERROR_MESSAGES.UNKNOWN_ERROR);
      return { success: false, message: errorMessage };
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
        const errorMessage = formatErrorMessage(
          data.error || data.message,
          ERROR_MESSAGES.PAYMENT_FAILED
        );
        return { success: false, message: errorMessage };
      }
      
      return data;
    } catch (error) {
      console.error('Payment service error - processBancontactPayment:', error);
      const errorMessage = formatErrorMessage(error.message, ERROR_MESSAGES.UNKNOWN_ERROR);
      return { success: false, message: errorMessage };
    }
  },

  // Get payment status
  getPaymentStatus: async (transactionId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/status/${transactionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: formatErrorMessage(data.error || data.message, 'Failed to get payment status')
        };
      }
      
      return data;
    } catch (error) {
      console.error('Payment service error - getPaymentStatus:', error);
      return { 
        success: false, 
        message: formatErrorMessage(error.message, 'Unable to check payment status')
      };
    }
  },

  // Cancel payment
  cancelPayment: async (transactionId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/payments/cancel/${transactionId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { 
          success: false, 
          message: formatErrorMessage(data.error || data.message, 'Failed to cancel payment')
        };
      }
      
      return data;
    } catch (error) {
      console.error('Payment service error - cancelPayment:', error);
      return { 
        success: false, 
        message: formatErrorMessage(error.message, 'Unable to cancel payment')
      };
    }
  }
};
