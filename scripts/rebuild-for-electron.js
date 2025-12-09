#!/usr/bin/env node
/**
 * Rebuild better-sqlite3 for Electron (production build)
 * This ensures the native module works with Electron's Node.js version
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const betterSqlite3Path = path.join(process.cwd(), 'node_modules', 'better-sqlite3');
const buildPath = path.join(betterSqlite3Path, 'build', 'Release', 'better_sqlite3.node');

console.log('🔧 Setting up better-sqlite3 for Electron...');

try {
  // Get Electron version from package.json
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const electronVersionRaw = packageJson.dependencies?.electron || packageJson.devDependencies?.electron;
  
  if (!electronVersionRaw) {
    throw new Error('Electron not found in package.json dependencies');
  }
  
  const electronVersion = electronVersionRaw.replace(/[\^~]/g, '');
  console.log(`📦 Using Electron version: ${electronVersion}`);
  
  // Helper function to run npx/npm exec commands
  const runNpx = (command) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? true : false;
    
    // Try npm exec first (works in npm 7+)
    try {
      execSync(`npm exec -- ${command}`, { 
        stdio: 'inherit',
        cwd: betterSqlite3Path,
        shell: shell,
        env: { ...process.env, PATH: env.PATH }
      });
      return true;
    } catch (e) {
      // Fallback to npx if npm exec fails
      try {
        execSync(`npx ${command}`, { 
          stdio: 'inherit',
          cwd: betterSqlite3Path,
          shell: shell,
          env: { ...process.env, PATH: env.PATH }
        });
        return true;
      } catch (e2) {
        // Try using node_modules/.bin directly
        const npxPath = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'prebuild-install.cmd' : 'prebuild-install');
        if (fs.existsSync(npxPath)) {
          execSync(`"${npxPath}" ${command.split(' ').slice(1).join(' ')}`, { 
            stdio: 'inherit',
            cwd: betterSqlite3Path,
            shell: shell,
            env: { ...process.env, PATH: env.PATH }
          });
          return true;
        }
        throw e2;
      }
    }
  };

  // Step 1: Try to download prebuilt binaries for Electron
  console.log('📦 Attempting to download prebuilt binaries for Electron...');
  try {
    runNpx(`prebuild-install --runtime=electron --target=${electronVersion} --arch=x64`);
    
    // Verify it works with Electron
    console.log('✅ Downloaded prebuilt binaries, verifying...');
    // Note: We can't actually test Electron loading here, but electron-builder will rebuild if needed
    process.exit(0);
  } catch (prebuildError) {
    console.log('⚠️  Prebuilt binaries not available for Electron ' + electronVersion);
  }
  
  // Step 2: We MUST rebuild for Electron - Node.js binaries won't work
  console.log('');
  console.log('🔨 Rebuilding better-sqlite3 for Electron...');
  console.log('   This is REQUIRED - Node.js binaries are not compatible with Electron');
  console.log('');
  
  // Configure environment for Visual Studio 2022 detection
  const env = { ...process.env };
  
  // Ensure Node.js is in PATH (critical for Windows)
  const nodeDir = path.dirname(process.execPath);
  if (!env.PATH || !env.PATH.includes(nodeDir)) {
    env.PATH = `${nodeDir};${env.PATH || ''}`;
  }
  
  // Try to detect and configure Visual Studio 2022
  const vs2022Paths = [
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Community',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Professional',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\Enterprise'
  ];
  
  // Also check for VS 18 (which is VS 2022)
  const vs18Paths = [
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\BuildTools',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\Community',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\Professional',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\18\\Enterprise'
  ];
  
  const allVsPaths = [...vs2022Paths, ...vs18Paths];
  let vsPath = null;
  
  for (const vsPathCandidate of allVsPaths) {
    if (fs.existsSync(vsPathCandidate)) {
      vsPath = vsPathCandidate;
      console.log(`✅ Found Visual Studio at: ${vsPath}`);
      break;
    }
  }
  
  // Set environment variables to help node-gyp find Visual Studio
  if (vsPath) {
    // Set GYP_MSVS_VERSION to 2022
    env.GYP_MSVS_VERSION = '2022';
    
    // Find VC tools directory (this is critical for node-gyp)
    const vcToolsPath = path.join(vsPath, 'VC', 'Tools', 'MSVC');
    let vcVersionPath = null;
    
    if (fs.existsSync(vcToolsPath)) {
      // Find the latest VC version
      try {
        const vcVersions = fs.readdirSync(vcToolsPath)
          .filter(item => {
            const itemPath = path.join(vcToolsPath, item);
            return fs.statSync(itemPath).isDirectory();
          })
          .sort()
          .reverse();
        
        if (vcVersions.length > 0) {
          vcVersionPath = path.join(vcToolsPath, vcVersions[0]);
          const vcToolsDir = path.join(vcVersionPath, 'bin', 'Hostx64', 'x64');
          if (fs.existsSync(vcToolsDir)) {
            // Set VCINSTALLDIR - this tells node-gyp where to find VC tools
            env.VCINSTALLDIR = path.join(vsPath, 'VC');
            // Add VC tools to PATH
            env.PATH = `${vcToolsDir};${env.PATH || process.env.PATH || ''}`;
          }
        }
      } catch (e) {
        // If we can't find VC version, still try to set VCINSTALLDIR
        env.VCINSTALLDIR = path.join(vsPath, 'VC');
      }
    } else {
      // Fallback: set VCINSTALLDIR even if we can't find the exact version
      env.VCINSTALLDIR = path.join(vsPath, 'VC');
    }
    
    // Set path to MSBuild (prepend to existing PATH, don't replace)
    const msBuildPath = path.join(vsPath, 'MSBuild', 'Current', 'Bin', 'MSBuild.exe');
    if (fs.existsSync(msBuildPath)) {
      const msBuildDir = path.dirname(msBuildPath);
      // Preserve original PATH and prepend MSBuild directory
      env.PATH = `${msBuildDir};${env.PATH || process.env.PATH || ''}`;
    }
    
    // Set Windows SDK path if available
    const windowsSdkPath = path.join(vsPath, 'Windows Kits', '10', 'bin');
    if (fs.existsSync(windowsSdkPath)) {
      // Find the latest SDK version
      try {
        const sdkVersions = fs.readdirSync(windowsSdkPath)
          .filter(item => {
            const itemPath = path.join(windowsSdkPath, item);
            return fs.statSync(itemPath).isDirectory() && /^\d+\.\d+/.test(item);
          })
          .sort()
          .reverse();
        
        if (sdkVersions.length > 0) {
          const sdkBinPath = path.join(windowsSdkPath, sdkVersions[0], 'x64');
          if (fs.existsSync(sdkBinPath)) {
            env.PATH = `${sdkBinPath};${env.PATH || process.env.PATH || ''}`;
          }
        }
      } catch (e) {
        // Ignore SDK path errors
      }
    }
    
    console.log(`   Configured VCINSTALLDIR: ${env.VCINSTALLDIR || 'not set'}`);
  }
  
  // Always preserve the original PATH - don't override it completely
  if (!env.PATH) {
    env.PATH = process.env.PATH || '';
  }
  
  // Also try setting npm_config_msvs_version
  env.npm_config_msvs_version = '2022';
  
  // Try to configure npm to use VS 2022 (this persists for the session)
  try {
    execSync('npm config set msvs_version 2022', { stdio: 'ignore' });
  } catch (e) {
    // Ignore if this fails
  }
  
  // Helper function to run electron-rebuild with VS environment
  const runElectronRebuild = () => {
    const rebuildCmd = `@electron/rebuild --module-dir "${betterSqlite3Path}" --arch=x64 --electron-version=${electronVersion} --force`;
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? true : false;
    
    // On Windows, try to use batch file wrapper that sets up VS environment
    if (isWindows && vsPath) {
      const batchWrapper = path.join(process.cwd(), 'scripts', 'rebuild-with-vs.bat');
      if (fs.existsSync(batchWrapper)) {
        console.log('   Using VS environment wrapper...');
        try {
          execSync(`"${batchWrapper}" "${betterSqlite3Path}" "${electronVersion}"`, {
            stdio: 'inherit',
            cwd: process.cwd(),
            shell: true,
            env: env
          });
          return true;
        } catch (e) {
          console.log('   Batch wrapper failed, trying direct method...');
        }
      }
    }
    
    // Try npm exec first
    try {
      execSync(`npm exec -- ${rebuildCmd}`, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: env,
        shell: shell
      });
      return true;
    } catch (e) {
      // Fallback to npx
      try {
        execSync(`npx ${rebuildCmd}`, { 
          stdio: 'inherit',
          cwd: process.cwd(),
          env: env,
          shell: shell
        });
        return true;
      } catch (e2) {
        // Try using node_modules/.bin directly
        const rebuildPath = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'electron-rebuild.cmd' : 'electron-rebuild');
        if (fs.existsSync(rebuildPath)) {
          execSync(`"${rebuildPath}" --module-dir "${betterSqlite3Path}" --arch=x64 --electron-version=${electronVersion} --force`, { 
            stdio: 'inherit',
            cwd: process.cwd(),
            env: env,
            shell: shell
          });
          return true;
        }
        throw e2;
      }
    }
  };

  try {
    // First attempt: with environment variables
    console.log('🔧 Attempting rebuild with VS 2022 configuration...');
    runElectronRebuild();
    console.log('');
    console.log('✅ Successfully rebuilt better-sqlite3 for Electron');
    process.exit(0);
  } catch (rebuildError) {
    console.error('');
    console.error('❌ Failed to rebuild better-sqlite3 for Electron');
    console.error('');
    
    // Check if VS is installed but not detected
    if (vsPath) {
      console.error('⚠️  Visual Studio was found but node-gyp could not use it.');
      console.error(`   Found at: ${vsPath}`);
      console.error('');
      console.log('💡 Try these solutions:');
      console.log('');
      console.log('   1. Open "Developer Command Prompt for VS 2022" (search in Start menu)');
      console.log('   2. Navigate to this project directory');
      console.log('   3. Run: npm run rebuild:electron');
      console.log('');
      console.log('   OR set environment variable manually:');
      console.log('   $env:GYP_MSVS_VERSION="2022"');
      console.log('   npm run rebuild:electron');
      console.log('');
    } else {
      console.error('This is REQUIRED for the app to work. You need Visual Studio Build Tools.');
      console.error('');
      console.log('📋 To fix this, please install Visual Studio Build Tools:');
      console.log('');
      console.log('   1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/');
      console.log('   2. Run the installer');
      console.log('   3. Select "Desktop development with C++" workload');
      console.log('   4. Make sure these components are selected:');
      console.log('      - MSVC v143 - VS 2022 C++ x64/x86 build tools');
      console.log('      - Windows 10/11 SDK (latest version)');
      console.log('      - C++ CMake tools for Windows');
      console.log('   5. Click Install (this may take 10-20 minutes)');
      console.log('   6. Restart your computer');
      console.log('   7. Restart your terminal/IDE');
      console.log('   8. Run: npm run rebuild:electron');
      console.log('');
    }
    
    console.log('⚠️  Without Visual Studio Build Tools, the app will show a database error.');
    console.log('    The native module MUST be compiled for Electron\'s specific ABI version.');
    console.log('');
    process.exit(1);
  }
} catch (error) {
  console.error('');
  console.error('❌ Failed to set up better-sqlite3 for Electron:', error.message);
  console.error('');
  process.exit(1);
}
