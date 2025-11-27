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
    
    const printer = new ThermalPrinter({
      type: this.getPrinterType(printerConfig.type),
      interface: interfaceString,
      characterSet: 'PC437_USA',
      removeSpecialCharacters: false,
      lineCharacter: '-',
      options: {
        timeout: 5000
      }
    });
    return printer;
  }

  /**
   * Test printer connection
   */
  static async testPrinter(printerId) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found in database');
      }

      // Clean connection string (remove extra spaces)
      const cleanConnection = printerConfig.connection_string ? printerConfig.connection_string.trim() : '';
      
      if (!cleanConnection) {
        throw new Error('No connection string configured for this printer');
      }

      // Create config with cleaned connection string
      const cleanConfig = {
        ...printerConfig,
        connection_string: cleanConnection
      };

      const printer = this.createPrinterInstance(cleanConfig);
      
      printer.alignCenter();
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println('PRINTER TEST');
      printer.bold(false);
      printer.drawLine();
      printer.alignLeft();
      printer.println(`Printer: ${printerConfig.name}`);
      printer.println(`Type: ${printerConfig.type}`);
      printer.println(`Connection: ${cleanConnection}`);
      printer.println(`Date: ${new Date().toLocaleString()}`);
      printer.drawLine();
      printer.alignCenter();
      printer.println('Test Successful!');
      printer.newLine();
      printer.cut();

      await printer.execute();
      return { success: true, message: 'Test print successful' };
    } catch (error) {
      console.error('Printer test error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
        errorMessage = 'Connection timeout - Check if printer is ON and IP address is correct';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - Check if printer is ON and port is correct (try 9100, 9101, or 9102)';
      } else if (errorMessage.includes('EHOSTUNREACH')) {
        errorMessage = 'Host unreachable - Check if printer is on the same network';
      } else if (errorMessage.includes('ENETUNREACH')) {
        errorMessage = 'Network unreachable - Check your network connection';
      } else if (errorMessage === 'Printer Error') {
        errorMessage = 'Printer error - Check if printer is ON, has paper, and is ready';
      }
      
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Print receipt
   */
  static async printReceipt(printerId, orderData) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found');
      }

      const printer = this.createPrinterInstance(printerConfig);
      
      // Get table info if available
      let tableInfo = null;
      if (orderData.table_id) {
        tableInfo = PrTable.getById(orderData.table_id);
      }
      
      // ============ HEADER ============
      printer.alignCenter();
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println('Alphinex Solution Printer');
      printer.bold(false);
      printer.setTextNormal();
      printer.println('3rd Floor,Ali Arcade, Alphinex Solution');
      printer.println('Rawalpindi');
      printer.println('Tel: +1 (555) 123-4567');
      printer.println('https://alphinex.com');
      printer.newLine();
      
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
      if (discount > 0) {
        printer.println(`Discount: -${discount.toFixed(2)}`);
      }
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
      return { success: false, message: error.message };
    }
  }

  /**
   * Print kitchen order
   */
  static async printKitchenOrder(printerId, orderData) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found');
      }

      const printer = this.createPrinterInstance(printerConfig);
      
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
      printer.println('Items to Prepare');
      printer.bold(false);
      
      for (const item of orderData.items) {
        printer.println(`${item.qty} x ${item.name}`);
        
        // Print item notes if any
        if (item.notes) {
          printer.println(`   Note: ${item.notes}`);
        }
      }
      
      printer.newLine();
      printer.println('--- End of Order ---');
      printer.newLine();
      printer.cut();
      
      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error('Kitchen order print error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Print custom text
   */
  static async printCustom(printerId, textLines) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found');
      }

      const printer = this.createPrinterInstance(printerConfig);
      
      // Print each line
      for (const line of textLines) {
        printer.println(line);
      }
      
      printer.cut();
      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error('Custom print error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = PrinterService;