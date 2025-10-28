import React, { useState, useRef, useEffect } from 'react';
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
    <div className="flex-1 bg-pos-bg-secondary flex flex-col overflow-hidden">
      {/* Main products grid */}
      <div className="flex-1 p-2 grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] overflow-y-auto content-start scrollbar-custom">
        {products.map((product) => (
          <div
            key={product.id}
            className={`card card-hover max-w-24 border-pos-border-accent flex flex-col gap-0.5 ${
              selectedProductId === product.id ? 'border-pos-info bg-pos-bg-tertiary' : 'bg-pos-bg-tertiary'
            }`}
            onClick={() => handleProductClick(product)}
          >
            <div className="max-w-24 h-12 flex items-center justify-center text-4xl overflow-hidden" style={{ background: product.color }}>
              {isImageUrl(product.image) ? (
                <img 
                  src={`http://localhost:5000${product.image}`} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="drop-shadow-md">{product.image || '📦'}</span>
              )}
            </div>
            <div className="flex flex-col gap-0 items-center">
              <div className="text-sm font-medium text-white leading-none max-h-8">{product.name}</div>
              <div className="text-xs text-pos-text-muted font-semibold">€{product.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-products section at the bottom */}
      {(selectedProductId && (subProducts.length > 0 || loadingSubProducts)) && (
        <div className="bg-pos-bg-accent border-t-2 border-pos-border-accent p-4 max-h-[40vh] overflow-y-auto scrollbar-custom" style={{animation: 'slideUp 0.3s ease-out'}} ref={subProductsRef}>
          {loadingSubProducts ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-pos-text-muted text-xs">
              <div className="w-5 h-5 border-2 border-pos-border-accent border-t-pos-info rounded-full animate-spin"></div>
              <span>Loading variants...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-pos-border-accent">
                <h3 className="text-white m-0 text-base font-semibold">Select {products.find(p => p.id === selectedProductId)?.name} variant</h3>
                <button 
                  className="bg-none border-none text-pos-text-muted text-2xl cursor-pointer p-0 w-7.5 h-7.5 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-pos-border-accent hover:text-white" 
                  onClick={() => {
                    setSelectedProductId(null);
                    setSubProducts([]);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                {subProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className="bg-pos-bg-tertiary border-2 border-pos-border-accent rounded-md p-1 cursor-pointer transition-all duration-200 flex flex-col gap-1 text-center max-w-20 hover:transform hover:-translate-y-0.5 hover:border-pos-info card-hover"
                    onClick={() => handleSubProductSelect(subProduct)}
                  >
                    <div className="h-10 flex items-center justify-center text-2xl rounded overflow-hidden" style={{ background: subProduct.color }}>
                      {isImageUrl(subProduct.image) ? (
                        <img 
                          src={`http://localhost:5000${subProduct.image}`} 
                          alt={subProduct.name} 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="drop-shadow-sm">{subProduct.image || '📦'}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-medium text-white leading-tight max-h-5.5 overflow-hidden">{subProduct.name}</div>
                      <div className="text-xs text-pos-info font-semibold">€{subProduct.price.toFixed(2)}</div>
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