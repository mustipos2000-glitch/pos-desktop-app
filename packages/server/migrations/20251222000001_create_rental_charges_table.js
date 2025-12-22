const db = require('../config/database');

module.exports = {
  name: '20251222000001_create_rental_charges_table',
  
  up: () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS rental_charges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rental_charge REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created rental_charges table');
  },

  down: () => {
    db.exec('DROP TABLE IF EXISTS rental_charges');
    console.log('✅ Dropped rental_charges table');
  }
};
