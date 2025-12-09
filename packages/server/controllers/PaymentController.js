const PaymentService = require('../services/PaymentService');
const EmailService = require('../services/EmailService');

const PaymentController = {
  // Process Cashmatic payment
  processCashmaticPayment: async (req, res) => {
    try {
      const { amount, member_id, payment_type, reference } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }
      
      console.log(`💰 Processing Cashmatic payment: €${amount}`);
      
      const result = await PaymentService.processCashmaticPayment({
        amount,
        member_id,
        payment_type,
        reference
      });
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Cashmatic payment processed successfully',
          sessionId: result.sessionId || result.transaction_id,
          transaction_id: result.transaction_id,
          data: result.data
        });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Cashmatic payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to process Cashmatic payment' });
    }
  },

  // Get payment status (used by /cashmatic/status/:sessionId)
  getPaymentStatus: async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      const result = await PaymentService.getPaymentStatus(transactionId);
      
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(404).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ success: false, error: 'Failed to get payment status' });
    }
  },


  // Process Payworld payment
  processPayworldPayment: async (req, res) => {
    try {
      const { amount, member_id, payment_type, reference } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }
      
      console.log(`💳 Processing Payworld payment: €${amount}`);
      
      const result = await PaymentService.processPayworldPayment({
        amount,
        member_id,
        payment_type,
        reference
      });
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Payworld payment processed successfully',
          sessionId: result.sessionId || result.transaction_id,
          transaction_id: result.transaction_id,
          data: result.data
        });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Payworld payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to process Payworld payment' });
    }
  },

  // Get Payworld payment status
  getPayworldStatus: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const result = await PaymentService.getPayworldStatus(sessionId);
      
      if (result.success) {
        res.json({ success: true, ok: true, ...result.data });
      } else {
        res.status(404).json({ success: false, ok: false, error: result.message });
      }
    } catch (error) {
      console.error('Get Payworld status error:', error);
      res.status(500).json({ success: false, ok: false, error: 'Failed to get Payworld status' });
    }
  },

  // Cancel Payworld payment
  cancelPayworldPayment: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const result = await PaymentService.cancelPayworldPayment(sessionId);
      
      if (result.success) {
        res.json({ success: true, message: 'Payworld payment cancelled successfully' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Cancel Payworld payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel Payworld payment' });
    }
  },

  // Process Viva payment
  processVivaPayment: async (req, res) => {
    try {
      const { amount, merchantId, terminalId, orderReference } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }
      
      if (!merchantId || !terminalId) {
        return res.status(400).json({ error: 'Merchant ID and Terminal ID are required' });
      }
      
      console.log(`💳 Processing Viva payment: €${amount}`);
      
      // Note: Viva is currently a client-side integration
      // This endpoint exists for consistency but may need full implementation
      // For now, return a success response as the client handles the actual payment
      res.json({ 
        success: true, 
        ok: true,
        message: 'Viva payment processed successfully',
        data: {
          amount,
          method: 'viva',
          status: 'completed',
          merchantId,
          terminalId,
          orderReference,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Viva payment error:', error);
      res.status(500).json({ success: false, ok: false, error: 'Failed to process Viva payment' });
    }
  },

  // Send receipt via email
  sendReceiptEmail: async (req, res) => {
    try {
      const receiptData = req.body;
      
      if (!receiptData.email) {
        return res.status(400).json({ success: false, error: 'Email address is required' });
      }

      console.log(`📧 Sending receipt to: ${receiptData.email}`);
      
      const result = await EmailService.sendReceiptEmail(receiptData);
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Receipt sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Send receipt email error:', error);
      res.status(500).json({ success: false, error: 'Failed to send receipt email' });
    }
  }
};

module.exports = PaymentController;
