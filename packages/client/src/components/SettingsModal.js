import React, { useState } from 'react';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-pos-bg-secondary rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-pos-border-primary">
          <h2 className="text-pos-text-primary text-xl font-semibold">Settings</h2>
          <button className="text-pos-text-muted hover:text-pos-text-primary text-2xl" onClick={onClose}>×</button>
        </div>

        <div className="flex border-b border-pos-border-primary">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'general' 
                ? 'bg-pos-interactive-primary text-pos-text-primary border-b-2 border-pos-info' 
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'display' 
                ? 'bg-pos-interactive-primary text-pos-text-primary border-b-2 border-pos-info' 
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
            }`}
            onClick={() => setActiveTab('display')}
          >
            Display
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'printer' 
                ? 'bg-pos-interactive-primary text-pos-text-primary border-b-2 border-pos-info' 
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
            }`}
            onClick={() => setActiveTab('printer')}
          >
            Printer
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'payment' 
                ? 'bg-pos-interactive-primary text-pos-text-primary border-b-2 border-pos-info' 
                : 'text-pos-text-muted hover:text-pos-text-primary hover:bg-pos-bg-tertiary'
            }`}
            onClick={() => setActiveTab('payment')}
          >
            Payment
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-custom">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Store Name</label>
                <input type="text" defaultValue="My POS Store" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info" />
              </div>
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Tax Rate (%)</label>
                <input type="number" defaultValue="8" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info" />
              </div>
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Currency</label>
                <select defaultValue="USD" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Language</label>
                <select defaultValue="en" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Theme</label>
                <select defaultValue="dark" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Font Size</label>
                <select defaultValue="medium" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="show-images" defaultChecked className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="show-images" className="text-pos-text-primary text-sm">Show Product Images</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="compact-mode" className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="compact-mode" className="text-pos-text-primary text-sm">Compact Mode</label>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-6">
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Receipt Printer</label>
                <select defaultValue="default" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="default">Default Printer</option>
                  <option value="thermal">Thermal Printer</option>
                  <option value="none">No Printer</option>
                </select>
              </div>
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Kitchen Printer</label>
                <select defaultValue="none" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="none">No Printer</option>
                  <option value="kitchen1">Kitchen Printer 1</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="auto-print" className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="auto-print" className="text-pos-text-primary text-sm">Auto Print Receipt</label>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="cash-enabled" defaultChecked className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="cash-enabled" className="text-pos-text-primary text-sm">Enable Cash Payment</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="card-enabled" defaultChecked className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="card-enabled" className="text-pos-text-primary text-sm">Enable Card Payment</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="mobile-enabled" className="w-4 h-4 text-pos-info bg-pos-bg-tertiary border-pos-border-secondary rounded focus:ring-pos-info" />
                <label htmlFor="mobile-enabled" className="text-pos-text-primary text-sm">Enable Mobile Payment</label>
              </div>
              <div>
                <label className="block text-pos-text-primary text-sm font-medium mb-2">Card Terminal</label>
                <select defaultValue="none" className="w-full px-3 py-2 bg-pos-bg-tertiary border border-pos-border-secondary text-pos-text-primary rounded focus:outline-none focus:border-pos-info">
                  <option value="none">No Terminal</option>
                  <option value="stripe">Stripe Terminal</option>
                  <option value="square">Square Terminal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-pos-border-primary">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-success" onClick={onClose}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
