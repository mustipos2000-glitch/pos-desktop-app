const db = require('../config/database');

class Order {
    static create(order, details) {
        const insertOrder = db.prepare(`
      INSERT INTO orders (tax, status, note, gross_total, net_total, discount, table_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        const result = insertOrder.run(
            order.tax || 0,
            order.status || 'pending',
            order.note || '',
            order.sub_total || 0,
            order.total || 0,
            order.discount || 0,  // Now properly using the discount field
            order.table_id || null
        );

        const orderId = result.lastInsertRowid;

        if (details && details.length > 0) {
            const insertDetail = db.prepare(`
        INSERT INTO order_details (order_id, product_id, qty, total, notes, discount)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            const insertMany = db.transaction((rows) => {
                for (const row of rows) {
                    insertDetail.run(
                        orderId, 
                        row.product_id, 
                        row.qty, 
                        row.total,
                        row.notes || null,
                        row.discount || 0
                    );
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
        SET tax = ?, status = ?, note = ?, net_total = ?, gross_total = ?, discount = ?, table_id = ?
        WHERE id = ?
        `).run(
            payload.tax || 0,
            payload.status || 'pending',
            payload.note || '',
            payload.total || 0,
            payload.sub_total || 0,
            payload.discount || 0,  // Now properly using the discount field
            payload.table_id || null,
            id
        );

        // 🔁 Insert new order details
        const stmt = db.prepare(`
        INSERT INTO order_details (order_id, product_id, qty, total, notes, discount)
        VALUES (?, ?, ?, ?, ?, ?)
        `);
        const insertMany = db.transaction((items) => {
            for (const item of items) {
                stmt.run(
                    id, 
                    item.product_id, 
                    item.qty, 
                    item.total,
                    item.notes || null,
                    item.discount || 0
                );
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
            // Map database column names to expected property names
            order.sub_total = order.gross_total;
            order.total = order.net_total;
            // discount field is already correctly named
            delete order.gross_total;
            delete order.net_total;
            
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
        
        // Map database column names to expected property names
        order.sub_total = order.gross_total;
        order.total = order.net_total;
        // discount field is already correctly named
        delete order.gross_total;
        delete order.net_total;
        
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

    static getByTableId(tableId) {
        const order = db.prepare('SELECT * FROM orders WHERE table_id = ? AND status = ? ORDER BY id DESC LIMIT 1').get(tableId, 'send_kitchen');
        if (!order) return null;
        
        // Map database column names to expected property names
        order.sub_total = order.gross_total;
        order.total = order.net_total;
        delete order.gross_total;
        delete order.net_total;
        
        order.details = db
            .prepare(
                `SELECT od.*, p.name as product_name, p.price, p.color, p.image
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id
         WHERE od.order_id = ?`
            )
            .all(order.id);
        return order;
    }
}

module.exports = Order;