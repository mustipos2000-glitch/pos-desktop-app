const db = require('../config/database');

// Product model: basic CRUD operations
class Product {
    static getAll() {
        const sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.display_index ASC, p.id ASC
    `;
        return db.prepare(sql).all();
    }

    static getById(id) {
        const sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
        return db.prepare(sql).get(id);
    }

    static create(product) {
        const sql = `INSERT INTO products (
      name, button_name, production_name, price, vat_takeout, vat_eat_in,
      barcode, category_id, addition_type, display_index, parent_id, in_web_shop,
      printer1, printer2, printer3, image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

        const params = [
            product.name,
            product.button_name || null,
            product.production_name || null,
            product.price || 0,
            product.vat_takeout || 0,
            product.vat_eat_in || 0,
            product.barcode || null,
            product.category_id || null,
            product.addition_type || null,
            product.display_index || 0,
            product.parent_id || null,
            product.in_web_shop || 0,
            product.printer1 || null,
            product.printer2 || null,
            product.printer3 || null,
            product.image || null // ✅ added
        ];

        const result = db.prepare(sql).run(...params);
        return { id: result.lastInsertRowid, ...product };
    }

    static update(id, product) {
        const sql = `UPDATE products SET
      name = ?, button_name = ?, production_name = ?, price = ?, vat_takeout = ?, vat_eat_in = ?,
      barcode = ?, category_id = ?, addition_type = ?, display_index = ?, parent_id = ?, in_web_shop = ?,
      printer1 = ?, printer2 = ?, printer3 = ?,  image = ?
      WHERE id = ?`;

        const params = [
            product.name,
            product.button_name || null,
            product.production_name || null,
            product.price || 0,
            product.vat_takeout || 0,
            product.vat_eat_in || 0,
            product.barcode || null,
            product.category_id || null,
            product.addition_type || null,
            product.display_index || 0,
            product.parent_id || null,
            product.in_web_shop || 0,
            product.printer1 || null,
            product.printer2 || null,
            product.printer3 || null,
             product.image || null,
            id
        ];

        db.prepare(sql).run(...params);
        return { id, ...product };
    }

    static delete(id) {
        const sql = 'DELETE FROM products WHERE id = ?';
        return db.prepare(sql).run(id);
    }
}

module.exports = Product;
