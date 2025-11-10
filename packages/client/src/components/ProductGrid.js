import React, { useState, useRef, useEffect } from 'react';
import ApiService from '../services/api';
import SubproductModal from './SubproductModal';

const ProductGrid = ({ products, onAddToCart, customQuantity, setCustomQuantity }) => {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [subProducts, setSubProducts] = useState([]);
  const [loadingSubProducts, setLoadingSubProducts] = useState(false);
  const [showSubproductModal, setShowSubproductModal] = useState(false);
  const [productWithSubproducts, setProductWithSubproducts] = useState(null);
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
    // If same product clicked again → add to cart but keep sub-products visible
    if (selectedProductId === product.id) {
      onAddToCart(product, Number(customQuantity) || 1);
      setCustomQuantity(''); // ✅ reset quantity input
      return;
    }

    try {
      setLoadingSubProducts(true);
      setSelectedProductId(product.id);

      // Fetch sub-products
      const response = await ApiService.getSubProductsByProductId(product.id);
      const productSubProducts = response.data;

      // No sub-products → directly add product
      if (!productSubProducts || productSubProducts.length === 0) {
        onAddToCart(product, Number(customQuantity) || 1);
        setCustomQuantity(''); // ✅ reset quantity input
        setSelectedProductId(null);
        setSubProducts([]);
        setProductWithSubproducts(null);
        return;
      }

      // Has sub-products → check sub_product_group setting
      if (product.sub_product_group) {
        // sub_product_group is checked → show button only
        onAddToCart(product, Number(customQuantity) || 1);
        setCustomQuantity(''); // ✅ reset quantity input
        setSelectedProductId(null);
        setSubProducts([]);
        setProductWithSubproducts(product);
      } else {
        // sub_product_group is unchecked → show inline products
        onAddToCart(product, Number(customQuantity) || 1);
        setCustomQuantity(''); // ✅ reset quantity input
        setProductWithSubproducts(null);

        // Set sub-products for inline display
        setSubProducts(
          productSubProducts.map((subProduct) => ({
            id: subProduct.id,
            name: subProduct.name,
            price: subProduct.price,
            category: subProduct.category_name || "Uncategorized",
            image: subProduct.image || "📦",
            color: subProduct.color || product.color || "#3b82f6",
          }))
        );
      }
    } catch (error) {
      console.error("Error checking sub-products:", error);
      onAddToCart(product, Number(customQuantity) || 1);
      setCustomQuantity(''); // ✅ reset quantity input
      setSelectedProductId(null);
      setSubProducts([]);
      setProductWithSubproducts(null);
    } finally {
      setLoadingSubProducts(false);
    }
  };

  const handleSubProductSelect = (subProduct) => {
    onAddToCart(subProduct, Number(customQuantity) || 1);
    setCustomQuantity(''); // ✅ reset quantity input
    // Keep subproducts visible - don't clear them
  };



  return (
    <div className="flex-1 bg-pos-bg-secondary flex flex-col overflow-hidden relative">
      {/* Main products grid */}
      <div className="flex-1 p-2 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 overflow-y-auto content-start scrollbar-custom">
        {products.map((product) => (
          <div
            key={product.id}
            className="product-card flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-200 relative overflow-hidden"
            onClick={() => handleProductClick(product)}
            style={{
              borderWidth: "2px",
              borderStyle: "solid",
              borderColor: product.color || "#3b82f6",
              boxShadow: `0 0 0 1px ${product.color || "#3b82f6"} inset`, // ensures color visibility
            }}
          >

            {/* Price - Top Right */}
            <div className="absolute  right-0  rounded-md text-xs font-semibold text-gray-200  bg-[rgba(0,0,0,0.6)] px-1.5 py-[1px] ">
              €{product.price.toFixed(2)}
            </div>

            {/* Image */}
            <div className="w-full h-20 flex mt-2 p-1 items-center justify-center overflow-hidden">
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
          className="p-1 max-h-[40vh] overflow-y-auto scrollbar-custom animate-slideUp"
          ref={subProductsRef}
        >
          {loadingSubProducts ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-pos-text-muted text-xs">
              <div className="w-5 h-5"></div>
              <span>Loading variants...</span>
            </div>
          ) : (
            <>
              {/* Sub-product grid */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                {subProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className="cursor-pointer transition-all duration-200 flex flex-col items-center justify-between text-center relative overflow-hidden"
                    style={{
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: subProduct.color || "#3b82f6",
                      boxShadow: `0 0 0 1px ${subProduct.color || "#3b82f6"} inset`,
                    }}
                    onClick={() => handleSubProductSelect(subProduct)}
                  >
                    {/* Price - Top Right */}
                    <div className="absolute right-0 rounded-md text-xs font-semibold text-gray-200 bg-[rgba(0,0,0,0.6)] px-1.5 py-[1px]">
                      €{subProduct.price.toFixed(2)}
                    </div>

                    {/* Image */}
                    <div className="w-full h-20 flex mt-2 p-1 items-center justify-center overflow-hidden">
                      {isImageUrl(subProduct.image) ? (
                        <img
                          src={`http://localhost:5000${subProduct.image}`}
                          alt={subProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{subProduct.image || '📦'}</span>
                      )}
                    </div>

                    {/* Product Name */}
                    <div className="w-full px-2 py-2">
                      <div
                        className="text-sm font-semibold text-white leading-tight break-words text-center"
                        style={{ wordBreak: 'break-word' }}
                      >
                        {subProduct.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Subproducts Button - Bottom Left */}
      {productWithSubproducts && (
        <button
          onClick={() => setShowSubproductModal(true)}
          className="absolute bottom-0 px-6 py-3 btn-primary hover:bg-pos-interactive-primary text-white font-semibold transition-all duration-200 hover:scale-105"
        >
          Subproducts
        </button>
      )}

      {/* Subproduct Modal */}
      {showSubproductModal && productWithSubproducts && (
        <SubproductModal
          isOpen={showSubproductModal}
          onClose={() => setShowSubproductModal(false)}
          onAddToCart={onAddToCart}
          productId={productWithSubproducts.id}
        />
      )}
    </div>
  );
};

export default ProductGrid;
