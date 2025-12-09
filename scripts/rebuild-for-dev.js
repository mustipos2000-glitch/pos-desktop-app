#!/usr/bin/env node
/**
 * Rebuild better-sqlite3 for Node.js (development mode)
 * This ensures the native module works with the system Node.js version
 */

const { execSync } = require('child_process');

console.log('🔧 Rebuilding better-sqlite3 for Node.js (development)...');

try {
  execSync('npm rebuild better-sqlite3', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Successfully rebuilt better-sqlite3 for Node.js');
} catch (error) {
  console.error('❌ Failed to rebuild better-sqlite3:', error.message);
  process.exit(1);
}
