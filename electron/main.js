const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Check if running in development or production
const isDev = !app.isPackaged;
let serverProcess = null;

function startServer() {
  if (isDev) {
    // In dev mode, server is started separately
    return;
  }

  // In production, start the Node.js server from unpacked location
  const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'server', 'server.js');
  // Point to node_modules in the asar file
  const nodeModulesInAsar = path.join(process.resourcesPath, 'app.asar', 'node_modules');
  const nodeModulesUnpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules');
  
  // Use Electron's node executable instead of system node
  const nodePath = process.execPath;
  
  serverProcess = spawn(nodePath, [serverPath], {
    cwd: path.join(process.resourcesPath, 'app.asar.unpacked'),
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_ENV: 'production', 
      ELECTRON_RUN_AS_NODE: '1',
      // Include both asar and unpacked node_modules
      NODE_PATH: `${nodeModulesInAsar}${path.delimiter}${nodeModulesUnpacked}`
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // In development, load from the React dev server
  // In production, load from the built files
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Wait a bit for server to start, then load the app
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5000');
    }, 2000);
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
