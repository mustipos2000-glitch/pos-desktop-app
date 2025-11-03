import React, { useState, useRef, useEffect } from 'react';
import ApiService from '../services/api';

const ProductGrid = ({ products, onAddToCart }) => {

  console.log("products in ProductGrid", products);
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
    if (selectedProductId === product.id) {
      setSelectedProductId(null);
      setSubProducts([]);
      return;
    }

    try {
      setLoadingSubProducts(true);
      setSelectedProductId(product.id);

      const response = await ApiService.getSubProductsByProductId(product.id);
      const productSubProducts = response.data;

      if (productSubProducts && productSubProducts.length > 0) {
        setSubProducts(
          productSubProducts.map((subProduct) => ({
            id: subProduct.id,
            name: subProduct.name,
            price: subProduct.price,
            category: subProduct.category_name || 'Uncategorized',
            image: subProduct.image || '📦',
            color: subProduct.color || product.color || '#3b82f6',
          }))
        );
      } else {
        setSelectedProductId(null);
        setSubProducts([]);
        onAddToCart(product);
      }
    } catch (error) {
      console.error('Error checking sub-products:', error);
      setSelectedProductId(null);
      setSubProducts([]);
      onAddToCart(product);
    } finally {
      setLoadingSubProducts(false);
    }
  };

  const handleSubProductSelect = (subProduct) => {
    onAddToCart(subProduct);
    setSelectedProductId(null);
    setSubProducts([]);
  };

  return (
    <div className="flex-1 bg-pos-bg-secondary flex flex-col overflow-hidden">
      {/* Main products grid */}
      <div className="flex-1 p-2 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 overflow-y-auto content-start scrollbar-custom">
        {products.map((product) => (
          <div
  key={product.id}
  className="product-card flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-200 relative bg-[#1e293b] rounded-lg overflow-hidden"
  onClick={() => handleProductClick(product)}
  style={{
    border: `2px solid ${
      product.color?.startsWith('#') ? product.color : `#${product.color || '3b82f6'}`
    }`,
    
  }}
>
  
  {/* Price - Top Right */}
  <div className="absolute  right-0  text-xs font-semibold text-gray-200  bg-[rgba(0,0,0,0.6)] px-1.5 py-[1px] ">
    €{product.price.toFixed(2)}
  </div>

  {/* Image */}
  <div className="w-full h-20 flex mt-2 items-center justify-center overflow-hidden">
    {isImageUrl(product.image) ? (
      <img
        src={`http://localhost:5000${product.image}`}
        alt={product.name}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-3xl">{product.image || '📦'}</span>
    )}
  </div>

  {/* Product Name */}
  <div className="w-full px-2 py-2">
    <div
      className="text-sm font-semibold text-white leading-tight break-words text-center"
      style={{ wordBreak: 'break-word' }}
    >
      {product.name}
    </div>
  </div>
</div>

        ))}
      </div>

      {/* Sub-products section */}
      {(selectedProductId && (subProducts.length > 0 || loadingSubProducts)) && (
        <div
          className="bg-pos-bg-accent border-t-2 border-pos-border-accent p-4 max-h-[40vh] overflow-y-auto scrollbar-custom animate-slideUp"
          ref={subProductsRef}
        >
          {loadingSubProducts ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-pos-text-muted text-xs">
              <div className="w-5 h-5 border-2 border-pos-border-accent border-t-pos-info rounded-full animate-spin"></div>
              <span>Loading variants...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-pos-border-accent">
                <h3 className="text-white m-0 text-base font-semibold">
                  Select {products.find((p) => p.id === selectedProductId)?.name} variant
                </h3>
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

              {/* Sub-product grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
                {subProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className="cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center rounded-lg p-2 hover:scale-[1.03]"
                    style={{
                      border: `2px solid ${subProduct.color || '#3b82f6'}`,
                      background: '#1e293b',
                    }}
                    onClick={() => handleSubProductSelect(subProduct)}
                  >
                    <div
                      className="h-10 flex items-center justify-center text-2xl rounded-md overflow-hidden w-full"
                      style={{
                        background: subProduct.color || '#1e293b',
                      }}
                    >
                      {isImageUrl(subProduct.image) ? (
                        <img
                          src={`http://localhost:5000${subProduct.image}`}
                          alt={subProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{subProduct.image || '📦'}</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-medium text-white text-ellipsis overflow-hidden whitespace-nowrap w-full">
                      {subProduct.name}
                    </div>
                    <div className="text-xs text-pos-info font-semibold">
                      €{subProduct.price.toFixed(2)}
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
