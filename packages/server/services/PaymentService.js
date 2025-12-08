/**
 * PaymentService - Handles integration with Cashmatic and Bancontact payment terminals
 * 
 * This service provides a mock implementation that can be replaced with actual
 * payment terminal integration (e.g., via serial port, TCP/IP, or SDK)
 */

const PaymentTerminal = require('../models/PaymentTerminal');
const net = require('net');

class PaymentService {
  /**
   * Test terminal connection
   * @param {Object} terminal - Terminal configuration
   * @returns {Promise<Object>} Test result
   */
  static async testTerminalConnection(terminal) {
    try {
      console.log(`🧪 Testing connection to ${terminal.name} (${terminal.connection_string})`);
      
      if (terminal.connection_type === 'tcp') {
        return await this.testTcpConnection(terminal.connection_string);
      } else if (terminal.connection_type === 'serial') {
        return await this.testSerialConnection(terminal.connection_string);
      } else if (terminal.connection_type === 'api') {
        return await this.testApiConnection(terminal.connection_string);
      }
      
      return {
        success: false,
        message: 'Unsupported connection type'
      };
    } catch (error) {
      console.error('❌ Terminal test failed:', error);
      return {
        success: false,
        message: error.message || 'Connection test failed'
      };
    }
  }

  /**
   * Test TCP connection
   */
  static async testTcpConnection(connectionString) {
    return new Promise((resolve) => {
      const [host, port] = connectionString.replace('tcp://', '').split(':');
      const client = new net.Socket();
      
      const timeout = setTimeout(() => {
        client.destroy();
        resolve({
          success: false,
          message: 'Connection timeout - terminal not responding'
        });
      }, 5000);
      
      client.connect(parseInt(port), host, () => {
        clearTimeout(timeout);
        client.destroy();
        resolve({
          success: true,
          message: 'Connection successful'
        });
      });
      
      client.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `Connection failed: ${err.message}`
        });
      });
    });
  }

  /**
   * Test serial connection
   */
  static async testSerialConnection(connectionString) {
    // TODO: Implement serial port testing
    // Requires 'serialport' package
    return {
      success: false,
      message: 'Serial port testing not yet implemented. Install serialport package.'
    };
  }

  /**
   * Test API connection
   */
  static async testApiConnection(connectionString) {
    try {
      const response = await fetch(connectionString, {
        method: 'GET',
        timeout: 5000
      });
      
      return {
        success: response.ok,
        message: response.ok ? 'API connection successful' : `API returned status ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        message: `API connection failed: ${error.message}`
      };
    }
  }
  /**
   * Process Cashmatic payment
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment result
   */
  static async processCashmaticPayment(paymentData) {
    try {
      const { amount, member_id, payment_type, reference } = paymentData;
      
      console.log(`💰 Cashmatic Payment Request:`, {
        amount: `€${amount}`,
        member_id,
        payment_type,
        reference
      });
      
      // Get Cashmatic terminal configuration
      const terminal = PaymentTerminal.getByType('cashmatic');
      
      // If terminal is configured and enabled, use it
      if (terminal && terminal.enabled) {
        // Process payment based on connection type
        if (terminal.connection_type === 'tcp') {
          return await this.processTcpPayment(terminal, paymentData, 'cashmatic');
        } else if (terminal.connection_type === 'serial') {
          return await this.processSerialPayment(terminal, paymentData, 'cashmatic');
        } else if (terminal.connection_type === 'api') {
          return await this.processApiPayment(terminal, paymentData, 'cashmatic');
        }
      }
      
      // Fallback to mock for testing (when no terminal configured)
      console.log('⚠️ Using mock Cashmatic payment (no terminal configured)');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transaction_id = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Cashmatic Payment Successful: ${transaction_id}`);
      
      return {
        success: true,
        transaction_id,
        sessionId: transaction_id, // Add sessionId for compatibility
        data: {
          amount,
          method: 'cashmatic',
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference,
          terminal: terminal ? terminal.name : 'Mock Terminal',
          // Mock Cashmatic response format
          state: 'FINISHED',
          requestedAmount: amount * 100, // in cents
          insertedAmount: amount * 100,
          dispensedAmount: 0,
          notDispensedAmount: 0
        }
      };
    } catch (error) {
      console.error('❌ Cashmatic payment failed:', error);
      return {
        success: false,
        message: error.message || 'Cashmatic payment failed'
      };
    }
  }

  /**
   * Process Bancontact payment
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment result
   */
  static async processBancontactPayment(paymentData) {
    try {
      const { amount, member_id, payment_type, reference } = paymentData;
      
      console.log(`💳 Bancontact Payment Request:`, {
        amount: `€${amount}`,
        member_id,
        payment_type,
        reference
      });
      
      // Get Bancontact terminal configuration
      const terminal = PaymentTerminal.getByType('bancontact');
      
      if (!terminal) {
        return {
          success: false,
          message: 'Bancontact terminal not configured. Please add terminal in settings.'
        };
      }
      
      if (!terminal.enabled) {
        return {
          success: false,
          message: 'Bancontact terminal is disabled. Please enable it in settings.'
        };
      }
      
      // Process payment based on connection type
      if (terminal.connection_type === 'tcp') {
        return await this.processTcpPayment(terminal, paymentData, 'bancontact');
      } else if (terminal.connection_type === 'serial') {
        return await this.processSerialPayment(terminal, paymentData, 'bancontact');
      } else if (terminal.connection_type === 'api') {
        return await this.processApiPayment(terminal, paymentData, 'bancontact');
      }
      
      // Fallback to mock for testing
      console.log('⚠️ Using mock payment (no real terminal connection)');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const transaction_id = `BANC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Bancontact Payment Successful: ${transaction_id}`);
      
      return {
        success: true,
        transaction_id,
        data: {
          amount,
          method: 'bancontact',
          status: 'completed',
          timestamp: new Date().toISOString(),
          reference,
          card_type: 'bancontact',
          terminal: terminal.name
        }
      };
    } catch (error) {
      console.error('❌ Bancontact payment failed:', error);
      return {
        success: false,
        message: error.message || 'Bancontact payment failed'
      };
    }
  }

  /**
   * Process TCP payment
   */
  static async processTcpPayment(terminal, paymentData, method) {
    return new Promise((resolve) => {
      const [host, port] = terminal.connection_string.replace('tcp://', '').split(':');
      const client = new net.Socket();
      
      const timeout = setTimeout(() => {
        client.destroy();
        resolve({
          success: false,
          message: 'Payment timeout - terminal not responding'
        });
      }, 30000);
      
      client.connect(parseInt(port), host, () => {
        // Send payment command (format depends on your terminal)
        const command = JSON.stringify({
          action: 'payment',
          amount: paymentData.amount,
          reference: paymentData.reference
        });
        client.write(command + '\n');
      });
      
      client.on('data', (data) => {
        clearTimeout(timeout);
        client.destroy();
        
        try {
          const response = JSON.parse(data.toString());
          resolve({
            success: response.status === 'approved',
            transaction_id: response.transaction_id || `${method.toUpperCase()}-${Date.now()}`,
            data: response
          });
        } catch (error) {
          resolve({
            success: false,
            message: 'Invalid response from terminal'
          });
        }
      });
      
      client.on('error', (err) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `Terminal connection failed: ${err.message}`
        });
      });
    });
  }

  /**
   * Process serial payment
   */
  static async processSerialPayment(terminal, paymentData, method) {
    // TODO: Implement serial port payment processing
    return {
      success: false,
      message: 'Serial port payment not yet implemented'
    };
  }

  /**
   * Process API payment
   */
  static async processApiPayment(terminal, paymentData, method) {
    try {
      const response = await fetch(terminal.connection_string + '/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
        timeout: 30000
      });
      
      const result = await response.json();
      
      return {
        success: result.status === 'approved',
        transaction_id: result.transaction_id,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: `API payment failed: ${error.message}`
      };
    }
  }

  /**
   * Get payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  static async getPaymentStatus(transactionId) {
    try {
      // TODO: Implement actual status check with payment terminal
      
      // Mock Cashmatic status response
      return {
        success: true,
        ok: true,
        data: {
          transaction_id: transactionId,
          status: 'completed',
          state: 'FINISHED',
          timestamp: new Date().toISOString(),
          requestedAmount: 0,
          insertedAmount: 0,
          dispensedAmount: 0,
          notDispensedAmount: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get payment status'
      };
    }
  }

  /**
   * Cancel payment
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Cancellation result
   */
  static async cancelPayment(transactionId) {
    try {
      console.log(`🚫 Cancelling payment: ${transactionId}`);
      
      // TODO: Implement actual payment cancellation with terminal
      
      return {
        success: true,
        message: 'Payment cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to cancel payment'
      };
    }
  }

  /**
   * Process Payworld payment
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment result
   */
  static async processPayworldPayment(paymentData) {
    try {
      const { amount, member_id, payment_type, reference } = paymentData;
      
      console.log(`💳 Payworld Payment Request:`, {
        amount: `€${amount}`,
        member_id,
        payment_type,
        reference
      });
      
      // Get Bancontact/Payworld terminal configuration
      const terminal = PaymentTerminal.getByType('bancontact');
      
      if (!terminal) {
        return {
          success: false,
          message: 'Payworld terminal not configured. Please add terminal in settings.'
        };
      }
      
      if (!terminal.enabled) {
        return {
          success: false,
          message: 'Payworld terminal is disabled. Please enable it in settings.'
        };
      }
      
      // Process payment based on connection type
      if (terminal.connection_type === 'tcp') {
        return await this.processTcpPayment(terminal, paymentData, 'payworld');
      } else if (terminal.connection_type === 'serial') {
        return await this.processSerialPayment(terminal, paymentData, 'payworld');
      } else if (terminal.connection_type === 'api') {
        return await this.processApiPayment(terminal, paymentData, 'payworld');
      }
      
      // Fallback to mock for testing
      console.log('⚠️ Using mock Payworld payment (no real terminal connection)');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const transaction_id = `PAYWORLD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ Payworld Payment Successful: ${transaction_id}`);
      
      return {
        success: true,
        transaction_id,
        sessionId: transaction_id,
        data: {
          amount,
          method: 'payworld',
          status: 'completed',
          state: 'APPROVED',
          timestamp: new Date().toISOString(),
          reference,
          card_type: 'bancontact',
          terminal: terminal.name
        }
      };
    } catch (error) {
      console.error('❌ Payworld payment failed:', error);
      return {
        success: false,
        message: error.message || 'Payworld payment failed'
      };
    }
  }

  /**
   * Get Payworld payment status
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Payment status
   */
  static async getPayworldStatus(sessionId) {
    try {
      // TODO: Implement actual status check with Payworld terminal
      
      // Mock Payworld status response
      return {
        success: true,
        ok: true,
        data: {
          sessionId,
          state: 'APPROVED',
          message: 'Payworld betaling voltooid.',
          details: {
            amount: 0,
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        ok: false,
        message: error.message || 'Failed to get Payworld status'
      };
    }
  }

  /**
   * Cancel Payworld payment
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Cancellation result
   */
  static async cancelPayworldPayment(sessionId) {
    try {
      console.log(`🚫 Cancelling Payworld payment: ${sessionId}`);
      
      // TODO: Implement actual payment cancellation with Payworld terminal
      
      return {
        success: true,
        message: 'Payworld payment cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to cancel Payworld payment'
      };
    }
  }
}

module.exports = PaymentService;
