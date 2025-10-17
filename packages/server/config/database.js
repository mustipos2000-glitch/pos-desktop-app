const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '../../..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pos.db');
const db = new Database(dbPath);

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pincode TEXT NOT NULL,
    social_security TEXT,
    identification TEXT,
    role TEXT DEFAULT 'User',
    avatar_color TEXT DEFAULT '#3b82f6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (name, pincode, social_security, identification, role, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin', '1234', '', '', 'Admin', '#ef4444');

  console.log('✅ Default admin user created (username: admin, pincode: 1234)');
}

module.exports = db;
