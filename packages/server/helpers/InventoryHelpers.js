const db = require('../config/database');

const InventoryHelper = {

  getAvailableQty: (productId) => {
    // total inventory
    const inventory = db.prepare(`SELECT qty FROM inventory WHERE product_id = ?`).get(productId);
    const totalQty = inventory ? inventory.qty : 0;

    // used qty in orders
    const usedRow = db.prepare(`
      SELECT SUM(qty) as usedQty
      FROM order_details od
      JOIN orders o ON o.id = od.order_id
      WHERE od.product_id = ? AND o.status != 'cancelled'
    `).get(productId);

    const usedQty = usedRow ? usedRow.usedQty || 0 : 0;

    return totalQty - usedQty;
  }

};

module.exports = InventoryHelper;
