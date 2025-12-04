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

  // Process Bancontact payment
  processBancontactPayment: async (req, res) => {
    try {
      const { amount, member_id, payment_type, reference } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }
      
      console.log(`💳 Processing Bancontact payment: €${amount}`);
      
      const result = await PaymentService.processBancontactPayment({
        amount,
        member_id,
        payment_type,
        reference
      });
      
      if (result.success) {
        res.json({ 
          success: true, 
          message: 'Bancontact payment processed successfully',
          transaction_id: result.transaction_id,
          data: result.data
        });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Bancontact payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to process Bancontact payment' });
    }
  },

  // Get payment status
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

  // Cancel payment
  cancelPayment: async (req, res) => {
    try {
      const { transactionId } = req.params;
      
      const result = await PaymentService.cancelPayment(transactionId);
      
      if (result.success) {
        res.json({ success: true, message: 'Payment cancelled successfully' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Cancel payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel payment' });
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
