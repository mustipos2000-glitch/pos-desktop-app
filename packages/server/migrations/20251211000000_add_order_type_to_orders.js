const db = require('../config/database');

// Migration to add order_type column to orders table
module.exports = {
  name: '20251211000000_add_order_type_to_orders',
  
  up: () => {
    try {
      // Add order_type column
      db.exec(`ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'horeca'`);
      console.log('✅ Added order_type column to orders table');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('⚠️ order_type column already exists');
      } else {
        throw err;
      }
    }
  },

  down: () => {
    // SQLite doesn't support DROP COLUMN easily, so we skip it
    console.log('⚠️ Rollback not supported for this migration');
  }
};
