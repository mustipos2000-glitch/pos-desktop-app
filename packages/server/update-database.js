/**
 * Database Update Script
 * Adds updated_at column and trigger to orders table
 * Run this with: node update-database.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine database directory based on environment
let dbDir;
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  // Development: use project root database folder
  dbDir = path.join(__dirname, '../..', 'database');
} else {
  // Production: use user's app data directory
  const appDataDir = process.env.APPDATA ||
    (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') :
      path.join(os.homedir(), '.local', 'share'));
  dbDir = path.join(appDataDir, 'POS Desktop', 'database');
}

const dbPath = path.join(dbDir, 'pos.db');

console.log('📂 Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found!');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('🔄 Updating database schema...');

try {
  // Add updated_at column if it doesn't exist
  console.log('➕ Adding updated_at column...');
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN updated_at DATETIME`);
    console.log('✅ Added updated_at column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️  updated_at column already exists');
    } else {
      throw err;
    }
  }

  // Create trigger to automatically update updated_at
  console.log('➕ Creating trigger...');
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_orders_timestamp 
      AFTER UPDATE ON orders
      FOR EACH ROW
      BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
    console.log('✅ Created trigger update_orders_timestamp');
  } catch (err) {
    console.log('⚠️  Trigger creation note:', err.message);
  }

  // Update existing orders to have updated_at = created_at if null
  console.log('🔄 Updating existing orders...');
  const result = db.prepare(`
    UPDATE orders 
    SET updated_at = created_at 
    WHERE updated_at IS NULL
  `).run();
  console.log(`✅ Updated ${result.changes} existing orders`);

  console.log('\n✅ Database update completed successfully!');
  console.log('🔄 Please restart your server for changes to take effect.');

} catch (error) {
  console.error('❌ Error updating database:', error);
  process.exit(1);
} finally {
  db.close();
}
