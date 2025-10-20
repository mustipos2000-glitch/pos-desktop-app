const db = require('../config/database');

class Category {
  static getAll() {
    const sql = 'SELECT * FROM categories';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(name, next_course = 0, in_web_shop = 0) {
    const sql = 'INSERT INTO categories (name, next_course, in_web_shop) VALUES (?, ?, ?)';
    const result = db.prepare(sql).run(name, next_course, in_web_shop);
    return { id: result.lastInsertRowid, name, next_course, in_web_shop };
  }

  static update(id, name, next_course = 0, in_web_shop = 0) {
    const sql = 'UPDATE categories SET name = ?, next_course = ?, in_web_shop = ? WHERE id = ?';
    db.prepare(sql).run(name, next_course, in_web_shop, id);
    return { id, name, next_course, in_web_shop };
  }

  static delete(id) {
    const sql = 'DELETE FROM categories WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Category;