const db = require('../config/database');

/**
 * Migration: Consolidate first_name and name into full_name
 * This migration combines the first_name and name columns into a single full_name column
 */
const name = '004-consolidate-member-name';

function up() {
  console.log('Running migration: 004-consolidate-member-name');
  
  try {
    // Check if table has old schema (first_name and name columns)
    const tableInfo = db.prepare("PRAGMA table_info(members)").all();
    const hasFirstName = tableInfo.some(col => col.name === 'first_name');
    const hasName = tableInfo.some(col => col.name === 'name');
    const hasFullName = tableInfo.some(col => col.name === 'full_name');
    
    // If table already has full_name and no first_name/name, migration already done
    if (hasFullName && !hasFirstName && !hasName) {
      console.log('Migration 004-consolidate-member-name already applied, skipping');
      return;
    }
    
    // If table has old schema, migrate it
    if (hasFirstName && hasName) {
      // Add full_name column if it doesn't exist
      if (!hasFullName) {
        db.exec(`ALTER TABLE members ADD COLUMN full_name TEXT`);
      }
      
      // Populate full_name with combined first_name and name
      db.exec(`UPDATE members SET full_name = first_name || ' ' || name WHERE full_name IS NULL OR full_name = ''`);
      
      // Create new table with desired schema
      db.exec(`
        CREATE TABLE members_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          phone TEXT DEFAULT '',
          email TEXT DEFAULT '',
          address TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Copy data to new table
      db.exec(`
        INSERT INTO members_new (id, full_name, phone, email, address, created_at, updated_at)
        SELECT id, full_name, phone, email, address, created_at, updated_at
        FROM members
      `);
      
      // Drop old table
      db.exec(`DROP TABLE members`);
      
      // Rename new table
      db.exec(`ALTER TABLE members_new RENAME TO members`);
      
      console.log('Migration 004-consolidate-member-name completed successfully');
    } else {
      console.log('Migration 004-consolidate-member-name: Table schema is unexpected, skipping');
    }
  } catch (error) {
    console.error('Migration 004-consolidate-member-name failed:', error);
    throw error;
  }
}

function down() {
  console.log('Rolling back migration: 004-consolidate-member-name');
  
  try {
    // Create table with old schema
    db.exec(`
      CREATE TABLE members_old (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        address TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Split full_name back into first_name and name
    const members = db.prepare('SELECT * FROM members').all();
    const insertStmt = db.prepare(`
      INSERT INTO members_old (id, name, first_name, phone, email, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const member of members) {
      const nameParts = member.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      
      insertStmt.run(
        member.id,
        lastName,
        firstName,
        member.phone,
        member.email,
        member.address,
        member.created_at,
        member.updated_at
      );
    }
    
    // Drop new table
    db.exec(`DROP TABLE members`);
    
    // Rename old table
    db.exec(`ALTER TABLE members_old RENAME TO members`);
    
    console.log('Rollback 004-consolidate-member-name completed successfully');
  } catch (error) {
    console.error('Rollback 004-consolidate-member-name failed:', error);
    throw error;
  }
}

module.exports = { name, up, down };
