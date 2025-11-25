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
    const printer = new ThermalPrinter({
      type: this.getPrinterType(printerConfig.type),
      interface: printerConfig.connection_string || 'tcp://localhost:9100',
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
      printer.println('YOUR RESTAURANT NAME');
      printer.bold(false);
      printer.setTextNormal();
      printer.println('123 Main Street, City');
      printer.println('State, ZIP Code');
      printer.println('Tel: +1 (555) 123-4567');
      printer.println('www.yourrestaurant.com');
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
        printer.println(`Table: ${tableInfo.table_no}`);
        if (tableInfo.customer_name) {
          printer.println(`Customer: ${tableInfo.customer_name}`);
        }
        if (tableInfo.waiter_name) {
          printer.println(`Server: ${tableInfo.waiter_name}`);
        }
      }
      
      printer.drawLine();
      
      // ============ ITEMS HEADER ============
      printer.bold(true);
      // Using left alignment for better readability
      const itemHeader = 'Item'.padEnd(20) + 'Qty'.padStart(4) + 'Price'.padStart(8) + 'Total'.padStart(8);
      printer.println(itemHeader);
      printer.bold(false);
      printer.drawLine();
      
      // ============ ORDER ITEMS ============
      if (orderData.details && orderData.details.length > 0) {
        orderData.details.forEach(item => {
          const itemName = (item.product_name || item.name || 'Item').substring(0, 20).padEnd(20);
          const qty = item.qty.toString().padStart(4);
          const price = `$${(item.price || 0).toFixed(2)}`.padStart(8);
          const total = `$${item.total.toFixed(2)}`.padStart(8);
          
          printer.println(itemName + qty + price + total);
          
          // Print notes if any
          if (item.notes) {
            printer.println(`  * ${item.notes}`);
          }
        });
      }
      
      printer.drawLine();
      
      // ============ TOTALS ============
      const subtotal = orderData.sub_total || 0;
      const discount = orderData.discount || 0;
      const tax = orderData.tax || 0;
      const total = orderData.total || 0;
      
      printer.alignRight();
      
      // Show original subtotal if there's a discount
      if (discount > 0) {
        printer.println(`Subtotal: $${(subtotal + discount).toFixed(2)}`);
        printer.println(`Discount: -$${discount.toFixed(2)}`);
        printer.drawLine();
      }
      
      printer.println(`Subtotal: $${subtotal.toFixed(2)}`);
      printer.println(`Tax (${this.calculateTaxRate(subtotal, tax)}%): $${tax.toFixed(2)}`);
      
      printer.newLine();
      printer.bold(true);
      printer.setTextSize(1, 1);
      printer.println(`TOTAL: $${total.toFixed(2)}`);
      printer.bold(false);
      printer.setTextNormal();
      
      printer.drawLine();
      
      // ============ PAYMENT INFO ============
      printer.alignLeft();
      if (orderData.payment_method) {
        printer.println(`Payment Method: ${orderData.payment_method}`);
      }
      if (orderData.payment_amount) {
        printer.println(`Amount Paid: $${orderData.payment_amount.toFixed(2)}`);
        const change = orderData.payment_amount - total;
        if (change > 0) {
          printer.println(`Change: $${change.toFixed(2)}`);
        }
      }
      
      // ============ ORDER NOTES ============
      if (orderData.note) {
        printer.drawLine();
        printer.bold(true);
        printer.println('Note:');
        printer.bold(false);
        printer.println(orderData.note);
      }
      
      // ============ FOOTER ============
      printer.drawLine();
      printer.alignCenter();
      printer.newLine();
      printer.println('Thank you for dining with us!');
      printer.println('We hope to see you again soon');
      printer.newLine();
      printer.setTextSize(0, 0);
      printer.println('Please visit us at:');
      printer.println('www.yourrestaurant.com');
      printer.setTextNormal();
      printer.newLine();
      
      // QR Code placeholder (if you want to add later)
      // printer.println('Scan for feedback:');
      // printer.printQR('https://yourrestaurant.com/feedback');
      
      printer.newLine();
      printer.newLine();
      printer.cut();

      await printer.execute();
      return { success: true, message: 'Receipt printed successfully' };
    } catch (error) {
      console.error('Print receipt error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Calculate tax rate percentage
   */
  static calculateTaxRate(subtotal, tax) {
    if (subtotal === 0) return 0;
    return ((tax / subtotal) * 100).toFixed(1);
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
      
      // Header
      printer.alignCenter();
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println('KITCHEN ORDER');
      printer.bold(false);
      printer.drawLine();
      
      // Order Info
      printer.alignLeft();
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println(`Order #${orderData.id}`);
      printer.bold(false);
      printer.setTextNormal();
      printer.println(`Time: ${new Date(orderData.created_at).toLocaleTimeString()}`);
      if (tableInfo) {
        printer.bold(true);
        printer.setTextSize(1, 1);
        printer.println(`TABLE: ${tableInfo.table_no}`);
        printer.setTextNormal();
        printer.bold(false);
        if (tableInfo.waiter_name) {
          printer.println(`Waiter: ${tableInfo.waiter_name}`);
        }
      }
      printer.drawLine();
      
      // Items
      if (orderData.details && orderData.details.length > 0) {
        orderData.details.forEach(item => {
          printer.bold(true);
          printer.setTextSize(1, 1);
          printer.println(`${item.qty}x ${item.product_name || item.name || 'Item'}`);
          printer.setTextNormal();
          printer.bold(false);
          
          // Print notes if any
          if (item.notes) {
            printer.println(`  ** ${item.notes} **`);
          }
          printer.newLine();
        });
      }
      
      printer.drawLine();
      
      // Footer
      if (orderData.note) {
        printer.bold(true);
        printer.println(`ORDER NOTE:`);
        printer.bold(false);
        printer.println(orderData.note);
        printer.drawLine();
      }
      
      printer.newLine();
      printer.newLine();
      printer.cut();

      await printer.execute();
      return { success: true, message: 'Kitchen order printed successfully' };
    } catch (error) {
      console.error('Print kitchen order error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Print custom text
   */
  static async printCustom(printerId, text) {
    try {
      const printerConfig = Printer.getById(printerId);
      if (!printerConfig) {
        throw new Error('Printer not found');
      }

      const printer = this.createPrinterInstance(printerConfig);
      
      printer.alignLeft();
      printer.println(text);
      printer.newLine();
      printer.newLine();
      printer.cut();

      await printer.execute();
      return { success: true, message: 'Custom text printed successfully' };
    } catch (error) {
      console.error('Print custom error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = PrinterService;
