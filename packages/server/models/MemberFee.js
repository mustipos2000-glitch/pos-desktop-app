const db = require('../config/database');

class MemberFee {
  static getAll() {
    const sql = 'SELECT * FROM member_fees ORDER BY id ASC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM member_fees WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(member_fee) {
    const sql = 'INSERT INTO member_fees (member_fee) VALUES (?)';
    const result = db.prepare(sql).run(member_fee);
    return { id: result.lastInsertRowid, member_fee };
  }

  static update(id, member_fee) {
    const sql = 'UPDATE member_fees SET member_fee = ? WHERE id = ?';
    db.prepare(sql).run(member_fee, id);
    return { id, member_fee };
  }

  static delete(id) {
    const sql = 'DELETE FROM member_fees WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = MemberFee;
