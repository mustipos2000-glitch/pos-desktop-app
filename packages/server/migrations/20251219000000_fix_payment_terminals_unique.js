// Migration: Remove UNIQUE constraint from payment_terminals.type column
const db = require('../config/database');

module.exports = {
  name: 'fix-payment-terminals-unique',
  up: () => {
    console.log('Running migration: fix-payment-terminals-unique');
    
    try {
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='payment_terminals'
      `).get();
      
      if (!tableExists) {
        console.log('✅ Table does not exist yet, no migration needed');
        return;
      }
      
      // Get existing data
      const existingTerminals = db.prepare('SELECT * FROM payment_terminals').all();
      console.log(`📦 Found ${existingTerminals.length} existing terminals`);
      
      // Drop old table
      db.exec('DROP TABLE IF EXISTS payment_terminals');
      console.log('🗑️  Dropped old table');
      
      // Create new table without UNIQUE constraint on type
      db.exec(`
        CREATE TABLE payment_terminals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          connection_type TEXT NOT NULL,
          connection_string TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created new table structure');
      
      // Restore data
      if (existingTerminals.length > 0) {
        const insertStmt = db.prepare(`
          INSERT INTO payment_terminals (id, name, type, connection_type, connection_string, enabled, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const terminal of existingTerminals) {
          insertStmt.run(
            terminal.id,
            terminal.name,
            terminal.type,
            terminal.connection_type,
            terminal.connection_string,
            terminal.enabled,
            terminal.created_at,
            terminal.updated_at
          );
        }
        console.log(`✅ Restored ${existingTerminals.length} terminals`);
      }
      
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
};
