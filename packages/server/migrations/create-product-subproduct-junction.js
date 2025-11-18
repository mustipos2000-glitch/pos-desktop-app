const db = require('../config/database');

// Create junction table for many-to-many relationship between products and sub_products
console.log('Creating product_sub_products junction table...');

try {
  // Create the junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_sub_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      sub_product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY(sub_product_id) REFERENCES sub_products(id) ON DELETE CASCADE,
      UNIQUE(product_id, sub_product_id)
    )
  `);
  console.log('✅ Junction table created successfully');

  // Migrate existing data from sub_products.product_id to junction table
  const existingRelations = db.prepare(`
    SELECT id, product_id FROM sub_products WHERE product_id IS NOT NULL
  `).all();

  if (existingRelations.length > 0) {
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO product_sub_products (product_id, sub_product_id)
      VALUES (?, ?)
    `);

    const migrateMany = db.transaction((relations) => {
      for (const relation of relations) {
        insertStmt.run(relation.product_id, relation.id);
      }
    });

    migrateMany(existingRelations);
    console.log(`✅ Migrated ${existingRelations.length} existing relationships to junction table`);
  }

  console.log('✅ Migration completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
