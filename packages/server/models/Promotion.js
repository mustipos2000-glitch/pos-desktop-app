const db = require('../config/database');

class Promotion {
  static getAll() {
    const promotions = db.prepare(`
      SELECT * FROM promotions ORDER BY created_at DESC
    `).all();
    
    // Get products for each promotion
    promotions.forEach(promo => {
      const products = db.prepare(`
        SELECT p.id, p.name
        FROM products p
        INNER JOIN promotion_products pp ON p.id = pp.product_id
        WHERE pp.promotion_id = ?
      `).all(promo.id);
      
      promo.products = products;
      promo.product_names = products.map(p => p.name).join(', ');
      promo.product_ids = products.map(p => p.id);
    });
    
    return promotions;
  }

  static getById(id) {
    const promotion = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);
    
    if (promotion) {
      const products = db.prepare(`
        SELECT p.id, p.name
        FROM products p
        INNER JOIN promotion_products pp ON p.id = pp.product_id
        WHERE pp.promotion_id = ?
      `).all(id);
      
      promotion.products = products;
      promotion.product_ids = products.map(p => p.id);
    }
    
    return promotion;
  }

  static getActiveByProductId(productId) {
    const sql = `
      SELECT p.*
      FROM promotions p
      INNER JOIN promotion_products pp ON p.id = pp.promotion_id
      WHERE pp.product_id = ?
      AND p.is_active = 1
      AND (p.start_date IS NULL OR p.start_date <= date('now'))
      AND (p.end_date IS NULL OR p.end_date >= date('now'))
      ORDER BY p.created_at DESC
      LIMIT 1
    `;
    return db.prepare(sql).get(productId);
  }

  static create(promotion) {
    const sql = `
      INSERT INTO promotions (
        name, discount_type, discount_value,
        start_date, end_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      promotion.name,
      promotion.discount_type || 'percentage',
      promotion.discount_value || 0,
      promotion.start_date || null,
      promotion.end_date || null,
      promotion.is_active !== undefined ? promotion.is_active : 1
    ];

    const result = db.prepare(sql).run(...params);
    const promotionId = result.lastInsertRowid;
    
    // Insert product associations
    if (promotion.product_ids && promotion.product_ids.length > 0) {
      const insertProduct = db.prepare(`
        INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)
      `);
      
      promotion.product_ids.forEach(productId => {
        insertProduct.run(promotionId, productId);
      });
    }
    
    return { id: promotionId, ...promotion };
  }

  static update(id, promotion) {
    const sql = `
      UPDATE promotions SET
        name = ?,
        discount_type = ?,
        discount_value = ?,
        start_date = ?,
        end_date = ?,
        is_active = ?
      WHERE id = ?
    `;

    const params = [
      promotion.name,
      promotion.discount_type || 'percentage',
      promotion.discount_value || 0,
      promotion.start_date || null,
      promotion.end_date || null,
      promotion.is_active !== undefined ? promotion.is_active : 1,
      id
    ];

    db.prepare(sql).run(...params);
    
    // Update product associations
    // First, delete existing associations
    db.prepare('DELETE FROM promotion_products WHERE promotion_id = ?').run(id);
    
    // Then insert new associations
    if (promotion.product_ids && promotion.product_ids.length > 0) {
      const insertProduct = db.prepare(`
        INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)
      `);
      
      promotion.product_ids.forEach(productId => {
        insertProduct.run(id, productId);
      });
    }
    
    return { id, ...promotion };
  }

  static delete(id) {
    const sql = 'DELETE FROM promotions WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = Promotion;
