import React, { useState, useRef, useEffect } from 'react';
import './css/ProductGrid.css';
import ApiService from '../services/api';

const ProductGrid = ({ products, onAddToCart }) => {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [subProducts, setSubProducts] = useState([]);
  const [loadingSubProducts, setLoadingSubProducts] = useState(false);
  const subProductsRef = useRef(null);

  // Function to determine if the image is a URL or emoji
  const isImageUrl = (image) => {
    return image && (image.startsWith('http') || image.startsWith('/uploads/'));
  };

  // Handle clicking outside to close sub-products
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subProductsRef.current && !subProductsRef.current.contains(event.target)) {
        // Check if the click was on a product card
        const productCard = event.target.closest('.product-card');
        if (!productCard) {
          setSelectedProductId(null);
          setSubProducts([]);
        }
      }
    };

    if (selectedProductId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [selectedProductId]);

  // Handle product click - check for sub-products first
  const handleProductClick = async (product) => {
    // If clicking the same product that's already expanded, collapse it
    if (selectedProductId === product.id) {
      setSelectedProductId(null);
      setSubProducts([]);
      return;
    }

    try {
      setLoadingSubProducts(true);
      setSelectedProductId(product.id);
      
      // Check if product has sub-products
      const response = await ApiService.getSubProductsByProductId(product.id);
      const productSubProducts = response.data;

      if (productSubProducts && productSubProducts.length > 0) {
        // Product has sub-products, show them at the bottom
        setSubProducts(productSubProducts.map(subProduct => ({
          id: subProduct.id,
          name: subProduct.name,
          price: subProduct.price,
          category: subProduct.category_name || 'Uncategorized',
          image: subProduct.image || '📦',
          color: '#3b82f6'
        })));
      } else {
        // No sub-products, add main product to cart directly
        setSelectedProductId(null);
        setSubProducts([]);
        onAddToCart(product);
      }
    } catch (error) {
      console.error('Error checking sub-products:', error);
      // If there's an error, just add the main product to cart
      setSelectedProductId(null);
      setSubProducts([]);
      onAddToCart(product);
    } finally {
      setLoadingSubProducts(false);
    }
  };

  // Handle sub-product selection
  const handleSubProductSelect = (subProduct) => {
    onAddToCart(subProduct);
    setSelectedProductId(null);
    setSubProducts([]);
  };

  return (
    <div className="product-grid-container">
      {/* Main products grid */}
      <div className="product-grid">
        {products.map((product) => (
          <div
            key={product.id}
            className={`product-card ${selectedProductId === product.id ? 'selected' : ''}`}
            onClick={() => handleProductClick(product)}
          >
            <div className="product-image" style={{ background: product.color }}>
              {isImageUrl(product.image) ? (
                <img 
                  src={`http://localhost:5000${product.image}`} 
                  alt={product.name} 
                  className="product-image-img"
                />
              ) : (
                <span className="product-emoji">{product.image || '📦'}</span>
              )}
            </div>
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-price">€{product.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-products section at the bottom */}
      {(selectedProductId && (subProducts.length > 0 || loadingSubProducts)) && (
        <div className="sub-products-section" ref={subProductsRef}>
          {loadingSubProducts ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span>Loading variants...</span>
            </div>
          ) : (
            <>
              <div className="sub-product-header">
                <h3>Select {products.find(p => p.id === selectedProductId)?.name} variant</h3>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setSelectedProductId(null);
                    setSubProducts([]);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="sub-products-grid">
                {subProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className="sub-product-card"
                    onClick={() => handleSubProductSelect(subProduct)}
                  >
                    <div className="sub-product-image" style={{ background: subProduct.color }}>
                      {isImageUrl(subProduct.image) ? (
                        <img 
                          src={`http://localhost:5000${subProduct.image}`} 
                          alt={subProduct.name} 
                          className="sub-product-image-img"
                        />
                      ) : (
                        <span className="sub-product-emoji">{subProduct.image || '📦'}</span>
                      )}
                    </div>
                    <div className="sub-product-info">
                      <div className="sub-product-name">{subProduct.name}</div>
                      <div className="sub-product-price">€{subProduct.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;