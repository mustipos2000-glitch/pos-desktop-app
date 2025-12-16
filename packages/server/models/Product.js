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
        // Check if barcode already exists (if provided)
        if (product.barcode && product.barcode.trim() !== '') {
            const existing = db.prepare('SELECT id FROM products WHERE barcode = ?').get(product.barcode);
            if (existing) {
                throw new Error(`Barcode "${product.barcode}" already exists for another product`);
            }
        }

        const sql = `INSERT INTO products (
      name, button_name, production_name, price, vat_takeout, vat_eat_in,
      barcode, category_id, addition_type, display_index, in_web_shop,
      printer1, printer2, printer3, image, color, price_vat_inc, sub_product_group,
      is_weight_based, weight_unit, price_per_unit, minimum_weight, maximum_weight, tare_weight
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
            product.in_web_shop || 0,
            product.printer1 || null,
            product.printer2 || null,
            product.printer3 || null,
            product.image || null,
            product.color || '#3b82f6',
            product.price_vat_inc || 0,
            product.sub_product_group || 0,
            product.is_weight_based || 0,
            product.weight_unit || 'kg',
            product.price_per_unit || 0,
            product.minimum_weight || 0,
            product.maximum_weight || 0,
            product.tare_weight || 0
        ];

        const result = db.prepare(sql).run(...params);
        return { id: result.lastInsertRowid, ...product };
    }

    static update(id, product) {
        // Check if barcode already exists for another product (if provided)
        if (product.barcode && product.barcode.trim() !== '') {
            const existing = db.prepare('SELECT id FROM products WHERE barcode = ? AND id != ?').get(product.barcode, id);
            if (existing) {
                throw new Error(`Barcode "${product.barcode}" already exists for another product`);
            }
        }

        const sql = `UPDATE products SET
      name = ?, button_name = ?, production_name = ?, price = ?, vat_takeout = ?, vat_eat_in = ?,
      barcode = ?, category_id = ?, addition_type = ?, display_index = ?, in_web_shop = ?,
      printer1 = ?, printer2 = ?, printer3 = ?, image = ?, color = ?, price_vat_inc = ?, sub_product_group = ?,
      is_weight_based = ?, weight_unit = ?, price_per_unit = ?, minimum_weight = ?, maximum_weight = ?, tare_weight = ?
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
            product.in_web_shop || 0,
            product.printer1 || null,
            product.printer2 || null,
            product.printer3 || null,
            product.image || null,
            product.color || '#3b82f6',
            product.price_vat_inc || 0,
            product.sub_product_group || 0,
            product.is_weight_based || 0,
            product.weight_unit || 'kg',
            product.price_per_unit || 0,
            product.minimum_weight || 0,
            product.maximum_weight || 0,
            product.tare_weight || 0,
            id
        ];

        db.prepare(sql).run(...params);
        return { id, ...product };
    }

    static delete(id) {
        // Check if product has sub-products linked to it via junction table
        const checkSubProducts = 'SELECT COUNT(*) as count FROM product_sub_products WHERE product_id = ?';
        const subProductCount = db.prepare(checkSubProducts).get(id);
        
        if (subProductCount.count > 0) {
            throw new Error(`Cannot delete product: ${subProductCount.count} sub-product(s) are linked to this product`);
        }

        // Check if product is used in any orders
        const checkOrders = 'SELECT COUNT(*) as count FROM order_details WHERE product_id = ?';
        const orderCount = db.prepare(checkOrders).get(id);
        
        if (orderCount.count > 0) {
            throw new Error(`Cannot delete product: This product has been used in ${orderCount.count} order(s)`);
        }

        const sql = 'DELETE FROM products WHERE id = ?';
        return db.prepare(sql).run(id);
    }

    static getByBarcode(barcode) {
        const sql = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ?
    `;
        return db.prepare(sql).get(barcode);
    }
}

module.exports = Product;