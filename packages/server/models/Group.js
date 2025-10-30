const db = require('../config/database');

class Group {
  static getAll() {
    const sql = 'SELECT * FROM groups ORDER BY id ASC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM groups WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(name, is_visible = 0) {
    const sql = 'INSERT INTO groups (name, is_visible) VALUES (?, ?)';
    const result = db.prepare(sql).run(name, is_visible);
    return { id: result.lastInsertRowid, name, is_visible };
  }

  static update(id, name, is_visible = 0) {
    const sql = 'UPDATE groups SET name = ?, is_visible = ? WHERE id = ?';
    db.prepare(sql).run(name, is_visible, id);
    return { id, name, is_visible };
  }

  static delete(id) {
    const sql = 'DELETE FROM groups WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Group;
