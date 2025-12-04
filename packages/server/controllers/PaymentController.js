const PaymentService = require('../services/PaymentService');

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
  }
};

module.exports = PaymentController;
