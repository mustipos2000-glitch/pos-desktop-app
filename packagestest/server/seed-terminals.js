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

  // Define terminal configurations to seed
  // Each terminal type has its config file path and metadata
  const terminalDefinitions = [
    {
      name: 'Cashmatic Terminal',
      type: 'cashmatic',
      connection_type: 'network',
      configPath: path.join(__dirname, 'config', 'cashmaticConfig.json'),
      requiredFields: ['ip', 'username', 'password']
    },
    {
      name: 'Payworld Terminal',
      type: 'payworld', // Also supports 'payword' and 'bancontact' aliases
      connection_type: 'network',
      configPath: path.join(__dirname, 'config', 'payworld.config.json'),
      requiredFields: ['ip', 'port', 'posId']
    },
    {
      name: 'Viva Wallet Terminal',
      type: 'viva',
      connection_type: 'api',
      configPath: path.join(__dirname, 'config', 'viva.config.json'),
      requiredFields: ['merchantId', 'terminalId'] // Client-side only for now
    }
  ];

  const terminals = [];

  // Process each terminal definition
  terminalDefinitions.forEach(def => {
    if (fs.existsSync(def.configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(def.configPath, 'utf8'));
        
        // Validate required fields
        const missingFields = def.requiredFields.filter(field => !config[field]);
        if (missingFields.length > 0) {
          console.warn(`⚠ ${def.name}: Missing required fields: ${missingFields.join(', ')}`);
          return;
        }
        
        terminals.push({
          name: def.name,
          type: def.type,
          connection_type: def.connection_type,
          connection_string: JSON.stringify(config),
          enabled: 1
        });
        console.log(`✓ ${def.name} config loaded`);
      } catch (error) {
        console.error(`✗ Error loading ${def.name} config:`, error.message);
      }
    } else {
      console.log(`ℹ ${def.name}: Config file not found at ${def.configPath} (skipping)`);
    }
  });

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
