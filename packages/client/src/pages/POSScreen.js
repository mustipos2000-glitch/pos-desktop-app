import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import OrderPanel from '../components/OrderPanel';
import BottomBar from '../components/BottomBar';
import SettingsModal from '../components/SettingsModal';
import UnifiedTableModal from '../components/UnifiedTableModal';
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
  const [refreshKitchenCount, setRefreshKitchenCount] = useState(null);
  const [showSplitCartModal, setShowSplitCartModal] = useState(false);
  const [splitCartSelectedItems, setSplitCartSelectedItems] = useState([]);
  const [lastClickedProductId, setLastClickedProductId] = useState(null);
  const [activeParentRowIndex, setActiveParentRowIndex] = useState(null);

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
          let itemTotal = price * quantity;
          
          // Add sub-products to total
          if (item.subProducts && item.subProducts.length > 0) {
            item.subProducts.forEach(subItem => {
              const subPrice = typeof subItem.price === 'number' && !isNaN(subItem.price) ? subItem.price : 0;
              const subQty = typeof subItem.quantity === 'number' && !isNaN(subItem.quantity) ? subItem.quantity : 0;
              itemTotal += subPrice * subQty;
            });
          }
          
          return sum + itemTotal;
        }, 0);

        const orderData = {
          tax: 0,  // Add tax field
          status: 'send_kitchen',
          note: '',
          sub_total: subTotal,
          total: subTotal,
          discount: 0,
          table_id: selectedTable.id,
          details: (() => {
            const allDetails = [];
            let detailIndex = 0;
            
            cart.forEach((item) => {
              const parentDetailIndex = detailIndex;
              
              // Add parent item
              allDetails.push({
                product_id: item.id,
                qty: item.quantity,
                total: item.price * item.quantity,
                notes: item.notes || null,
                discount: item.discount || 0,
              });
              detailIndex++;
              
              // Add sub-products with correct parent index
              if (item.subProducts && item.subProducts.length > 0) {
                item.subProducts.forEach(subItem => {
                  allDetails.push({
                    product_id: subItem.id,
                    qty: subItem.quantity,
                    total: subItem.price * subItem.quantity,
                    notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${subItem.notes || ''}`,
                    discount: 0,
                  });
                  detailIndex++;
                });
              }
            });
            
            return allDetails;
          })(),
        };

        if (currentOrderId) {
          // Update existing order
          await ApiService.updateOrder(currentOrderId, orderData);
        } else {
          // Create new order
          const response = await ApiService.createOrder(orderData);
          
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
          printer1: product.printer1 || '',
          printer2: product.printer2 || '',
          printer3: product.printer3 || '',
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
  const addToCart = (product, quantity = 1, isSubProduct = false) => {
  const finalQuantity = quantity > 0 ? quantity : 1;
  
  // If it's a sub-product, handle special logic
  if (isSubProduct && cart.length > 0 && lastClickedProductId && activeParentRowIndex !== null) {
    const newCart = [...cart];
    const targetParent = newCart[activeParentRowIndex];
    
    // Verify the active parent still exists and matches
    if (targetParent && targetParent.id === lastClickedProductId) {
      
      // If parent has quantity > 1, split it
      if (targetParent.quantity > 1) {
        // Decrease parent quantity by 1
        newCart[activeParentRowIndex] = {
          ...targetParent,
          quantity: targetParent.quantity - 1,
          subProducts: targetParent.subProducts || []
        };
        
        // Create new row with qty 1 and the sub-product
        const newParentCartItemId = `${targetParent.id}_${targetParent.name}_${Date.now()}`;
        const subProductCartItemId = `${product.id}_${product.name}_${Date.now()}`;
        
        const newParentRow = {
          ...targetParent,
          quantity: 1,
          cartItemId: newParentCartItemId,
          subProducts: [{
            ...product,
            quantity: finalQuantity,
            cartItemId: subProductCartItemId,
            isSubProduct: true
          }]
        };
        
        newCart.push(newParentRow);
        // Update active parent to the new row
        setActiveParentRowIndex(newCart.length - 1);
        setCart(newCart);
        return;
      }
      
      // Parent has qty 1 - add/update sub-product in active parent
      // Initialize subProducts array if it doesn't exist
      if (!targetParent.subProducts) {
        targetParent.subProducts = [];
      }
      
      // Check if this sub-product already exists in active parent
      const existingSubProduct = targetParent.subProducts.find(
        subItem => subItem.id === product.id && subItem.name === product.name
      );
      
      if (existingSubProduct) {
        // Same sub-product - update quantity
        existingSubProduct.quantity += finalQuantity;
      } else {
        // Different sub-product - add to active parent
        const cartItemId = `${product.id}_${product.name}_${Date.now()}`;
        targetParent.subProducts.push({
          ...product,
          quantity: finalQuantity,
          cartItemId,
          isSubProduct: true
        });
      }
      
      setCart(newCart);
      return;
    }
  }
  
  // For regular products, track which product was clicked and set as active parent
  setLastClickedProductId(product.id);
  
  // Find existing item with same product ID WITHOUT sub-products
  let existingItemWithoutSubProducts = -1;
  for (let i = cart.length - 1; i >= 0; i--) {
    if (cart[i].id === product.id && 
        !cart[i].isSubProduct && 
        (!cart[i].subProducts || cart[i].subProducts.length === 0)) {
      existingItemWithoutSubProducts = i;
      break;
    }
  }

  if (existingItemWithoutSubProducts !== -1) {
    // Update the product without sub-products and set as active
    setActiveParentRowIndex(existingItemWithoutSubProducts);
    setCart(cart.map((item, index) => {
      return index === existingItemWithoutSubProducts
        ? { ...item, quantity: item.quantity + finalQuantity }
        : item;
    }));
  } else {
    // Add new product and set as active parent
    const newCartItemId = `${product.id}_${product.name}_${Date.now()}`;
    const newCart = [...cart, { ...product, quantity: finalQuantity, cartItemId: newCartItemId, isSubProduct: false, subProducts: [] }];
    setCart(newCart);
    setActiveParentRowIndex(newCart.length - 1); // Set the newly added item as active
  }
};


  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      // Remove item from cart (this will also remove its sub-products)
      const newCart = cart.filter(item => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return itemCartId !== cartItemId;
      });
      setCart(newCart);
      
      // If cart becomes empty and we have an order ID, delete the order
      if (newCart.length === 0 && currentOrderId && selectedTable) {
        try {
          await ApiService.deleteOrder(currentOrderId);
          setCurrentOrderId(null);
          
          // Update table status back to available
          await ApiService.updatePrTable(selectedTable.id, {
            ...selectedTable,
            status: 'available'
          });
        } catch (error) {
          console.error('Error deleting order:', error);
        }
      }
    } else {
      // Simple quantity update - no splitting
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
    // Handle "No Table / Take Away" case (table is null)
    if (!table) {
      // If a table was previously selected, clear the cart
      if (selectedTable) {
        setCart([]);
      }
      setSelectedTable(null);
      setCurrentOrderId(null);
      return;
    }
    
    // Check if we have items in the current cart (no table selected yet)
    const hasCurrentCartItems = cart.length > 0 && !selectedTable;
    
    // Check if this table has an existing order
    try {
      const response = await ApiService.getOrderByTableId(table.id);
          
      if (response.data && response.data.details && response.data.details.length > 0) {
        // Table has an existing order - load it
        const existingOrder = response.data;
        setCurrentOrderId(existingOrder.id);
        
        // Convert order details to cart format
        // Fetch sub-products data for proper reconstruction
        const existingCartItems = await Promise.all(existingOrder.details.map(async (detail, index) => {
          const notes = detail.notes || '';
          const isMarkedAsSubProduct = notes.startsWith('__SUBPRODUCT_OF_');
          
          // For sub-products, fetch from sub_products table
          let itemData;
          if (isMarkedAsSubProduct) {
            try {
              const subProductResponse = await ApiService.getSubProductById(detail.product_id);
              itemData = subProductResponse.data;
            } catch (error) {
              console.error('Error fetching sub-product:', error);
              // Fallback to product if sub-product not found
              itemData = products.find(p => p.id === detail.product_id);
            }
          } else {
            // Regular product
            itemData = products.find(p => p.id === detail.product_id);
          }
          
          // Calculate current unit price from total with validation
          const detailTotal = typeof detail.total === 'number' ? detail.total : 0;
          const detailQty = typeof detail.qty === 'number' && detail.qty > 0 ? detail.qty : 1;
          const currentUnitPrice = detailTotal / detailQty;
          
          // If there's a discount, we need to reconstruct the original price
          let originalPrice = null;
          let appliedDiscount = null;
          
          if (detail.discount && detail.discount > 0) {
            const discountPerUnit = detail.discount / detail.qty;
            originalPrice = currentUnitPrice + discountPerUnit;
            
            if (itemData && Math.abs(originalPrice - itemData.price) < 0.01) {
              const discountPercent = (detail.discount / (originalPrice * detail.qty)) * 100;
              
              if (Math.abs(discountPercent - Math.round(discountPercent)) < 0.1) {
                appliedDiscount = `${Math.round(discountPercent)}%`;
              } else {
                appliedDiscount = `€${discountPerUnit.toFixed(2)}`;
              }
            } else {
              appliedDiscount = `€${discountPerUnit.toFixed(2)}`;
            }
          }
          
          const productName = itemData?.name || detail.product_name || detail.name || 'Unknown';
          const actualNotes = isMarkedAsSubProduct ? notes.replace(/^__SUBPRODUCT_OF_\d+__/, '') : notes;
          
          return {
            id: detail.product_id,
            name: productName,
            price: isNaN(currentUnitPrice) ? 0 : currentUnitPrice,
            quantity: detailQty,
            notes: actualNotes,
            discount: typeof detail.discount === 'number' ? detail.discount : 0,
            originalPrice: originalPrice,
            appliedDiscount: appliedDiscount,
            color: detail.color || itemData?.color || '#3b82f6',
            image: detail.image || itemData?.image || '📦',
            category: itemData?.category || 'Uncategorized',
            cartItemId: `${detail.product_id}_${productName}_${index}`,
            isSubProduct: false,
            subProducts: [],
            // Include printer fields from product data
            printer1: itemData?.printer1 || '',
            printer2: itemData?.printer2 || '',
            printer3: itemData?.printer3 || '',
            _isMarkedAsSubProduct: isMarkedAsSubProduct,
            _originalNotes: notes,
            _detailIndex: index
          };
        }));
        
        // Group items with sub-product markers
        const finalCart = [];
        const subProductsByParent = new Map();
        
        existingCartItems.forEach((item) => {
          if (item._isMarkedAsSubProduct) {
            // Extract parent index from marker
            const match = item._originalNotes.match(/^__SUBPRODUCT_OF_(\d+)__/);
            if (match) {
              const parentIndex = parseInt(match[1]);
              if (!subProductsByParent.has(parentIndex)) {
                subProductsByParent.set(parentIndex, []);
              }
              subProductsByParent.get(parentIndex).push({
                ...item,
                isSubProduct: true
              });
            }
          } else {
            // Regular parent item
            finalCart.push(item);
          }
        });
        
        // Attach sub-products to their parents
        finalCart.forEach((item) => {
          const detailIndex = item._detailIndex;
          if (subProductsByParent.has(detailIndex)) {
            item.subProducts = subProductsByParent.get(detailIndex);
          }
          // Clean up temporary properties
          delete item._isMarkedAsSubProduct;
          delete item._originalNotes;
          delete item._detailIndex;
        });
        
        // Load existing order items
        setCart(finalCart);
        setSelectedTable(table);
      } else {
        // No existing order for this table
        setCurrentOrderId(null);
        
        // If we have items in cart (added without table), keep them and assign to this table
        if (hasCurrentCartItems) {
          setSelectedTable(table);
          // Cart items remain, auto-save will trigger and create order
        } else {
          // No cart items, just select the table with empty cart
          setSelectedTable(table);
          setCart([]);
        }
      }
    } catch (error) {
      console.error('Error loading table order:', error);
      
      // On error, if we have cart items without table, still assign them to this table
      if (hasCurrentCartItems) {
        setSelectedTable(table);
        // Cart items remain
      } else {
        // No cart items, clear everything
        setCurrentOrderId(null);
        setSelectedTable(table);
        setCart([]);
      }
    }
  };

  const handleSendToKitchen = async () => {    
    // Edge case: Validate cart has items
    if (cart.length === 0) {
      return null;
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
        let itemTotal = price * quantity;
        
        // Add sub-products to total
        if (item.subProducts && item.subProducts.length > 0) {
          item.subProducts.forEach(subItem => {
            const subPrice = typeof subItem.price === 'number' && !isNaN(subItem.price) ? subItem.price : 0;
            const subQty = typeof subItem.quantity === 'number' && !isNaN(subItem.quantity) ? subItem.quantity : 0;
            itemTotal += subPrice * subQty;
          });
        }
        
        return sum + itemTotal;
      }, 0);
      
      const total = subTotal;

      const orderData = {
        tax: 0,  // Add tax field
        status: 'send_kitchen',
        note: '',
        sub_total: subTotal,
        total: total,
        discount: 0,
        table_id: selectedTable ? selectedTable.id : null,
        details: (() => {
          const allDetails = [];
          let detailIndex = 0;
          
          cart.forEach((item) => {
            const parentDetailIndex = detailIndex;
            
            // Add parent item
            allDetails.push({
              product_id: item.id,
              qty: item.quantity,
              total: item.price * item.quantity,
              notes: item.notes || null,
              discount: item.discount || 0,
            });
            detailIndex++;
            
            // Add sub-products with correct parent index
            if (item.subProducts && item.subProducts.length > 0) {
              item.subProducts.forEach(subItem => {
                allDetails.push({
                  product_id: subItem.id,
                  qty: subItem.quantity,
                  total: subItem.price * subItem.quantity,
                  notes: `__SUBPRODUCT_OF_${parentDetailIndex}__${subItem.notes || ''}`,
                  discount: 0,
                });
                detailIndex++;
              });
            }
          });
          
          return allDetails;
        })(),
      };

      let finalOrderId = currentOrderId;
      
      if (currentOrderId) {
        // Update existing order
        await ApiService.updateOrder(currentOrderId, orderData);
      } else {
        // Create new order
        const response = await ApiService.createOrder(orderData);
        
        // Edge case: Store the new order ID for future updates
        if (response.data && response.data.id) {
          finalOrderId = response.data.id;
          setCurrentOrderId(finalOrderId);
        }
      }

      // Edge case: Update table status only if table is selected and available
      if (selectedTable && selectedTable.status === 'available') {
        try {
          await ApiService.updatePrTable(selectedTable.id, {
            ...selectedTable,
            status: 'reserved'
          });
        } catch (error) {
          console.error('Error updating table status:', error);
          // Don't fail the entire operation if table status update fails
        }
      }
      
      // Clear cart and deselect table (select "No-table") after sending to kitchen
      setCart([]);
      setSelectedTable(null);
      setCurrentOrderId(null);
      
      // Return the order ID for printing
      return finalOrderId;
      
    } catch (error) {
      console.error('Error sending order to kitchen:', error);
      // Silently fail - error is logged to console
      return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-pos-bg-primary">
        <TopBar />
        <div className="flex-1 flex justify-center items-center rounded-lg">
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
          onRefreshKitchenCount={(fn) => setRefreshKitchenCount(() => fn)}
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
        onSplitCart={(items, confirmCallback) => {
          setSplitCartSelectedItems(items);
          setShowSplitCartModal(true);
          window.splitCartConfirmCallback = confirmCallback;
        }}
        onOrderComplete={() => {
          setCart([]);
          setSelectedTable(null);
          setCurrentOrderId(null);
          // Refresh kitchen order count after payment completion
          if (refreshKitchenCount) {
            refreshKitchenCount();
          }
        }}
        onDeleteAll={async () => {
          // Delete the order if it exists
          if (currentOrderId && selectedTable) {
            try {
              await ApiService.deleteOrder(currentOrderId);
              
              // Update table status back to available
              await ApiService.updatePrTable(selectedTable.id, {
                ...selectedTable,
                status: 'available'
              });
            } catch (error) {
              console.error('Error deleting order:', error);
            }
          }
          
          // Clear table selection and order ID
          setSelectedTable(null);
          setCurrentOrderId(null);
        }}
      />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showSplitCartModal && (
        <UnifiedTableModal
          isOpen={showSplitCartModal}
          onClose={() => {
            setShowSplitCartModal(false);
            setSplitCartSelectedItems([]);
          }}
          onSelectTable={(destinationTable) => {
            if (window.splitCartConfirmCallback) {
              window.splitCartConfirmCallback(destinationTable);
              window.splitCartConfirmCallback = null;
            }
            setShowSplitCartModal(false);
            setSplitCartSelectedItems([]);
          }}
          mode="split"
          selectedItems={splitCartSelectedItems}
          currentTable={selectedTable}
        />
      )}
    </div>
  );
};

export default POSScreen;