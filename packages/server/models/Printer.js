const db = require('../config/database');

class Printer {
  static getAll() {
    const sql = 'SELECT * FROM printers ORDER BY id ASC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM printers WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(printer) {
    const sql = `INSERT INTO printers (name, type, connection_string) VALUES (?, ?, ?)`;
    const params = [
      printer.name,
      printer.type,
      printer.connection_string || null
    ];
    const result = db.prepare(sql).run(...params);
    return { id: result.lastInsertRowid, ...printer };
  }

  static update(id, printer) {
    const sql = `UPDATE printers SET name = ?, type = ?, connection_string = ? WHERE id = ?`;
    const params = [
      printer.name,
      printer.type,
      printer.connection_string || null,
      id
    ];
    db.prepare(sql).run(...params);
    return { id, ...printer };
  }

  static delete(id) {
    const sql = 'DELETE FROM printers WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Printer;
