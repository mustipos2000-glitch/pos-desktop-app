// Preload script for Electron
// This runs in a sandboxed context before the renderer process loads

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any APIs you want to expose to the renderer here
  platform: process.platform
});
