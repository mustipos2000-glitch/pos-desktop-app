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
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-save cart to table whenever cart changes and table is selected
  useEffect(() => {
    // Only auto-save if we have a table selected and items in cart
    if (!selectedTable || cart.length === 0) {
      return;
    }

    const autoSaveOrder = async () => {
      try {
        const subTotal = cart.reduce((sum, item) => {
          const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
          const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
          return sum + (price * quantity);
        }, 0);

        const orderData = {
          status: 'send_kitchen',
          note: '',
          sub_total: subTotal,
          total: subTotal,
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
          console.log(`Auto-saved order #${currentOrderId} for table ${selectedTable.table_no}`);
        } else {
          // Create new order
          const response = await ApiService.createOrder(orderData);
          console.log(`Auto-created order for table ${selectedTable.table_no}`, response);
          
          // Store the new order ID
          if (response.data && response.data.id) {
            setCurrentOrderId(response.data.id);
          }
        }

        // Update table status to reserved if it's available
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
      } catch (error) {
        console.error('Error auto-saving order:', error);
      }
    };

    // Debounce the auto-save to avoid too many API calls
    const timeoutId = setTimeout(() => {
      autoSaveOrder();
    }, 800); // Wait 800ms after last cart change

    return () => clearTimeout(timeoutId);
  }, [cart, selectedTable, currentOrderId]);

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
  
  // Create a unique cart item ID that combines product ID with name to handle sub-products
  // This ensures that products and sub-products with the same ID are treated as separate items
  const cartItemId = `${product.id}_${product.name}`;
  
  const existingItem = cart.find(item => {
    const existingCartItemId = `${item.id}_${item.name}`;
    return existingCartItemId === cartItemId;
  });

  if (existingItem) {
    setCart(cart.map(item => {
      const itemCartId = `${item.id}_${item.name}`;
      return itemCartId === cartItemId
        ? { ...item, quantity: item.quantity + finalQuantity }
        : item;
    }));
  } else {
    setCart([...cart, { ...product, quantity: finalQuantity, cartItemId }]);
  }
};


  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return itemCartId !== cartItemId;
      }));
    } else {
      setCart(cart.map(item => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return itemCartId === cartItemId ? { ...item, quantity } : item;
      }));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Filter products based on search query WITHIN the selected category
  const getFilteredProducts = () => {
    // First filter by selected category
    const categoryProducts = products.filter(p => p.category === selectedCategory);
    
    // If no search query, return all products in the category
    if (!searchQuery || searchQuery.trim() === '') {
      return categoryProducts;
    }
    
    // If search query exists, filter within the selected category
    const query = searchQuery.toLowerCase().trim();
    return categoryProducts.filter(product => 
      product.name.toLowerCase().includes(query)
    );
  };

  const handleTableSelect = async (table) => {
    // Store current cart items and order ID before switching
    const currentCartItems = [...cart];
    const hadOrderId = currentOrderId !== null;
    
    // Simply switch to the selected table without confirmation
    setSelectedTable(table);
    
    // Check if this table has an existing order
    try {
      const response = await ApiService.getOrderByTableId(table.id);
      
      console.log('Order response for table:', table.id, response);
      
      if (response.data && response.data.details && response.data.details.length > 0) {
        // Table has an existing order - load it
        const existingOrder = response.data;
        setCurrentOrderId(existingOrder.id);
        
        // Convert order details to cart format
        const existingCartItems = existingOrder.details.map(detail => {
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
          
          const productName = detail.product_name || detail.name || 'Unknown';
          return {
            id: detail.product_id,
            name: productName,
            price: isNaN(currentUnitPrice) ? 0 : currentUnitPrice,
            quantity: detailQty,
            notes: detail.notes || '',
            discount: typeof detail.discount === 'number' ? detail.discount : 0,
            originalPrice: originalPrice,
            appliedDiscount: appliedDiscount,
            color: detail.color || product?.color || '#3b82f6',
            image: detail.image || product?.image || '📦',
            category: product?.category || 'Uncategorized',
            cartItemId: `${detail.product_id}_${productName}`,
          };
        });
        
        // Load existing order items directly
        console.log('Loading cart items:', existingCartItems);
        setCart(existingCartItems);
      } else {
        // No existing order for this table
        console.log('No existing order found for table:', table.id);
        setCurrentOrderId(null);
        
        // Only preserve cart items if they haven't been saved to another table yet
        // If hadOrderId is true, it means items were already saved to a previous table
        // so we should NOT carry them over to this new empty table
        if (currentCartItems.length > 0 && !hadOrderId) {
          console.log('Preserving unsaved cart items for new table assignment');
          setCart(currentCartItems);
        } else {
          // Clear cart if switching from a table with saved order to empty table
          console.log('Clearing cart - switching to empty table');
          setCart([]);
        }
      }
    } catch (error) {
      console.error('Error loading table order:', error);
      // On error, only preserve items if they weren't saved to a table yet
      setCurrentOrderId(null);
      if (currentCartItems.length > 0 && !hadOrderId) {
        console.log('Error occurred, preserving unsaved cart items');
        setCart(currentCartItems);
      } else {
        setCart([]);
      }
    }
  };

  const handleSendToKitchen = async () => {
    // Edge case: Validate table selection
    if (!selectedTable) {
      console.log('No table selected');
      return;
    }
    
    // Edge case: Validate cart has items
    if (cart.length === 0) {
      console.log('Cart is empty');
      return;
    }

    try {
      // Edge case: Validate all cart items have valid data
      const invalidItems = cart.filter(item => 
        !item.id || 
        typeof item.quantity !== 'number' || 
        item.quantity <= 0 || 
        typeof item.price !== 'number' || 
        item.price < 0
      );
      
      if (invalidItems.length > 0) {
        console.error('Invalid items in cart:', invalidItems);
        return;
      }

      const subTotal = cart.reduce((sum, item) => {
        const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
        const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
        return sum + (price * quantity);
      }, 0);
      
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
        console.log(`Updated order #${currentOrderId} for table ${selectedTable.table_no}`);
      } else {
        // Create new order
        const response = await ApiService.createOrder(orderData);
        console.log(`Created new order for table ${selectedTable.table_no}`, response);
        
        // Edge case: Store the new order ID for future updates
        if (response.data && response.data.id) {
          setCurrentOrderId(response.data.id);
        }
      }

      // Edge case: Update table status only if it's available
      if (selectedTable.status === 'available') {
        try {
          await ApiService.updatePrTable(selectedTable.id, {
            ...selectedTable,
            status: 'reserved'
          });
          console.log(`Table ${selectedTable.table_no} status changed to reserved`);
          
          // Update local selectedTable state to reflect new status
          setSelectedTable({
            ...selectedTable,
            status: 'reserved'
          });
        } catch (error) {
          console.error('Error updating table status:', error);
          // Don't fail the entire operation if table status update fails
        }
      }
      
      // Edge case: Don't clear cart and table after sending to kitchen
      // Keep them so user can add more items or make changes
      console.log(`Order sent to kitchen for Table ${selectedTable.table_no}`);
      
    } catch (error) {
      console.error('Error sending order to kitchen:', error);
      // Silently fail - error is logged to console
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
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
        />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              // Keep search active when changing categories
              // This allows users to search within the new category
            }}
          />
          <ProductGrid
            products={getFilteredProducts()}
            onAddToCart={addToCart}
            customQuantity={customQuantity}
            setCustomQuantity={setCustomQuantity}
            searchQuery={searchQuery}
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