const db = require('../config/database');

class Room {
  static getAll() {
    const sql = 'SELECT * FROM rooms ORDER BY id ASC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM rooms WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(name, total_table = 0) {
    const sql = 'INSERT INTO rooms (name, total_table) VALUES (?, ?)';
    const result = db.prepare(sql).run(name, total_table);
    return { id: result.lastInsertRowid, name, total_table };
  }

  static update(id, name, total_table = 0) {
    const sql = 'UPDATE rooms SET name = ?, total_table = ? WHERE id = ?';
    db.prepare(sql).run(name, total_table, id);
    return { id, name, total_table };
  }

  static delete(id) {
    const sql = 'DELETE FROM rooms WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Room;
