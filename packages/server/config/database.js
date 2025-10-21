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

// Create categories table if not exists (kept here for compatibility)
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    next_course INTEGER DEFAULT 0,
    in_web_shop INTEGER DEFAULT 0
  )
`);

// Create products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    button_name TEXT,
    production_name TEXT,
    price REAL DEFAULT 0,
    vat_takeout REAL DEFAULT 0,
    vat_eat_in REAL DEFAULT 0,
    barcode TEXT,
    category_id INTEGER,
    addition_type TEXT,
    display_index INTEGER DEFAULT 0,
    in_web_shop INTEGER DEFAULT 0,
    printer1 TEXT,
    printer2 TEXT,
    printer3 TEXT,
    image TEXT,                     
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )
`);

try {
  db.exec(`ALTER TABLE products ADD COLUMN image TEXT`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
  }
}

// Create orders table
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tax REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    note TEXT,
    gross_total REAL DEFAULT 0,
    net_total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create order_details table
db.exec(`
  CREATE TABLE IF NOT EXISTS order_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty REAL DEFAULT 0,
    total REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);


// Insert default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (name, pincode, social_security, identification, role, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin', '1234', '', '', 'Admin', '#ef4444');
}

module.exports = db;