const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Check if running in development or production
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
let serverProcess = null;
let mainWindow = null;
let customerDisplayWindow = null;

function runSeeder(serverDir, nodePath) {
  return new Promise((resolve, reject) => {
    const seederPath = path.join(serverDir, 'seed-terminals.js');
    
    console.log('Running terminal seeder...');
    const seederProcess = spawn(nodePath, [seederPath], {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        ELECTRON_RUN_AS_NODE: '1'
      }
    });

    seederProcess.stdout.on('data', (data) => {
      console.log('Seeder:', data.toString());
    });

    seederProcess.stderr.on('data', (data) => {
      console.error('Seeder Error:', data.toString());
    });

    seederProcess.on('error', (err) => {
      console.error('Failed to run seeder:', err);
      reject(err);
    });

    seederProcess.on('exit', (code) => {
      if (code === 0) {
        console.log('Terminal seeder completed successfully');
        resolve();
      } else {
        console.error(`Seeder exited with code ${code}`);
        reject(new Error(`Seeder exited with code ${code}`));
      }
    });
  });
}

async function startServer() {
  if (isDev) {
    // In dev mode, server is started separately
    return;
  }

  // In production, determine server path based on whether app is packaged
  let serverPath, serverDir;
  
  if (app.isPackaged) {
    // Packaged app - use asar.unpacked location
    serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'server', 'server.js');
    serverDir = path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'server');
  } else {
    // Unpacked app (running from dist/win-unpacked) - check multiple possible locations
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'server'),
      path.join(__dirname, '..', 'packages', 'server'),
      path.join(process.cwd(), 'packages', 'server'),
      path.join(app.getAppPath(), '..', 'packages', 'server')
    ];
    
    for (const possibleDir of possiblePaths) {
      const possiblePath = path.join(possibleDir, 'server.js');
      if (fs.existsSync(possiblePath)) {
        serverPath = possiblePath;
        serverDir = possibleDir;
        console.log('✅ Found server at:', serverPath);
        break;
      }
    }
    
    if (!serverPath) {
      console.error('❌ Could not find server.js in any of these locations:');
      possiblePaths.forEach(p => console.error('   -', p));
      throw new Error('Server file not found');
    }
  }
  
  // Use Electron's node executable instead of system node
  const nodePath = process.execPath;

  // Run seeder before starting server
  try {
    await runSeeder(serverDir, nodePath);
  } catch (error) {
    console.error('Seeder failed, but continuing with server startup:', error);
  }
  
  serverProcess = spawn(nodePath, [serverPath], {
    cwd: serverDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { 
      ...process.env, 
      NODE_ENV: 'production', 
      ELECTRON_RUN_AS_NODE: '1'
    }
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Server:', output);
    // Check for server ready message
    if (output.includes('Server is running on')) {
      console.log('✅ Server started successfully');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('Server Error:', error);
    // Show critical errors in a dialog
    if (error.includes('better-sqlite3') || error.includes('ERR_DLOPEN_FAILED')) {
      const { dialog } = require('electron');
      dialog.showErrorBox('Database Error', 
        'Failed to load database module. The application may not work correctly.\n\n' + error);
    }
    if (error.includes('Cannot find module') || error.includes('MODULE_NOT_FOUND')) {
      const { dialog } = require('electron');
      dialog.showErrorBox('Module Error', 
        'A required module is missing. Please reinstall the application.\n\n' + error);
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
    const { dialog } = require('electron');
    dialog.showErrorBox('Server Error', 
      'Failed to start the server process.\n\n' + err.message);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Server process exited with code ${code}`);
      const { dialog } = require('electron');
      dialog.showErrorBox('Server Crashed', 
        `The server process exited unexpectedly with code ${code}.\n\nPlease check the console for details.`);
    } else {
      console.log(`Server process exited with code ${code}`);
    }
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Allow loading local files
    }
  });

  // In development, load from the React dev server
  // In production, load from the built files
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Wait for server to start, then load the app
    let isLoading = false;
    const checkServer = () => {
      if (isLoading) return;
      
      const http = require('http');
      const req = http.get('http://localhost:5000/health', (res) => {
        if (res.statusCode === 200 && !isLoading) {
          isLoading = true;
          console.log('✅ Server is ready, loading app...');
          mainWindow.loadURL('http://localhost:5000').catch(err => {
            console.error('Failed to load URL:', err);
            isLoading = false;
            // Try to show error page
            mainWindow.loadURL('data:text/html,<h1>Failed to load application</h1><p>' + err.message + '</p>');
          });
        } else if (!isLoading) {
          console.log('⏳ Waiting for server... (status: ' + res.statusCode + ')');
          setTimeout(checkServer, 1000);
        }
      });
      
      req.on('error', (err) => {
        if (!isLoading) {
          console.log('⏳ Waiting for server... (' + err.message + ')');
          setTimeout(checkServer, 1000);
        }
      });
      
      req.setTimeout(2000, () => {
        req.destroy();
        if (!isLoading) {
          console.log('⏳ Waiting for server... (timeout)');
          setTimeout(checkServer, 1000);
        }
      });
    };
    
    // Start checking after a short delay
    setTimeout(checkServer, 2000);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    // Show error in window
    mainWindow.loadURL('data:text/html,<h1>Failed to load application</h1><p>Error: ' + errorDescription + '</p><p>Code: ' + errorCode + '</p><p>URL: ' + validatedURL + '</p>');
  });
  
  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer ${level}]:`, message);
  });
  
  return mainWindow;
}

function createCustomerDisplayWindow() {
  if (customerDisplayWindow) {
    customerDisplayWindow.focus();
    return;
  }

  const preloadPath = path.join(__dirname, 'preload.js');
  const { screen } = require('electron');
  
  // Get all available displays
  const allDisplays = screen.getAllDisplays();
  console.log(`📺 Found ${allDisplays.length} display(s)`);
  allDisplays.forEach((display, index) => {
    console.log(`   Display ${index + 1}: ${display.bounds.width}x${display.bounds.height} @ (${display.bounds.x}, ${display.bounds.y}) - ${display.id}`);
  });
  
  let x = 0, y = 0, width = 800, height = 600;
  
  // Try to use a secondary display if available
  if (allDisplays.length > 1) {
    // Use the second display (index 1)
    const secondDisplay = allDisplays[1];
    const bounds = secondDisplay.bounds;
    x = bounds.x;
    y = bounds.y;
    width = bounds.width;
    height = bounds.height;
    console.log(`✅ Customer Display will open on secondary display (${width}x${height})`);
  } else {
    // Fallback to positioning next to main window on same display
    console.log('⚠️  Only one display detected. Positioning customer display next to main window.');
    if (mainWindow && !mainWindow.isDestroyed()) {
      const mainBounds = mainWindow.getBounds();
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
      
      x = mainBounds.x + mainBounds.width + 10;
      y = mainBounds.y;
      width = 400;
      height = 800;
      
      if (x + width > screenWidth) {
        x = screenWidth - width - 10;
        if (x < mainBounds.x + mainBounds.width) {
          x = mainBounds.x + mainBounds.width + 10;
        }
      }
      
      if (y + height > screenHeight) {
        y = screenHeight - height - 10;
      }
      if (y < 0) y = 10;
    }
  }
  
  customerDisplayWindow = new BrowserWindow({
    width: width,
    height: height,
    x: x,
    y: y,
    title: 'Customer Display',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    frame: true,
    resizable: true,
    alwaysOnTop: false
  });

  // Mark this window as customer display window
  customerDisplayWindow.isCustomerDisplay = true;

  // In development, load from the React dev server
  // In production, load from the built files
  if (isDev) {
    customerDisplayWindow.loadURL('http://localhost:3000/#/customer-display');
    // Optionally open dev tools for customer display in dev mode
    // customerDisplayWindow.webContents.openDevTools();
  } else {
    customerDisplayWindow.loadURL('http://localhost:5000/#/customer-display');
  }

  customerDisplayWindow.on('closed', () => {
    customerDisplayWindow = null;
  });

  customerDisplayWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Customer Display failed to load:', errorCode, errorDescription, validatedURL);
  });
}

function closeCustomerDisplayWindow() {
  if (customerDisplayWindow) {
    customerDisplayWindow.close();
    customerDisplayWindow = null;
  }
}

// IPC handlers for customer display
ipcMain.on('customer-display:toggle', (event, enabled) => {
  if (enabled) {
    createCustomerDisplayWindow();
  } else {
    closeCustomerDisplayWindow();
  }
});

ipcMain.on('customer-display:update-cart', (event, data) => {
  if (customerDisplayWindow && !customerDisplayWindow.isDestroyed()) {
    customerDisplayWindow.webContents.send('customer-display:cart-updated', data);
  }
});

ipcMain.handle('customer-display:is-display-window', (event) => {
  // Check if the sender is the customer display window
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  return senderWindow && senderWindow.isCustomerDisplay === true;
});

ipcMain.handle('customer-display:get-main-window-bounds', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.getBounds();
  }
  return null;
});

ipcMain.handle('display:get-all-displays', () => {
  const { screen } = require('electron');
  const allDisplays = screen.getAllDisplays();
  return allDisplays.map((display, index) => ({
    id: display.id,
    index: index,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    rotation: display.rotation,
    isPrimary: display.id === screen.getPrimaryDisplay().id
  }));
});

ipcMain.handle('display:get-display-info', () => {
  const { screen } = require('electron');
  const primary = screen.getPrimaryDisplay();
  return {
    primary: {
      id: primary.id,
      bounds: primary.bounds,
      workArea: primary.workArea
    },
    all: screen.getAllDisplays().length
  };
});

app.whenReady().then(async () => {
  console.log('=== Application Starting ===');
  console.log('App Path:', app.getAppPath());
  console.log('Resources Path:', process.resourcesPath);
  console.log('Is Packaged:', app.isPackaged);
  console.log('Node Version:', process.version);
  console.log('Electron Version:', process.versions.electron);
  
  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    const { dialog } = require('electron');
    dialog.showErrorBox('Startup Error', 
      'Failed to start the application.\n\n' + error.message + '\n\nCheck console for details.');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Clean up customer display window on app quit
app.on('before-quit', () => {
  if (customerDisplayWindow) {
    customerDisplayWindow.close();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
