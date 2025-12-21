const db = require('../config/database');

const name = '20251219000000_create_promotions_table';

function up() {
  console.log('Creating promotions table...');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      product_id INTEGER NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value REAL NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `;
  
  db.exec(sql);
  console.log('✅ Promotions table created successfully');
}

function down() {
  console.log('Dropping promotions table...');
  db.exec('DROP TABLE IF EXISTS promotions');
  console.log('✅ Promotions table dropped');
}

module.exports = { name, up, down };
