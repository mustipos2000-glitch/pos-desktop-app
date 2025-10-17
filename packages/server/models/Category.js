const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Create categories table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    next_course INTEGER DEFAULT 0,
    in_web_shop INTEGER DEFAULT 0
  )
`);

class Category {
  static getAll(callback) {
    const sql = 'SELECT * FROM categories';
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = 'SELECT * FROM categories WHERE id = ?';
    db.get(sql, [id], callback);
  }

  static create(name, next_course = 0, in_web_shop = 0, callback) {
    const sql = 'INSERT INTO categories (name, next_course, in_web_shop) VALUES (?, ?, ?)';
    db.run(sql, [name, next_course, in_web_shop], function(err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, { id: this.lastID, name, next_course, in_web_shop });
    });
  }

  static update(id, name, next_course = 0, in_web_shop = 0, callback) {
    const sql = 'UPDATE categories SET name = ?, next_course = ?, in_web_shop = ? WHERE id = ?';
    db.run(sql, [name, next_course, in_web_shop, id], function(err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, { id, name, next_course, in_web_shop });
    });
  }

  static delete(id, callback) {
    const sql = 'DELETE FROM categories WHERE id = ?';
    db.run(sql, [id], callback);
  }
}

module.exports = Category;