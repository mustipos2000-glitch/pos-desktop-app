/**
 * Test Barcodes Add Karne Ka Script
 * 
 * Ye script tumhare existing products mein test barcodes add kar dega
 * Taki tum barcode scanner test kar sako
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database', 'pos.db');

console.log('📦 Opening database:', dbPath);

let db;
try {
  db = new Database(dbPath);
  console.log('✅ Connected to database');
} catch (err) {
  console.error('❌ Error opening database:', err.message);
  process.exit(1);
}

// Test barcodes jo add karenge
const testBarcodes = [
  '1234567890',
  '9876543210',
  '1111111111',
  '2222222222',
  '3333333333',
  '4444444444',
  '5555555555',
  '6666666666',
  '7777777777',
  '8888888888'
];

// Function to add barcodes to products
function addTestBarcodes() {
  try {
    // First, get all products
    const products = db.prepare('SELECT id, name, barcode FROM products LIMIT 10').all();

    if (products.length === 0) {
      console.log('⚠️ No products found in database');
      return;
    }

    console.log(`\n📋 Found ${products.length} products\n`);

    // Update each product with a test barcode
    let updated = 0;
    let skipped = 0;

    const updateStmt = db.prepare('UPDATE products SET barcode = ? WHERE id = ?');

    products.forEach((product, index) => {
      const barcode = testBarcodes[index] || `TEST${Date.now()}${index}`;
      
      // Skip if product already has a barcode
      if (product.barcode && product.barcode.trim() !== '') {
        console.log(`⏭️  Skipped: ${product.name} (already has barcode: ${product.barcode})`);
        skipped++;
        return;
      }

      // Update product with barcode
      try {
        updateStmt.run(barcode, product.id);
        console.log(`✅ Added barcode ${barcode} to: ${product.name}`);
        updated++;
      } catch (err) {
        console.error(`❌ Error updating ${product.name}:`, err.message);
      }
    });

    console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}\n`);
  } catch (err) {
    console.error('❌ Error in addTestBarcodes:', err.message);
    throw err;
  }
}

// Function to show all products with barcodes
function showProductsWithBarcodes() {
  try {
    const products = db.prepare(
      "SELECT id, name, barcode, price FROM products WHERE barcode IS NOT NULL AND barcode != '' ORDER BY id"
    ).all();

    if (products.length === 0) {
      console.log('⚠️ No products with barcodes found');
      return;
    }

    console.log('\n📋 Products with Barcodes:\n');
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ ID │ Barcode      │ Name                    │ Price      │');
    console.log('├────────────────────────────────────────────────────────────┤');
    
    products.forEach(product => {
      const id = String(product.id).padEnd(3);
      const barcode = String(product.barcode || '').padEnd(13);
      const name = String(product.name || '').substring(0, 23).padEnd(23);
      const price = `€${(product.price || 0).toFixed(2)}`.padStart(10);
      console.log(`│ ${id}│ ${barcode}│ ${name}│ ${price} │`);
    });
    
    console.log('└────────────────────────────────────────────────────────────┘\n');
  } catch (err) {
    console.error('❌ Error in showProductsWithBarcodes:', err.message);
    throw err;
  }
}

// Main execution
function main() {
  try {
    console.log('\n🚀 Starting barcode addition...\n');
    
    // Add test barcodes
    addTestBarcodes();
    
    // Show all products with barcodes
    showProductsWithBarcodes();
    
    console.log('💡 Testing Tips:');
    console.log('   1. Open POS: http://localhost:3000');
    console.log('   2. Click "Barcode Search" button');
    console.log('   3. Type barcode fast (e.g., 1234567890) and press Enter');
    console.log('   4. Or use USB scanner to scan printed barcodes\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close database
    try {
      db.close();
      console.log('✅ Database connection closed\n');
    } catch (err) {
      console.error('❌ Error closing database:', err.message);
    }
  }
}

// Run the script
main();
