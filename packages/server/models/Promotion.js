const db = require('../config/database');

class Promotion {
  static getAll() {
    const promotions = db.prepare(`
      SELECT * FROM promotions ORDER BY created_at DESC
    `).all();
    
    // Get products for each promotion with prices
    promotions.forEach(promo => {
      const products = db.prepare(`
        SELECT p.id, p.name, p.price
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
        SELECT p.id, p.name, p.price
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
    // Use datetime('now') for SQLite which handles local time properly
    console.log('🔍 Model: Checking promotion for product:', productId);
    
    // First, let's check if there's ANY promotion for this product (ignoring dates)
    const anyPromotion = db.prepare(`
      SELECT p.*, pp.product_id
      FROM promotions p
      INNER JOIN promotion_products pp ON p.id = pp.promotion_id
      WHERE pp.product_id = ?
    `).all(productId);
    
    console.log('📋 Model: All promotions for this product:', anyPromotion);
    
    const sql = `
      SELECT p.*
      FROM promotions p
      INNER JOIN promotion_products pp ON p.id = pp.promotion_id
      WHERE pp.product_id = ?
      AND p.is_active = 1
      AND (p.start_date IS NULL OR datetime(p.start_date) <= datetime('now', 'localtime'))
      AND (p.end_date IS NULL OR datetime(p.end_date) >= datetime('now', 'localtime'))
      ORDER BY p.discount_value DESC
      LIMIT 1
    `;
    const promotion = db.prepare(sql).get(productId);
    
    console.log('📦 Model: Active promotion query result:', promotion);
    
    if (promotion) {
      // Get all products in this promotion
      const products = db.prepare(`
        SELECT p.id, p.name, p.price
        FROM products p
        INNER JOIN promotion_products pp ON p.id = pp.product_id
        WHERE pp.promotion_id = ?
      `).all(promotion.id);
      
      promotion.products = products;
      promotion.product_ids = products.map(p => p.id);
      
      console.log('✅ Model: Promotion with products:', {
        name: promotion.name,
        products: products.map(p => p.name).join(', ')
      });
    } else {
      console.log('⚠️ Model: No active promotion found (check dates and is_active)');
    }
    
    return promotion;
  }

  static getActiveBillPromotion() {
    console.log('🔍 Model: Checking for active bill-level promotion');
    
    const sql = `
      SELECT p.*
      FROM promotions p
      WHERE p.apply_to = 'entire_order'
      AND p.is_active = 1
      AND (p.start_date IS NULL OR datetime(p.start_date) <= datetime('now', 'localtime'))
      AND (p.end_date IS NULL OR datetime(p.end_date) >= datetime('now', 'localtime'))
      ORDER BY p.discount_value DESC
      LIMIT 1
    `;
    const promotion = db.prepare(sql).get();
    
    console.log('📦 Model: Active bill promotion:', promotion);
    
    return promotion;
  }

  static create(promotion) {
    // Check for overlapping promotions on the same products
    if (promotion.apply_to !== 'entire_order' && promotion.product_ids && promotion.product_ids.length > 0) {
      const overlappingCheck = db.prepare(`
        SELECT p.name as promotion_name, prod.name as product_name
        FROM promotions p
        INNER JOIN promotion_products pp ON p.id = pp.promotion_id
        INNER JOIN products prod ON pp.product_id = prod.id
        WHERE pp.product_id IN (${promotion.product_ids.map(() => '?').join(',')})
        AND p.is_active = 1
        AND p.apply_to = 'specific_products'
        AND (
          (? IS NULL OR p.end_date IS NULL OR datetime(?) <= datetime(p.end_date))
          AND (? IS NULL OR p.start_date IS NULL OR datetime(?) >= datetime(p.start_date))
        )
        LIMIT 1
      `).get(...promotion.product_ids, promotion.start_date, promotion.start_date, promotion.end_date, promotion.end_date);
      
      if (overlappingCheck) {
        throw new Error(`Product "${overlappingCheck.product_name}" already has an active promotion "${overlappingCheck.promotion_name}" during this time period. Please choose different dates or deactivate the existing promotion.`);
      }
    }
    
    const sql = `
      INSERT INTO promotions (
        name, discount_type, discount_value,
        start_date, end_date, is_active, apply_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      promotion.name,
      promotion.discount_type || 'percentage',
      promotion.discount_value || 0,
      promotion.start_date || null,
      promotion.end_date || null,
      promotion.is_active !== undefined ? promotion.is_active : 1,
      promotion.apply_to || 'specific_products'
    ];

    const result = db.prepare(sql).run(...params);
    const promotionId = result.lastInsertRowid;
    
    // Insert product associations (only for specific_products)
    if (promotion.apply_to !== 'entire_order' && promotion.product_ids && promotion.product_ids.length > 0) {
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
    // Check for overlapping promotions on the same products (excluding current promotion)
    if (promotion.apply_to !== 'entire_order' && promotion.product_ids && promotion.product_ids.length > 0) {
      const overlappingCheck = db.prepare(`
        SELECT p.name as promotion_name, prod.name as product_name
        FROM promotions p
        INNER JOIN promotion_products pp ON p.id = pp.promotion_id
        INNER JOIN products prod ON pp.product_id = prod.id
        WHERE pp.product_id IN (${promotion.product_ids.map(() => '?').join(',')})
        AND p.id != ?
        AND p.is_active = 1
        AND p.apply_to = 'specific_products'
        AND (
          (? IS NULL OR p.end_date IS NULL OR datetime(?) <= datetime(p.end_date))
          AND (? IS NULL OR p.start_date IS NULL OR datetime(?) >= datetime(p.start_date))
        )
        LIMIT 1
      `).get(...promotion.product_ids, id, promotion.start_date, promotion.start_date, promotion.end_date, promotion.end_date);
      
      if (overlappingCheck) {
        throw new Error(`Product "${overlappingCheck.product_name}" already has an active promotion "${overlappingCheck.promotion_name}" during this time period. Please choose different dates or deactivate the existing promotion.`);
      }
    }
    
    const sql = `
      UPDATE promotions SET
        name = ?,
        discount_type = ?,
        discount_value = ?,
        start_date = ?,
        end_date = ?,
        is_active = ?,
        apply_to = ?
      WHERE id = ?
    `;

    const params = [
      promotion.name,
      promotion.discount_type || 'percentage',
      promotion.discount_value || 0,
      promotion.start_date || null,
      promotion.end_date || null,
      promotion.is_active !== undefined ? promotion.is_active : 1,
      promotion.apply_to || 'specific_products',
      id
    ];

    db.prepare(sql).run(...params);
    
    // Update product associations
    // First, delete existing associations
    db.prepare('DELETE FROM promotion_products WHERE promotion_id = ?').run(id);
    
    // Then insert new associations (only for specific_products)
    if (promotion.apply_to !== 'entire_order' && promotion.product_ids && promotion.product_ids.length > 0) {
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
