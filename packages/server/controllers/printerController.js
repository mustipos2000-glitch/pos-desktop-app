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

      // Validate connection string format if provided
      if (payload.connection_string) {
        const validationError = validateConnectionString(payload.connection_string);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
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

      // Validate connection string format if provided
      if (payload.connection_string) {
        const validationError = validateConnectionString(payload.connection_string);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
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
      const result = await PrinterService.testPrinter(id);      
      if (result.success) {
        res.json({ success: true, message: 'Test print successful' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Test printer error:', error);
      res.status(500).json({ success: false, error: 'Failed to test printer' });
    }
  },

  // Print receipt
  printReceipt: async (req, res) => {
    try {
      const { printer_id, order_data } = req.body;
      
      if (!printer_id || !order_data) {
        return res.status(400).json({ error: 'Printer ID and order data are required' });
      }
      
      const result = await PrinterService.printReceipt(printer_id, order_data);
      
      if (result.success) {
        res.json({ success: true, message: 'Receipt printed successfully' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Print receipt error:', error);
      res.status(500).json({ success: false, error: 'Failed to print receipt' });
    }
  },

  // Print kitchen order
  printKitchenOrder: async (req, res) => {
    try {
      const { printer_id, order_data } = req.body;
      
      if (!printer_id || !order_data) {
        return res.status(400).json({ error: 'Printer ID and order data are required' });
      }
      
      const result = await PrinterService.printKitchenOrder(printer_id, order_data);
      
      if (result.success) {
        res.json({ success: true, message: 'Kitchen order printed successfully' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Print kitchen order error:', error);
      res.status(500).json({ success: false, error: 'Failed to print kitchen order' });
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
      const { printer_id, text_lines } = req.body;
      
      if (!printer_id || !text_lines) {
        return res.status(400).json({ error: 'Printer ID and text lines are required' });
      }
      
      const result = await PrinterService.printCustom(printer_id, text_lines);
      
      if (result.success) {
        res.json({ success: true, message: 'Custom text printed successfully' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Print custom text error:', error);
      res.status(500).json({ success: false, error: 'Failed to print custom text' });
    }
  }
};

/**
 * Validate connection string format
 */
function validateConnectionString(connectionString) {
  if (!connectionString || typeof connectionString !== 'string') {
    return 'Connection string must be a non-empty string';
  }

  const trimmed = connectionString.trim();
  
  // Check for valid formats
  const validFormats = [
    /^tcp:\/\/[\d\.]+:\d+$/,           // TCP format: tcp://192.168.1.100:9100
    /^\\\\\.\\COM\d+$/i,               // Windows COM port: \\.\COM3
    /^\/dev\/(usb|lp)\//i,             // Linux device files: /dev/usb/lp0
    /^COM\d+$/i                        // Simple COM port: COM3
  ];
  
  const isValid = validFormats.some(format => format.test(trimmed));
  
  if (!isValid) {
    return 'Invalid connection string format. Valid formats: tcp://IP:PORT, \\.\COM3, /dev/usb/lp0';
  }
  
  return null; // No error
}

module.exports = PrinterController;