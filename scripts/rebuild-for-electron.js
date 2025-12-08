#!/usr/bin/env node
/**
 * Rebuild better-sqlite3 for Electron (production build)
 * This ensures the native module works with Electron's Node.js version
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Rebuilding better-sqlite3 for Electron...');

try {
  // Get Electron version from package.json
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const electronVersion = packageJson.devDependencies.electron.replace('^', '');
  
  console.log(`📦 Using Electron version: ${electronVersion}`);
  
  execSync(
    `npx electron-rebuild --module-dir node_modules/better-sqlite3 --arch=x64 --version=${electronVersion} --force --use-prebuilt-binaries=false`,
    { 
      stdio: 'inherit',
      cwd: process.cwd()
    }
  );
  
  console.log('✅ Successfully rebuilt better-sqlite3 for Electron');
} catch (error) {
  console.error('❌ Failed to rebuild better-sqlite3:', error.message);
  process.exit(1);
}
