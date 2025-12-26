const db = require('../config/database');

module.exports = {
  name: '20251212000000_add_employee_id_to_orders',
  up: () => {
    console.log('Running migration: add employee_id to orders');
    
    // Check if column already exists
    const tableInfo = db.prepare('PRAGMA table_info(orders)').all();
    const hasEmployeeId = tableInfo.some(col => col.name === 'employee_id');
    
    if (!hasEmployeeId) {
      db.exec(`ALTER TABLE orders ADD COLUMN employee_id INTEGER`);
      console.log('✅ Added employee_id column to orders table');
    } else {
      console.log('⚠️ employee_id column already exists in orders table');
    }
  }
};
