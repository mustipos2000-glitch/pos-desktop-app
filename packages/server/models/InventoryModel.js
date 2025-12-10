const db = require('../config/database');

const InventoryModel = {

  create: (product_id, qty) => {
    const stmt = db.prepare(`INSERT INTO inventory (product_id, qty) VALUES (?, ?)`);
    const info = stmt.run(product_id, qty);
    return info.lastInsertRowid;
  },

  getById: (id) => {
    return db.prepare(`SELECT * FROM inventory WHERE id = ?`).get(id);
  },

  getAll: () => {
    return db.prepare(`
      SELECT i.id, i.product_id, p.name as product_name, i.qty
      FROM inventory i
      JOIN products p ON p.id = i.product_id
    `).all();
  },

  update: (id, qty) => {
    const stmt = db.prepare(`UPDATE inventory SET qty = ? WHERE id = ?`);
    const info = stmt.run(qty, id);
    return info.changes;
  },

  delete: (id) => {
    const stmt = db.prepare(`DELETE FROM inventory WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes;
  },

  getByProductId: (product_id) => {
    return db.prepare(`SELECT * FROM inventory WHERE product_id = ?`).get(product_id);
  }

};

module.exports = InventoryModel;
