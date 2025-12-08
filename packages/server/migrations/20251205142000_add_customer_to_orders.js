const db = require('../config/database');

module.exports = {
  name: '20251205142000_add_customer_to_orders',
  up: () => {
    console.log('Running migration: add customer_id to orders');
    
    // Check if column already exists
    const tableInfo = db.prepare('PRAGMA table_info(orders)').all();
    const hasCustomerId = tableInfo.some(col => col.name === 'customer_id');
    
    if (!hasCustomerId) {
      db.exec(`ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id)`);
      console.log('✅ Added customer_id column to orders table');
    } else {
      console.log('⚠️ customer_id column already exists in orders table');
    }
  }
};
