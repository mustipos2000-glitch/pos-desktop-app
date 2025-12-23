const db = require('../config/database');

// Create members table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT UNIQUE,
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
      WHERE full_name LIKE ? OR phone LIKE ? OR member_id LIKE ?
      ORDER BY created_at DESC
    `;
    const term = `%${searchTerm}%`;
    return db.prepare(sql).all(term, term, term);
  }

  static getNextMemberId() {
    // Get the highest member_id
    const sql = 'SELECT member_id FROM members WHERE member_id IS NOT NULL ORDER BY CAST(member_id AS INTEGER) DESC LIMIT 1';
    const result = db.prepare(sql).get();
    
    if (!result || !result.member_id) {
      return '0001'; // Start from 0001
    }
    
    // Increment the member_id
    const currentId = parseInt(result.member_id, 10);
    const nextId = currentId + 1;
    return String(nextId).padStart(4, '0');
  }

  static create(full_name, phone = '', email = '', address = '', member_id = null) {
    // If member_id is not provided, generate the next one
    if (!member_id) {
      member_id = this.getNextMemberId();
    }
    
    const sql = `
      INSERT INTO members (member_id, full_name, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = db.prepare(sql).run(member_id, full_name, phone, email, address);
    return this.getById(result.lastInsertRowid);
  }

  static update(id, full_name, phone = '', email = '', address = '', member_id = null) {
    let sql, params;
    
    if (member_id) {
      sql = `
        UPDATE members 
        SET member_id = ?, full_name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [member_id, full_name, phone, email, address, id];
    } else {
      sql = `
        UPDATE members 
        SET full_name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [full_name, phone, email, address, id];
    }
    
    const result = db.prepare(sql).run(...params);
    return result.changes > 0 ? this.getById(id) : null;
  }

  static delete(id) {
    const sql = 'DELETE FROM members WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Member;
