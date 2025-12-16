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

  static async getHoldOrders(employeeId = null) {
    const endpoint = employeeId ? `/orders/hold?employee_id=${employeeId}` : '/orders/hold';
    return this.request(endpoint);
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

  // ---------- CASHMATIC ----------
  static async startCashmaticPayment(payload) {
    console.log("startCashmaticPayment payload:", payload);
    return this.request("/cashmatic/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async getCashmaticStatus(sessionId) {
    return this.request(`/cashmatic/status/${sessionId}`);
  }

  static async cancelCashmatic(sessionId) {
    return this.request(`/cashmatic/cancel/${sessionId}`, {
      method: "POST",
    });
  }

  // ---------- PAYWORLD ----------
  // start betaling → geeft sessionId
  static async startPayworldPayment(payload) {
    console.log("startPayworldPayment payload:", payload);
    const res = await this.request("/payworld/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("startPayworldPayment res:", res);
    return res;
  }

  // live status
  static async getPayworldStatus(sessionId) {
    console.log("getPayworldStatus sessionId:", sessionId);
    const res = await this.request(`/payworld/status/${sessionId}`);
    console.log("getPayworldStatus res:", res);
    return res;
  }

  // annuleren
  static async cancelPayworldPayment(sessionId) {
    return this.request(`/payworld/cancel/${sessionId}`, {
      method: "POST",
    });
  }

  // config (voor Settings: IP/poort/posId/currency)
  static async getPayworldConfig() {
    return this.request("/payworld/config");
  }

  static async savePayworldConfig(config) {
    return this.request("/payworld/config", {
      method: "POST",
      body: JSON.stringify(config),
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

  // Printer methods
  static async getPrinters() {
    return this.request('/printers');
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

// delete inventory api call if you need it
  static async deleteInventory(productId) {
    return this.request(`/inventory/${productId}`, {
      method: 'DELETE',
    });
  }


  // Report methods
  static async getXReport(date) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    return this.request(`/reports/x-report?${params.toString()}`);
  }

  static async getZReport(date) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    return this.request(`/reports/z-report?${params.toString()}`);
  }

  static async getReportHistory(limit = 30) {
    return this.request(`/reports/history?limit=${limit}`);
  }

  // Cash Drawer methods
  static async getCashDrawers() {
    return this.request('/cash-drawers');
  }

  static async getActiveCashDrawer() {
    return this.request('/cash-drawers/active');
  }

  static async getCashDrawerById(id) {
    return this.request(`/cash-drawers/${id}`);
  }

  static async createCashDrawer(drawerData) {
    return this.request('/cash-drawers', {
      method: 'POST',
      body: JSON.stringify(drawerData),
    });
  }

  static async updateCashDrawer(id, drawerData) {
    return this.request(`/cash-drawers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(drawerData),
    });
  }

  static async deleteCashDrawer(id) {
    return this.request(`/cash-drawers/${id}`, {
      method: 'DELETE',
    });
  }

  static async setActiveCashDrawer(id) {
    return this.request(`/cash-drawers/${id}/set-active`, {
      method: 'POST',
    });
  }

  static async testCashDrawer(id) {
    return this.request(`/cash-drawers/${id}/test`, {
      method: 'POST',
    });
  }

  static async openCashDrawer() {
    return this.request('/printers/open-drawer', {
      method: 'POST',
      body: JSON.stringify({})  // Uses main printer
    });
  }

}

export default ApiService;