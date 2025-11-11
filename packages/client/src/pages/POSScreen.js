import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import OrderPanel from '../components/OrderPanel';
import BottomBar from '../components/BottomBar';
import SettingsModal from '../components/SettingsModal';
import ApiService from '../services/api';

const POSScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customQuantity, setCustomQuantity] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);


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
  const addToCart = (product, quantity = 1) => {
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

  const handleTableSelect = async (table) => {
    setSelectedTable(table);
    
    // Check if this table has an existing order
    try {
      const response = await ApiService.getOrderByTableId(table.id);
      
      console.log('Order response for table:', table.id, response);
      
      if (response.data && response.data.details && response.data.details.length > 0) {
        // Load existing order into cart
        const existingOrder = response.data;
        setCurrentOrderId(existingOrder.id);
        
        // Convert order details to cart format
        const cartItems = existingOrder.details.map(detail => {
          // Find the product in our products list to get category and original price
          const product = products.find(p => p.id === detail.product_id);
          
          // Calculate current unit price from total with validation
          const detailTotal = typeof detail.total === 'number' ? detail.total : 0;
          const detailQty = typeof detail.qty === 'number' && detail.qty > 0 ? detail.qty : 1;
          const currentUnitPrice = detailTotal / detailQty;
          
          // If there's a discount, we need to reconstruct the original price
          let originalPrice = null;
          let appliedDiscount = null;
          
          if (detail.discount && detail.discount > 0) {
            // The discount is stored as the total discount amount for all quantities
            const discountPerUnit = detail.discount / detail.qty;
            originalPrice = currentUnitPrice + discountPerUnit;
            
            // Try to determine if it was a percentage or fixed discount
            // If the original price matches the product price, show the discount info
            if (product && Math.abs(originalPrice - product.price) < 0.01) {
              // Calculate what percentage this discount represents
              const discountPercent = (detail.discount / (originalPrice * detail.qty)) * 100;
              
              // If it's close to a round percentage, show as percentage
              if (Math.abs(discountPercent - Math.round(discountPercent)) < 0.1) {
                appliedDiscount = `${Math.round(discountPercent)}%`;
              } else {
                appliedDiscount = `€${discountPerUnit.toFixed(2)}`;
              }
            } else {
              appliedDiscount = `€${discountPerUnit.toFixed(2)}`;
            }
          }
          
          return {
            id: detail.product_id,
            name: detail.product_name || detail.name || 'Unknown',
            price: isNaN(currentUnitPrice) ? 0 : currentUnitPrice,
            quantity: detailQty,
            notes: detail.notes || '',
            discount: typeof detail.discount === 'number' ? detail.discount : 0,
            originalPrice: originalPrice,
            appliedDiscount: appliedDiscount,
            color: detail.color || product?.color || '#3b82f6',
            image: detail.image || product?.image || '📦',
            category: product?.category || 'Uncategorized',
          };
        });
        
        console.log('Loading cart items:', cartItems);
        setCart(cartItems);
      } else {
        // No existing order, start fresh
        console.log('No existing order found for table:', table.id);
        setCurrentOrderId(null);
        setCart([]);
      }
    } catch (error) {
      console.error('Error loading table order:', error);
      setCurrentOrderId(null);
      setCart([]);
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable) {
      alert('Please select a table first');
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty. Add items before sending to kitchen.');
      return;
    }

    try {
      const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = subTotal;

      const orderData = {
        status: 'send_kitchen',
        note: '',
        sub_total: subTotal,
        total: total,
        discount: 0,
        table_id: selectedTable.id,
        details: cart.map((item) => ({
          product_id: item.id,
          qty: item.quantity,
          total: item.price * item.quantity,
          notes: item.notes || null,
          discount: item.discount || 0,
        })),
      };

      if (currentOrderId) {
        // Update existing order
        await ApiService.updateOrder(currentOrderId, orderData);
      } else {
        // Create new order
        await ApiService.createOrder(orderData);
      }

      // Update table status from 'available' to 'reserved' if needed
      if (selectedTable.status === 'available') {
        try {
          await ApiService.updatePrTable(selectedTable.id, {
            ...selectedTable,
            status: 'reserved'
          });
          console.log(`Table ${selectedTable.table_no} status changed to reserved`);
        } catch (error) {
          console.error('Error updating table status:', error);
        }
      }
      
      // Clear cart and table selection after successful order
      setCart([]);
      setSelectedTable(null);
      setCurrentOrderId(null);
    } catch (error) {
      console.error('Error sending order to kitchen:', error);
      alert('Failed to send order to kitchen. Please try again.');
    }
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
        <TopBar 
          selectedTable={selectedTable}
          onTableSelect={handleTableSelect}
          onSendToKitchen={handleSendToKitchen}
          cart={cart}
          hasExistingOrder={!!currentOrderId}
        />
        <div className="flex-1 flex overflow-hidden">
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
        currentOrderId={currentOrderId}
        selectedTable={selectedTable}
        onOrderComplete={() => {
          setCart([]);
          setSelectedTable(null);
          setCurrentOrderId(null);
        }}
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default POSScreen;