/**
 * Migration: Create cash_drawers table
 * Stores cash drawer configurations for POS system
 */

const db = require('../config/database');

module.exports = {
  name: '009-create-cash-drawers',
  up: () => {
    console.log('Running migration: 009-create-cash-drawers');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS cash_drawers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        connection_type TEXT NOT NULL DEFAULT 'printer',
        ip_address TEXT,
        port INTEGER,
        printer_id INTEGER,
        is_active INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE SET NULL
      )
    `;
    
    db.exec(sql);
    console.log('✅ Created cash_drawers table');
  }
};
