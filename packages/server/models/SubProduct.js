const db = require('../config/database');

// SubProduct model: basic CRUD operations
class SubProduct {
    static getAll() {
        const sql = `
      SELECT sp.*, c.name as category_name, p.name as product_name
      FROM sub_products sp
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN products p ON sp.product_id = p.id
      ORDER BY sp.display_index ASC, sp.id ASC
    `;
        return db.prepare(sql).all();
    }

    static getById(id) {
        const sql = `
      SELECT sp.*, c.name as category_name, p.name as product_name
      FROM sub_products sp
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN products p ON sp.product_id = p.id
      WHERE sp.id = ?
    `;
        return db.prepare(sql).get(id);
    }

    static getByProductId(productId) {
        const sql = `
      SELECT sp.*, c.name as category_name, p.name as product_name
      FROM sub_products sp
      LEFT JOIN categories c ON sp.category_id = c.id
      LEFT JOIN products p ON sp.product_id = p.id
      WHERE sp.product_id = ?
      ORDER BY sp.display_index ASC, sp.id ASC
    `;
        return db.prepare(sql).all(productId);
    }

    static create(subProduct) {
        const sql = `INSERT INTO sub_products (
      product_id, name, button_name, production_name, price, vat_takeout, vat_eat_in,
      barcode, category_id, addition_type, display_index, in_web_shop,
      printer1, printer2, printer3, image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
            subProduct.product_id,
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
            subProduct.image || null
        ];

        const result = db.prepare(sql).run(...params);
        return { id: result.lastInsertRowid, ...subProduct };
    }

    static update(id, subProduct) {
        const sql = `UPDATE sub_products SET
      product_id = ?, name = ?, button_name = ?, production_name = ?, price = ?, vat_takeout = ?, vat_eat_in = ?,
      barcode = ?, category_id = ?, addition_type = ?, display_index = ?, in_web_shop = ?,
      printer1 = ?, printer2 = ?, printer3 = ?, image = ?
      WHERE id = ?`;

        const params = [
            subProduct.product_id,
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
            id
        ];

        db.prepare(sql).run(...params);
        return { id, ...subProduct };
    }

    static delete(id) {
        const sql = 'DELETE FROM sub_products WHERE id = ?';
        return db.prepare(sql).run(id);
    }
}

module.exports = SubProduct;
