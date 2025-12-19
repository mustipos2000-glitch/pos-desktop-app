import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import ProductGrid from '../components/ProductGrid';
import OrderPanel from '../components/OrderPanel';
import BottomBar from '../components/BottomBar';
import SettingsModal from '../components/SettingsModal';
import UnifiedTableModal from '../components/UnifiedTableModal';
import MessageModal from '../components/MessageModal';
import BarcodeSearchModal from '../components/BarcodeSearchModal';
import ApiService from '../services/api';
import { useVersion } from '../context/VersionContext';
import { useMessageModal } from '../hooks/useMessageModal';

const POSScreen = () => {
  const { hasFeature } = useVersion();
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customQuantity, setCustomQuantity] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderNo, setCurrentOrderNo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKitchenCount, setRefreshKitchenCount] = useState(null);
  const [refreshHoldCount, setRefreshHoldCount] = useState(null);
  const [showSplitCartModal, setShowSplitCartModal] = useState(false);
  const [splitCartSelectedItems, setSplitCartSelectedItems] = useState([]);
  const [lastClickedProductId, setLastClickedProductId] = useState(null);
  const [activeParentRowIndex, setActiveParentRowIndex] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showBarcodeSearch, setShowBarcodeSearch] = useState(false);

  // Load logged-in user from localStorage on mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        setSelectedEmployee(user);
        console.log('✅ Logged-in user loaded as selected employee:', user);
      } catch (error) {
        console.error('Error parsing currentUser from localStorage:', error);
      }
    }
  }, []);

  // Debug logging for customer state changes
  useEffect(() => {
  }, [selectedCustomer]);

  // Auto-save cart whenever cart changes (for both table orders and hold orders)
  useEffect(() => {
    // Only auto-save if we have items in cart
    if (cart.length === 0) {
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

        // Determine order status based on whether table is selected
        const orderStatus = selectedTable ? 'send_kitchen' : 'on_hold';

        // Calculate total discount from all cart items
        const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
        const orderType = localStorage.getItem('posVersion') || 'horeca';

        const orderData = {
          tax: 0,  // Add tax field
          status: orderStatus,
          note: '',
          sub_total: subTotal,
          total: subTotal,
          discount: totalDiscount,
          customer_id: selectedCustomer ? selectedCustomer.id : null,
          employee_id: selectedEmployee ? selectedEmployee.id : null,
          table_id: selectedTable ? selectedTable.id : null,
          order_type: orderType,
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

        console.log('💾 Auto-saving order with status:', orderStatus, 'employee_id:', orderData.employee_id);
        
        if (currentOrderId) {
          // Update existing order
          await ApiService.updateOrder(currentOrderId, orderData);
          console.log('✅ Order updated');
        } else {
          // Create new order
          const response = await ApiService.createOrder(orderData);
          
          // Store the new order ID and order_no
          if (response.data && response.data.id) {
            setCurrentOrderId(response.data.id);
            setCurrentOrderNo(response.data.order_no);
            console.log('✅ Order created with ID:', response.data.id, 'Order No:', response.data.order_no);
          }
        }

        // Update table status to reserved if table is selected and available
        if (selectedTable && selectedTable.status === 'available') {
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
        
        // Show inventory error to user if it's an inventory issue
        if (error.message && error.message.includes('Insufficient inventory')) {
          const errorDetails = error.details ? 
            error.details.map(d => `${d.product_name}: requested ${d.requested}, available ${d.available}`).join('\n') : 
            error.message;
          
          showError(errorDetails, '⚠️ Insufficient Inventory');
          
          // Optionally: Remove items that exceed inventory from cart
          // This prevents the order from being stuck in an invalid state
        }
      }
    };

    // Debounce the auto-save to avoid too many API calls
    const timeoutId = setTimeout(() => {
      autoSaveOrder();
    }, 800); // Wait 800ms after last cart change

    return () => clearTimeout(timeoutId);
  }, [cart, selectedTable, currentOrderId, selectedCustomer, selectedEmployee]);

  // Initialize customer display window on mount if enabled
  useEffect(() => {
    const initCustomerDisplay = () => {
      const isCustomerDisplayEnabled = localStorage.getItem('customerDisplayEnabled') === 'true';
      if (isCustomerDisplayEnabled && window.electron && window.electron.customerDisplay) {
        window.electron.customerDisplay.toggle(true);
      }
    };
    
    // Try immediately, and also set up a small delay in case Electron APIs aren't ready yet
    initCustomerDisplay();
    const timeoutId = setTimeout(initCustomerDisplay, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Sync cart data to customer display window
  useEffect(() => {
    // Check if customer display is enabled
    const isCustomerDisplayEnabled = localStorage.getItem('customerDisplayEnabled') === 'true';
    
    if (isCustomerDisplayEnabled && window.electron && window.electron.customerDisplay) {
      // Calculate total discount from cart items
      const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
      
      // Send cart data to customer display window
      window.electron.customerDisplay.sendCartData({
        cart,
        selectedTable,
        currentOrderNo,
        selectedCustomer,
        discount: totalDiscount
      });
    }
  }, [cart, selectedTable, currentOrderNo, selectedCustomer]);

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
          available_qty: product.available_qty || 0,
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
  const type = localStorage.getItem('posVersion');
  const addToCart = async (product, quantity = 1, isSubProduct = false) => {
  const finalQuantity = quantity > 0 ? quantity : 1;
  
  // Check inventory availability before adding (for both new and existing orders)
  if (type === "retail" && !isSubProduct) {
    try {
      // Fetch fresh availability from server
      let availableQty = product.available_qty;
      
      if (currentOrderId) {
        // For existing orders, fetch with excludeOrderId to get accurate availability
        const url = `/products/${product.id}?excludeOrderId=${currentOrderId}`;
        const response = await fetch(`http://localhost:5000/api${url}`);
        const data = await response.json();
        availableQty = data.data.available_qty || 0;
      }
      
      // Calculate how much of this product is already in cart
      const currentInCart = cart.reduce((total, item) => {
        if (item.id === product.id && !item.isSubProduct) {
          return total + item.quantity;
        }
        return total;
      }, 0);
      
      const requestedTotal = currentInCart + finalQuantity;
      
      // Check if requested total exceeds available
      if (requestedTotal > availableQty) {
        showWarning(
          `${product.name}\n\nRequested: ${requestedTotal}\nAvailable: ${availableQty}\nAlready in cart: ${currentInCart}`,
          '⚠️ Insufficient Stock'
        );
        return; // Don't add to cart
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      // On error, allow the add and let server validate
    }
  }
  
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
  const item = cart.find(i => i.cartItemId === cartItemId);
  
  if (!item) return;

  console.log("Updating quantity for item:", item.name, "to", quantity);

  // Check inventory when INCREASING quantity (for both new and existing orders)
  if  (type === "retail" && quantity > item.quantity && !item.isSubProduct) {
    try {
      // Fetch fresh availability from server
      let availableQty = item.available_qty;
      
      if (currentOrderId) {
        // For existing orders, fetch with excludeOrderId to get accurate availability
        const url = `/products/${item.id}?excludeOrderId=${currentOrderId}`;
        const response = await fetch(`http://localhost:5000/api${url}`);
        const data = await response.json();
        availableQty = data.data.available_qty || 0;
      }
      
      // Calculate total of this product in cart (excluding current item)
      const otherItemsTotal = cart.reduce((total, cartItem) => {
        if (cartItem.id === item.id && cartItem.cartItemId !== cartItemId && !cartItem.isSubProduct) {
          return total + cartItem.quantity;
        }
        return total;
      }, 0);
      
      const requestedTotal = quantity + otherItemsTotal;
      
      // Check against available quantity
      if (requestedTotal > availableQty) {
        showWarning(
          `${item.name}\n\nRequested: ${requestedTotal}\nAvailable: ${availableQty}\nOther items in cart: ${otherItemsTotal}`,
          '⚠️ Insufficient Stock'
        );
        return; // Don't update
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      // On error, allow the update and let server validate
    }
  }

  if (quantity <= 0) {
    // Remove item from cart
    const newCart = cart.filter(i => i.cartItemId !== cartItemId);
    setCart(newCart);

    // Optional: delete order if cart empty
    if (newCart.length === 0 && currentOrderId && selectedTable) {
      try {
        await ApiService.deleteOrder(currentOrderId);
        setCurrentOrderId(null);
        await ApiService.updatePrTable(selectedTable.id, { ...selectedTable, status: 'available' });
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  } else {
    // Update quantity
    setCart(cart.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
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
      setSelectedCustomer(null);
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
        setCurrentOrderNo(existingOrder.order_no);
        
        // Load customer if exists
        console.log('📋 Order customer_id:', existingOrder.customer_id);
        if (existingOrder.customer_id) {
          try {
            const customerResponse = await ApiService.getCustomerById(existingOrder.customer_id);
            console.log('👤 Customer API response:', customerResponse);
            if (customerResponse.data) {
              console.log('✅ Setting customer:', customerResponse.data);
              setSelectedCustomer(customerResponse.data);
            } else {
              console.log('⚠️ No customer data in response');
              setSelectedCustomer(null);
            }
          } catch (error) {
            console.error('❌ Error loading customer:', error);
            setSelectedCustomer(null);
          }
        } else {
          console.log('ℹ️ No customer_id in order');
          setSelectedCustomer(null);
        }
        
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
        setSelectedCustomer(null);
        
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
        setSelectedCustomer(null);
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

      // Send to kitchen always uses send_kitchen status
      const orderStatus = 'send_kitchen';

      // Calculate total discount from all cart items
      const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
      const orderType = localStorage.getItem('posVersion') || 'horeca';

      const orderData = {
        tax: 0,  // Add tax field
        status: orderStatus,
        note: '',
        sub_total: subTotal,
        total: total,
        discount: totalDiscount,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        employee_id: selectedEmployee ? selectedEmployee.id : null,
        table_id: selectedTable ? selectedTable.id : null,
        order_type: orderType,
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
        
        // Edge case: Store the new order ID and order_no for future updates
        if (response.data && response.data.id) {
          finalOrderId = response.data.id;
          setCurrentOrderId(finalOrderId);
          setCurrentOrderNo(response.data.order_no);
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
      
      // Clear cart, customer, and deselect table (select "No-table") after sending to kitchen
      setCart([]);
      setSelectedTable(null);
      setCurrentOrderId(null);
      setCurrentOrderNo(null);
      setSelectedCustomer(null);
      
      // Return the order ID for printing
      return finalOrderId;
      
    } catch (error) {
      console.error('Error sending order to kitchen:', error);
      // Silently fail - error is logged to console
      return null;
    }
  };

  const handleEmployeeChange = async (employee) => {
    // If there's a current order with items, save it before switching
    if (cart.length > 0 && currentOrderId) {
      console.log('💾 Saving current order before switching employee');
      // The auto-save effect will handle saving with current employee_id
    }

    // If there are items in cart but no order ID yet, clear the cart
    // (this shouldn't happen often due to auto-save, but just in case)
    if (cart.length > 0 && !currentOrderId) {
      setCart([]);
    }

    // Switch to new employee
    setSelectedEmployee(employee);
    
    // Clear current order state
    setCart([]);
    setSelectedTable(null);
    setCurrentOrderId(null);
    setCurrentOrderNo(null);
    setSelectedCustomer(null);
  };

  const handleLoadHoldOrder = async (order) => {
    try {
      // Clear current cart and table
      setCart([]);
      setSelectedTable(null);
      setCurrentOrderId(null);
      setCurrentOrderNo(null);
      setSelectedCustomer(null);

      // Load employee if exists
      if (order.employee_id) {
        try {
          const employeeResponse = await ApiService.request(`/users/${order.employee_id}`);
          if (employeeResponse) {
            setSelectedEmployee(employeeResponse);
          }
        } catch (error) {
          console.error('Error loading employee:', error);
        }
      }

      // Load customer if exists
      if (order.customer_id) {
        try {
          const customerResponse = await ApiService.getCustomerById(order.customer_id);
          if (customerResponse.data) {
            setSelectedCustomer(customerResponse.data);
          }
        } catch (error) {
          console.error('Error loading customer:', error);
        }
      }

      // Convert order details to cart format
      const holdCartItems = await Promise.all(order.details.map(async (detail, index) => {
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
      
      holdCartItems.forEach((item) => {
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

      // Set the cart with hold order items
      setCart(finalCart);
      
      // Keep the order ID and order_no so we can update it (don't delete it yet)
      setCurrentOrderId(order.id);
      setCurrentOrderNo(order.order_no);
      
    } catch (error) {
      console.error('Error loading hold order:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-pos-bg-primary">
        <TopBar />
        <div className="flex-1 flex justify-center items-center rounded-lg">
          <div className="text-pos-text-primary">Loading data...</div>
        </div>
        <BottomBar 
          onOpenSettings={() => setShowSettings(true)} 
          onBarcodeSearch={() => setShowBarcodeSearch(true)}
        />
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
          onRefreshHoldCount={(fn) => setRefreshHoldCount(() => fn)}
          onLoadHoldOrder={handleLoadHoldOrder}
          selectedEmployeeId={selectedEmployee?.id}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={handleEmployeeChange}
        />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            categories={hasFeature('categoryProducts') ? categories : []}
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
        <BottomBar 
          onOpenSettings={() => setShowSettings(true)} 
          onBarcodeSearch={() => setShowBarcodeSearch(true)}
        />
      </div>
      <OrderPanel
        cart={cart}
        setCart={setCart}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        customQuantity={customQuantity}
        setCustomQuantity={setCustomQuantity}
        currentOrderId={currentOrderId}
        currentOrderNo={currentOrderNo}
        selectedTable={selectedTable}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        selectedEmployee={selectedEmployee}
        onRefreshHoldCount={refreshHoldCount}
        onSplitCart={(items, confirmCallback) => {
          setSplitCartSelectedItems(items);
          setShowSplitCartModal(true);
          window.splitCartConfirmCallback = confirmCallback;
        }}
        onOrderComplete={() => {
          setCart([]);
          setSelectedTable(null);
          setCurrentOrderId(null);
          setCurrentOrderNo(null);
          setSelectedCustomer(null);
          // Refresh kitchen order count after payment completion
          if (refreshKitchenCount) {
            refreshKitchenCount();
          }
        }}
        onDeleteAll={async () => {
          // Delete the order if it exists
          if (currentOrderId) {
            try {
              await ApiService.deleteOrder(currentOrderId);
              
              // Update table status back to available if table is selected
              if (selectedTable) {
                await ApiService.updatePrTable(selectedTable.id, {
                  ...selectedTable,
                  status: 'available'
                });
              }
            } catch (error) {
              console.error('Error deleting order:', error);
            }
          }
          
          // Clear table selection, order ID, order_no, and customer
          setSelectedTable(null);
          setCurrentOrderId(null);
          setCurrentOrderNo(null);
          setSelectedCustomer(null);
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

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      <BarcodeSearchModal
        isOpen={showBarcodeSearch}
        onClose={() => setShowBarcodeSearch(false)}
        onProductFound={(product) => {
          // Add product to cart when found
          addToCart(product, 1, false);
        }}
      />
    </div>
  );
};

export default POSScreen;