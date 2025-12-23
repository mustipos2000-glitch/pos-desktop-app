const db = require('../config/database');

/**
 * Migration: Create rental_bookings table
 * Stores rental bookings with date/time ranges and member information
 */
module.exports = {
  name: '20251223000000_create_rental_bookings_table',
  
  up: () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS rental_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        member_name TEXT NOT NULL,
        start_datetime TEXT NOT NULL,
        end_datetime TEXT NOT NULL,
        duration_hours INTEGER NOT NULL,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'active',
        transaction_id TEXT,
        payment_method TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ rental_bookings table created');
  },

  down: () => {
    db.exec('DROP TABLE IF EXISTS rental_bookings;');
    console.log('✅ rental_bookings table dropped');
  }
};
