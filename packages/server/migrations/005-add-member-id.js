const db = require('../config/database');

/**
 * Migration: Add member_id field to members table
 * This adds a unique member identifier separate from the auto-increment id
 */
module.exports = {
  name: '005-add-member-id',
  
  up: () => {
    console.log('Running migration: Add member_id to members table');
    
    try {
      // Check if member_id column already exists
      const tableInfo = db.prepare("PRAGMA table_info(members)").all();
      const memberIdExists = tableInfo.some(col => col.name === 'member_id');
      
      if (memberIdExists) {
        console.log('member_id column already exists, skipping migration');
        return;
      }

      // Add member_id column without UNIQUE constraint first
      db.exec(`
        ALTER TABLE members ADD COLUMN member_id TEXT;
      `);

      // Generate member_id for existing members
      const existingMembers = db.prepare('SELECT id FROM members WHERE member_id IS NULL').all();
      
      if (existingMembers.length > 0) {
        console.log(`Generating member_id for ${existingMembers.length} existing members`);
        
        const updateStmt = db.prepare('UPDATE members SET member_id = ? WHERE id = ?');
        
        existingMembers.forEach((member, index) => {
          const memberId = String(index + 1).padStart(4, '0'); // 0001, 0002, etc.
          updateStmt.run(memberId, member.id);
        });
      }

      // Now recreate the table with UNIQUE constraint
      db.exec(`
        CREATE TABLE members_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_id TEXT UNIQUE,
          full_name TEXT NOT NULL,
          phone TEXT DEFAULT '',
          email TEXT DEFAULT '',
          address TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.exec(`
        INSERT INTO members_new (id, member_id, full_name, phone, email, address, created_at, updated_at)
        SELECT id, member_id, full_name, phone, email, address, created_at, updated_at FROM members;
      `);

      db.exec('DROP TABLE members;');
      db.exec('ALTER TABLE members_new RENAME TO members;');

      console.log('Migration completed: member_id added successfully with UNIQUE constraint');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: () => {
    console.log('Rolling back migration: Remove member_id from members table');
    
    try {
      // SQLite doesn't support DROP COLUMN directly, need to recreate table
      db.exec(`
        CREATE TABLE members_backup (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          phone TEXT DEFAULT '',
          email TEXT DEFAULT '',
          address TEXT DEFAULT '',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      db.exec(`
        INSERT INTO members_backup (id, full_name, phone, email, address, created_at, updated_at)
        SELECT id, full_name, phone, email, address, created_at, updated_at FROM members;
      `);

      db.exec('DROP TABLE members;');
      db.exec('ALTER TABLE members_backup RENAME TO members;');

      console.log('Rollback completed: member_id removed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
