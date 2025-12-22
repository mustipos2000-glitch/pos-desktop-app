const db = require('../config/database');

class MosquePayment {
  static getAll() {
    const sql = 'SELECT * FROM mosque_payments ORDER BY created_at DESC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM mosque_payments WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static getByTransactionId(transactionId) {
    const sql = 'SELECT * FROM mosque_payments WHERE transaction_id = ?';
    return db.prepare(sql).get(transactionId);
  }

  static getByMemberId(memberId) {
    const sql = 'SELECT * FROM mosque_payments WHERE member_id = ? ORDER BY created_at DESC';
    return db.prepare(sql).all(memberId);
  }

  static create(paymentData) {
    const {
      transaction_id,
      member_id,
      member_name,
      payment_type,
      payment_subtype,
      amount,
      payment_method,
      sadaka_goal,
      sadaka_type,
      rent_start_date,
      rent_start_time,
      rent_end_date,
      rent_end_time,
      is_half_payment,
      status = 'completed'
    } = paymentData;

    const sql = `
      INSERT INTO mosque_payments (
        transaction_id, member_id, member_name, payment_type, payment_subtype,
        amount, payment_method, sadaka_goal, sadaka_type,
        rent_start_date, rent_start_time, rent_end_date, rent_end_time,
        is_half_payment, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(sql).run(
      transaction_id,
      member_id || null,
      member_name || null,
      payment_type,
      payment_subtype || null,
      amount,
      payment_method,
      sadaka_goal || null,
      sadaka_type || null,
      rent_start_date || null,
      rent_start_time || null,
      rent_end_date || null,
      rent_end_time || null,
      is_half_payment ? 1 : 0,
      status
    );

    return { id: result.lastInsertRowid, ...paymentData };
  }

  static update(id, paymentData) {
    const {
      status,
      payment_method,
      amount
    } = paymentData;

    const sql = `
      UPDATE mosque_payments 
      SET status = ?, payment_method = ?, amount = ?
      WHERE id = ?
    `;

    db.prepare(sql).run(status, payment_method, amount, id);
    return { id, ...paymentData };
  }

  static delete(id) {
    const sql = 'DELETE FROM mosque_payments WHERE id = ?';
    return db.prepare(sql).run(id);
  }

  // Get statistics
  static getStatsByType(startDate, endDate) {
    const sql = `
      SELECT 
        payment_type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM mosque_payments
      WHERE created_at BETWEEN ? AND ?
      GROUP BY payment_type
    `;
    return db.prepare(sql).all(startDate, endDate);
  }

  static getStatsByMethod(startDate, endDate) {
    const sql = `
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM mosque_payments
      WHERE created_at BETWEEN ? AND ?
      GROUP BY payment_method
    `;
    return db.prepare(sql).all(startDate, endDate);
  }
}

module.exports = MosquePayment;
