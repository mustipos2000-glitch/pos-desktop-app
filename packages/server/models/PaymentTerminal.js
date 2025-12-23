const db = require('../config/database');

// Create payment_terminals table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS payment_terminals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    connection_type TEXT NOT NULL,
    connection_string TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class PaymentTerminal {
  static getAll() {
    const sql = 'SELECT * FROM payment_terminals ORDER BY created_at DESC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM payment_terminals WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static getByType(type) {
    const sql = 'SELECT * FROM payment_terminals WHERE type = ? AND enabled = 1';
    return db.prepare(sql).get(type);
  }

  static create(data) {
    const { name, type, connection_type, connection_string, enabled = 1 } = data;
    const sql = `
      INSERT INTO payment_terminals (name, type, connection_type, connection_string, enabled)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(name, type, connection_type, connection_string, enabled);
    return this.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const { name, type, connection_type, connection_string, enabled } = data;
    const sql = `
      UPDATE payment_terminals 
      SET name = ?, type = ?, connection_type = ?, connection_string = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = db.prepare(sql).run(name, type, connection_type, connection_string, enabled, id);
    return result.changes > 0 ? this.getById(id) : null;
  }

  static delete(id) {
    const sql = 'DELETE FROM payment_terminals WHERE id = ?';
    const result = db.prepare(sql).run(id);
    return result.changes > 0;
  }
}

module.exports = PaymentTerminal;
