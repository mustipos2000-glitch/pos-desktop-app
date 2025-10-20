const db = require('../config/database');

class Order {
    static create(order, details) {
        const insertOrder = db.prepare(`
      INSERT INTO orders (tax, status, note, sub_total, total)
      VALUES (?, ?, ?, ?, ?)
    `);

        const result = insertOrder.run(
            order.tax || 0,
            order.status || 'pending',
            order.note || '',
            order.sub_total || 0,
            order.total || 0
        );

        const orderId = result.lastInsertRowid;

        if (details && details.length > 0) {
            const insertDetail = db.prepare(`
        INSERT INTO order_details (order_id, product_id, qty, total)
        VALUES (?, ?, ?, ?)
      `);
            const insertMany = db.transaction((rows) => {
                for (const row of rows) {
                    insertDetail.run(orderId, row.product_id, row.qty, row.total);
                }
            });
            insertMany(details);
        }

        return { id: orderId, ...order, details };
    }

    // ✅ FIXED: made static
    static update(id, payload, items) {
        const existing = Order.getById(id);
        if (!existing) return null;

        // 🧹 Delete only old order details
        db.prepare('DELETE FROM order_details WHERE order_id = ?').run(id);

        // 🆙 Update the order record
        db.prepare(`
        UPDATE orders
        SET tax = ?, status = ?, note = ?, total = ?, sub_total = ?
        WHERE id = ?
        `).run(
            payload.tax || 0,
            payload.status || 'pending',
            payload.note || '',
            payload.total || 0,
            payload.sub_total || 0,
            id
        );

        // 🔁 Insert new order details
        const stmt = db.prepare(`
        INSERT INTO order_details (order_id, product_id, qty, total)
        VALUES (?, ?, ?, ?)
        `);
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                stmt.run(id, item.product_id, item.qty, item.total);
            }
        });

        if (items && items.length > 0) {
            insertMany(items);
        }

        return Order.getById(id);
    }


    static getAll() {
        const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
        for (const order of orders) {
            order.details = db
                .prepare(
                    `SELECT od.*, p.name as product_name, p.price
           FROM order_details od
           LEFT JOIN products p ON od.product_id = p.id
           WHERE od.order_id = ?`
                )
                .all(order.id);
        }
        return orders;
    }

    static getById(id) {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
        if (!order) return null;
        order.details = db
            .prepare(
                `SELECT od.*, p.name as product_name, p.price
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id
         WHERE od.order_id = ?`
            )
            .all(id);
        return order;
    }

    static delete(id) {
        db.prepare('DELETE FROM order_details WHERE order_id = ?').run(id);
        db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    }
}

module.exports = Order;
