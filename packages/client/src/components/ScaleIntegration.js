import React, { useState, useEffect, useCallback } from 'react';

const ScaleIntegration = ({ 
  onWeightReceived, 
  product, 
  isVisible = false, 
  onClose 
}) => {
  const [scaleStatus, setScaleStatus] = useState({
    connected: false,
    type: null,
    lastWeight: 0,
    stable: false
  });
  
  
  const [connectionConfig, setConnectionConfig] = useState({
    type: 'serial',
    serial: {
      port: 'COM1',
      baudRate: 9600
    },
    tcp: {
      host: '192.168.1.100',
      port: 4001
    }
  });
  
  const [availablePorts, setAvailablePorts] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isStable, setIsStable] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available serial ports
  const fetchAvailablePorts = useCallback(async () => {
    try {
      const response = await fetch('/api/scale/ports');
      const data = await response.json();
      if (data.success) {
        setAvailablePorts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch available ports:', error);
    }
  }, []);

  // Get scale status
  const fetchScaleStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/scale/status');
      const data = await response.json();
      if (data.success) {
        setScaleStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch scale status:', error);
    }
  }, []);

  // Connect to scale
  const connectToScale = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const config = connectionConfig.type === 'serial' 
        ? connectionConfig.serial 
        : connectionConfig.tcp;
        
      const response = await fetch('/api/scale/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: connectionConfig.type,
          config: config
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchScaleStatus();
        setError(null);
      } else {
        setError(data.error || 'Failed to connect to scale');
      }
    } catch (error) {
      setError('Connection failed: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from scale
  const disconnectFromScale = async () => {
    try {
      const response = await fetch('/api/scale/disconnect', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setScaleStatus({
          connected: false,
          type: null,
          lastWeight: 0,
          stable: false
        });
        setCurrentWeight(0);
        setIsStable(false);
        setCalculatedPrice(0);
      }
    } catch (error) {
      setError('Disconnect failed: ' + error.message);
    }
  };

  // Get current weight
  const getCurrentWeight = async () => {
    try {
      const response = await fetch('/api/scale/weight');
      const data = await response.json();
      
      if (data.success) {
        setCurrentWeight(data.data.weight);
        setIsStable(data.data.stable);
        
        // Calculate price if product has weight-based pricing
        if (product && product.is_weight_based && product.price_per_unit) {
          calculatePrice(data.data.weight);
        }
      } else {
        setError(data.error || 'Failed to get weight');
      }
    } catch (error) {
      setError('Failed to get weight: ' + error.message);
    }
  };

  // Tare the scale
  const tareScale = async () => {
    try {
      const response = await fetch('/api/scale/tare', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'Failed to tare scale');
      }
    } catch (error) {
      setError('Tare failed: ' + error.message);
    }
  };

  // Calculate price based on weight
  const calculatePrice = async (weight) => {
    if (!product || !product.is_weight_based || !product.price_per_unit) {
      return;
    }

    try {
      const response = await fetch('/api/scale/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: weight,
          pricePerUnit: product.price_per_unit,
          unit: product.weight_unit || 'kg'
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCalculatedPrice(data.data.totalPrice);
      }
    } catch (error) {
      console.error('Price calculation failed:', error);
    }
  };

  // Accept current weight
  const acceptWeight = () => {
    if (currentWeight > 0 && isStable && onWeightReceived) {
      onWeightReceived({
        weight: currentWeight,
        unit: product?.weight_unit || 'kg',
        price: calculatedPrice,
        stable: isStable
      });
    }
  };

  // Initialize component
  useEffect(() => {
    if (isVisible) {
      fetchAvailablePorts();
      fetchScaleStatus();
    }
  }, [isVisible, fetchAvailablePorts, fetchScaleStatus]);

  // Auto-refresh weight when connected
  useEffect(() => {
    let interval;
    if (scaleStatus.connected && isVisible) {
      interval = setInterval(() => {
        getCurrentWeight();
      }, 1000); // Update every second
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [scaleStatus.connected, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Scale Integration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Product Info */}
        {product && product.is_weight_based && (
          <div className="bg-blue-50 p-3 rounded mb-4">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-600">
              Price: €{product.price_per_unit}/{product.weight_unit || 'kg'}
            </p>
            {product.minimum_weight > 0 && (
              <p className="text-sm text-gray-600">
                Min: {product.minimum_weight} {product.weight_unit || 'kg'}
              </p>
            )}
          </div>
        )}

        {/* Connection Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              scaleStatus.connected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {scaleStatus.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {scaleStatus.connected && (
            <p className="text-sm text-gray-600">
              Type: {scaleStatus.type?.toUpperCase()}
            </p>
          )}
        </div>

        {/* Connection Configuration */}
        {!scaleStatus.connected && (
          <div className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Connection Type:
              </label>
              <select
                value={connectionConfig.type}
                onChange={(e) => setConnectionConfig(prev => ({
                  ...prev,
                  type: e.target.value
                }))}
                className="w-full p-2 border rounded"
              >
                <option value="serial">Serial (COM Port)</option>
                <option value="tcp">TCP/IP Network</option>
              </select>
            </div>

            {connectionConfig.type === 'serial' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    COM Port:
                  </label>
                  <select
                    value={connectionConfig.serial.port}
                    onChange={(e) => setConnectionConfig(prev => ({
                      ...prev,
                      serial: { ...prev.serial, port: e.target.value }
                    }))}
                    className="w-full p-2 border rounded"
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
                    value={connectionConfig.serial.baudRate}
                    onChange={(e) => setConnectionConfig(prev => ({
                      ...prev,
                      serial: { ...prev.serial, baudRate: parseInt(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={38400}>38400</option>
                    <option value={57600}>57600</option>
                    <option value={115200}>115200</option>
                  </select>
                </div>
              </div>
            )}

            {connectionConfig.type === 'tcp' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    IP Address:
                  </label>
                  <input
                    type="text"
                    value={connectionConfig.tcp.host}
                    onChange={(e) => setConnectionConfig(prev => ({
                      ...prev,
                      tcp: { ...prev.tcp, host: e.target.value }
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="192.168.1.100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Port:
                  </label>
                  <input
                    type="number"
                    value={connectionConfig.tcp.port}
                    onChange={(e) => setConnectionConfig(prev => ({
                      ...prev,
                      tcp: { ...prev.tcp, port: parseInt(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded"
                    placeholder="4001"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Weight Display */}
        {scaleStatus.connected && (
          <div className="mb-4">
            <div className="bg-gray-50 p-4 rounded text-center">
              <div className="text-3xl font-bold mb-2">
                {currentWeight.toFixed(3)} {product?.weight_unit || 'kg'}
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  isStable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isStable ? 'Stable' : 'Weighing...'}
                </span>
              </div>

              {calculatedPrice > 0 && (
                <div className="text-xl font-semibold text-blue-600">
                  €{calculatedPrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!scaleStatus.connected ? (
            <button
              onClick={connectToScale}
              disabled={isConnecting}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect to Scale'}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={getCurrentWeight}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Get Weight
                </button>
                
                <button
                  onClick={tareScale}
                  className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
                >
                  Tare
                </button>
              </div>
              
              {currentWeight > 0 && isStable && (
                <button
                  onClick={acceptWeight}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                  Accept Weight
                </button>
              )}
              
              <button
                onClick={disconnectFromScale}
                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Connect your Bizerba scale via Serial or TCP/IP</li>
            <li>Place item on scale and wait for stable reading</li>
            <li>Use "Tare" to zero out container weight</li>
            <li>Click "Accept Weight" when ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScaleIntegration;