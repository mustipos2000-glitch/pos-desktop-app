import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import ApiService from "../services/api";

const OrderPanel = ({ cart, setCart, onUpdateQuantity }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const discountInputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastAddedId, setLastAddedId] = useState(null);
  const prevCartLengthRef = useRef(cart.length);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Track last added item. Only auto-set when items are added; clear selection when items are removed.
  useEffect(() => {
    const prevLen = prevCartLengthRef.current;
    const currLen = cart.length;

    if (currLen > prevLen) {
      // Items were added -> mark the last item as active
      const lastItem = cart[cart.length - 1];
      setLastAddedId(Number(lastItem.id));
    } else if (currLen < prevLen) {
      // Items were removed -> clear active selection and any selected ids
      setLastAddedId(null);
      setSelectedIds([]);
    }

    prevCartLengthRef.current = currLen;
  }, [cart]);

  // Toggle item selection
  const handleSelect = (id) => {
  id = Number(id);
  setSelectedIds((prev) => {
    const alreadySelected = prev.includes(id);
    if (alreadySelected) {
      // Deselect: remove from selected list and clear active
      setLastAddedId(null);
      return prev.filter((x) => x !== id);
    }

    // Select: add to selected list and mark as active
    setLastAddedId(id);
    return [...prev, id];
  });
};


  // Select all
  const handleSelectAll = () => {
    setSelectedIds(cart.map((item) => Number(item.id)));
  };

  // Delete selected items
  const handleClearSelected = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one item to delete.");
      return;
    }
    setCart((prev) => prev.filter((item) => !selectedIds.includes(Number(item.id))));
    // After clearing selected items, no item should remain selected or active
    setSelectedIds([]);
    setLastAddedId(null);
  };

  // Delete single item
  const handleDeleteSingle = (e, itemId) => {
    e.stopPropagation();
    const id = Number(itemId);
    setCart((prev) => prev.filter((item) => Number(item.id) !== id));
    // When deleting a selected product, clear selection and active item
    setSelectedIds([]);
    setLastAddedId(null);
  };

  const handleDeleteAllConfirm = () => {
    // Clear entire cart and selection
    setCart([]);
    setSelectedIds([]);
    setLastAddedId(null);
  };

  const totalProductCount = () => cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const hasSelection = selectedIds.length > 0;

  const calculateTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateTax = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity * 0.12, 0);

  const handleCashPayment = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const subTotal = calculateTotal();
      const tax = calculateTax();
      const total = subTotal + tax - discount;

      const orderData = {
        tax,
        status: "completed",
        note,
        sub_total: subTotal,
        total,
        discount,
        details: cart.map((item) => ({
          product_id: item.id,
          qty: item.quantity,
          total: item.price * item.quantity,
        })),
      };

      await ApiService.createOrder(orderData);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error processing order:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotes = () => {
    // Use a simple prompt for now to capture notes for the order
    const newNote = window.prompt("Enter note for the order:", note || "");
    if (newNote !== null) setNote(newNote);
  };

  const handleCloseReceipt = () => setShowReceipt(false);

  const handlePrintReceipt = () => {
    setShowReceipt(false);
    setCart([]);
    setDiscount(0);
    if (discountInputRef.current) discountInputRef.current.value = "";
    window.print();
  };
// Handle numeric keypad input for discount
  const handleNumpadInput = (value) => {
    if (!discountInputRef.current) return;

    const currentDiscount = discount.toString();

    if (value === 'C') {
      // Clear discount
      setDiscount(0);
      discountInputRef.current.value = '';
    } else if (value === '.') {
      // Add decimal point if not already present
      if (!currentDiscount.includes('.')) {
        const newDiscount = currentDiscount + '.';
        setDiscount(parseFloat(newDiscount) || 0);
        discountInputRef.current.value = newDiscount;
      }
    } else {
      // Add digit
      const newDiscount = currentDiscount === '0' ? value : currentDiscount + value;
      setDiscount(parseFloat(newDiscount) || 0);
      discountInputRef.current.value = newDiscount;
    }
  };
  return (
    <div className="w-1/4 min-w-[300px] bg-pos-bg-quaternary flex flex-col border-l border-pos-border-light h-screen">
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
      <div className="flex-1 overflow-y-auto px-4 flex flex-col bg-pos-bg-secondary min-h-[160px] scrollbar-custom">
        {cart.length === 0 ? (
          <div className="text-center text-pos-text-disabled py-10 px-5 text-sm">
            No items in cart
          </div>
        ) : (
          cart.map((item) => {
            const id = Number(item.id);
            const isSelected = selectedIds.includes(id);
            const isLastAdded = id === lastAddedId;

            const bgColor = isLastAdded
              ? "bg-green-500"
              : isSelected
              ? "bg-green-500"
              : "bg-blue-500";
            const textColor = "text-white";

            return (
              <div
                key={id}
                onClick={() => handleSelect(id)}
                className={`grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-2.5 items-center text-sm py-1.5 px-5 cursor-pointer ${bgColor}`}
              >
                <div className={`font-light ${textColor}`}>{item.name}</div>

                <div className={`flex items-center gap-2 justify-center ${textColor}`}>
                  <button
                    className={`bg-pos-interactive-primary ${textColor} w-7 h-4 flex items-center justify-center hover:bg-pos-interactive-hover`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.id, item.quantity - 1);
                    }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className={`bg-pos-interactive-primary ${textColor} w-7 h-4 flex items-center justify-center hover:bg-pos-interactive-hover`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.id, item.quantity + 1);
                    }}
                  >
                    +
                  </button>
                </div>

                <div className={`text-right ${textColor} font-light`}>
                  {(item.price * item.quantity).toFixed(2)}
                </div>

                
              </div>
            );
          })
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-t border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Gross Total</span>
        <span className="bg-pos-interactive-primary px-0.5 py-0.5 text-pos-text-secondary min-w-[100px] text-center">
          {calculateTotal().toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Tax 12%</span>
        <span className="bg-pos-interactive-primary px-0.5 py-0.5 text-pos-text-secondary min-w-[100px] text-center">
          {calculateTax().toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Discount</span>
        <input
          type="text"
          className={`max-w-[6.5rem] text-center py-1.5 px-2 text-black bg-white text-xs outline-none ${!hasSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="0"
          ref={discountInputRef}
          disabled={!hasSelection}
          onChange={(e) => {
            const newDiscount = parseFloat(e.target.value) || 0;
            setDiscount(newDiscount);
          }}
        />
      </div>

      <div className="flex justify-between items-center px-2 py-0 bg-pos-bg-secondary border-b border-pos-border-light text-xs font-semibold text-pos-text-secondary">
        <span>Net Total</span>
        <span className="bg-pos-interactive-primary px-0.5 py-0.5 text-pos-text-secondary min-w-[100px] text-center">
          {(calculateTotal() + calculateTax() - discount).toFixed(2)}
        </span>
      </div>

       <div className="grid grid-cols-4 gap-1 p-0.5">
        <button className="bg-gray-600 text-pos-text-secondary border-none p-0 cursor-pointer text-sm font-semibold transition-colors duration-200 hover:bg-gray-500" onClick={() => handleNumpadInput('C')}>C</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('7')}>7</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('8')}>8</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('9')}>9</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('.')}>.</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('4')}>4</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('5')}>5</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('6')}>6</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('0')}>0</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('1')}>1</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('2')}>2</button>
        <button className="btn-primary p-0 text-sm font-semibold" onClick={() => handleNumpadInput('3')}>3</button>
      </div>

      {/* Bottom Buttons */}
      <div className="grid grid-cols-6 gap-2 p-1 bg-pos-bg-primary">
        <button
          className={`bg-pos-interactive-primary text-pos-text-secondary px-3 py-2 text-lg font-medium ${hasSelection ? 'hover:bg-pos-interactive-hover' : 'opacity-50 cursor-not-allowed'}`}
          onClick={handleClearSelected}
          title={
            selectedIds.length > 0
              ? `Delete ${selectedIds.length} selected item(s)`
              : "Select items to delete"
          }
          disabled={!hasSelection}
        >
          🗑️
        </button>

        {/* Delete All - opens confirmation modal showing amount */}
        <button
          className={`btn-danger text-sm font-medium ${!hasSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setShowDeleteAllModal(true)}
          title="Delete all items from the order"
          disabled={!hasSelection}
        >
          Delete All
        </button>

        {/* Notes - enabled only when selection exists */}
        <button
          className={`btn-primary text-sm font-medium ${!hasSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleNotes}
          disabled={!hasSelection}
          title={hasSelection ? 'Add note for the order' : 'Select items to add notes'}
        >
          Notes
        </button>

        {/* Select All */}
        <button
          className=" text-sm   font-medium"
          onClick={handleSelectAll}
          title="Discount"
        >
          Discount
        </button>

        <button className="btn-primary text-sm font-medium">Drawer</button>
        <button className="btn-primary text-sm font-medium">Card</button>

        <button
          className="btn-primary text-sm font-medium disabled:opacity-50"
          onClick={handleCashPayment}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Cash"}
        </button>
      </div>

      {/* Confirmation Modal for Delete All */}
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

      {showReceipt && (
        <ReceiptModal
          cart={cart}
          total={calculateTotal() + calculateTax() - discount}
          subTotal={calculateTotal()}
          tax={calculateTax()}
          discount={discount}
          onClose={handleCloseReceipt}
          onPrint={handlePrintReceipt}
        />
      )}
    </div>
  );
};

export default OrderPanel;
