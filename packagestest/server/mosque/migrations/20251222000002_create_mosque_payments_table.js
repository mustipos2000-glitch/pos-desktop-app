const db = require('../../config/database');

module.exports = {
  name: '20251222000002_create_mosque_payments_table',
  
  up: () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS mosque_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE NOT NULL,
        member_id INTEGER,
        member_name TEXT,
        payment_type TEXT NOT NULL,
        payment_subtype TEXT,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        sadaka_goal TEXT,
        sadaka_type TEXT,
        rent_start_date TEXT,
        rent_start_time TEXT,
        rent_end_date TEXT,
        rent_end_time TEXT,
        is_half_payment INTEGER DEFAULT 0,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Created mosque_payments table');
  },

  down: () => {
    db.exec('DROP TABLE IF EXISTS mosque_payments');
    console.log('✅ Dropped mosque_payments table');
  }
};