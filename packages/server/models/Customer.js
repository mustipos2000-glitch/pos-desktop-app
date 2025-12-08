const db = require('../config/database');

class Customer {
  static getAll() {
    const sql = 'SELECT * FROM customers ORDER BY created_at DESC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM customers WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static search(searchTerm) {
    const sql = `
      SELECT * FROM customers 
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY name ASC
      LIMIT 20
    `;
    const searchPattern = `%${searchTerm}%`;
    return db.prepare(sql).all(searchPattern, searchPattern, searchPattern);
  }

  static create(customerData) {
    const { name, phone, email, address, notes } = customerData;
    const sql = `
      INSERT INTO customers (name, phone, email, address, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    const result = db.prepare(sql).run(name, phone || null, email || null, address || null, notes || null);
    return { id: result.lastInsertRowid, ...customerData };
  }

  static update(id, customerData) {
    const { name, phone, email, address, notes } = customerData;
    const sql = `
      UPDATE customers 
      SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    db.prepare(sql).run(name, phone || null, email || null, address || null, notes || null, id);
    return { id, ...customerData };
  }

  static delete(id) {
    const sql = 'DELETE FROM customers WHERE id = ?';
    const result = db.prepare(sql).run(id);
    return { deleted: result.changes };
  }
}

module.exports = Customer;
