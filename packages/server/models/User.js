const db = require('../config/database');

// Create users table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pincode TEXT NOT NULL,
    social_security TEXT DEFAULT '',
    identification TEXT DEFAULT '',
    role TEXT DEFAULT 'User',
    avatar_color TEXT DEFAULT '#3b82f6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

class User {
  static getAll() {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(name, pincode, social_security = '', identification = '', role = 'User', avatar_color = '#3b82f6') {
    const sql = `
      INSERT INTO users (name, pincode, social_security, identification, role, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(name, pincode, social_security, identification, role, avatar_color);
    return this.getById(result.lastInsertRowid);
  }

  static update(id, name, pincode, social_security = '', identification = '', role = 'User', avatar_color = '#3b82f6') {
    const sql = `
      UPDATE users 
      SET name = ?, pincode = ?, social_security = ?, identification = ?, role = ?, avatar_color = ?
      WHERE id = ?
    `;
    const result = db.prepare(sql).run(name, pincode, social_security, identification, role, avatar_color, id);
    return result.changes > 0 ? this.getById(id) : null;
  }

  static delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    return db.prepare(sql).run(id);
  }

  static verifyPincode(userId, pincode) {
    const sql = 'SELECT * FROM users WHERE id = ? AND pincode = ?';
    return db.prepare(sql).get(userId, pincode);
  }
}

module.exports = User;