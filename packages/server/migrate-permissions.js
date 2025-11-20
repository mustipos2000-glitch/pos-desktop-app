const db = require('./config/database');
try {
  // Check if permissions column exists
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasPermissionsColumn = tableInfo.some(col => col.name === 'permissions');

  if (!hasPermissionsColumn) {
    db.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'`);
  } else {
    console.log('✓ Permissions column already exists');
  }

  // Update existing users to have empty permissions array if null
  const updateResult = db.prepare(`
    UPDATE users 
    SET permissions = '[]' 
    WHERE permissions IS NULL OR permissions = ''
  `).run();

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
