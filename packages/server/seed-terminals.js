const fs = require('fs');
const path = require('path');
const db = require('./config/database');

// Create payment_terminals table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS payment_terminals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    connection_type TEXT NOT NULL,
    connection_string TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function seedTerminals() {
  console.log('Starting terminal seeding...');

  // Read config files
  const cashmaticConfigPath = path.join(__dirname, 'config', 'cashmaticConfig.json');
  const paywordConfigPath = path.join(__dirname, 'config', 'payworld.config.json');
  const vivaConfigPath = path.join(__dirname, 'config', 'viva.config.json');

  const terminals = [];

  // Seed Cashmatic terminal
  if (fs.existsSync(cashmaticConfigPath)) {
    try {
      const cashmaticConfig = JSON.parse(fs.readFileSync(cashmaticConfigPath, 'utf8'));
      terminals.push({
        name: 'Cashmatic Terminal',
        type: 'cashmatic',
        connection_type: 'network',
        connection_string: JSON.stringify(cashmaticConfig),
        enabled: 1
      });
      console.log('✓ Cashmatic config loaded');
    } catch (error) {
      console.error('✗ Error loading Cashmatic config:', error.message);
    }
  }

  // Seed Payword terminal
  if (fs.existsSync(paywordConfigPath)) {
    try {
      const paywordConfig = JSON.parse(fs.readFileSync(paywordConfigPath, 'utf8'));
      terminals.push({
        name: 'Payword Terminal',
        type: 'payword',
        connection_type: 'network',
        connection_string: JSON.stringify(paywordConfig),
        enabled: 1
      });
      console.log('✓ Payword config loaded');
    } catch (error) {
      console.error('✗ Error loading Payword config:', error.message);
    }
  }

  // Seed Viva terminal
  if (fs.existsSync(vivaConfigPath)) {
    try {
      const vivaConfig = JSON.parse(fs.readFileSync(vivaConfigPath, 'utf8'));
      terminals.push({
        name: 'Viva Wallet Terminal',
        type: 'viva',
        connection_type: 'api',
        connection_string: JSON.stringify(vivaConfig),
        enabled: 1
      });
      console.log('✓ Viva config loaded');
    } catch (error) {
      console.error('✗ Error loading Viva config:', error.message);
    }
  }

  // Insert or update terminals
  const checkStmt = db.prepare('SELECT id FROM payment_terminals WHERE type = ?');
  const insertStmt = db.prepare(`
    INSERT INTO payment_terminals (name, type, connection_type, connection_string, enabled)
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateStmt = db.prepare(`
    UPDATE payment_terminals 
    SET name = ?, connection_type = ?, connection_string = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE type = ?
  `);

  terminals.forEach(terminal => {
    try {
      const existing = checkStmt.get(terminal.type);
      
      if (existing) {
        updateStmt.run(
          terminal.name,
          terminal.connection_type,
          terminal.connection_string,
          terminal.enabled,
          terminal.type
        );
        console.log(`✓ Updated ${terminal.name}`);
      } else {
        insertStmt.run(
          terminal.name,
          terminal.type,
          terminal.connection_type,
          terminal.connection_string,
          terminal.enabled
        );
        console.log(`✓ Created ${terminal.name}`);
      }
    } catch (error) {
      console.error(`✗ Error seeding ${terminal.name}:`, error.message);
    }
  });

  console.log('Terminal seeding completed!');
}

// Run seeder if called directly
if (require.main === module) {
  seedTerminals();
  process.exit(0);
}

module.exports = seedTerminals;
