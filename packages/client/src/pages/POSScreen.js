import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import OrderPanel from '../components/OrderPanel';
import BottomBar from '../components/BottomBar';
import SettingsModal from '../components/SettingsModal';
import ApiService from '../services/api';
import './css/POSScreen.css';

const POSScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getCategories();
        const categoryNames = response.data.map(category => category.name);
        setCategories(categoryNames);
        
        // Set first category as default selected
        if (categoryNames.length > 0) {
          setSelectedCategory(categoryNames);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const products = [
    { id: 1, name: 'Coca-Cola', price: 23.09, category: 'Starter', image: '🥤', color: '#dc2626' },
    { id: 2, name: 'Orange Juice', price: 3.00, category: 'Starter', image: '🧃', color: '#f59e0b' },
    { id: 3, name: 'Espresso', price: 2.00, category: 'Starter', image: '☕', color: '#78350f' },
    { id: 4, name: 'Virgin Mojito', price: 4.50, category: 'Starter', image: '🍹', color: '#10b981' },
    { id: 5, name: 'Iced Tea', price: 3.50, category: 'Starter', image: '🧊', color: '#3b82f6' },
    { id: 6, name: 'koffie met slagroom en', price: 0.09, category: 'test cat', image: '☕', color: '#92400e' },
    { id: 7, name: 'cappuccino', price: 33.00, category: 'test cat', image: '☕', color: '#dc2626' },
    { id: 8, name: 'musli', price: 6.99, category: 'test cat', image: '🥣', color: '#10b981' },
  ];

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
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
      <div className="pos-screen">
        <TopBar />
        <div className="pos-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading categories...</div>
        </div>
        <BottomBar onOpenSettings={() => setShowSettings(true)} />
      </div>
    );
  }

  return (
    <div className="pos-screen">
      <TopBar />
      <div className="pos-main">
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ProductGrid
          products={products.filter(p => p.category === selectedCategory)}
          onAddToCart={addToCart}
        />
        <OrderPanel
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onClearCart={clearCart}
        />
      </div>
      <BottomBar onOpenSettings={() => setShowSettings(true)} />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default POSScreen;
