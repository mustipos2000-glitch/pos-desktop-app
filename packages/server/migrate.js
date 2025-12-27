const db = require('./config/database');
const fs = require('fs');
const path = require('path');

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Get all executed migrations
function getExecutedMigrations() {
  return db.prepare('SELECT name FROM migrations').all().map(row => row.name);
}

// Mark migration as executed
function markMigrationExecuted(name) {
  db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
}

// Run all pending migrations
function runMigrations() {
  console.log('🔄 Checking for pending migrations...');
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const mosqueMigrationsDir = path.join(__dirname, 'mosque', 'migrations');
  const executedMigrations = getExecutedMigrations();
  
  // Get all migration files from both directories
  let migrationFiles = [];
  
  // Main migrations
  if (fs.existsSync(migrationsDir)) {
    const mainMigrations = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => ({ file, dir: migrationsDir }));
    migrationFiles.push(...mainMigrations);
  }
  
  // Mosque migrations
  if (fs.existsSync(mosqueMigrationsDir)) {
    const mosqueMigrations = fs.readdirSync(mosqueMigrationsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => ({ file, dir: mosqueMigrationsDir }));
    migrationFiles.push(...mosqueMigrations);
  }
  
  // Sort by filename to ensure migrations run in order
  migrationFiles.sort((a, b) => a.file.localeCompare(b.file));

  let pendingCount = 0;

  for (const { file, dir } of migrationFiles) {
    const migrationPath = path.join(dir, file);
    const migration = require(migrationPath);
    
    if (!executedMigrations.includes(migration.name)) {
      console.log(`\n📦 Running migration: ${migration.name}`);
      
      try {
        migration.up();
        markMigrationExecuted(migration.name);
        console.log(`✅ Migration ${migration.name} completed successfully`);
        pendingCount++;
      } catch (error) {
        console.error(`❌ Migration ${migration.name} failed:`, error.message);
        throw error;
      }
    }
  }

  if (pendingCount === 0) {
    console.log('✅ All migrations are up to date');
  } else {
    console.log(`\n✅ Successfully ran ${pendingCount} migration(s)`);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  try {
    runMigrations();
    console.log('\n🎉 Migration process completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  }
}

module.exports = { runMigrations };
