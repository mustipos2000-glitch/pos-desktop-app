import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import OrderPanel from '../components/OrderPanel';
import BottomBar from '../components/BottomBar';
import SettingsModal from '../components/SettingsModal';
import SubproductModal from '../components/SubproductModal';
import ApiService from '../services/api';

const POSScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubproducts, setShowSubproducts] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customQuantity, setCustomQuantity] = useState('');
  const [productsWithSubproducts, setProductsWithSubproducts] = useState(new Set());
  const [selectedProductForSubproducts, setSelectedProductForSubproducts] = useState(null);


  // Fetch categories and products from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories (only visible ones)
        const categoryResponse = await ApiService.getCategories({ is_visible: true });
        const categoryNames = categoryResponse.data.map(category => category.name);
        setCategories(categoryNames);

        // Set first category as default selected
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames[0]);
        }

        // Fetch products
        const productResponse = await ApiService.getProducts();
        // Map products to match the expected format
       
        const formattedProducts = productResponse.data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category_name || 'Uncategorized',
          image: product.image || '📦',
          color: product.color || '#3b82f6',
          sub_product_group: product.sub_product_group || false,
        }));
      
        
        setProducts(formattedProducts);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const addToCart = async (product, quantity = 1) => {
  const finalQuantity = quantity > 0 ? quantity : 1;
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    setCart(cart.map(item =>
      item.id === product.id
        ? { ...item, quantity: item.quantity + finalQuantity }
        : item
    ));
  } else {
    setCart([...cart, { ...product, quantity: finalQuantity }]);
  }

  // Only check for modal-based subproducts if sub_product_group is enabled
  if (product.sub_product_group) {
    if (!productsWithSubproducts.has(product.id)) {
      try {
        const response = await ApiService.getSubProductsByProductId(product.id);
        if (response.data && response.data.length > 0) {
          setProductsWithSubproducts(prev => new Set([...prev, product.id]));
          setSelectedProductForSubproducts(product);
        }
      } catch (error) {
        console.error('Error checking subproducts:', error);
      }
    } else {
      setSelectedProductForSubproducts(product);
    }
  }
};


  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-pos-bg-primary">
        <TopBar />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-pos-text-primary">Loading data...</div>
        </div>
        <BottomBar onOpenSettings={() => setShowSettings(true)} />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-pos-bg-primary">
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <ProductGrid
            products={products.filter(p => p.category === selectedCategory)}
            onAddToCart={addToCart}
            customQuantity={customQuantity}
            setCustomQuantity={setCustomQuantity}
          />
          
          {/* Subproducts Button - Bottom Left - Only show if cart has products with subproducts */}
          {cart.some(item => productsWithSubproducts.has(item.id)) && (
            <button
              onClick={() => setShowSubproducts(true)}
              className="absolute bottom-4 left-4 px-6 py-3 bg-pos-bg-primary hover:bg-pos-interactive-primary text-white font-semibold rounded-lg shadow-lg transition-all duration-200 hover:scale-105 border-2 border-pos-info z-10"
            >
              Subproducts
            </button>
          )}
        </div>
        <BottomBar onOpenSettings={() => setShowSettings(true)} />
      </div>
      <OrderPanel
        cart={cart}
        setCart={setCart}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
         customQuantity={customQuantity}
        setCustomQuantity={setCustomQuantity}
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showSubproducts && selectedProductForSubproducts && (
        <SubproductModal
          isOpen={showSubproducts}
          onClose={() => setShowSubproducts(false)}
          onAddToCart={addToCart}
          productId={selectedProductForSubproducts.id}
        />
      )}
    </div>
  );
};

export default POSScreen;