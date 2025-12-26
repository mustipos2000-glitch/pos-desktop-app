import React, { useState, useEffect, useRef } from 'react';

const BarcodeSearchModal = ({ isOpen, onClose, onProductFound }) => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [scannerBuffer, setScannerBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());
  const inputRef = useRef(null);
  const scannerTimeoutRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Clear any previous data
      setBarcode('');
      setError('');
      setProduct(null);
      setScannerBuffer('');
    }
  }, [isOpen]);

  // USB Scanner Detection: Listens for rapid keyboard input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // USB scanners type very fast (< 50ms between keys)
      // Human typing is usually > 100ms
      const isScannerInput = timeDiff < 50;

      if (e.key === 'Enter') {
        // Scanner finished - process the barcode
        if (scannerBuffer.length > 0) {
          console.log('📷 Barcode scanned:', scannerBuffer);
          setBarcode(scannerBuffer);
          handleSearch(scannerBuffer);
          setScannerBuffer('');
        } else if (barcode.length > 0) {
          // Manual entry with Enter key
          handleSearch(barcode);
        }
        e.preventDefault();
      } else if (e.key.length === 1 && isScannerInput) {
        // Scanner is typing - accumulate characters
        setScannerBuffer(prev => prev + e.key);
        
        // Clear buffer after 100ms of no input (scanner finished)
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }
        scannerTimeoutRef.current = setTimeout(() => {
          if (scannerBuffer.length > 0) {
            console.log('📷 Scanner buffer timeout, processing:', scannerBuffer);
            setBarcode(scannerBuffer);
            handleSearch(scannerBuffer);
            setScannerBuffer('');
          }
        }, 100);
      }

      setLastKeyTime(currentTime);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [isOpen, scannerBuffer, barcode, lastKeyTime]);

  const handleSearch = async (searchBarcode) => {
    const barcodeToSearch = searchBarcode || barcode;
    
    if (!barcodeToSearch || barcodeToSearch.trim() === '') {
      setError('Please scan or enter a barcode');
      return;
    }

    setLoading(true);
    setError('');
    setProduct(null);

    try {
      const response = await fetch(`http://localhost:5000/api/products/barcode/${encodeURIComponent(barcodeToSearch)}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setProduct(data.data);
        // Just show product details, don't auto-add to cart
      } else {
        setError(data.error || 'Product not found');
        // Auto-clear error and reset for next scan
        setTimeout(() => {
          setError('');
          setBarcode('');
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 2000);
      }
    } catch (err) {
      setError('Failed to search product');
      console.error('Barcode search error:', err);
      // Auto-clear error
      setTimeout(() => {
        setError('');
        setBarcode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (barcode && barcode.trim() !== '') {
      handleSearch(barcode);
    }
  };

  const handleClose = () => {
    setBarcode('');
    setError('');
    setProduct(null);
    setScannerBuffer('');
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;





  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-pos-bg-secondary rounded-lg shadow-2xl w-full max-w-md mx-4 border border-pos-border-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pos-border-primary">
          <h2 className="text-xl font-semibold text-pos-text-primary">📷 Barcode Search</h2>
          <button
            onClick={handleClose}
            className="text-pos-text-muted hover:text-pos-text-primary text-3xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Scanner Status */}
          <div className="mb-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📷</span>
                <div>
                  <div className="text-sm font-medium text-blue-400">USB Scanner Ready</div>
                  <div className="text-xs text-blue-300">Scan barcode or type manually</div>
                </div>
              </div>
              {scannerBuffer && (
                <div className="text-xs text-blue-300 animate-pulse">
                  Scanning... {scannerBuffer.length} chars
                </div>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualSearch();
                  }
                }}
                placeholder="Scan barcode or type manually..."
                className="flex-1 px-4 py-3 bg-pos-bg-primary border-2 border-pos-border-secondary text-pos-text-primary text-lg placeholder-pos-text-muted rounded-lg focus:outline-none focus:border-pos-info transition-colors"
                disabled={loading}
                autoFocus
              />
              <button
                onClick={handleManualSearch}
                disabled={loading || !barcode}
                className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? '⏳ Searching...' : '🔍 Search'}
              </button>
            </div>
            <div className="mt-2 text-xs text-pos-text-muted">
              💡 Tip: Scanner will automatically search when you scan a barcode
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900 bg-opacity-20 border border-red-500 text-red-400 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Product Details */}
          {product && (
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-900 bg-opacity-20">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">✅</span>
                <div>
                  <div className="text-lg font-bold text-green-400">Product Found!</div>
                  <div className="text-sm text-green-300">Product details below</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-pos-bg-tertiary rounded">
                  <span className="text-pos-text-muted">Name:</span>
                  <span className="font-bold text-pos-text-primary text-lg">{product.name}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-pos-bg-tertiary rounded">
                  <span className="text-pos-text-muted">Price:</span>
                  <span className="font-bold text-green-400 text-xl">€{product.price?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-pos-bg-tertiary rounded">
                  <span className="text-pos-text-muted">Barcode:</span>
                  <span className="font-mono text-pos-text-primary">{product.barcode}</span>
                </div>

                {product.is_weight_based === 1 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-900 bg-opacity-20 border border-orange-500 rounded">
                    <span className="text-xl">⚖️</span>
                    <span className="text-sm text-orange-300">
                      Weight-based product: €{product.price_per_unit}/{product.weight_unit}
                    </span>
                  </div>
                )}
              </div>

              {/* Add to Cart Button */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    if (onProductFound) {
                      onProductFound(product);
                    }
                    handleClose();
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✅ Add to Cart
                </button>
                <button
                  onClick={() => {
                    setProduct(null);
                    setBarcode('');
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  className="px-4 py-3 bg-pos-bg-tertiary text-pos-text-primary rounded-lg hover:bg-pos-bg-primary transition-colors font-medium"
                >
                  🔄 Scan Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeSearchModal;
