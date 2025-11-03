import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal"; // Added missing import
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [showDiscountModal, setShowDiscountModal] = useState(false); // Added missing state

  // Track last added item
  useEffect(() => {
    const prevLen = prevCartLengthRef.current;
    const currLen = cart.length;

    if (currLen > prevLen) {
      const lastItem = cart[cart.length - 1];
      setLastAddedId(Number(lastItem.id));
    } else if (currLen < prevLen) {
      setLastAddedId(null);
      setSelectedIds([]);
    }

    prevCartLengthRef.current = currLen;
  }, [cart]);

  // Select item
  const handleSelect = (id) => {
    id = Number(id);
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

  // Select all
  const handleSelectAll = () => {
    setSelectedIds(cart.map((item) => Number(item.id)));
  };

  // Delete selected
  const handleClearSelected = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one item to delete.");
      return;
    }
    setCart((prev) =>
      prev.filter((item) => !selectedIds.includes(Number(item.id)))
    );
    setSelectedIds([]);
    setLastAddedId(null);
  };

  // Delete all
  const handleDeleteAllConfirm = () => {
    setCart([]);
    setSelectedIds([]);
    setLastAddedId(null);
  };

  const totalProductCount = () =>
    cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const hasSelection = selectedIds.length > 0;

  const calculateTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateTax = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity * 0.12, 0);

  // Payment
  const handlePayment = (paymentMethod = "cash") => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod(paymentMethod);
    setShowPaymentModal(true);
  };

  const handleCashPayment = () => handlePayment("cash");
  const handleCardPayment = () => handlePayment("card");

  const handlePaymentConfirm = async (paymentData) => {
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
        payment_method:
          paymentData.cashAmount > 0 && paymentData.cardAmount > 0
            ? "mixed"
            : paymentData.cashAmount > 0
            ? "cash"
            : "card",
        cash_amount: paymentData.cashAmount,
        card_amount: paymentData.cardAmount,
        total_paid: paymentData.totalPaid,
        change_due: paymentData.changeDue,
        details: cart.map((item) => ({
          product_id: item.id,
          qty: item.quantity,
          total: item.price * item.quantity,
        })),
      };

      await ApiService.createOrder(orderData);
      setShowPaymentModal(false);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error processing order:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Notes
  const handleNotes = () => {
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

  // Numpad
  const handleNumpadInput = (value) => {
    if (!discountInputRef.current) return;

    const currentDiscount = discount.toString();

    if (value === "C") {
      setDiscount(0);
      discountInputRef.current.value = "";
    } else if (value === ".") {
      if (!currentDiscount.includes(".")) {
        const newDiscount = currentDiscount + ".";
        setDiscount(parseFloat(newDiscount) || 0);
        discountInputRef.current.value = newDiscount;
      }
    } else {
      const newDiscount =
        currentDiscount === "0" ? value : currentDiscount + value;
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

                <div
                  className={`flex items-center gap-2 justify-center ${textColor}`}
                >
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
                {item.appliedDiscount && (
  <div className="text-xs text-whit italic">
    Discount: {item.appliedDiscount}
  </div>
)}

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
          className={`max-w-[6.5rem] text-center py-1.5 px-2 text-black bg-white text-xs outline-none ${
            !hasSelection ? "opacity-50 cursor-not-allowed" : ""
          }`}
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

      {/* Numpad */}
      <div className="grid grid-cols-4 gap-1 p-0.5">
        {["C", "7", "8", "9", ".", "4", "5", "6", "0", "1", "2", "3"].map(
          (val) => (
            <button
              key={val}
              className={`btn-primary p-0 text-sm font-semibold ${
                val === "C" ? "bg-gray-600 hover:bg-gray-500" : ""
              }`}
              onClick={() => handleNumpadInput(val)}
            >
              {val}
            </button>
          )
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="grid grid-cols-6 gap-2 p-1 bg-pos-bg-primary">
        <button
          className={`bg-pos-interactive-primary text-pos-text-secondary px-3 py-2 text-lg font-medium ${
            hasSelection ? "hover:bg-pos-interactive-hover" : "opacity-50 cursor-not-allowed"
          }`}
          onClick={handleClearSelected}
          disabled={!hasSelection}
        >
          🗑️
        </button>

        <button
          className={`btn-danger text-sm font-medium ${!hasSelection ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => setShowDeleteAllModal(true)}
          disabled={!hasSelection}
        >
          Delete All
        </button>

        <button
          className={`btn-primary text-sm font-medium ${!hasSelection ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleNotes}
          disabled={!hasSelection}
        >
          Notes
        </button>

        <button
          className="btn-primary text-sm font-medium"
          onClick={() => setShowDiscountModal(true)}
        >
          Discount
        </button>

        <button className="btn-primary text-sm font-medium">Drawer</button>

        <button
          className="btn-primary text-sm font-medium disabled:opacity-50"
          onClick={handleCardPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Card
        </button>

        <button
          className="btn-primary text-sm font-medium disabled:opacity-50"
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
        total={calculateTotal() + calculateTax() - discount}
        onConfirm={handlePaymentConfirm}
        defaultPaymentMethod={selectedPaymentMethod}
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

      {showDiscountModal && (
        <DiscountModal
          title={
            selectedIds.length === 0
              ? "Whole Order"
              : selectedIds.length === 1
              ? cart.find((item) => item.id === selectedIds[0])?.name
              : cart
                  .filter((item) => selectedIds.includes(item.id))
                  .map((i) => i.name)
                  .join(", ")
          }
          basePrice={
            selectedIds.length === 0
              ? calculateTotal() + calculateTax()
              : cart
                  .filter((item) => selectedIds.includes(item.id))
                  .reduce((sum, i) => sum + i.price * i.quantity, 0)
          }
          onClose={() => setShowDiscountModal(false)}
         onConfirm={({ finalPrice, mode, rawInput }) => {
  if (selectedIds.length === 0) {
    // Apply discount to the whole order
    setDiscount((prev) => prev + (mode === "percentage" ? (calculateTotal() + calculateTax()) * (parseFloat(rawInput) / 100) : parseFloat(rawInput)));
  } else {
    // Apply to selected items
    setCart((prev) =>
      prev.map((item) => {
        if (selectedIds.includes(item.id)) {
          const itemTotal = item.price * item.quantity;
          let discountValue = 0;

          if (mode === "percentage") {
            discountValue = (itemTotal * parseFloat(rawInput)) / 100;
          } else {
            discountValue = parseFloat(rawInput);
          }

          const updatedTotal = itemTotal - discountValue;
          return {
            ...item,
            price: updatedTotal / item.quantity,
            appliedDiscount:
              mode === "percentage"
                ? `${rawInput}%`
                : `€${discountValue.toFixed(2)}`,
          };
        }
        return item;
      })
    );
  }
  setShowDiscountModal(false);
}}

        />
      )}
    </div>
  );
};

export default OrderPanel;
