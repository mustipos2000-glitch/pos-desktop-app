const db = require('../config/database');

class Order {
    static create(order, details) {
        // Generate order_no
        const orderNo = `ORD-${String(Date.now()).slice(-6)}`;
        
        // Set completed_at if order is created with completed/paid status
        const status = order.status || 'pending';
        const completedAt = (status === 'completed' || status === 'paid') 
            ? new Date().toISOString() 
            : null;
    
        const insertOrder = db.prepare(`
      INSERT INTO orders (tax, status, note, gross_total, net_total, discount, table_id, customer_id, order_no, order_type, completed_at,employee_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `);

        const result = insertOrder.run(
            order.tax || 0,
            status,
            order.note || '',
            order.sub_total || 0,
            order.total || 0,
            order.discount || 0,  // Now properly using the discount field
            order.table_id || null,
            order.customer_id || null,
            orderNo,
            order.order_type || 'horeca',
            completedAt,
            order.employee_id || null
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
        return { id: orderId, order_no: orderNo, ...order, details };
    }

    // ✅ FIXED: made static
    static update(id, payload, items) {
        const existing = Order.getById(id);
        if (!existing) return null;

        // 🧹 Delete only old order details
        db.prepare('DELETE FROM order_details WHERE order_id = ?').run(id);

        // Check if status is changing to completed/paid and set completed_at
        const newStatus = payload.status || 'pending';
        const oldStatus = existing.status;
        let completedAt = existing.completed_at;
        
        // Set completed_at when order is marked as completed or paid for the first time
        if ((newStatus === 'completed' || newStatus === 'paid') && 
            (oldStatus !== 'completed' && oldStatus !== 'paid')) {
            completedAt = new Date().toISOString();
        }

        // 🆙 Update the order record
        db.prepare(`
        UPDATE orders
        SET tax = ?, status = ?, note = ?, net_total = ?, gross_total = ?, discount = ?, table_id = ?, customer_id = ?, order_type = ?, completed_at = ?, employee_id = ?
        WHERE id = ?
        `).run(
            payload.tax || 0,
            newStatus,
            newStatus,
            payload.note || '',
            payload.total || 0,
            payload.sub_total || 0,
            payload.discount || 0,  // Now properly using the discount field
            payload.table_id || null,
            payload.customer_id || null,
            payload.order_type || existing.order_type || 'horeca',
            completedAt,
            payload.employee_id || null,
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

    static getHoldOrders(employeeId = null) {
        let orders;
        if (employeeId) {
            orders = db.prepare('SELECT * FROM orders WHERE status = ? AND employee_id = ? ORDER BY id DESC').all('on_hold', employeeId);
        } else {
            orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY id DESC').all('on_hold');
        }
        
        for (const order of orders) {
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
        }
        return orders;
    }
}

module.exports = Order;