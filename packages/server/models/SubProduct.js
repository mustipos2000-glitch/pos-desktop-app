const db = require('../config/database');

// SubProduct model: basic CRUD operations
class SubProduct {
    static getAll(filters = {}) {
        let sql = `
      SELECT sp.*, c.name as category_name, g.name as group_name
      FROM sub_products sp
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN groups g ON sp.group_id = g.id
    `;
        
        const conditions = [];
        const params = [];

        // Filter by group_id if provided
        if (filters.group_id !== undefined && filters.group_id !== null) {
            conditions.push('sp.group_id = ?');
            params.push(filters.group_id);
        }

        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY sp.display_index ASC, sp.id ASC';

        return db.prepare(sql).all(...params);
    }

    static getById(id) {
        const sql = `
      SELECT sp.*, c.name as category_name, g.name as group_name
      FROM sub_products sp
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN groups g ON sp.group_id = g.id
      WHERE sp.id = ?
    `;
        return db.prepare(sql).get(id);
    }

    static getByProductId(productId) {
        const sql = `
      SELECT sp.*, c.name as category_name, g.name as group_name
      FROM sub_products sp
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN groups g ON sp.group_id = g.id
      INNER JOIN product_sub_products psp ON sp.id = psp.sub_product_id
      WHERE psp.product_id = ?
      ORDER BY sp.display_index ASC, sp.id ASC
    `;
        return db.prepare(sql).all(productId);
    }

    static create(subProduct) {
        const sql = `INSERT INTO sub_products (
      group_id, product_id, name, button_name, production_name, price, vat_takeout, vat_eat_in,
      barcode, category_id, addition_type, display_index, in_web_shop,
      printer1, printer2, printer3, image, color, price_vat_inc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            subProduct.group_id || null,
            subProduct.product_id || null,
            subProduct.name,
            subProduct.button_name || null,
            subProduct.production_name || null,
            subProduct.price || 0,
            subProduct.vat_takeout || 0,
            subProduct.vat_eat_in || 0,
            subProduct.barcode || null,
            subProduct.category_id || null,
            subProduct.addition_type || null,
            subProduct.display_index || 0,
            subProduct.in_web_shop || 0,
            subProduct.printer1 || null,
            subProduct.printer2 || null,
            subProduct.printer3 || null,
            subProduct.image || null,
            subProduct.color || '#3b82f6',
            subProduct.price_vat_inc || 0
        ];

        const result = db.prepare(sql).run(...params);
        return { id: result.lastInsertRowid, ...subProduct };
    }

    static update(id, subProduct) {
        const sql = `UPDATE sub_products SET
      group_id = ?, product_id = ?, name = ?, button_name = ?, production_name = ?, price = ?, vat_takeout = ?, vat_eat_in = ?,
      barcode = ?, category_id = ?, addition_type = ?, display_index = ?, in_web_shop = ?,
      printer1 = ?, printer2 = ?, printer3 = ?, image = ?, color = ?, price_vat_inc = ?
      WHERE id = ?`;

        const params = [
            subProduct.group_id || null,
            subProduct.product_id || null,
            subProduct.name,
            subProduct.button_name || null,
            subProduct.production_name || null,
            subProduct.price || 0,
            subProduct.vat_takeout || 0,
            subProduct.vat_eat_in || 0,
            subProduct.barcode || null,
            subProduct.category_id || null,
            subProduct.addition_type || null,
            subProduct.display_index || 0,
            subProduct.in_web_shop || 0,
            subProduct.printer1 || null,
            subProduct.printer2 || null,
            subProduct.printer3 || null,
            subProduct.image || null,
            subProduct.color || '#3b82f6',
            subProduct.price_vat_inc || 0,
            id
        ];

        db.prepare(sql).run(...params);
        return { id, ...subProduct };
    }

    static delete(id) {
        // Check if sub-product is used in any orders
        const checkOrders = 'SELECT COUNT(*) as count FROM order_details WHERE product_id = ?';
        const orderCount = db.prepare(checkOrders).get(id);
        
        if (orderCount.count > 0) {
            throw new Error(`Cannot delete sub-product: This sub-product has been used in ${orderCount.count} order(s)`);
        }

        const sql = 'DELETE FROM sub_products WHERE id = ?';
        return db.prepare(sql).run(id);
    }
}

module.exports = SubProduct;
