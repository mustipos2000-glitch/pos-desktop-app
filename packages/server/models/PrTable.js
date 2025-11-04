const db = require('../config/database');

class PrTable {
  static getAll() {
    const sql = `
      SELECT pt.*, r.name as room_name 
      FROM pr_table pt
      LEFT JOIN rooms r ON pt.room_id = r.id
      ORDER BY pt.id ASC
    `;
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = `
      SELECT pt.*, r.name as room_name 
      FROM pr_table pt
      LEFT JOIN rooms r ON pt.room_id = r.id
      WHERE pt.id = ?
    `;
    return db.prepare(sql).get(id);
  }

  static create(table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size) {
    const sql = 'INSERT INTO pr_table (table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const result = db.prepare(sql).run(table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size);
    return { id: result.lastInsertRowid, table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size };
  }

  static update(id, table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size) {
    const sql = 'UPDATE pr_table SET table_no = ?, room_id = ?, order_id = ?, status = ?, description = ?, customer_name = ?, waiter_name = ?, table_size = ? WHERE id = ?';
    db.prepare(sql).run(table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size, id);
    return { id, table_no, room_id, order_id, status, description, customer_name, waiter_name, table_size };
  }

  static delete(id) {
    const sql = 'DELETE FROM pr_table WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = PrTable;
