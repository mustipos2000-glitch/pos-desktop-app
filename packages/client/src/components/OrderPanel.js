import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal";
import NoteModal from "./NoteModal";
import Toast from "./Toast";
import ApiService from "../services/api";

const OrderPanel = ({ cart, setCart, onUpdateQuantity, customQuantity, setCustomQuantity, currentOrderId, selectedTable, onOrderComplete }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");



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
  };

  const totalProductCount = () =>
    cart.length;
  const hasSelection = selectedIds.length > 0;

  const calculateTotal = () =>
    cart.reduce((sum, item) => {
      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      return sum + (price * quantity);
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
        details: cart.map((item) => ({
          product_id: item.id,
          qty: item.quantity,
          total: item.price * item.quantity,
          notes: item.notes || null,
          discount: item.discount || 0,
        })),
      };

      // If we have a currentOrderId, update the existing order
      // Otherwise create a new order
      if (currentOrderId) {
        // Edge case: Always include table_id if we have a selected table
        if (selectedTable) {
          orderData.table_id = selectedTable.id;
        }
        
        await ApiService.updateOrder(currentOrderId, orderData);
        console.log(`Updated existing order #${currentOrderId} to completed status`);
        
        // Edge case: Update table status to 'available' after payment only if table exists
        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: 'available'
            });
            console.log(`Table ${selectedTable.table_no} status changed to available`);
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
        console.log('Created new completed order', response);
        
        // Edge case: Update table status even for new orders
        if (selectedTable) {
          try {
            await ApiService.updatePrTable(selectedTable.id, {
              ...selectedTable,
              status: 'available'
            });
            console.log(`Table ${selectedTable.table_no} status changed to available`);
          } catch (error) {
            console.error('Error updating table status:', error);
          }
        }
      }
      
      // Reset order-level note after successful order creation
      setNote("");
      
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

  const handleCloseReceipt = () => setShowReceipt(false);

  const handlePrintReceipt = () => {
    setShowReceipt(false);
    setCart([]);
    setDiscount(0);
    setNote(""); // Reset order-level note after order completion
    
    // Call onOrderComplete to clear table and order selection in parent
    if (onOrderComplete) {
      onOrderComplete();
    }
    
    window.print();
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
          type="error"
          onClose={() => setToastMessage("")}
        />
      )}
      <div className="w-1/6 min-w-[300px] bg-pos-bg-quaternary flex flex-col border-l border-pos-border-light h-screen">
        {/* Header */}
      <div className="px-4 py-3 bg-pos-bg-secondary border-b border-pos-border-light">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-2.5 text-xs text-pos-text-disabled font-semibold uppercase">
          <span>Item</span>
          <span>Quantity</span>
          <span className="text-right">Total</span>
          <span></span>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto   flex flex-col bg-pos-bg-secondary min-h-[160px] scrollbar-custom">
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
              <div
                key={cartItemId}
                onClick={() => handleSelect(cartItemId)}
                className={`grid grid-cols-12 mb-1 gap-3 items-center text-sm py-1 px-2 cursor-pointer ${bgColor}`}
              >
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

                <div className="flex gap-2  col-span-6 items-end ps-4 text-center ">
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
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>

              </div>
            );


          })
        )}
      </div>

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

      {/* Icon row (4 icons) */}
      <div className="grid grid-cols-4 gap-2 p-1 bg-pos-bg-secondary border-t border-pos-border-light">
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
          className={`bg-pos-interactive-primary text-pos-text-secondary py-2 ${cart.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
        >
          <span className="relative inline-block">
            🛒
            <span className="absolute -top-1 -right-1 text-sm text-red-500 font-bold">✕</span>
          </span>
        </button>

        <button
          onClick={handleNotes}
          disabled={cart.length === 0}
          className={`bg-pos-interactive-primary text-pos-text-secondary py-2 ${cart.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
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
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-4 gap-1 p-1">
        {["C", "7", "8", "9", ".", "4", "5", "6", "0", "1", "2", "3"].map((val) => (
          <button
            key={val}
            onClick={() => handleNumpadInput(val)}
            className={`aspect-auto flex items-center py-2  justify-center text-sm transition-all duration-150 
        ${val === "C"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-pos-interactive-primary hover:bg-pos-interactive-primary text-gray-100 active:scale-95"
              }`}
          >
            {val}
          </button>
        ))}
      </div>



      {/* Bottom Buttons */}
      <div className="grid grid-cols-2 gap-2 px-2 bg-pos-bg-primary border-t border-pos-border-light">
        {/* Card */}
        <button
          className="bg-pos-interactive-primary text-pos-text-secondary text-sm font-medium py-2 hover:bg-pos-interactive-hover disabled:opacity-50"
          onClick={handleCardPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Card
        </button>

        {/* Cash */}
        <button
          className="bg-pos-interactive-primary text-pos-text-secondary text-sm font-medium py-2 hover:bg-pos-interactive-hover disabled:opacity-50"
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
              ? calculateTotal()
              : cart
                .filter((item) => {
                  const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                  return selectedIds.includes(itemCartId);
                })
                .reduce((sum, i) => sum + i.price * i.quantity, 0)
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
              // Validate discount doesn't exceed total for whole order
              const totalCartValue = calculateTotal();
              if (mode === "amount" && discountAmount > totalCartValue) {
                setToastMessage("Discount amount cannot exceed the total");
                return;
              }

              // Apply discount to all items in the cart
              setCart((prev) =>
                prev.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  let discountValue = 0;

                  if (mode === "percentage") {
                    discountValue = (itemTotal * discountAmount) / 100;
                  } else {
                    // For fixed amount, distribute proportionally across all items
                    const itemProportion = itemTotal / totalCartValue;
                    discountValue = discountAmount * itemProportion;
                  }

                  const updatedTotal = Math.max(0, itemTotal - discountValue);
                  return {
                    ...item,
                    originalPrice: item.originalPrice || item.price,
                    price: updatedTotal / item.quantity,
                    appliedDiscount:
                      mode === "percentage"
                        ? `${discountAmount}%`
                        : `€${discountValue.toFixed(2)}`,
                    discount: discountValue,
                  };
                })
              );
            } else {
              // Validate discount doesn't exceed selected items total
              const selectedTotal = cart
                .filter((item) => {
                  const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                  return selectedIds.includes(itemCartId);
                })
                .reduce((sum, i) => sum + i.price * i.quantity, 0);
              
              if (mode === "amount" && discountAmount > selectedTotal) {
                setToastMessage("Discount amount cannot exceed the selected items total");
                return;
              }

              // Apply to selected items
              setCart((prev) =>
                prev.map((item) => {
                  const itemCartId = item.cartItemId || `${item.id}_${item.name}`;
                  if (selectedIds.includes(itemCartId)) {
                    const itemTotal = item.price * item.quantity;
                    let discountValue = 0;

                    if (mode === "percentage") {
                      discountValue = (itemTotal * discountAmount) / 100;
                    } else {
                      discountValue = discountAmount;
                    }

                    const updatedTotal = Math.max(0, itemTotal - discountValue);
                    return {
                      ...item,
                      originalPrice: item.originalPrice || item.price,
                      price: updatedTotal / item.quantity,
                      appliedDiscount:
                        mode === "percentage"
                          ? `${discountAmount}%`
                          : `€${discountValue.toFixed(2)}`,
                      discount: discountValue,
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
