const db = require('../config/database');

module.exports = {
  name: '002-add-permissions',
  up: () => {
    console.log('Running migration: 002-add-permissions');
    
    // Check if permissions column exists
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasPermissionsColumn = tableInfo.some(col => col.name === 'permissions');

    if (!hasPermissionsColumn) {
      db.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'`);
      console.log('✅ Added permissions column to users table');
    } else {
      console.log('✓ Permissions column already exists');
    }

    // Update existing users to have empty permissions array if null
    const updateResult = db.prepare(`
      UPDATE users 
      SET permissions = '[]' 
      WHERE permissions IS NULL OR permissions = ''
    `).run();

    if (updateResult.changes > 0) {
      console.log(`✅ Updated ${updateResult.changes} users with default permissions`);
    }
  }
};
