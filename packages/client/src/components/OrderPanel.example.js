/**
 * EXAMPLE: Refactored OrderPanel.js (Key Sections Only)
 * This shows how the payment-related code should look after refactoring
 * Copy these patterns into your actual OrderPanel.js
 */

import { useState, useRef, useEffect } from "react";
import ReceiptModal from "./ReceiptModal";
import ConfirmationModal from "./ConfirmationModal";
import PaymentModal from "./PaymentModal";
import DiscountModal from "./DiscountModal";
import NoteModal from "./NoteModal";
import Toast from "./Toast";
import { printerService } from "../services/printerService";
import { usePaymentHandlers } from "../hooks/usePaymentHandlers";

const OrderPanel = ({
  cart,
  setCart,
  onUpdateQuantity,
  customQuantity,
  setCustomQuantity,
  currentOrderId,
  selectedTable,
  onOrderComplete,
  onDeleteAll,
  onSplitCart,
}) => {
  // ... existing state variables ...
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCashmaticModal, setShowCashmaticModal] = useState(false);
  const [cashmaticInfo, setCashmaticInfo] = useState({
    requested: 0,
    inserted: 0,
    dispensed: 0,
    notDispensed: 0,
    state: null,
  });
  const [showPayworldModal, setShowPayworldModal] = useState(false);
  const [payworldStatus, setPayworldStatus] = useState({
    state: "IDLE",
    message: "",
    details: null,
  });
  
  // ✅ NEW: Use payment handlers hook
  const paymentHandlers = usePaymentHandlers({
    cart,
    discount,
    calculateTotal,
    setIsProcessing,
    setToastType,
    setToastMessage,
    setShowPaymentModal,
    setSelectedPaymentMethod,
    setShowCashmaticModal,
    setCashmaticInfo,
    setShowPayworldModal,
    setPayworldStatus,
    handlePaymentConfirm,
  });

  const {
    handleCashPayment,
    handleCardPayment,
    handleCashmaticPayment,
    handlePayworldPayment,
    handleAbortPayworld,
  } = paymentHandlers;

  // ❌ REMOVED: cashmaticPolling useEffect
  // ❌ REMOVED: payworldPolling useEffect
  // ❌ REMOVED: All old payment handler functions

  // ✅ KEEP: handlePaymentConfirm (unchanged)
  const handlePaymentConfirm = async (paymentData) => {
    // ... existing implementation ...
  };

  // ... rest of the component (cart management, notes, etc.) ...

  return (
    <>
      {/* ... existing JSX ... */}
      
      {/* Payment Buttons - onClick handlers now use hook functions */}
      <div className="grid grid-cols-4 gap-2 px-1 mb-3">
        <button
          className="bg-pos-bg-primary border border-pos-border-primary py-1"
          onClick={handleCardPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Card
        </button>
        <button
          className="bg-pos-bg-primary border border-pos-border-primary py-1"
          onClick={handleCashPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Cash
        </button>
        <button
          className="bg-pos-bg-primary border border-pos-border-primary py-1"
          onClick={handleCashmaticPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Cashmatic
        </button>
        <button
          className="bg-pos-bg-primary border border-pos-border-primary py-1"
          onClick={handlePayworldPayment}
          disabled={isProcessing || cart.length === 0}
        >
          Payworld
        </button>
      </div>

      {/* Modals remain unchanged */}
      {showCashmaticModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
          {/* ... existing modal JSX ... */}
        </div>
      )}

      {showPayworldModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60">
          {/* ... existing modal JSX ... */}
          <button onClick={handleAbortPayworld}>
            Actie beëindigen
          </button>
        </div>
      )}
    </>
  );
};

export default OrderPanel;
