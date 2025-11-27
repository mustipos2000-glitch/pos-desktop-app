const db = require('./config/database');
try {
  // Get all categories ordered by ID
  const categories = db.prepare('SELECT id FROM categories ORDER BY id ASC').all();
  
  if (categories.length === 0) {
    process.exit(0);
  }

  // Update each category with its display_order based on current position
  const updateStmt = db.prepare('UPDATE categories SET display_order = ? WHERE id = ?');
  
  categories.forEach((category, index) => {
    const displayOrder = index + 1;
    updateStmt.run(displayOrder, category.id);
  });

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
