/**
 * CashmaticService - Real implementation for Cashmatic payment machine
 * 
 * Based on Cashmatic API documentation:
 * - HTTPS REST API on port 50301
 * - Bearer token authentication
 * - Amount in cents
 */

const https = require('https');

// Store active sessions per instance
const activeSessions = new Map();

class CashmaticService {
  constructor(config = null) {
    this.token = null;
    this.tokenExpiry = null;
    this.config = config;
  }

  /**
   * Set configuration from terminal database record
   * @param {Object} terminal - Terminal record from database
   */
  setConfig(terminal) {
    if (!terminal || !terminal.connection_string) {
      throw new Error('Terminal configuration is required');
    }
    
    try {
      // Parse connection_string JSON stored in database
      const config = typeof terminal.connection_string === 'string' 
        ? JSON.parse(terminal.connection_string)
        : terminal.connection_string;
      
      // Validate required fields
      if (!config.ip || !config.username || !config.password) {
        throw new Error('Invalid Cashmatic configuration: missing ip, username, or password');
      }
      
      this.config = {
        ip: config.ip,
        username: config.username,
        password: config.password,
      };
      
      // Reset token when config changes
      this.token = null;
      this.tokenExpiry = null;
      
      return this.config;
    } catch (error) {
      throw new Error(`Failed to parse Cashmatic configuration: ${error.message}`);
    }
  }

  /**
   * Get configuration
   */
  getConfig() {
    if (!this.config) {
      throw new Error('Cashmatic configuration not set. Call setConfig() first or pass config to constructor.');
    }
    return this.config;
  }

  /**
   * Make HTTPS request to Cashmatic device
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {object} body - Request body
   * @returns {Promise<object>} Response data
   */
  async request(endpoint, method = 'POST', body = null) {
    const config = this.getConfig();
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: config.ip,
        port: 50301,
        path: `/api${endpoint}`,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Cashmatic uses self-signed certificates
        rejectUnauthorized: false,
        timeout: 30000,
      };

      // Add Bearer token if we have one
      if (this.token) {
        options.headers['Authorization'] = `Bearer ${this.token}`;
      }

      console.log(`📡 Cashmatic Request: ${method} https://${config.ip}:50301/api${endpoint}`);

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            console.log(`✅ Cashmatic Response:`, jsonData);
            resolve(jsonData);
          } catch (error) {
            console.log(`📄 Cashmatic Raw Response:`, data);
            resolve({ raw: data });
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Cashmatic Error:`, error.message);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout - Cashmatic not responding'));
      });

      if (body) {
        const bodyStr = JSON.stringify(body);
        console.log(`📤 Request Body:`, bodyStr);
        req.write(bodyStr);
      }

      req.end();
    });
  }

  /**
   * Login to Cashmatic and get Bearer token
   * @returns {Promise<string>} Bearer token
   */
  async login() {
    const config = this.getConfig();
    
    // Check if we have a valid token (tokens expire in 15 minutes)
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    console.log(`🔐 Logging into Cashmatic at ${config.ip}...`);

    try {
      const response = await this.request('/user/Login', 'POST', {
        username: config.username,
        password: config.password,
      });

      if (response.error || response.errorCode) {
        throw new Error(response.message || response.error || 'Login failed');
      }

      // Store token - API returns token directly or in a field
      this.token = response.token || response.data?.token || response;
      // Set expiry to 14 minutes from now (tokens expire in 15 min)
      this.tokenExpiry = Date.now() + (14 * 60 * 1000);

      console.log(`✅ Cashmatic login successful`);
      return this.token;
    } catch (error) {
      console.error(`❌ Cashmatic login failed:`, error.message);
      throw new Error(`Cashmatic login failed: ${error.message}`);
    }
  }

  /**
   * Renew the authentication token
   * @returns {Promise<string>} New Bearer token
   */
  async renewToken() {
    try {
      const response = await this.request('/user/RenewToken', 'POST');
      
      if (response.error) {
        throw new Error(response.message || 'Token renewal failed');
      }

      this.token = response.token || response.data?.token || response;
      this.tokenExpiry = Date.now() + (14 * 60 * 1000);

      return this.token;
    } catch (error) {
      // If renewal fails, try full login
      return this.login();
    }
  }

  /**
   * Get device information
   * @returns {Promise<object>} Device info
   */
  async getDeviceInfo() {
    await this.login();
    return this.request('/device/GetDeviceInfo', 'POST');
  }

  /**
   * Get all denomination levels
   * @returns {Promise<object>} Levels info
   */
  async getAllLevels() {
    await this.login();
    return this.request('/device/AllLevels', 'POST');
  }

  /**
   * Start a payment transaction
   * @param {number} amountInCents - Amount in cents
   * @param {string} reference - Transaction reference
   * @param {string} reason - Transaction reason
   * @returns {Promise<object>} Transaction info
   */
  async startPayment(amountInCents, reference = '', reason = '') {
    await this.login();

    console.log(`💰 Starting Cashmatic payment: ${amountInCents} cents`);

    const response = await this.request('/transaction/StartPayment', 'POST', {
      amount: amountInCents,
      reason: reason || 'POS Payment',
      reference: reference || `REF-${Date.now()}`,
      queueAllowed: true,
    });

    if (response.error || response.errorCode) {
      throw new Error(response.message || response.error || 'Failed to start payment');
    }

    return response;
  }

  /**
   * Get active transaction status
   * @returns {Promise<object>} Transaction status
   */
  async getActiveTransaction() {
    await this.login();
    return this.request('/device/ActiveTransaction', 'POST');
  }

  /**
   * Get last transaction
   * @returns {Promise<object>} Last transaction info
   */
  async getLastTransaction() {
    await this.login();
    return this.request('/device/LastTransaction', 'POST');
  }

  /**
   * Cancel current payment
   * @returns {Promise<object>} Cancellation result
   */
  async cancelPayment() {
    await this.login();
    
    console.log(`🚫 Cancelling Cashmatic payment...`);
    
    const response = await this.request('/transaction/CancelPayment', 'POST');

    if (response.error || response.errorCode) {
      throw new Error(response.message || response.error || 'Failed to cancel payment');
    }

    return response;
  }

  /**
   * Commit/confirm the payment
   * @returns {Promise<object>} Commit result
   */
  async commitPayment() {
    await this.login();
    
    console.log(`✅ Committing Cashmatic payment...`);
    
    const response = await this.request('/transaction/CommitPayment', 'POST');

    if (response.error || response.errorCode) {
      throw new Error(response.message || response.error || 'Failed to commit payment');
    }

    return response;
  }

  /**
   * Test connection to Cashmatic device
   * @returns {Promise<object>} Test result
   */
  async testConnection() {
    try {
      console.log(`🧪 Testing Cashmatic connection...`);
      
      // Try to login first
      await this.login();
      
      // Then try to get device info
      const deviceInfo = await this.getDeviceInfo();
      
      return {
        success: true,
        message: 'Cashmatic connection successful',
        deviceInfo: {
          name: deviceInfo.deviceName,
          model: deviceInfo.model,
          serialNumber: deviceInfo.serialNumber,
          status: deviceInfo.statusMessage,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Cashmatic connection failed: ${error.message}`,
      };
    }
  }

  // ==================== Session Management ====================

  /**
   * Create a new payment session
   * @param {number} amountInCents - Amount in cents
   * @returns {Promise<object>} Session info
   */
  async createSession(amountInCents) {
    const sessionId = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Start the payment on the device
      await this.startPayment(amountInCents);

      // Store session info with instance reference
      const sessionKey = `${this.config?.ip || 'default'}-${sessionId}`;
      const session = {
        id: sessionId,
        amount: amountInCents,
        state: 'IN_PROGRESS',
        startTime: new Date().toISOString(),
        insertedAmount: 0,
        dispensedAmount: 0,
        notDispensedAmount: 0,
        instance: this,
      };

      activeSessions.set(sessionKey, session);

      return {
        success: true,
        sessionId,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get session status by polling the device
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Session status
   */
  async getSessionStatus(sessionId) {
    // Find session by ID (search through all sessions)
    let session = null;
    let sessionKey = null;
    for (const [key, value] of activeSessions.entries()) {
      if (value.id === sessionId) {
        session = value;
        sessionKey = key;
        break;
      }
    }
    
    if (!session) {
      return {
        success: false,
        message: 'Session not found',
      };
    }

    try {
      // Get active transaction from device
      const txStatus = await this.getActiveTransaction();

      // Map device status to our state
      let state = 'IN_PROGRESS';
      const operation = txStatus.operation || txStatus.data?.operation;
      const status = txStatus.status || txStatus.data?.status;
      
      // Check if transaction is complete
      if (!operation || operation === 'idle') {
        // No active operation, check last transaction
        const lastTx = await this.getLastTransaction();
        const lastEnd = lastTx.end || lastTx.data?.end;
        
        if (lastEnd === 'success' || lastEnd === 'completed') {
          state = 'FINISHED';
        } else if (lastEnd === 'cancelled') {
          state = 'CANCELLED';
        } else if (lastEnd === 'error') {
          state = 'ERROR';
        }
      } else if (status === 'stopping' || status === 'cancelling') {
        state = 'CANCELLING';
      }

      // Get amounts
      const inserted = txStatus.inserted || txStatus.data?.inserted || 0;
      const dispensed = txStatus.dispensed || txStatus.data?.dispensed || 0;
      const notDispensed = txStatus.notDispensed || txStatus.data?.notDispensed || 0;

      // Update session
      session.state = state;
      session.insertedAmount = inserted;
      session.dispensedAmount = dispensed;
      session.notDispensedAmount = notDispensed;

      // Clean up if terminal state
      if (['FINISHED', 'CANCELLED', 'ERROR'].includes(state)) {
        // Keep session for a bit for final status checks
        setTimeout(() => {
          if (sessionKey) {
            activeSessions.delete(sessionKey);
          }
        }, 60000);
      }

      return {
        success: true,
        ok: true,
        sessionId,
        state,
        requestedAmount: session.amount,
        insertedAmount: inserted,
        dispensedAmount: dispensed,
        notDispensedAmount: notDispensed,
      };
    } catch (error) {
      console.error(`❌ Error getting session status:`, error.message);
      return {
        success: false,
        ok: false,
        message: error.message,
      };
    }
  }

  /**
   * Cancel a payment session
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Cancellation result
   */
  async cancelSession(sessionId) {
    // Find session by ID
    let session = null;
    let sessionKey = null;
    for (const [key, value] of activeSessions.entries()) {
      if (value.id === sessionId) {
        session = value;
        sessionKey = key;
        break;
      }
    }
    
    if (!session) {
      return {
        success: false,
        message: 'Session not found',
      };
    }

    try {
      await this.cancelPayment();
      
      session.state = 'CANCELLED';
      
      return {
        success: true,
        message: 'Payment cancelled',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

// Export class and factory function
// Note: Services should be created per terminal configuration
// Use createService(terminal) to get a configured instance
function createCashmaticService(terminal) {
  const service = new CashmaticService();
  if (terminal) {
    service.setConfig(terminal);
  }
  return service;
}

// Legacy singleton for backward compatibility (will need config set before use)
const cashmaticService = new CashmaticService();

module.exports = {
  CashmaticService,
  cashmaticService,
  createCashmaticService,
};

