const db = require('../../config/database');

/**
 * RentalBooking Model
 * Handles rental bookings for space/kitchen rentals
 */
class RentalBooking {
  /**
   * Get all rental bookings
   */
  static getAll() {
    const stmt = db.prepare(`
      SELECT * FROM rental_bookings 
      ORDER BY start_datetime DESC
    `);
    return stmt.all();
  }

  /**
   * Get rental booking by ID
   */
  static getById(id) {
    const stmt = db.prepare('SELECT * FROM rental_bookings WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Get rental bookings by member ID
   */
  static getByMemberId(memberId) {
    const stmt = db.prepare(`
      SELECT * FROM rental_bookings 
      WHERE member_id = ? 
      ORDER BY start_datetime DESC
    `);
    return stmt.all(memberId);
  }

  /**
   * Check for overlapping bookings
   * Returns true if there's an overlap, false otherwise
   */
  static checkOverlap(startDatetime, endDatetime, excludeId = null) {
    let query = `
      SELECT COUNT(*) as count 
      FROM rental_bookings 
      WHERE status = 'active'
        AND (
          (start_datetime < ? AND end_datetime > ?)
          OR (start_datetime < ? AND end_datetime > ?)
          OR (start_datetime >= ? AND end_datetime <= ?)
        )
    `;
    
    const params = [endDatetime, startDatetime, endDatetime, endDatetime, startDatetime, endDatetime];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(query);
    const result = stmt.get(...params);
    return result.count > 0;
  }

  /**
   * Get overlapping bookings (for detailed error messages)
   */
  static getOverlappingBookings(startDatetime, endDatetime, excludeId = null) {
    let query = `
      SELECT * 
      FROM rental_bookings 
      WHERE status = 'active'
        AND (
          (start_datetime < ? AND end_datetime > ?)
          OR (start_datetime < ? AND end_datetime > ?)
          OR (start_datetime >= ? AND end_datetime <= ?)
        )
    `;
    
    const params = [endDatetime, startDatetime, endDatetime, endDatetime, startDatetime, endDatetime];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Create a new rental booking
   */
  static create(bookingData) {
    const {
      member_id,
      member_name,
      start_datetime,
      end_datetime,
      duration_hours,
      amount,
      transaction_id,
      payment_method,
      status = 'active'
    } = bookingData;

    // Check for overlaps before creating
    if (this.checkOverlap(start_datetime, end_datetime)) {
      throw new Error('OVERLAP_ERROR: This time slot overlaps with an existing booking');
    }

    // Calculate duration in days (rental charge is per day)
    const durationDays = Math.floor(duration_hours / 24);

    const stmt = db.prepare(`
      INSERT INTO rental_bookings (
        member_id, member_name, start_datetime, end_datetime, 
        duration_hours, amount, transaction_id, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      member_id,
      member_name,
      start_datetime,
      end_datetime,
      duration_hours,
      amount,
      transaction_id,
      payment_method,
      status
    );

    return this.getById(result.lastInsertRowid);
  }

  /**
   * Update a rental booking
   */
  static update(id, bookingData) {
    const existing = this.getById(id);
    if (!existing) {
      throw new Error('Rental booking not found');
    }

    const {
      start_datetime,
      end_datetime,
      duration_hours,
      amount,
      status
    } = bookingData;

    // Check for overlaps if dates are being updated
    if (start_datetime && end_datetime) {
      if (this.checkOverlap(start_datetime, end_datetime, id)) {
        throw new Error('OVERLAP_ERROR: This time slot overlaps with an existing booking');
      }
    }

    const stmt = db.prepare(`
      UPDATE rental_bookings 
      SET start_datetime = COALESCE(?, start_datetime),
          end_datetime = COALESCE(?, end_datetime),
          duration_hours = COALESCE(?, duration_hours),
          amount = COALESCE(?, amount),
          status = COALESCE(?, status),
          updated_at = datetime('now')
      WHERE id = ?
    `);

    stmt.run(
      start_datetime || null,
      end_datetime || null,
      duration_hours || null,
      amount || null,
      status || null,
      id
    );

    return this.getById(id);
  }

  /**
   * Delete a rental booking
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM rental_bookings WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error('Rental booking not found');
    }
    
    return { success: true, message: 'Rental booking deleted successfully' };
  }

  /**
   * Get bookings by date range
   */
  static getByDateRange(startDate, endDate) {
    const stmt = db.prepare(`
      SELECT * FROM rental_bookings 
      WHERE start_datetime >= ? AND start_datetime <= ?
      ORDER BY start_datetime ASC
    `);
    return stmt.all(startDate, endDate);
  }

  /**
   * Get active bookings
   */
  static getActive() {
    const stmt = db.prepare(`
      SELECT * FROM rental_bookings 
      WHERE status = 'active'
      ORDER BY start_datetime ASC
    `);
    return stmt.all();
  }
}

module.exports = RentalBooking;
