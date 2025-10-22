const db = require('../config/database');

class Category {
  static getAll() {
    const sql = 'SELECT * FROM categories ORDER BY display_order ASC, id ASC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(name, next_course = 0, in_web_shop = 0) {
    // Get the max display_order and add 1
    const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM categories').get();
    const display_order = (maxOrder.max || 0) + 1;
    
    const sql = 'INSERT INTO categories (name, next_course, in_web_shop, display_order) VALUES (?, ?, ?, ?)';
    const result = db.prepare(sql).run(name, next_course, in_web_shop, display_order);
    return { id: result.lastInsertRowid, name, next_course, in_web_shop, display_order };
  }

  static update(id, name, next_course = 0, in_web_shop = 0) {
    const sql = 'UPDATE categories SET name = ?, next_course = ?, in_web_shop = ? WHERE id = ?';
    db.prepare(sql).run(name, next_course, in_web_shop, id);
    return { id, name, next_course, in_web_shop };
  }

  static delete(id) {
    // Check if category has products
    const checkProducts = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
    const productCount = db.prepare(checkProducts).get(id);
    
    if (productCount.count > 0) {
      throw new Error(`Cannot delete category: ${productCount.count} product(s) are using this category`);
    }

    // Check if category has sub-products
    const checkSubProducts = 'SELECT COUNT(*) as count FROM sub_products WHERE category_id = ?';
    const subProductCount = db.prepare(checkSubProducts).get(id);
    
    if (subProductCount.count > 0) {
      throw new Error(`Cannot delete category: ${subProductCount.count} sub-product(s) are using this category`);
    }

    const sql = 'DELETE FROM categories WHERE id = ?';
    return db.prepare(sql).run(id);
  }

  static moveUp(id) {
    const current = this.getById(id);
    if (!current) return null;

    // Find the category with the next lower display_order
    const sql = 'SELECT * FROM categories WHERE display_order < ? ORDER BY display_order DESC LIMIT 1';
    const previous = db.prepare(sql).get(current.display_order);
    
    if (!previous) return null; // Already at the top

    // Swap display_order values
    const updateCurrent = 'UPDATE categories SET display_order = ? WHERE id = ?';
    const updatePrevious = 'UPDATE categories SET display_order = ? WHERE id = ?';
    
    db.prepare(updateCurrent).run(previous.display_order, current.id);
    db.prepare(updatePrevious).run(current.display_order, previous.id);
    
    return { current, previous };
  }

  static moveDown(id) {
    const current = this.getById(id);
    if (!current) return null;

    // Find the category with the next higher display_order
    const sql = 'SELECT * FROM categories WHERE display_order > ? ORDER BY display_order ASC LIMIT 1';
    const next = db.prepare(sql).get(current.display_order);
    
    if (!next) return null; // Already at the bottom

    // Swap display_order values
    const updateCurrent = 'UPDATE categories SET display_order = ? WHERE id = ?';
    const updateNext = 'UPDATE categories SET display_order = ? WHERE id = ?';
    
    db.prepare(updateCurrent).run(next.display_order, current.id);
    db.prepare(updateNext).run(current.display_order, next.id);
    
    return { current, next };
  }
}

module.exports = Category;