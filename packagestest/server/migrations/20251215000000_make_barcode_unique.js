const db = require('../config/database');

// Migration: Make barcode column unique in products table
module.exports = {
  name: '20251215000000_make_barcode_unique',
  
  up: () => {
    try {
      // First, check if there are duplicate barcodes
      const duplicates = db.prepare(`
        SELECT barcode, COUNT(*) as count 
        FROM products 
        WHERE barcode IS NOT NULL AND barcode != ''
        GROUP BY barcode 
        HAVING count > 1
      `).all();

      if (duplicates.length > 0) {
        console.log('⚠️  Found duplicate barcodes. Clearing duplicates...');
        // Clear duplicate barcodes (keep first occurrence)
        duplicates.forEach(dup => {
          const products = db.prepare('SELECT id FROM products WHERE barcode = ? ORDER BY id').all(dup.barcode);
          // Keep first, clear rest
          for (let i = 1; i < products.length; i++) {
            db.prepare('UPDATE products SET barcode = NULL WHERE id = ?').run(products[i].id);
          }
        });
      }

      // Create unique index on barcode column
      db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode 
        ON products(barcode) 
        WHERE barcode IS NOT NULL AND barcode != ''
      `);

      console.log('✅ Migration: Made barcode column unique in products table');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  down: () => {
    try {
      db.exec('DROP INDEX IF EXISTS idx_products_barcode');
      console.log('✅ Rollback: Removed unique constraint from barcode column');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
