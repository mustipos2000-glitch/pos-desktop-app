#!/usr/bin/env node
/**
 * Rebuild better-sqlite3 for Node.js (development mode)
 * This ensures the native module works with the system Node.js version
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const betterSqlite3Path = path.join(process.cwd(), 'node_modules', 'better-sqlite3');
const buildPath = path.join(betterSqlite3Path, 'build', 'Release', 'better_sqlite3.node');

console.log('🔧 Setting up better-sqlite3 for Node.js (development)...');

// Check if the native module already exists and works
try {
  if (fs.existsSync(buildPath)) {
    // Try to load it to verify it works
    require('better-sqlite3');
    console.log('✅ better-sqlite3 is already working for Node.js');
    process.exit(0);
  }
} catch (error) {
  console.log('⚠️  Native module exists but failed to load, will reinstall...');
}

try {
  // Use prebuild-install to download prebuilt binaries for Node.js
  console.log('📦 Downloading prebuilt binaries for Node.js...');
  execSync('npx prebuild-install --runtime=node', { 
    stdio: 'inherit',
    cwd: betterSqlite3Path
  });
  
  // Verify the module works
  require('better-sqlite3');
  console.log('✅ Successfully set up better-sqlite3 for Node.js');
} catch (error) {
  console.error('❌ Failed to set up better-sqlite3 for Node.js:', error.message);
  console.log('💡 Tip: If this fails, you may need to install Visual Studio Build Tools');
  console.log('   Run: npm install --global windows-build-tools');
  process.exit(1);
}
