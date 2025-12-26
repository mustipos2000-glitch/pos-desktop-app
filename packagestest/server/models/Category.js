const db = require('../config/database');

class Category {
  static getAll(filters = {}) {
    let sql = 'SELECT * FROM categories';
    const params = [];
    
    // Apply is_visible filter if provided
    if (filters.is_visible !== undefined && filters.is_visible !== null) {
      sql += ' WHERE is_visible = ?';
      params.push(filters.is_visible ? 1 : 0);
    }
    
    sql += ' ORDER BY display_order ASC, id ASC';
    
    return params.length > 0 
      ? db.prepare(sql).all(...params)
      : db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(name, next_course = 0, in_web_shop = 0, is_visible = 1) {
    // Get the max display_order and add 1
    const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM categories').get();
    const display_order = (maxOrder.max || 0) + 1;
    
    const sql = 'INSERT INTO categories (name, next_course, in_web_shop, display_order, is_visible) VALUES (?, ?, ?, ?, ?)';
    const result = db.prepare(sql).run(name, next_course, in_web_shop, display_order, is_visible ? 1 : 0);
    return { id: result.lastInsertRowid, name, next_course, in_web_shop, display_order, is_visible: is_visible ? 1 : 0 };
  }

  static update(id, name, next_course = 0, in_web_shop = 0, is_visible = 1) {
    const sql = 'UPDATE categories SET name = ?, next_course = ?, in_web_shop = ?, is_visible = ? WHERE id = ?';
    db.prepare(sql).run(name, next_course, in_web_shop, is_visible ? 1 : 0, id);
    return { id, name, next_course, in_web_shop, is_visible: is_visible ? 1 : 0 };
  }

  static delete(id) {
    // Check if category has products (including sub-products which are now in products table)
    const checkProducts = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
    const productCount = db.prepare(checkProducts).get(id);
    
    if (productCount.count > 0) {
      throw new Error(`Cannot delete category: ${productCount.count} product(s) are using this category`);
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