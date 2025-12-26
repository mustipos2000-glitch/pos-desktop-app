const db = require('../config/database');

class RentalCharge {
  static getAll() {
    const sql = 'SELECT * FROM rental_charges ORDER BY id ASC';
    return db.prepare(sql).all();
  }

  static getById(id) {
    const sql = 'SELECT * FROM rental_charges WHERE id = ?';
    return db.prepare(sql).get(id);
  }

  static create(rental_charge) {
    const sql = 'INSERT INTO rental_charges (rental_charge) VALUES (?)';
    const result = db.prepare(sql).run(rental_charge);
    return { id: result.lastInsertRowid, rental_charge };
  }

  static update(id, rental_charge) {
    const sql = 'UPDATE rental_charges SET rental_charge = ? WHERE id = ?';
    db.prepare(sql).run(rental_charge, id);
    return { id, rental_charge };
  }

  static delete(id) {
    const sql = 'DELETE FROM rental_charges WHERE id = ?';
    return db.prepare(sql).run(id);
  }
}

module.exports = RentalCharge;
