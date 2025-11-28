const db = require('../config/database');

module.exports = {
  name: '001-add-display-order',
  up: () => {
    console.log('Running migration: 001-add-display-order');
    
    // Get all categories ordered by ID
    const categories = db.prepare('SELECT id FROM categories ORDER BY id ASC').all();
    
    if (categories.length === 0) {
      console.log('No categories to migrate');
      return;
    }

    // Update each category with its display_order based on current position
    const updateStmt = db.prepare('UPDATE categories SET display_order = ? WHERE id = ?');
    
    categories.forEach((category, index) => {
      const displayOrder = index + 1;
      updateStmt.run(displayOrder, category.id);
    });

    console.log(`✅ Migrated ${categories.length} categories with display_order`);
  }
};
