import React, { useState, useEffect } from 'react';

const ScaleConfiguration = ({ isVisible, onClose, onSave }) => {
  const [config, setConfig] = useState({
    enabled: false,
    defaultConnectionType: 'serial',
    serial: {
      port: 'COM1',
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    },
    tcp: {
      host: '192.168.1.100',
      port: 4001
    },
    autoConnect: false,
    autoTare: false,
    weightTimeout: 5000,
    stableWeightDelay: 2000
  });

  const [availablePorts, setAvailablePorts] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch available serial ports
  useEffect(() => {
    if (isVisible) {
      fetchAvailablePorts();
      loadConfiguration();
    }
  }, [isVisible]);

  const fetchAvailablePorts = async () => {
    try {
      const response = await fetch('/api/scale/ports');
      const data = await response.json();
      if (data.success) {
        setAvailablePorts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch available ports:', error);
    }
  };

  const loadConfiguration = () => {
    // Load configuration from localStorage or API
    const savedConfig = localStorage.getItem('scaleConfiguration');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved configuration:', error);
      }
    }
  };

  const saveConfiguration = () => {
    // Save to localStorage and call parent callback
    localStorage.setItem('scaleConfiguration', JSON.stringify(config));
    if (onSave) {
      onSave(config);
    }
    onClose();
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // First connect
      const connectionConfig = config.defaultConnectionType === 'serial' 
        ? config.serial 
        : config.tcp;

      const connectResponse = await fetch('/api/scale/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: config.defaultConnectionType,
          config: connectionConfig
        }),
      });

      const connectData = await connectResponse.json();

      if (!connectData.success) {
        setTestResult({
          success: false,
          message: connectData.error || 'Failed to connect'
        });
        return;
      }

      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test the connection
      const testResponse = await fetch('/api/scale/test');
      const testData = await testResponse.json();

      setTestResult({
        success: testData.success,
        message: testData.success 
          ? `Connected successfully! Weight: ${testData.data.weight} ${testData.data.unit || 'kg'}`
          : testData.error || 'Connection test failed'
      });

    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Scale Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">General Settings</h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    enabled: e.target.checked
                  }))}
                  className="mr-2"
                />
                Enable Scale Integration
              </label>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Default Connection Type:
                </label>
                <select
                  value={config.defaultConnectionType}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    defaultConnectionType: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                  disabled={!config.enabled}
                >
                  <option value="serial">Serial (COM Port)</option>
                  <option value="tcp">TCP/IP Network</option>
                </select>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoConnect}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    autoConnect: e.target.checked
                  }))}
                  className="mr-2"
                  disabled={!config.enabled}
                />
                Auto-connect on startup
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoTare}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    autoTare: e.target.checked
                  }))}
                  className="mr-2"
                  disabled={!config.enabled}
                />
                Auto-tare before weighing
              </label>
            </div>
          </div>

          {/* Serial Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Serial Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  COM Port:
                </label>
                <select
                  value={config.serial.port}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    serial: { ...prev.serial, port: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  disabled={!config.enabled}
                >
                  {availablePorts.map(port => (
                    <option key={port.path} value={port.path}>
                      {port.path} {port.manufacturer && `(${port.manufacturer})`}
                    </option>
                  ))}
                  <option value="COM1">COM1</option>
                  <option value="COM2">COM2</option>
                  <option value="COM3">COM3</option>
                  <option value="COM4">COM4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Baud Rate:
                </label>
                <select
                  value={config.serial.baudRate}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    serial: { ...prev.serial, baudRate: parseInt(e.target.value) }
                  }))}
                  className="w-full p-2 border rounded"
                  disabled={!config.enabled}
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Data Bits:
                </label>
                <select
                  value={config.serial.dataBits}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    serial: { ...prev.serial, dataBits: parseInt(e.target.value) }
                  }))}
                  className="w-full p-2 border rounded"
                  disabled={!config.enabled}
                >
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Parity:
                </label>
                <select
                  value={config.serial.parity}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    serial: { ...prev.serial, parity: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  disabled={!config.enabled}
                >
                  <option value="none">None</option>
                  <option value="even">Even</option>
                  <option value="odd">Odd</option>
                </select>
              </div>
            </div>
          </div>

          {/* TCP Configuration */}
          <div>
            <h3 className="text-lg font-semibold mb-3">TCP/IP Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  IP Address:
                </label>
                <input
                  type="text"
                  value={config.tcp.host}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    tcp: { ...prev.tcp, host: e.target.value }
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="192.168.1.100"
                  disabled={!config.enabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Port:
                </label>
                <input
                  type="number"
                  value={config.tcp.port}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    tcp: { ...prev.tcp, port: parseInt(e.target.value) }
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="4001"
                  disabled={!config.enabled}
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Advanced Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Weight Timeout (ms):
                </label>
                <input
                  type="number"
                  value={config.weightTimeout}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    weightTimeout: parseInt(e.target.value)
                  }))}
                  className="w-full p-2 border rounded"
                  min="1000"
                  max="30000"
                  disabled={!config.enabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Stable Weight Delay (ms):
                </label>
                <input
                  type="number"
                  value={config.stableWeightDelay}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    stableWeightDelay: parseInt(e.target.value)
                  }))}
                  className="w-full p-2 border rounded"
                  min="500"
                  max="10000"
                  disabled={!config.enabled}
                />
              </div>
            </div>
          </div>

          {/* Test Connection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Connection</h3>
            
            <button
              onClick={testConnection}
              disabled={!config.enabled || isTesting}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <div className={`p-3 rounded ${
                testResult.success 
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              onClick={saveConfiguration}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Configuration
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Bizerba Scale Setup Help:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Serial:</strong> Connect scale via RS232/USB cable to COM port</li>
            <li>• <strong>TCP/IP:</strong> Connect scale to network and configure IP address</li>
            <li>• <strong>Common Baud Rates:</strong> 9600 (most common), 19200, 38400</li>
            <li>• <strong>Bizerba Models:</strong> Most models use 9600 baud, 8 data bits, no parity</li>
            <li>• Check your scale's manual for specific communication settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScaleConfiguration;