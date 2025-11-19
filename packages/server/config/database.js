const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine database directory based on environment
let dbDir;
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  // Development: use project root database folder
  dbDir = path.join(__dirname, '../../..', 'database');
} else {
  // Production: use user's app data directory
  const appDataDir = process.env.APPDATA ||
    (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') :
      path.join(os.homedir(), '.local', 'share'));
  dbDir = path.join(appDataDir, 'POS Desktop', 'database');
}

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pos.db');
console.log('Database path:', dbPath);
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
    in_web_shop INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0
  )
`);

// Add display_order column if it doesn't exist
try {
  db.exec(`ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

// Add is_visible column if it doesn't exist
try {
  db.exec(`ALTER TABLE categories ADD COLUMN is_visible INTEGER DEFAULT 1`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

// Create products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER DEFAULT NULL,
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
    FOREIGN KEY(category_id) REFERENCES categories(id),
    FOREIGN KEY(parent_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

try {
  db.exec(`ALTER TABLE products ADD COLUMN image TEXT`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
  }
}

// Add parent_id column if it doesn't exist
try {
  db.exec(`ALTER TABLE products ADD COLUMN parent_id INTEGER DEFAULT NULL`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
  }
}

// Add color column if it doesn't exist
try {
  db.exec(`ALTER TABLE products ADD COLUMN color TEXT DEFAULT '#3b82f6'`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
  }
}

// Add price_vat_inc column if it doesn't exist
try {
  db.exec(`ALTER TABLE products ADD COLUMN price_vat_inc REAL DEFAULT 0`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
  }
}

// Add sub_product_group column if it doesn't exist
try {
  db.exec(`ALTER TABLE products ADD COLUMN sub_product_group INTEGER DEFAULT 0`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
  }
}

// Create separate sub_products table
db.exec(`
  CREATE TABLE IF NOT EXISTS sub_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER DEFAULT NULL,
    product_id INTEGER DEFAULT NULL,
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
    color TEXT DEFAULT '#3b82f6',
    price_vat_inc REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id),
    FOREIGN KEY(group_id) REFERENCES groups(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);

// Migrate existing sub-products from products table to sub_products table (one-time migration)
try {
  const existingSubProducts = db.prepare(`SELECT * FROM products WHERE parent_id IS NOT NULL`).all();

  if (existingSubProducts.length > 0) {
    const insertStmt = db.prepare(`
      INSERT INTO sub_products (
        product_id, name, button_name, production_name, price, vat_takeout, vat_eat_in,
        barcode, category_id, addition_type, display_index, in_web_shop,
        printer1, printer2, printer3, image, color, price_vat_inc, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const checkStmt = db.prepare(`SELECT id FROM sub_products WHERE name = ? AND product_id = ?`);

    for (const subProduct of existingSubProducts) {
      // Check if already migrated
      const existing = checkStmt.get(subProduct.name, subProduct.parent_id);
      if (!existing) {
        // Verify that the parent product exists before inserting
        const parentExists = db.prepare(`SELECT id FROM products WHERE id = ?`).get(subProduct.parent_id);
        if (parentExists) {
        insertStmt.run(
          subProduct.parent_id,
          subProduct.name,
          subProduct.button_name,
          subProduct.production_name,
          subProduct.price,
          subProduct.vat_takeout,
          subProduct.vat_eat_in,
          subProduct.barcode,
          subProduct.category_id,
          subProduct.addition_type,
          subProduct.display_index,
          subProduct.in_web_shop,
          subProduct.printer1,
          subProduct.printer2,
          subProduct.printer3,
          subProduct.image,
          subProduct.color || '#3b82f6',
          subProduct.price_vat_inc || 0,
          subProduct.created_at
          );
        } else {
          console.log(`⚠️  Skipping sub-product "${subProduct.name}" - parent product ${subProduct.parent_id} not found`);
        }
      }
    }

    // Delete migrated sub-products from products table
    db.exec(`DELETE FROM products WHERE parent_id IS NOT NULL`);
    console.log(`✅ Migrated ${existingSubProducts.length} sub-products to separate table`);
  }
} catch (err) {
  console.log('Migration note:', err.message);
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
    table_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(table_id) REFERENCES pr_table(id) ON DELETE SET NULL
  )
`);

// Add table_id column to orders if it doesn't exist
try {
  db.exec(`ALTER TABLE orders ADD COLUMN table_id INTEGER`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

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

// Add notes column to order_details if it doesn't exist
try {
  db.exec(`ALTER TABLE order_details ADD COLUMN notes TEXT`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

// Add discount column to order_details if it doesn't exist
try {
  db.exec(`ALTER TABLE order_details ADD COLUMN discount REAL DEFAULT 0`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

// Create groups table
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_visible INTEGER DEFAULT 0
  )
`);

// Create rooms table
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_table INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create pr_table table
db.exec(`
  CREATE TABLE IF NOT EXISTS pr_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_no TEXT NOT NULL,
    room_id INTEGER,
    order_id INTEGER,
    status TEXT DEFAULT 'available',
    description TEXT,
    customer_name TEXT,
    waiter_name TEXT,
    table_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
  )
`);

// Add new columns to pr_table if they don't exist
try {
  db.exec(`ALTER TABLE pr_table ADD COLUMN customer_name TEXT`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

try {
  db.exec(`ALTER TABLE pr_table ADD COLUMN waiter_name TEXT`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}

try {
  db.exec(`ALTER TABLE pr_table ADD COLUMN table_size INTEGER`);
} catch (err) {
  if (!err.message.includes('duplicate column name')) {
    // Column already exists, ignore
  }
}



// Create product_sub_products junction table for many-to-many relationship
db.exec(`
  CREATE TABLE IF NOT EXISTS product_sub_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sub_product_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY(sub_product_id) REFERENCES sub_products(id) ON DELETE CASCADE,
    UNIQUE(product_id, sub_product_id)
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