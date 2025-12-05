const db = require('../config/database');

// Create members table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class Member {
  static getAll() {
    const sql = 'SELECT * FROM members ORDER BY created_at DESC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM members WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static search(searchTerm) {
    const sql = `
      SELECT * FROM members 
      WHERE full_name LIKE ? OR phone LIKE ?
      ORDER BY created_at DESC
    `;
    const term = `%${searchTerm}%`;
    return db.prepare(sql).all(term, term);
  }

  static create(full_name, phone = '', email = '', address = '') {
    const sql = `
      INSERT INTO members (full_name, phone, email, address)
      VALUES (?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(full_name, phone, email, address);
    return this.getById(result.lastInsertRowid);
  }

  static update(id, full_name, phone = '', email = '', address = '') {
    const sql = `
      UPDATE members 
      SET full_name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const result = db.prepare(sql).run(full_name, phone, email, address, id);
    return result.changes > 0 ? this.getById(id) : null;
  }

  static delete(id) {
    const sql = 'DELETE FROM members WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Member;
