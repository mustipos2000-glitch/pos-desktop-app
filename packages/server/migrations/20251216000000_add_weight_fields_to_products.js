const db = require('../config/database');

const name = '20251216000000_add_weight_fields_to_products';

function up() {
  console.log('Adding weight-related fields to products table...');
  
  try {
    // Add is_weight_based column
    db.exec(`ALTER TABLE products ADD COLUMN is_weight_based INTEGER DEFAULT 0`);
    console.log('✅ Added is_weight_based column');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('❌ Failed to add is_weight_based column:', err.message);
    }
  }

  try {
    // Add weight_unit column (kg, g, lb, oz)
    db.exec(`ALTER TABLE products ADD COLUMN weight_unit TEXT DEFAULT 'kg'`);
    console.log('✅ Added weight_unit column');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('❌ Failed to add weight_unit column:', err.message);
    }
  }

  try {
    // Add price_per_unit column (price per kg/g/lb)
    db.exec(`ALTER TABLE products ADD COLUMN price_per_unit REAL DEFAULT 0`);
    console.log('✅ Added price_per_unit column');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('❌ Failed to add price_per_unit column:', err.message);
    }
  }

  try {
    // Add minimum_weight column
    db.exec(`ALTER TABLE products ADD COLUMN minimum_weight REAL DEFAULT 0`);
    console.log('✅ Added minimum_weight column');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('❌ Failed to add minimum_weight column:', err.message);
    }
  }

  try {
    // Add maximum_weight column
    db.exec(`ALTER TABLE products ADD COLUMN maximum_weight REAL DEFAULT 0`);
    console.log('✅ Added maximum_weight column');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('❌ Failed to add maximum_weight column:', err.message);
    }
  }

  try {
    // Add tare_weight column (container weight to subtract)
    db.exec(`ALTER TABLE products ADD COLUMN tare_weight REAL DEFAULT 0`);
    console.log('✅ Added tare_weight column');
  } catch (err) {
    if (!err.message.includes('duplicate column name')) {
      console.error('❌ Failed to add tare_weight column:', err.message);
    }
  }

  console.log('✅ Weight fields migration completed');
}

function down() {
  console.log('Removing weight-related fields from products table...');
  
  // Note: SQLite doesn't support DROP COLUMN, so we would need to recreate the table
  // For now, we'll just log that this would remove the columns
  console.log('⚠️  SQLite doesn\'t support DROP COLUMN. Weight fields will remain in table.');
}

module.exports = { name, up, down };