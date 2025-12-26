/**
 * Migration: Add is_main column to printers table
 * Allows marking one printer as the main/default printer
 */

const db = require('../config/database');

module.exports = {
  name: '20251216000000-add-is-main-to-printers',
  up: () => {
    console.log('Checking if is_main column exists in printers table...');
    
    // Check if column already exists
    const columns = db.prepare('PRAGMA table_info(printers)').all();
    const hasIsMain = columns.some(col => col.name === 'is_main');
    
    if (hasIsMain) {
      console.log('✅ is_main column already exists, skipping...');
      return;
    }
    
    console.log('Adding is_main column to printers table...');
    
    // Add is_main column with default value 0 (false)
    db.exec(`
      ALTER TABLE printers ADD COLUMN is_main INTEGER DEFAULT 0
    `);
    
    console.log('✅ is_main column added successfully');
  }
};
