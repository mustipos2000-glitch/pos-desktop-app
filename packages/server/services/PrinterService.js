const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const Printer = require('../models/Printer');
const PrTable = require('../models/PrTable');

class PrinterService {
  /**
   * Get printer type from string
   */
  static getPrinterType(typeString) {
    const types = {
      'EPSON': PrinterTypes.EPSON,
      'STAR': PrinterTypes.STAR,
      'TANCA': PrinterTypes.TANCA,
      'DARUMA': PrinterTypes.DARUMA,
      'BROTHER': PrinterTypes.BROTHER
    };
    return types[typeString] || PrinterTypes.EPSON;
  }

  /**
   * Normalize order data so that it always has an items[] array.
   * Accepts both { items: [...] } and { details: [...] } as used by Order.getById.
   */
  static normalizeOrderData(orderData) {
    if (!orderData) {
      return null;
    }

    // Clone to avoid mutating original object unexpectedly
    const normalized = { ...orderData };

    // If items already exists and is an array, keep it
    if (Array.isArray(normalized.items) && normalized.items.length > 0) {
      return normalized;
    }

    // If details exists (from Order.getById), map to items
    if (Array.isArray(orderData.details)) {
      normalized.items = orderData.details.map(d => ({
        name: d.product_name || d.name || '',
        qty: d.qty || d.quantity || 1,
        price: (typeof d.price === 'number' ? d.price : 0),
        notes: d.notes || d.note || ''
      }));
      return normalized;
    }

    // Fallback: no items, ensure at least empty array
    normalized.items = Array.isArray(normalized.items) ? normalized.items : [];
    return normalized;
  }

  /**
   * Create thermal printer instance
   */
  static createPrinterInstance(printerConfig) {
    // Handle different connection types
    let interfaceString = printerConfig.connection_string || 'tcp://localhost:9100';
    
    // Ensure proper formatting for different connection types
    if (interfaceString.startsWith('COM') || interfaceString.includes('COM')) {
      // Windows COM port format
      if (!interfaceString.startsWith('\\\\.\\')) {
        interfaceString = `\\\\.\\${interfaceString}`;
      }
    } else if (interfaceString.startsWith('/dev/') || interfaceString.startsWith('/usb/')) {
      // Unix-like device file format
      // Already in correct format
    } else if (!interfaceString.startsWith('tcp://') && interfaceString.includes(':')) {
      // Assume IP:Port format, convert to tcp://IP:Port
      interfaceString = `tcp://${interfaceString}`;
    } else if (!interfaceString.startsWith('tcp://') && !interfaceString.startsWith('\\\\.\\') && !interfaceString.startsWith('/')) {
      // Default to TCP if no protocol specified
      interfaceString = `tcp://${interfaceString}`;
    }

    // Map printer type string to PrinterTypes
    const type = this.getPrinterType(printerConfig.type);

    const printer = new ThermalPrinter({
      type: type,
      interface: interfaceString,
      options: {
        timeout: 5000
      },
      characterSet: 'SLOVENIA',
      removeSpecialCharacters: false,
      lineCharacter: '-'
    });

    return printer;
  }

  /**
   * Test printer connection and basic printing
   */
  static async testPrinter(printerId) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found in database');
      }

      // Clean connection string (same as in createPrinterInstance)
      const cleanConnection = printerConfig.connection_string ? printerConfig.connection_string.trim() : '';
      
      if (!cleanConnection) {
        throw new Error('No connection string configured for this printer');
      }

      const printer = this.createPrinterInstance(printerConfig);

      // Connect to printer
      const isConnected = await printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error('Printer is not connected or not reachable');
      }

      // Print test content
      printer.alignCenter();
      printer.bold(true);
      printer.setTextSize(1, 1);
      printer.println('*** TEST PRINT ***');
      printer.bold(false);
      printer.setTextNormal();
      printer.drawLine();
      printer.println(`Printer: ${printerConfig.name}`);
      printer.println(`Type: ${printerConfig.type}`);
      printer.println(`Interface: ${cleanConnection}`);
      printer.drawLine();
      printer.println('If you can read this, the printer is working.');
      printer.newLine();
      printer.println('Thank you for using POS Printer Service.');
      printer.newLine();
      printer.cut();

      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error('Test print error:', error);
      
      // Map common errors to user-friendly messages
      let errorMessage = 'Unknown error during test print';
      
      if (error.message.includes('not reachable') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to printer. Check IP/Port or cable connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Printer connection timed out. Check if printer is turned on and reachable.';
      } else if (error.message.includes('Printer not found')) {
        errorMessage = 'Printer not found in the system. Please check printer configuration.';
      } else if (error.message.includes('No connection string')) {
        errorMessage = 'No connection string configured. Please set printer IP/Port or COM port.';
      } else {
        errorMessage = error.message;
      }
      
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Print receipt
   */
  static async printReceipt(printerId, orderData) {
    try {
      // Ensure order data has items[] array
      orderData = PrinterService.normalizeOrderData(orderData);
      if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Order has no items to print');
      }

      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found in database');
      }

      // Clean connection string (same as test printer)
      const cleanConnection = printerConfig.connection_string ? printerConfig.connection_string.trim() : '';
      
      if (!cleanConnection) {
        throw new Error('No connection string configured for this printer');
      }

      const cleanConfig = {
        ...printerConfig,
        connection_string: cleanConnection
      };

      const printer = this.createPrinterInstance(cleanConfig);
      
      // Get table info if available
      let tableInfo = null;
      if (orderData.table_id) {
        tableInfo = PrTable.getById(orderData.table_id);
      }
      
      // ============ RECEIPT TITLE ============
      printer.bold(true);
      printer.setTextSize(1, 1);
      printer.println('RECEIPT');
      printer.bold(false);
      printer.setTextNormal();
      printer.drawLine();
      
      // ============ ORDER INFO ============
      printer.alignLeft();
      printer.bold(true);
      printer.println(`Order #: ${orderData.id}`);
      printer.bold(false);
      
      const orderDate = new Date(orderData.created_at);
      printer.println(`Date: ${orderDate.toLocaleDateString()}`);
      printer.println(`Time: ${orderDate.toLocaleTimeString()}`);
      
      if (tableInfo) {
        printer.println(`Table: ${tableInfo.table_no}${tableInfo.room_name ? ` (${tableInfo.room_name})` : ''}`);
      }
      
      printer.drawLine();
      
      // ============ ITEMS ============
      printer.bold(true);
      printer.println('Items');
      printer.bold(false);
      
      let subtotal = 0;
      for (const item of orderData.items) {
        const itemTotal = item.qty * item.price;
        subtotal += itemTotal;
        
        printer.println(`${item.qty} x ${item.name}`);
        printer.println(`   ${itemTotal.toFixed(2)}`);
        
        // Print item notes if any
        if (item.notes) {
          printer.println(`   Note: ${item.notes}`);
        }
      }
      
      printer.drawLine();
      
      // ============ TOTALS ============
      const discount = orderData.discount || 0;
      const tax = orderData.tax || 0;
      const total = subtotal - discount + tax;
      
      printer.println(`Subtotal: ${subtotal.toFixed(2)}`);
      printer.println(`Discount: ${discount.toFixed(2)}`);
      printer.println(`Tax: ${tax.toFixed(2)}`);
      printer.bold(true);
      printer.println(`TOTAL: ${total.toFixed(2)}`);
      printer.bold(false);
      
      printer.newLine();
      
      // ============ FOOTER ============
      printer.alignCenter();
      printer.println('Thank you for your business!');
      printer.println('Please come again soon.');
      printer.newLine();
      printer.println('--- End of Receipt ---');
      printer.newLine();
      printer.cut();
      
      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error('Receipt print error:', error);
      
      let errorMessage = 'Unknown error during receipt printing';
      
      if (error.message.includes('Printer not found')) {
        errorMessage = 'Printer not found in the system. Please check printer configuration.';
      } else if (error.message.includes('No connection string')) {
        errorMessage = 'No connection string configured. Please set printer IP/Port or COM port.';
      } else if (error.message.includes('no items')) {
        errorMessage = 'Order has no items to print.';
      } else {
        errorMessage = error.message;
      }
      
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Print custom text (generic)
   */
  static async printCustom(printerId, textLines) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found in database');
      }

      const cleanConnection = printerConfig.connection_string ? printerConfig.connection_string.trim() : '';
      if (!cleanConnection) {
        throw new Error('No connection string configured for this printer');
      }

      const cleanConfig = {
        ...printerConfig,
        connection_string: cleanConnection
      };

      const printer = this.createPrinterInstance(cleanConfig);

      printer.alignLeft();
      if (Array.isArray(textLines)) {
        for (const line of textLines) {
          printer.println(line);
        }
      } else if (typeof textLines === 'string') {
        printer.println(textLines);
      } else {
        throw new Error('Invalid text_lines format. Must be string or string[]');
      }

      printer.newLine();
      printer.cut();

      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error('Custom text print error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Print kitchen order
   */
  static async printKitchenOrder(printerId, orderData) {
    try {
      // Ensure order data has items[] array
      orderData = PrinterService.normalizeOrderData(orderData);
      if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Order has no items to print');
      }

      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found in database');
      }

      // Clean connection string
      const cleanConnection = printerConfig.connection_string ? printerConfig.connection_string.trim() : '';
      
      if (!cleanConnection) {
        throw new Error('No connection string configured for this printer');
      }

      const cleanConfig = {
        ...printerConfig,
        connection_string: cleanConnection
      };

      const printer = this.createPrinterInstance(cleanConfig);
      
      // Get table info if available
      let tableInfo = null;
      if (orderData.table_id) {
        tableInfo = PrTable.getById(orderData.table_id);
      }
      
      // ============ HEADER ============
      printer.alignCenter();
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println('KITCHEN ORDER');
      printer.bold(false);
      printer.setTextNormal();
      printer.drawLine();
      
      // ============ ORDER INFO ============
      printer.alignLeft();
      const orderDate = new Date(orderData.created_at);
      printer.println(`Order #: ${orderData.id}`);
      printer.println(`Date: ${orderDate.toLocaleDateString()}`);
      printer.println(`Time: ${orderDate.toLocaleTimeString()}`);
      
      if (tableInfo) {
        printer.println(`Table: ${tableInfo.table_no}${tableInfo.room_name ? ` (${tableInfo.room_name})` : ''}`);
      }
      
      printer.drawLine();
      
      // ============ ITEMS ============
      printer.bold(true);
      printer.println('Items');
      printer.bold(false);
      
      for (const item of orderData.items) {
        printer.println(`${item.qty} x ${item.name}`);
        if (item.notes) {
          printer.println(`   Note: ${item.notes}`);
        }
      }
      
      printer.drawLine();
      
      // ============ FOOTER ============
      printer.alignCenter();
      printer.println('--- End of Kitchen Order ---');
      printer.newLine();
      printer.cut();
      
      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error('Kitchen order print error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = PrinterService;
