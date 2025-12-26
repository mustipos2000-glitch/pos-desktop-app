const db = require('../config/database');

module.exports = {
  name: '20251222000000_create_member_fees_table',
  
  up: () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS member_fees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_fee REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created member_fees table');
  },

  down: () => {
    db.exec('DROP TABLE IF EXISTS member_fees');
    console.log('✅ Dropped member_fees table');
  }
};
