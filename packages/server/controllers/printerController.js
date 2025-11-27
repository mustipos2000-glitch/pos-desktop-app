const Printer = require('../models/Printer');
const PrinterService = require('../services/PrinterService');
const Order = require('../models/Order');

const PrinterController = {
  getAllPrinters: (req, res) => {
    try {
      const printers = Printer.getAll();
      res.json({ data: printers });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getPrinterById: (req, res) => {
    try {
      const id = req.params.id;
      const printer = Printer.getById(id);
      if (!printer) {
        return res.status(404).json({ error: 'Printer not found' });
      }
      res.json({ data: printer });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createPrinter: (req, res) => {
    try {
      const payload = req.body;
      if (!payload.name || !payload.type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const printer = Printer.create(payload);
      res.status(201).json({ message: 'Printer created successfully', data: printer });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  updatePrinter: (req, res) => {
    try {
      const id = req.params.id;
      const payload = req.body;
      if (!payload.name || !payload.type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const existingPrinter = Printer.getById(id);
      if (!existingPrinter) {
        return res.status(404).json({ error: 'Printer not found' });
      }

      const printer = Printer.update(id, payload);
      res.status(200).json({ message: 'Printer updated successfully', data: printer });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deletePrinter: (req, res) => {
    try {
      const id = req.params.id;
      const printer = Printer.getById(id);

      if (!printer) {
        return res.status(404).json({ error: 'Printer not found' });
      }

      Printer.delete(id);
      res.json({ message: 'Printer deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Test printer connection
  testPrinter: async (req, res) => {
    try {
      const id = req.params.id;
      console.log('Testing printer ID:', id);
      
      const result = await PrinterService.testPrinter(id);
      console.log('Test result:', result);
      
      if (result.success) {
        res.json({ message: result.message, success: true });
      } else {
        console.error('Test failed:', result.message);
        res.status(400).json({ error: result.message, success: false });
      }
    } catch (err) {
      console.error('Test printer error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  },

  // Print receipt
  printReceipt: async (req, res) => {
    try {
      const { printerId, orderId } = req.body;
      
      if (!printerId || !orderId) {
        return res.status(400).json({ error: 'Printer ID and Order ID are required' });
      }

      // Get order data with items
      const order = Order.getById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const result = await PrinterService.printReceipt(printerId, order);
      
      if (result.success) {
        res.json({ message: result.message, success: true });
      } else {
        res.status(400).json({ error: result.message, success: false });
      }
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  },

  // Print kitchen order
  printKitchenOrder: async (req, res) => {
    try {
      const { printerId, orderId } = req.body;
      
      if (!printerId || !orderId) {
        return res.status(400).json({ error: 'Printer ID and Order ID are required' });
      }

      // Get order data with items
      const order = Order.getById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const result = await PrinterService.printKitchenOrder(printerId, order);
      
      if (result.success) {
        res.json({ message: result.message, success: true });
      } else {
        res.status(400).json({ error: result.message, success: false });
      }
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  },

  // Print kitchen order to multiple printers (batch)
  printKitchenOrderBatch: async (req, res) => {
    try {
      const { printerIds, orderId } = req.body;
      
      if (!printerIds || !Array.isArray(printerIds) || printerIds.length === 0) {
        return res.status(400).json({ error: 'Printer IDs array is required' });
      }
      
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Get order data with items
      const order = Order.getById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`📦 Batch printing to ${printerIds.length} printer(s) for order #${orderId}`);

      // Print to all printers
      const results = await Promise.allSettled(
        printerIds.map(printerId => PrinterService.printKitchenOrder(printerId, order))
      );

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failedCount = results.length - successCount;

      // Collect error messages
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
        .map((r, index) => {
          const printerId = printerIds[index];
          const printer = Printer.getById(printerId);
          const printerName = printer ? printer.name : `Printer ${printerId}`;
          const errorMsg = r.status === 'rejected' ? r.reason.message : r.value.message;
          return `${printerName}: ${errorMsg}`;
        });

      if (successCount > 0) {
        res.json({ 
          message: `Successfully printed to ${successCount} printer(s)`,
          success: true,
          successCount,
          failedCount,
          errors: errors.length > 0 ? errors : undefined
        });
      } else {
        res.status(400).json({ 
          error: 'Failed to print to all printers',
          success: false,
          successCount: 0,
          failedCount,
          errors
        });
      }
    } catch (err) {
      console.error('Batch print error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  },

  // Print custom text
  printCustom: async (req, res) => {
    try {
      const { printerId, text } = req.body;
      
      if (!printerId || !text) {
        return res.status(400).json({ error: 'Printer ID and text are required' });
      }

      const result = await PrinterService.printCustom(printerId, text);
      
      if (result.success) {
        res.json({ message: result.message, success: true });
      } else {
        res.status(400).json({ error: result.message, success: false });
      }
    } catch (err) {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
};

module.exports = PrinterController;
