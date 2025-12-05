import { paymentService } from "../services/paymentService";
import { cashmaticService } from "../services/cashmaticService";
import { payworldService } from "../services/payworldService";

/**
 * Custom hook for centralized payment handling
 * Replaces the payment logic scattered in OrderPanel
 */
export const usePaymentHandlers = ({
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
}) => {
  /**
   * Handle cash payment
   */
  const handleCashPayment = () => {
    if (cart.length === 0) return;
    setSelectedPaymentMethod("cash");
    setShowPaymentModal(true);
  };

  /**
   * Handle card payment (auto-detects terminal type)
   */
  const handleCardPayment = async () => {
    if (cart.length === 0) return;

    const subTotal = calculateTotal();
    const total = subTotal - discount;

    if (total <= 0) {
      setToastType("error");
      setToastMessage("Order total must be greater than zero.");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await paymentService.startCardPayment(total, {
        onStatusUpdate: (status) => {
          setToastType("info");
          setToastMessage(status.message);
        },
        onSuccess: async (result) => {
          await handlePaymentConfirm(result);
          setToastType("success");
          setToastMessage(result.message);
        },
        onError: (error) => {
          setToastType("error");
          setToastMessage(error.message);
        },
      });

      // If result has showModal, open payment modal
      if (result.showModal) {
        setSelectedPaymentMethod(result.type);
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error("Card payment error:", error);
      setToastType("error");
      setToastMessage(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle Cashmatic payment
   */
  const handleCashmaticPayment = async () => {
    if (cart.length === 0) {
      setToastType("error");
      setToastMessage("Cart is empty.");
      return;
    }

    const subTotal = calculateTotal();
    const total = subTotal - discount;

    if (total <= 0) {
      setToastType("error");
      setToastMessage("Order total must be greater than zero.");
      return;
    }

    setIsProcessing(true);
    setShowCashmaticModal(true);
    setCashmaticInfo({
      requested: total,
      inserted: 0,
      dispensed: 0,
      notDispensed: 0,
      state: "IN_PROGRESS",
    });

    try {
      await cashmaticService.startPayment(total, {
        onStatusUpdate: (info) => {
          setCashmaticInfo(info);
        },
        onSuccess: async (result) => {
          await handlePaymentConfirm(result);
          setToastType("success");
          setToastMessage(result.message);
          if (!result.manualChangeRequired) {
            setShowCashmaticModal(false);
          }
        },
        onError: (error) => {
          setToastType("error");
          setToastMessage(error.message);
          setShowCashmaticModal(false);
        },
        onCancel: (result) => {
          setToastType("info");
          setToastMessage(result.message);
          setShowCashmaticModal(false);
        },
      });
    } catch (error) {
      console.error("Cashmatic payment error:", error);
      setToastType("error");
      setToastMessage(error.message);
      setShowCashmaticModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle Payworld payment
   */
  const handlePayworldPayment = async () => {
    if (cart.length === 0) {
      setToastType("error");
      setToastMessage("Cart is empty.");
      return;
    }

    const subTotal = calculateTotal();
    const total = subTotal - discount;

    if (total <= 0) {
      setToastType("error");
      setToastMessage("Order total must be greater than zero.");
      return;
    }

    setIsProcessing(true);
    setShowPayworldModal(true);
    setPayworldStatus({
      state: "IN_PROGRESS",
      message: "Payworld betaling gestart...",
      details: null,
    });

    try {
      await payworldService.startPayment(total, {
        onStatusUpdate: (status) => {
          setPayworldStatus(status);
        },
        onSuccess: async (result) => {
          await handlePaymentConfirm(result);
          setToastType("success");
          setToastMessage(result.message);
          setShowPayworldModal(false);
        },
        onError: (error) => {
          setPayworldStatus({
            state: "ERROR",
            message: error.message,
            details: error.details,
          });
          setToastType("error");
          setToastMessage(error.message);
        },
        onCancel: (result) => {
          setPayworldStatus({
            state: "CANCELLED",
            message: result.message,
            details: result.details,
          });
          setToastType("info");
          setToastMessage(result.message);
        },
        onDeclined: (result) => {
          setPayworldStatus({
            state: "DECLINED",
            message: result.message,
            details: result.details,
          });
          setToastType("error");
          setToastMessage(result.message);
        },
      });
    } catch (error) {
      console.error("Payworld payment error:", error);
      setToastType("error");
      setToastMessage(error.message);
      setShowPayworldModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Cancel Payworld payment
   */
  const handleAbortPayworld = async () => {
    try {
      await payworldService.cancelPayment();
    } catch (error) {
      console.error("Error cancelling Payworld:", error);
      setToastType("error");
      setToastMessage(error.message);
    }
  };

  return {
    handleCashPayment,
    handleCardPayment,
    handleCashmaticPayment,
    handlePayworldPayment,
    handleAbortPayworld,
  };
};
