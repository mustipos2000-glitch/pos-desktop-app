const db = require('../config/database');

module.exports = {
  name: '20251208000000_add_order_no_to_orders',
  up: () => {
    console.log('Running migration: add order_no to orders');
    
    // Check if column already exists
    const tableInfo = db.prepare('PRAGMA table_info(orders)').all();
    const hasOrderNo = tableInfo.some(col => col.name === 'order_no');
    
    if (!hasOrderNo) {
      db.exec(`ALTER TABLE orders ADD COLUMN order_no TEXT`);
      console.log('✅ Added order_no column to orders table');
      
      // Generate order_no for existing orders
      const existingOrders = db.prepare('SELECT id FROM orders WHERE order_no IS NULL').all();
      const updateStmt = db.prepare('UPDATE orders SET order_no = ? WHERE id = ?');
      
      existingOrders.forEach((order, index) => {
        const orderNo = `ORD-${String(order.id).padStart(6, '0')}`;
        updateStmt.run(orderNo, order.id);
      });
      
      console.log(`✅ Generated order_no for ${existingOrders.length} existing orders`);
    } else {
      console.log('⚠️ order_no column already exists in orders table');
    }
  }
};
