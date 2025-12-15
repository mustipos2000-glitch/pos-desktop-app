import React, { useState, useEffect, useRef } from 'react';

const BarcodeSearchModal = ({ isOpen, onClose, onProductFound }) => {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = async (searchBarcode) => {
    const barcodeToSearch = searchBarcode || barcode;
    
    if (!barcodeToSearch || barcodeToSearch.trim() === '') {
      setError('Please enter a barcode');
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
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (err) {
      setError('Failed to search product');
      console.error('Barcode search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const handleClose = () => {
    setBarcode('');
    setError('');
    setProduct(null);
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
          {/* Search Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Scan barcode..."
                className="flex-1 px-4 py-2 bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary placeholder-pos-text-muted rounded-lg focus:outline-none focus:border-pos-info transition-colors"
                disabled={loading}
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
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
            <div className="border border-pos-border-primary rounded-lg p-4 bg-pos-bg-tertiary">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Name:</span>
                  <span className="font-medium text-pos-text-primary">{product.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Price:</span>
                  <span className="font-medium text-pos-text-primary">€{product.price?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-pos-text-muted">Barcode:</span>
                  <span className="font-medium text-pos-text-primary">{product.barcode}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeSearchModal;
