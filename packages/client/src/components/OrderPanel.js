import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal";
import ApiService from "../services/api";

const OrderPanel = ({ cart, setCart, onUpdateQuantity, customQuantity, setCustomQuantity }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // repurposed ref/state: cash input (cash received)
  const cashInputRef = useRef(null);
  const [cashReceived, setCashReceived] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [lastAddedId, setLastAddedId] = useState(null);
  const prevCartLengthRef = useRef(cart.length);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("cash");
  const [showDiscountModal, setShowDiscountModal] = useState(false);

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
    cart.length;
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
    setCashReceived("");
    if (cashInputRef.current) cashInputRef.current.value = "";
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
                className={`grid grid-cols-12 mb-1 gap-3 items-center text-sm py-2 px-2 cursor-pointer rounded ${bgColor}`}
              >
                {/* Product Name */}
                <div className={`font-light col-span-4 ${textColor}`}>
                  {item.name
                    ? item.name.split(" ").length > 1
                      ? item.name.split(" ").slice(0, 5).join(" ") + (item.name.split(" ").length > 5 ? "..." : "")
                      : item.name.length > 20
                        ? item.name.slice(0, 14) + "..."
                        : item.name
                    : ""}
                </div>

                {/* Quantity Controls */}

                <div className={`flex items-center col-span-2 gap-2 justify-center ${textColor}`}>
                  <button
                    className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-sm font-semibold justify-center hover:bg-pos-interactive-hover`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.id, item.quantity - 1);
                    }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className={`bg-pos-interactive-primary ${textColor} px-1.5 flex items-center text-sm justify-center hover:bg-pos-interactive-hover`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.id, item.quantity + 1);
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
      <div className="bg-pos-bg-secondary px-3 py-3 border-t border-pos-border-light">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-pos-text-disabled uppercase">Total</div>
          <div className="text-lg font-bold text-pos-text-secondary">
            {(calculateTotal() - discount + calculateTax()).toFixed(2)}
          </div>


          <input
            type="text"
            placeholder="Add Quantity"
            value={customQuantity}
            onChange={(e) => setCustomQuantity(e.target.value)}
            className="max-w-[7rem] text-center py-1 px-2 bg-white text-black text-xs rounded outline-none"
          />
        </div>
      </div>

      {/* Icon row (4 icons) */}
      <div className="grid grid-cols-4 gap-2 p-2 bg-pos-bg-secondary border-t border-pos-border-light">
        <button
          onClick={handleClearSelected}
          disabled={!hasSelection}
          className={`bg-pos-interactive-primary text-pos-text-secondary py-2 rounded ${!hasSelection ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
        >
          🗑️
        </button>

        <button

          onClick={() => setShowDeleteAllModal(true)}
          disabled={!hasSelection}
          className="bg-pos-interactive-primary text-pos-text-secondary py-2 rounded hover:bg-pos-interactive-hover"
        >
          🛒
        </button>

        <button
          onClick={handleNotes}
          disabled={!hasSelection}
          className={`bg-pos-interactive-primary text-pos-text-secondary py-2 rounded ${!hasSelection ? "opacity-50 cursor-not-allowed" : "hover:bg-pos-interactive-hover"}`}
        >
          📝
        </button>

        <button
          onClick={() => setShowDiscountModal(true)}

          className="bg-pos-interactive-primary text-pos-text-secondary py-2 rounded hover:bg-pos-interactive-hover disabled:opacity-50"
          disabled={isProcessing || cart.length === 0}

        >
          💳
        </button>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-4 gap-1.5 p-1.5">
        {["C", "7", "8", "9", ".", "4", "5", "6", "0", "1", "2", "3"].map((val) => (
          <button
            key={val}
            onClick={() => handleNumpadInput(val)}
            className={`aspect-auto flex items-center py-1  justify-center rounded font-medium text-sm shadow-sm transition-all duration-150 
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
      <div className="grid grid-cols-2 gap-2 p-2 bg-pos-bg-primary border-t border-pos-border-light">
        {/* Card */}
        <button
          className="bg-pos-interactive-primary text-pos-text-secondary text-sm font-medium py-2 rounded hover:bg-pos-interactive-hover disabled:opacity-50"
          onClick={handleCardPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Card
        </button>

        {/* Cash */}
        <button
          className="bg-pos-interactive-primary text-pos-text-secondary text-sm font-medium py-2 rounded hover:bg-pos-interactive-hover disabled:opacity-50"
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
            const discountValueInput = parseFloat(rawInput);
            const discountAmount = isNaN(discountValueInput) ? 0 : discountValueInput;

            if (selectedIds.length === 0) {
              // Apply discount to the whole order
              setDiscount((prev) =>
                prev +
                (mode === "percentage"
                  ? (calculateTotal() + calculateTax()) * (discountAmount / 100)
                  : discountAmount)
              );
            } else {
              // Apply to selected items
              setCart((prev) =>
                prev.map((item) => {
                  if (selectedIds.includes(item.id)) {
                    const itemTotal = item.price * item.quantity;
                    let discountValue = 0;

                    if (mode === "percentage") {
                      discountValue = (itemTotal * discountAmount) / 100;
                    } else {
                      discountValue = discountAmount;
                    }

                    const updatedTotal = itemTotal - discountValue;
                    return {
                      ...item,
                      originalPrice: item.originalPrice || item.price, // store the base price once
                      price: updatedTotal / item.quantity,
                      appliedDiscount:
                        mode === "percentage"
                          ? `${discountAmount}%`
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
