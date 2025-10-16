import React, { useState } from 'react';
import './SettingsModal.css';

const SettingsModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-tabs">
          <button
            className={activeTab === 'general' ? 'active' : ''}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={activeTab === 'display' ? 'active' : ''}
            onClick={() => setActiveTab('display')}
          >
            Display
          </button>
          <button
            className={activeTab === 'printer' ? 'active' : ''}
            onClick={() => setActiveTab('printer')}
          >
            Printer
          </button>
          <button
            className={activeTab === 'payment' ? 'active' : ''}
            onClick={() => setActiveTab('payment')}
          >
            Payment
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="setting-item">
                <label>Store Name</label>
                <input type="text" defaultValue="My POS Store" />
              </div>
              <div className="setting-item">
                <label>Tax Rate (%)</label>
                <input type="number" defaultValue="8" />
              </div>
              <div className="setting-item">
                <label>Currency</label>
                <select defaultValue="USD">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Language</label>
                <select defaultValue="en">
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="settings-section">
              <div className="setting-item">
                <label>Theme</label>
                <select defaultValue="dark">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Font Size</label>
                <select defaultValue="medium">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div className="setting-item checkbox">
                <input type="checkbox" id="show-images" defaultChecked />
                <label htmlFor="show-images">Show Product Images</label>
              </div>
              <div className="setting-item checkbox">
                <input type="checkbox" id="compact-mode" />
                <label htmlFor="compact-mode">Compact Mode</label>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="settings-section">
              <div className="setting-item">
                <label>Receipt Printer</label>
                <select defaultValue="default">
                  <option value="default">Default Printer</option>
                  <option value="thermal">Thermal Printer</option>
                  <option value="none">No Printer</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Kitchen Printer</label>
                <select defaultValue="none">
                  <option value="none">No Printer</option>
                  <option value="kitchen1">Kitchen Printer 1</option>
                </select>
              </div>
              <div className="setting-item checkbox">
                <input type="checkbox" id="auto-print" />
                <label htmlFor="auto-print">Auto Print Receipt</label>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="settings-section">
              <div className="setting-item checkbox">
                <input type="checkbox" id="cash-enabled" defaultChecked />
                <label htmlFor="cash-enabled">Enable Cash Payment</label>
              </div>
              <div className="setting-item checkbox">
                <input type="checkbox" id="card-enabled" defaultChecked />
                <label htmlFor="card-enabled">Enable Card Payment</label>
              </div>
              <div className="setting-item checkbox">
                <input type="checkbox" id="mobile-enabled" />
                <label htmlFor="mobile-enabled">Enable Mobile Payment</label>
              </div>
              <div className="setting-item">
                <label>Card Terminal</label>
                <select defaultValue="none">
                  <option value="none">No Terminal</option>
                  <option value="stripe">Stripe Terminal</option>
                  <option value="square">Square Terminal</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={onClose}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
