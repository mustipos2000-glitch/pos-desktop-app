// Preload script for Electron
// This runs in a sandboxed context before the renderer process loads

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any APIs you want to expose to the renderer here
  platform: process.platform,
  
  // Customer Display IPC methods
  customerDisplay: {
    // Send cart data to customer display window
    sendCartData: (data) => ipcRenderer.send('customer-display:update-cart', data),
    // Toggle customer display window
    toggle: (enabled) => ipcRenderer.send('customer-display:toggle', enabled),
    // Listen for cart updates (in customer display window)
    onCartUpdate: (callback) => {
      ipcRenderer.on('customer-display:cart-updated', (event, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('customer-display:cart-updated');
    },
    // Check if this is the customer display window
    isCustomerDisplay: () => ipcRenderer.sendSync('customer-display:is-display-window'),
    // Get main window bounds for positioning
    getMainWindowBounds: () => ipcRenderer.invoke('customer-display:get-main-window-bounds')
  },

  // Display/Monitor information
  display: {
    // Get information about all connected displays
    getAllDisplays: () => ipcRenderer.invoke('display:get-all-displays'),
    // Get primary display info and display count
    getDisplayInfo: () => ipcRenderer.invoke('display:get-display-info')
  }
});
