/**
 * Mosque-specific API service
 * Contains all API methods related to mosque functionality
 */
class MosqueApiService {
  static baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  static async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Mosque API request failed:', error);
      throw error;
    }
  }

  // Mosque Payment methods
  static async getMosquePayments() {
    return this.request('/mosque/payments');
  }

  static async getMosquePaymentById(id) {
    return this.request(`/mosque/payments/${id}`);
  }

  static async getMosquePaymentByTransactionId(transactionId) {
    return this.request(`/mosque/payments/transaction/${transactionId}`);
  }

  static async getMosquePaymentsByMemberId(memberId) {
    return this.request(`/mosque/payments/member/${memberId}`);
  }

  static async createMosquePayment(paymentData) {
    return this.request('/mosque/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async updateMosquePayment(id, paymentData) {
    return this.request(`/mosque/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  static async deleteMosquePayment(id) {
    return this.request(`/mosque/payments/${id}`, {
      method: 'DELETE',
    });
  }

  static async getMosquePaymentStatsByType(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/mosque/payments/stats/by-type?${params.toString()}`);
  }

  static async getMosquePaymentStatsByMethod(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/mosque/payments/stats/by-method?${params.toString()}`);
  }
}

export default MosqueApiService;