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
  const serverDir = path.join(process.resourcesPath, 'app.asar.unpacked', 'packages', 'server');
  
  console.log('Starting server...');
  console.log('Server path:', serverPath);
  console.log('Server dir:', serverDir);
  console.log('Resources path:', process.resourcesPath);
  
  // Use Electron's node executable instead of system node
  const nodePath = process.execPath;
  
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
    console.log('Server:', data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('Server Error:', data.toString());
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
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
    console.log('Production mode - waiting for server...');
    // Wait for server to start, then load the app
    setTimeout(() => {
      console.log('Loading http://localhost:5000');
      mainWindow.loadURL('http://localhost:5000').catch(err => {
        console.error('Failed to load URL:', err);
      });
    }, 5000);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
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
