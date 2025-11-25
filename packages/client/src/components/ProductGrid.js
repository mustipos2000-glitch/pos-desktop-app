import React, { useState, useRef, useEffect } from 'react';
import ApiService from '../services/api';
import SubproductModal from './SubproductModal';

const ProductGrid = ({ products, onAddToCart, customQuantity, setCustomQuantity, searchQuery }) => {
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

  // Hide button and inline sub-products when category changes
  useEffect(() => {
    // Check if the product with subproducts button is still in the current products list
    if (productWithSubproducts) {
      const productStillVisible = products.some(p => p.id === productWithSubproducts.id);
      if (!productStillVisible) {
        setProductWithSubproducts(null);
      }
    }

    // Check if the selected product with inline sub-products is still in the current products list
    if (selectedProductId) {
      const productStillVisible = products.some(p => p.id === selectedProductId);
      if (!productStillVisible) {
        setSelectedProductId(null);
        setSubProducts([]);
      }
    }
  }, [products, productWithSubproducts, selectedProductId]);

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

      // Filter sub-products based on search query if exists
      let filteredSubProducts = productSubProducts;
      if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        filteredSubProducts = productSubProducts.filter(subProduct =>
          subProduct.name.toLowerCase().includes(query)
        );
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

        // Set sub-products for inline display (filtered if search query exists)
        setSubProducts(
          filteredSubProducts.map((subProduct) => ({
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
    <div className="flex-1 bg-pos-bg-secondary flex flex-col overflow-hidden relative mr-1 rounded-lg">


      {/* Main products grid */}
      <div className="flex-1 p-2 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 overflow-y-auto content-start scrollbar-custom">
        {products.length === 0 && searchQuery && searchQuery.trim() !== '' ? (
          <div className="col-span-full flex flex-col items-center justify-center h-full text-pos-text-muted">
            <span className="text-4xl mb-2">🔍</span>
            <span className="text-lg">No products found</span>
            <span className="text-sm mt-1">Try a different search term</span>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="product-card flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-200 relative hover:-translate-y-1 hover:shadow-lg"
              onClick={() => handleProductClick(product)}
              style={{
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: product.color || "#3b82f6",
                boxShadow: `0 0 0 1px ${product.color || "#3b82f6"} inset`, // ensures color visibility
              }}
            >

              {/* Price - Top Right */}
              <div className="absolute rounded-md text-xs font-semibold text-gray-200  bg-[rgba(0,0,0,0.6)] px-1.5 py-[1px] ">
                €{product.price.toFixed(2)}
              </div>

              {/* Image */}
              <div className="w-full h-20 flex p-1 items-center justify-center overflow-hidden">
                {isImageUrl(product.image) ? (
                  <img
                    src={`http://localhost:5000${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className="text-3xl">{product.image || '📦'}</span>
                )}
              </div>

              {/* Product Name */}
              <div className="w-full px-2 py-1">
                <div
                  className="text-sm font-semibold text-white leading-tight break-words text-center"
                  style={{ wordBreak: 'break-word' }}
                >
                  {product.name}
                </div>
              </div>
            </div>

          ))
        )}
      </div>

      {/* Sub-products section */}
      {(selectedProductId && (subProducts.length > 0 || loadingSubProducts)) && (
        <div
          className="p-1 max-h-[20vh] overflow-y-auto scrollbar-custom animate-slideUp border-t pt-2 bg-pos-bg-secondary"
          ref={subProductsRef}
        >
          {loadingSubProducts ? (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-pos-text-muted text-xs">
              <div className="w-5 h-5"></div>
              <span>Loading variants...</span>
            </div>
          ) : (
            <>
              {/* Sub-product grid - Compact layout */}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-1.5">
                {subProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className="cursor-pointer transition-all duration-200 flex items-center justify-between px-2 py-2 rounded hover:brightness-110 hover:scale-[1.02]"
                    style={{
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: subProduct.color || "#3b82f6",
                      backgroundColor: `${subProduct.color || "#3b82f6"}15`,
                    }}
                    onClick={() => handleSubProductSelect(subProduct)}
                  >
                    {/* Product Name */}
                    <div className="flex-1 min-w-0 mr-2">
                      <div
                        className="text-base font-medium text-white leading-tight truncate"
                        title={subProduct.name}
                      >
                        {subProduct.name}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-xs font-semibold text-white whitespace-nowrap">
                      €{subProduct.price.toFixed(2)}
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
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

export default ProductGrid;
