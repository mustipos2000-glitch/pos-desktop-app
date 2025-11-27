import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal";
import NoteModal from "./NoteModal";
import Toast from "./Toast";
import ApiService from "../services/api";
import { printerService } from "../services/printerService";

const OrderPanel = ({ cart, setCart, onUpdateQuantity, customQuantity, setCustomQuantity, currentOrderId, selectedTable, onOrderComplete, onDeleteAll, onSplitCart }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error");
  const [printers, setPrinters] = useState([]);
  const [completedOrderId, setCompletedOrderId] = useState(null);



  const [selectedIds, setSelectedIds] = useState([]);
  const [lastAddedId, setLastAddedId] = useState(null);
  const prevCartLengthRef = useRef(cart.length);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalTitle, setNoteModalTitle] = useState("");
  const [currentNoteValue, setCurrentNoteValue] = useState("");

  // Fetch printers on component mount
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        const response = await printerService.getAllPrinters();
        setPrinters(response.data || []);
      } catch (error) {
        console.error('Error fetching printers:', error);
      }
    };
    fetchPrinters();
  }, []);

  // Track last added item
  useEffect(() => {
    const prevLen = prevCartLengthRef.current;
    const currLen = cart.length;

    if (currLen > prevLen) {
      const lastItem = cart[cart.length - 1];
      const itemId = lastItem.cartItemId || `${lastItem.id}_${lastItem.name}`;
      setLastAddedId(itemId);
      setSelectedIds([itemId]); // Auto-select the newly added item
    } else if (currLen < prevLen) {
      setLastAddedId(null);
      setSelectedIds([]);
    }

    prevCartLengthRef.current = currLen;
  }, [cart]);

  // Select item
  const handleSelect = (id) => {
    setSelectedIds((prev) => {
      const alreadySelected = prev.includes(id);
      if (alreadySelected) {
        setLastAddedId(null);
        return prev.filter((x) => x !== id);
      }
      setLastAddedId(id);
      return [...prev, id];
    });
  };

  // Select all (available for future use)
  // const handleSelectAll = () => {
  //   setSelectedIds(cart.map((item) => item.cartItemId || `${item.id}_${item.name}`));
  // };

  // Delete selected
  const handleClearSelected = () => {
    if (selectedIds.length === 0) {
      setToastType("error");
      setToastMessage("Please select at least one item to delete.");
      return;
    }
    setCart((prev) =>
      prev.filter((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return !selectedIds.includes(itemCartId);
      })
    );
    setSelectedIds([]);
    setLastAddedId(null);
  };

  // Delete all
  const handleDeleteAllConfirm = () => {
    setCart([]);
    setSelectedIds([]);
    setLastAddedId(null);
    setDiscount(0);
    setNote("");
    setCustomQuantity("");
    
    // Notify parent to deselect table and clear order
    if (onDeleteAll) {
      onDeleteAll();
    }
  };

  const totalProductCount = () =>
    cart.length;
  const hasSelection = selectedIds.length > 0;

  const calculateTotal = () =>
    cart.reduce((sum, item) => {
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

  // const calculateTax = () =>
  //   cart.reduce((sum, item) => sum + item.price * item.quantity * 0.12, 0);

  // Payment
  const handlePayment = (paymentMethod = "cash") => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod(paymentMethod);
    setShowPaymentModal(true);
  };

  const handleCashPayment = () => handlePayment("cash");
  const handleCardPayment = () => handlePayment("card");

  const handlePaymentConfirm = async (paymentData) => {
    // Edge case: Validate cart has items
    if (cart.length === 0) {
      alert('Cart is empty. Cannot process payment.');
      return;
    }
    
    // Edge case: Validate payment data
    if (!paymentData || typeof paymentData.totalPaid !== 'number' || paymentData.totalPaid < 0) {
      alert('Invalid payment data. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const subTotal = calculateTotal();
      const total = subTotal - discount;
      
      // Edge case: Validate total is positive
      if (total < 0) {
        alert('Order total cannot be negative. Please review discounts.');
        setIsProcessing(false);
        return;
      }
      
      // Edge case: Validate payment covers the total
      if (paymentData.totalPaid < total) {
        alert(`Insufficient payment. Total: €${total.toFixed(2)}, Paid: €${paymentData.totalPaid.toFixed(2)}`);
        setIsProcessing(false);
        return;
      }

      const orderData = {
        status: "completed",
        note,
        sub_total: subTotal,
        total,
        discount,
        payment_method:
          paymentData.cashAmount > 0 && paymentData.cardAmount > 0
            ? "mixed"
            : paymentData.cashAmount > 0
              ? "cash"
              : "card",
        cash_amount: paymentData.cashAmount || 0,
        card_amount: paymentData.cardAmount || 0,
        total_paid: paymentData.totalPaid,
        change_due: paymentData.changeDue || 0,
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

      // If we have a currentOrderId, update the existing order
      // Otherwise create a new order
      if (currentOrderId) {
        // Edge case: Always include table_id if we have a selected table
        if (selectedTable) {
          orderData.table_id = selectedTable.id;
        }
        
        await ApiService.updateOrder(currentOrderId, orderData);
        
        // Edge case: Update table status to 'available' after payment only if table exists
        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: 'available'
            });
          } catch (error) {
            console.error('Error updating table status:', error);
            // Don't fail the entire operation if table status update fails
          }
        }
      } else {
        // Edge case: Creating new order without existing order ID
        // This should include table_id if available
        if (selectedTable) {
          orderData.table_id = selectedTable.id;
        }
        
        const response = await ApiService.createOrder(orderData);
        
        // Store the new order ID
        if (response && response.data && response.data.id) {
          finalOrderId = response.data.id;
        }
        
        // Edge case: Update table status even for new orders
        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: 'available'
            });
          } catch (error) {
            console.error('Error updating table status:', error);
          }
        }
      }
      
      // Reset order-level note after successful order creation
      setNote("");
      
      // Store the order ID for printing
      setCompletedOrderId(finalOrderId);
      
      setShowPaymentModal(false);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error processing order:", error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Notes
  const handleNotes = () => {
    if (selectedIds.length === 0) {
      // No items selected - add note to the whole order
      setNoteModalTitle("Whole Order");
      setCurrentNoteValue(note);
      setShowNoteModal(true);
    } else if (selectedIds.length === 1) {
      // Single item selected - add note to that item
      const selectedItem = cart.find((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return itemCartId === selectedIds[0];
      });
      setNoteModalTitle(selectedItem?.name || "Item");
      setCurrentNoteValue(selectedItem?.notes || "");
      setShowNoteModal(true);
    } else {
      // Multiple items selected - add same note to all
      setNoteModalTitle(`${selectedIds.length} Items`);
      setCurrentNoteValue("");
      setShowNoteModal(true);
    }
  };

  const handleNoteConfirm = (noteText) => {
    if (selectedIds.length === 0) {
      // Update order-level note
      setNote(noteText);
    } else {
      // Update item-level notes
      setCart((prev) =>
        prev.map((item) => {
          const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
          if (selectedIds.includes(itemCartId)) {
            return { ...item, notes: noteText };
          }
          return item;
        })
      );
      
      // Clear selection after adding note to items
      setSelectedIds([]);
      setLastAddedId(null);
    }
  };

  const handleSplitCart = () => {
    if (selectedIds.length === 0) {
      setToastType("error");
      setToastMessage("Please select items to move to another table.");
      return;
    }
    if (!selectedTable) {
      setToastType("error");
      setToastMessage("No table selected. Cannot split cart.");
      return;
    }
    
    // Get selected items
    const itemsToSplit = cart.filter((item) => {
      const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
      return selectedIds.includes(itemCartId);
    });
    
    // Call parent handler with selected items and callback
    if (onSplitCart) {
      onSplitCart(itemsToSplit, handleSplitCartConfirm);
    }
  };

  const handleSplitCartConfirm = async (destinationTable) => {
    try {
      // Get selected items
      const itemsToMove = cart.filter((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return selectedIds.includes(itemCartId);
      });

      // Calculate subtotal for items to move
      const subTotal = itemsToMove.reduce((sum, item) => {
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

      // Check if destination table has an existing order
      let destinationOrderId = null;
      try {
        const response = await ApiService.getOrderByTableId(destinationTable.id);
        if (response.data && response.data.id) {
          destinationOrderId = response.data.id;
        }
      } catch (error) {
      }

      // Prepare order data for destination table
      const orderData = {
        status: 'send_kitchen',
        note: '',
        sub_total: subTotal,
        total: subTotal,
        discount: 0,
        table_id: destinationTable.id,
        details: (() => {
          const allDetails = [];
          let detailIndex = 0;
          
          itemsToMove.forEach((item) => {
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

      if (destinationOrderId) {
        // Destination table has an order - fetch and merge
        const existingOrderResponse = await ApiService.getOrderByTableId(destinationTable.id);
        const existingOrder = existingOrderResponse.data;
        
        // Merge existing items with new items
        const mergedDetails = [...existingOrder.details, ...orderData.details];
        const mergedSubTotal = existingOrder.sub_total + subTotal;
        
        await ApiService.updateOrder(destinationOrderId, {
          ...orderData,
          sub_total: mergedSubTotal,
          total: mergedSubTotal,
          details: mergedDetails,
        });
      } else {
        // Create new order for destination table
        await ApiService.createOrder(orderData);
      }

      // Update destination table status to reserved if available
      if (destinationTable.status === 'available') {
        await ApiService.updatePrTable(destinationTable.id, {
          ...destinationTable,
          status: 'reserved'
        });
      }

      // Remove moved items from current cart
      const remainingCart = cart.filter((item) => {
        const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
        return !selectedIds.includes(itemCartId);
      });

      setCart(remainingCart);
      setSelectedIds([]);
      setLastAddedId(null);

      // If current cart is now empty, delete the current order
      if (remainingCart.length === 0 && currentOrderId) {
        await ApiService.deleteOrder(currentOrderId);
        
        // Update current table status to available
        if (selectedTable) {
          await ApiService.updatePrTable(selectedTable.id, {
            ...selectedTable,
            status: 'available'
          });
        }
        
        // Clear table selection
        if (onDeleteAll) {
          onDeleteAll();
        }
      }

      setToastType("success");
      setToastMessage(`Successfully moved ${itemsToMove.length} item(s) to Table ${destinationTable.table_no}`);
    } catch (error) {
      console.error('Error splitting cart:', error);
      setToastType("error");
      setToastMessage("Failed to move items. Please try again.");
    }
  };

  const handleCloseReceipt = () =>{
     setShowReceipt(false);
      setCart([]);
      setDiscount(0);
      setNote("");
      if (onOrderComplete) {
        onOrderComplete();
      }
    
    }

  const handlePrintReceipt = async () => {
    // Try to print to thermal printers assigned to products
    if (printers.length > 0 && completedOrderId && cart.length > 0) {
      try {
        // Debug: Check cart items for printer fields
        console.log('🔍 Checking cart items for printers:', cart.map(item => ({
          name: item.name,
          printer1: item.printer1,
          printer2: item.printer2,
          printer3: item.printer3
        })));

        // Collect all unique printer names from cart items
        const printerNames = new Set();
        cart.forEach(item => {
          if (item.printer1) printerNames.add(item.printer1);
          if (item.printer2) printerNames.add(item.printer2);
          if (item.printer3) printerNames.add(item.printer3);
        });

        console.log('🖨️ Found printers:', Array.from(printerNames));

        // If no printers assigned to products, use browser print
        if (printerNames.size === 0) {
          console.log('⚠️ No printers assigned to products. Using browser print.');
          window.print();
        } else {
          // Check assigned printers BEFORE printing (same as test printer)
          const printerCheckResults = [];
          
          for (const printerName of printerNames) {
            // Find printer by name
            const printer = printers.find(p => p.name === printerName);
            
            if (!printer) {
              printerCheckResults.push({
                name: printerName,
                status: 'not_found',
                message: `❌ Printer "${printerName}" not found in system`
              });
            } else if (!printer.connection_string || !printer.connection_string.trim()) {
              printerCheckResults.push({
                name: printerName,
                status: 'no_connection',
                message: `❌ Printer "${printerName}" has no connection string configured`
              });
            } else {
              printerCheckResults.push({
                name: printerName,
                status: 'ready',
                message: `✅ Printer "${printerName}" is ready`,
                printer: printer
              });
            }
          }

          // Show warnings for problematic printers
          const problemPrinters = printerCheckResults.filter(r => r.status !== 'ready');
          if (problemPrinters.length > 0) {
            const warningMessage = problemPrinters.map(p => p.message).join('\n');
            const proceed = window.confirm(
              `⚠️ Printer Issues Detected:\n\n${warningMessage}\n\nDo you want to use browser print instead?`
            );
            
            if (proceed) {
              window.print();
              setShowReceipt(false);
              setCart([]);
              setDiscount(0);
              setNote("");
              setCompletedOrderId(null);
              if (onOrderComplete) {
                onOrderComplete();
              }
              return;
            } else {
              // User cancelled, don't print
              return;
            }
          }

          console.log(`📋 Order ID: ${completedOrderId}, sending receipt to printers...`);
          
          // Print to each assigned printer (even if inactive - let backend handle validation)
          const printPromises = [];
          printerNames.forEach(printerName => {
            // Find printer by name (don't check is_active here, backend will validate)
            const printer = printers.find(p => p.name === printerName);
            if (printer) {
              console.log(`📤 Calling API: POST /api/printers/print-receipt with printerId=${printer.id}, orderId=${completedOrderId}`);
              printPromises.push(
                printerService.printReceipt(printer.id, completedOrderId)
                  .then(response => {
                    console.log(`✅ Success: ${printer.name}`, response);
                    return response;
                  })
                  .catch(err => {
                    console.error(`❌ Failed: ${printer.name}`, err);
                    // Show user-friendly error
                    setToastType("error");
                    setToastMessage(`Failed to print to ${printer.name}: ${err.message || 'Connection failed'}`);
                    throw err;
                  })
              );
            } else {
              console.warn(`⚠️ Printer "${printerName}" not found in printer list`);
            }
          });

          // Wait for all print jobs to complete (or fail)
          const results = await Promise.allSettled(printPromises);
          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const failedCount = results.filter(r => r.status === 'rejected').length;
          
          console.log(`📊 Print Results: ${successCount} succeeded, ${failedCount} failed`);
          
          if (successCount > 0) {
            setToastType("success");
            setToastMessage(`Receipt sent to ${successCount} printer(s) successfully!`);
          } else {
            setToastType("error");
            setToastMessage("Failed to print to thermal printers. Using browser print.");
            window.print();
          }
        }
      } catch (error) {
        console.error('Error printing to thermal printer:', error);
        setToastType("error");
        setToastMessage("Failed to print to thermal printer. Using browser print.");
        window.print();
      }
    } else {
      // No printer configured or no order, use browser print
      window.print();
    }
    
    setShowReceipt(false);
    setCart([]);
    setDiscount(0);
    setNote(""); // Reset order-level note after order completion
    setCompletedOrderId(null);
    
    // Call onOrderComplete to clear table and order selection in parent
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  
  const handleNumpadInput = (value) => {
    if (value === "C") {
      setCustomQuantity("");
    } else if (value === ".") {
      if (!customQuantity.includes(".")) setCustomQuantity(customQuantity + ".");
    } else {
      setCustomQuantity((prev) => prev + value);
    }
  };


  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => {
            setToastMessage("");
            setToastType("error");
          }}
        />
      )}
      <div className="mt-2 mb-2 w-1/6 min-w-[300px] flex flex-col border-l border-pos-border-light h-screen bg-pos-bg-secondary rounded-2xl">
        {/* Header */}
      <div className="px-4 py-2 mt-2 bg-pos-bg-secondary border-b border-pos-border-light rounded-lg">
        <div className="grid grid-cols-12 gap-2.5 text-xs text-pos-text-muted font-semibold uppercase">
          <span className="col-span-4">Item</span>
          <span className="col-span-2  flex justify-center items-center ">Quantity</span>
          <span className="col-span-6 ps-5 ">Total</span>
          <span></span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto   flex flex-col min-h-[160px] scrollbar-custom">
        {cart.length === 0 ? (
          <div className="text-center text-pos-text-disabled py-10 px-5 text-sm">
            No items in cart
          </div>
        ) : (
          cart.map((item) => {
            const cartItemId = item.cartItemId || `${item.id}_${item.name}`;
            const isSelected = selectedIds.includes(cartItemId);
 
            const isLastAdded = cartItemId === lastAddedId;

            const bgColor = isLastAdded
              ? "bg-green-500"
              : isSelected
                ? "bg-green-500"
                : "bg-blue-500";
            const textColor = "text-white";


            return (
              <div key={cartItemId} className="mb-1">
                {/* Parent Product Row - Expanded to include sub-products */}
                <div
                  onClick={() => handleSelect(cartItemId)}
                  className={`cursor-pointer ${bgColor}`}
                >
                  {/* Main Product Info */}
                  <div className="grid grid-cols-12 gap-3 items-center text-sm py-1 px-2">
                    {/* Product Name */}
                    <div className={`font-light col-span-4 ${textColor} flex items-center gap-1`}>
                      <span>
                        {item.name
                          ? item.name.split(" ").length > 1
                            ? item.name.split(" ").slice(0, 5).join(" ") + (item.name.split(" ").length > 5 ? "..." : "")
                            : item.name.length > 20
                              ? item.name.slice(0, 14) + "..."
                              : item.name
                          : ""}
                      </span>
                      {item.notes && (
                        <span className="text-xs" title={item.notes}>📝</span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className={`flex items-center col-span-2 gap-2 justify-center ${textColor}`}>
                      <button
                        className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-sm font-semibold justify-center hover:bg-pos-interactive-hover`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(cartItemId, item.quantity - 1);
                        }}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-sm justify-center hover:bg-pos-interactive-hover`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateQuantity(cartItemId, item.quantity + 1);
                        }}
                      >
                        +
                      </button>
                    </div>

                    {/* Price Section */}
                    <div className="flex gap-2 col-span-6 items-end ps-4 text-center ">
                      {/* Actual Price (before discount) */}
                      <span className="text-xs line-through ">
                        {item.originalPrice
                          ? (item.originalPrice * item.quantity).toFixed(2)
                          : ""}
                      </span>

                      {/* Discount Info */}
                      {item.appliedDiscount && (
                        <span className="text-xs italic text-white">
                          {item.appliedDiscount}
                        </span>
                      )}

                      {/* Final Price after discount */}
                      <span className={`text-xs mt-1 ${textColor}`}>
                        €{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Sub-Products - Inside the same parent row with same grid structure */}
                  {item.subProducts && item.subProducts.length > 0 && (
                    <div className="pb-1">
                      {item.subProducts.map((subItem, subIndex) => {
                        const isFree = !subItem.price || subItem.price === 0;
                        
                        return (
                          <div
                            key={subItem.cartItemId}
                            className={`grid grid-cols-12 gap-3 items-center text-xs py-0.5 px-2 ${textColor}`}
                          >
                            {/* Sub-product Name with prefix - col-span-4 like parent */}
                            <div className="col-span-4 flex items-center gap-1 pl-4">
                              <span className="font-light">{subItem.name}</span>
                            </div>

                            {/* Quantity Controls - col-span-2 like parent */}
                            <div className="col-span-2 flex items-center gap-2 justify-center">
                              <button
                                className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-xs font-semibold justify-center hover:bg-pos-interactive-hover`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Decrease sub-product quantity
                                  const newCart = [...cart];
                                  const parentIndex = cart.findIndex(c => c.cartItemId === cartItemId);
                                  if (parentIndex !== -1 && newCart[parentIndex].subProducts[subIndex]) {
                                    if (newCart[parentIndex].subProducts[subIndex].quantity > 1) {
                                      newCart[parentIndex].subProducts[subIndex].quantity -= 1;
                                    } else {
                                      // Remove sub-product if quantity becomes 0
                                      newCart[parentIndex].subProducts.splice(subIndex, 1);
                                    }
                                    setCart(newCart);
                                  }
                                }}
                              >
                                -
                              </button>
                              <span>{subItem.quantity}</span>
                              <button
                                className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-xs justify-center hover:bg-pos-interactive-hover`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Increase sub-product quantity
                                  const newCart = [...cart];
                                  const parentIndex = cart.findIndex(c => c.cartItemId === cartItemId);
                                  if (parentIndex !== -1 && newCart[parentIndex].subProducts[subIndex]) {
                                    newCart[parentIndex].subProducts[subIndex].quantity += 1;
                                    setCart(newCart);
                                  }
                                }}
                              >
                                +
                              </button>
                            </div>

                            {/* Sub-product Price - col-span-6 like parent */}
                            <div className="col-span-4 flex items-center gap-2 justify-center">
                              {!isFree && (
                                <span>€{(subItem.price * subItem.quantity).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selection Info Banner */}
      {hasSelection && (
        <div className="bg-green-600 px-3 py-2 border-t border-green-700">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="text-sm font-semibold">
                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedIds([]);
                setLastAddedId(null);
              }}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Total row (label | amount | cash input) */}
      <div className="bg-pos-bg-secondary px-2 py-1 border-t border-pos-border-light">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-pos-text-disabled uppercase">Total</div>
          <div className="text-lg font-bold text-pos-text-secondary">
            {(calculateTotal() - discount ).toFixed(2)}
          </div>


          <input
            type="text"
            placeholder="Add Quantity"
            value={customQuantity}
            onChange={(e) => setCustomQuantity(e.target.value)}
            className="max-w-[7rem] text-center py-1 px-2 bg-white text-black text-sm outline-none"
          />
        </div>
      </div>

      {/* Icon row (5 icons) */}
      <div className="grid grid-cols-5 gap-2 p-1 bg-pos-bg-secondary border-t border-pos-border-light">
        <button
          onClick={handleClearSelected}
          disabled={!hasSelection}
          className={`bg-pos-interactive-primary text-pos-text-secondary py-2 ${!hasSelection ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
        >
          🗑️
        </button>

        <button
          onClick={() => setShowDeleteAllModal(true)}
          disabled={cart.length === 0}
          className={`bg-pos-interactive-primary text-pos-text-secondary py-1 ${cart.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
        >
          <span className="relative inline-block">
            🛒
            <span className="absolute -top-1 -right-1 text-red-500 font-bold">✕</span>
          </span>
        </button>

        <button
          onClick={handleNotes}
          disabled={cart.length === 0}
          className={`bg-pos-interactive-primary text-pos-text-secondary py-1 ${cart.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
        >
          📝
        </button>

        <button
          onClick={() => setShowDiscountModal(true)}
          className="bg-pos-interactive-primary text-pos-text-secondary py-2 hover:bg-pos-interactive-hover disabled:opacity-50"
          disabled={isProcessing || cart.length === 0}
        >
          🏷️
        </button>

        <button
          onClick={handleSplitCart}
          disabled={!hasSelection || !selectedTable}
          className={`relative text-pos-text-secondary py-2 ${(!hasSelection || !selectedTable) ? "bg-pos-interactive-primary opacity-50 cursor-not-allowed" : "bg-pos-interactive-primary hover:bg-pos-interactive-hover"}`}
          title="Move selected items to another table"
        >
          <span className="text-lg">🔀</span>
          {hasSelection && (
            <span className="absolute -top-1 -right-1 bg-white text-green-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {selectedIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-4 gap-1 p-1">
        {["C", "7", "8", "9", ".", "4", "5", "6", "0", "1", "2", "3"].map((val) => (
          <button
            key={val}
            onClick={() => handleNumpadInput(val)}
            className={`aspect-auto flex items-center py-1 justify-center transition-all duration-150 
        ${val === "C"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-pos-bg-quaternary hover:bg-pos-bg-tertiary text-white active:scale-95"
              }`}
          >
            {val}
          </button>
        ))}
      </div>



      {/* Bottom Buttons */}
      <div className="grid grid-cols-2 gap-2 px-1 mb-3">
        {/* Card */}
        <button
          className="bg-pos-bg-primary border border-pos-border-primary py-1 hover:bg-pos-interactive-hover disabled:opacity-50"
          onClick={handleCardPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Card
        </button>

        {/* Cash */}
        <button
          className="bg-pos-bg-primary border border-pos-border-primary py-1 hover:bg-pos-interactive-hover disabled:opacity-50"
          onClick={handleCashPayment}
          disabled={isProcessing || cart.length === 0}
        >
          {isProcessing ? "Processing..." : "Cash"}
        </button>
      </div>


      {/* Modals */}
      <ConfirmationModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={() => {
          handleDeleteAllConfirm();
          setShowDeleteAllModal(false);
        }}
        title="Delete Order"
        message={`This order has ${totalProductCount()} product(s). Do you want to delete?`}
        confirmText="Yes, Delete"
        cancelText="No"
        type="danger"
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={calculateTotal() - discount}
        onConfirm={handlePaymentConfirm}
        defaultPaymentMethod={selectedPaymentMethod}
      />

      {showReceipt && (
        <ReceiptModal
          cart={cart}
          total={calculateTotal() - discount}
          subTotal={calculateTotal()}
          // tax={calculateTax()}
          discount={discount}
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
        />
      )}

      {showDiscountModal && (
        <DiscountModal
          title={
            selectedIds.length === 0
              ? "Whole Order"
              : selectedIds.length === 1
                ? cart.find((item) => {
                    const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                    return itemCartId === selectedIds[0];
                  })?.name
                : cart
                  .filter((item) => {
                    const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                    return selectedIds.includes(itemCartId);
                  })
                  .map((i) => i.name)
                  .join(", ")
          }
          basePrice={
            selectedIds.length === 0
              ? // For whole order, calculate total using original prices
                cart.reduce((sum, i) => {
                  const priceToUse = i.originalPrice || i.price;
                  return sum + priceToUse * i.quantity;
                }, 0)
              : // For selected items, use original prices
                cart
                .filter((item) => {
                  const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                  return selectedIds.includes(itemCartId);
                })
                .reduce((sum, i) => {
                  // Use original price if available, otherwise use current price
                  const priceToUse = i.originalPrice || i.price;
                  return sum + priceToUse * i.quantity;
                }, 0)
          }
          onClose={() => setShowDiscountModal(false)}
          onConfirm={({ finalPrice, mode, rawInput }) => {
            const discountValueInput = parseFloat(rawInput);
            const discountAmount = isNaN(discountValueInput) ? 0 : discountValueInput;

            // Validate percentage doesn't exceed 100%
            if (mode === "percentage" && discountAmount > 100) {
              setToastMessage("Percentage discount cannot exceed 100%");
              return;
            }

            if (selectedIds.length === 0) {
              // Calculate total using original prices for validation
              const totalCartValueOriginal = cart.reduce((sum, item) => {
                const priceToUse = item.originalPrice || item.price;
                return sum + priceToUse * item.quantity;
              }, 0);
              
              if (mode === "amount" && discountAmount > totalCartValueOriginal) {
                setToastMessage("Discount amount cannot exceed the total");
                return;
              }

              // Filter items: skip only those with SPECIFIC discount (not whole order discount)
              const itemsWithSpecificDiscount = cart.filter(item => 
                item.discount && item.discount > 0 && item.discountType === 'specific'
              );
              
              const itemsToApplyDiscount = cart.filter(item => 
                !item.discount || item.discount === 0 || item.discountType === 'whole'
              );
              
              // Calculate total of items to apply discount using original prices
              const totalToApplyDiscount = itemsToApplyDiscount.reduce((sum, item) => {
                const priceToUse = item.originalPrice || item.price;
                return sum + priceToUse * item.quantity;
              }, 0);

              // If all items have specific discount, show message
              if (itemsToApplyDiscount.length === 0) {
                setToastMessage("All items already have a specific discount applied");
                return;
              }

              // Apply discount to items without specific discount (allows modifying whole order discount)
              setCart((prev) =>
                prev.map((item) => {
                  // Skip items that have a SPECIFIC discount
                  if (item.discount && item.discount > 0 && item.discountType === 'specific') {
                    return item;
                  }

                  // Always use original price for calculation
                  const originalPricePerUnit = item.originalPrice || item.price;
                  const originalTotal = originalPricePerUnit * item.quantity;
                  let discountValue = 0;

                  if (mode === "percentage") {
                    // Calculate discount based on original price
                    discountValue = (originalTotal * discountAmount) / 100;
                  } else {
                    // For fixed amount, distribute proportionally based on original prices
                    const itemProportion = originalTotal / totalToApplyDiscount;
                    discountValue = discountAmount * itemProportion;
                  }

                  const updatedTotal = Math.max(0, originalTotal - discountValue);
                  return {
                    ...item,
                    originalPrice: originalPricePerUnit,
                    price: updatedTotal / item.quantity,
                    appliedDiscount:
                      mode === "percentage"
                        ? `${discountAmount}%`
                        : `€${discountValue.toFixed(2)}`,
                    discount: discountValue,
                    discountType: 'whole', // Mark as whole order discount
                  };
                })
              );
            } else {
              // Validate discount doesn't exceed selected items total (using original prices)
              const selectedTotal = cart
                .filter((item) => {
                  const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                  return selectedIds.includes(itemCartId);
                })
                .reduce((sum, i) => {
                  const priceToUse = i.originalPrice || i.price;
                  return sum + priceToUse * i.quantity;
                }, 0);
              
              if (mode === "amount" && discountAmount > selectedTotal) {
                setToastMessage("Discount amount cannot exceed the selected items total");
                return;
              }

              // Apply to selected items
              setCart((prev) =>
                prev.map((item) => {
                  const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                  if (selectedIds.includes(itemCartId)) {
                    // Always use original price for discount calculation
                    const originalPricePerUnit = item.originalPrice || item.price;
                    const originalTotal = originalPricePerUnit * item.quantity;
                    let discountValue = 0;

                    if (mode === "percentage") {
                      // Calculate discount based on original price
                      discountValue = (originalTotal * discountAmount) / 100;
                    } else {
                      discountValue = discountAmount;
                    }

                    const updatedTotal = Math.max(0, originalTotal - discountValue);
                    return {
                      ...item,
                      originalPrice: originalPricePerUnit,
                      price: updatedTotal / item.quantity,
                      appliedDiscount:
                        mode === "percentage"
                          ? `${discountAmount}%`
                          : `€${discountValue.toFixed(2)}`,
                      discount: discountValue,
                      discountType: 'specific', // Mark as specific item discount
                    };
                  }
                  return item;
                })
              );
              
              // Clear selection after applying discount to items
              setSelectedIds([]);
              setLastAddedId(null);
            }
            setShowDiscountModal(false);
          }}

        />
      )}

      <NoteModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onConfirm={handleNoteConfirm}
        title={noteModalTitle}
        currentNote={currentNoteValue}
      />
      </div>
    </>
  );
};

export default OrderPanel;
