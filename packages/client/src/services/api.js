const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('API request:', url, config);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Try to parse error details from response body
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
        
        // Create error with detailed information
        const error = new Error(errorData.error || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.details = errorData.details;
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Category methods
  static async getCategories(filters = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.is_visible !== undefined) {
      queryParams.append('is_visible', filters.is_visible);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/categories?${queryString}` : '/categories';
    
    return this.request(endpoint);
  }

  static async getCategoryById(id) {
    return this.request(`/categories/${id}`);
  }

  static async createCategory(categoryData) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  static async updateCategory(id, categoryData) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  static async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Product methods
  static async getProducts() {
    return this.request('/products');
  }

  static async getProductById(id) {
    return this.request(`/products/${id}`);
  }

  static async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  static async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  static async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Sub-Product methods
  static async getSubProducts() {
    return this.request('/sub-products');
  }

  static async getSubProductsByProductId(productId) {
    return this.request(`/products/${productId}/sub-products`);
  }

  static async getSubProductById(id) {
    return this.request(`/sub-products/${id}`);
  }

  static async createSubProduct(subProductData) {
    return this.request('/sub-products', {
      method: 'POST',
      body: JSON.stringify(subProductData),
    });
  }

  static async updateSubProduct(id, subProductData) {
    return this.request(`/sub-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subProductData),
    });
  }

  static async deleteSubProduct(id) {
    return this.request(`/sub-products/${id}`, {
      method: 'DELETE',
    });
  }

  // Order methods
  static async getOrders() {
    return this.request('/orders');
  }

  static async getOrderById(id) {
    return this.request(`/orders/${id}`);
  }

  static async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  static async updateOrder(id, orderData) {
    return this.request(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  static async deleteOrder(id) {
    return this.request(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  static async getOrderByTableId(tableId) {
    return this.request(`/orders/table/${tableId}`);
  }

  static async getHoldOrders() {
    return this.request('/orders/hold');
  }

  // Room methods
  static async getRooms() {
    return this.request('/rooms');
  }

  static async getRoomById(id) {
    return this.request(`/rooms/${id}`);
  }

  static async createRoom(roomData) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  static async updateRoom(id, roomData) {
    return this.request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  }

  static async deleteRoom(id) {
    return this.request(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // PrTable methods
  static async getPrTables() {
    return this.request('/pr-tables');
  }

  static async getPrTableById(id) {
    return this.request(`/pr-tables/${id}`);
  }

  static async createPrTable(tableData) {
    return this.request('/pr-tables', {
      method: 'POST',
      body: JSON.stringify(tableData),
    });
  }

  static async updatePrTable(id, tableData) {
    return this.request(`/pr-tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tableData),
    });
  }

  static async deletePrTable(id) {
    return this.request(`/pr-tables/${id}`, {
      method: 'DELETE',
    });
  }

  // Member methods
  static async getMembers() {
    return this.request('/members');
  }

  static async searchMembers(searchTerm) {
    return this.request(`/members/search?q=${encodeURIComponent(searchTerm)}`);
  }

  static async getMemberById(id) {
    return this.request(`/members/${id}`);
  }

  static async createMember(memberData) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  }

  static async updateMember(id, memberData) {
    return this.request(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  }

  static async deleteMember(id) {
    return this.request(`/members/${id}`, {
      method: 'DELETE',
    });
  }

  // Cashmatic methods
  static async startCashmaticPayment(data) {
    console.log('startCashmaticPayment data:', data);
    return this.request('/cashmatic/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getCashmaticStatus(sessionId) {
    return this.request(`/cashmatic/status/${sessionId}`);
  }

  // Payworld methods
  static async startPayworldPayment(data) {
    console.log('startPayworldPayment data:', data);
    return this.request('/payworld/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getPayworldStatus(sessionId) {
    return this.request(`/payworld/status/${sessionId}`);
  }

  static async cancelPayworldPayment(sessionId) {
    return this.request(`/payworld/cancel/${sessionId}`, {
      method: 'POST',
    });
  }

  // Viva methods
  static async startVivaPayment(data) {
    console.log('startVivaPayment data:', data);
    return this.request('/viva/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payment Terminal methods
  static async getPaymentTerminals() {
    return this.request('/payment-terminals');
  }

  static async getPaymentTerminalById(id) {
    return this.request(`/payment-terminals/${id}`);
  }

  static async createPaymentTerminal(terminalData) {
    return this.request('/payment-terminals', {
      method: 'POST',
      body: JSON.stringify(terminalData),
    });
  }

  static async updatePaymentTerminal(id, terminalData) {
    return this.request(`/payment-terminals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(terminalData),
    });
  }

  static async deletePaymentTerminal(id) {
    return this.request(`/payment-terminals/${id}`, {
      method: 'DELETE',
    });
  }

  static async testPaymentTerminal(id) {
    return this.request(`/payment-terminals/${id}/test`, {
      method: 'POST',
    });
  }

  // Customer methods
  static async getCustomers() {
    return this.request('/customers');
  }

  static async searchCustomers(searchTerm) {
    return this.request(`/customers/search?q=${encodeURIComponent(searchTerm)}`);
  }

  static async getCustomerById(id) {
    return this.request(`/customers/${id}`);
  }

  static async createCustomer(customerData) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  static async updateCustomer(id, customerData) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  static async deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

// Inventory methods
  static async getInventory() {
    return this.request('/inventory');
  }

   static async AddInventory(ProductData) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(ProductData),
    });
  }

static async adjustInventory(productId, data) {
  return this.request(`/inventory/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

}

export default ApiService;