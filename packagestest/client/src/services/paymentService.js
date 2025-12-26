import { cashmaticService } from "./cashmaticService";
import { payworldService } from "./payworldService";
import { vivaService } from "./vivaService";

/**
 * Unified Payment Service
 * Centralized manager for all payment methods (Cash, Card, Cashmatic, Payworld, Viva)
 */
class PaymentService {
  constructor() {
    this.activePaymentType = null;
  }

  /**
   * Get the configured card terminal type from localStorage
   * @returns {string} Terminal type: 'none', 'viva', 'payworld'
   */
  getCardTerminalType() {
    return localStorage.getItem("pos_card_terminal") || "none";
  }

  /**
   * Start a cash payment (manual)
   * @param {number} amount - Total amount
   * @param {function} onSuccess - Success callback
   * @returns {object} Payment modal trigger
   */
  startCashPayment(amount, onSuccess) {
    return {
      type: "cash",
      amount,
      showModal: true,
      onSuccess,
    };
  }

  /**
   * Start a card payment based on configured terminal
   * @param {number} amount - Total amount
   * @param {object} callbacks - Callback functions
   * @returns {Promise<object>} Payment result or modal trigger
   */
  async startCardPayment(amount, callbacks = {}) {
    const terminalType = this.getCardTerminalType();

    // Viva terminal
    if (terminalType === "viva") {
      this.activePaymentType = "viva";
      return await vivaService.startPayment(amount, callbacks);
    }

    // Payworld terminal
    if (terminalType === "payworld") {
      this.activePaymentType = "payworld";
      return await payworldService.startPayment(amount, callbacks);
    }

    // Default: manual card payment modal
    return {
      type: "card",
      amount,
      showModal: true,
      onSuccess: callbacks.onSuccess,
    };
  }

  /**
   * Start a Cashmatic payment
   * @param {number} amount - Total amount
   * @param {object} callbacks - Callback functions
   * @returns {Promise<object>} Payment result
   */
  async startCashmaticPayment(amount, callbacks = {}) {
    this.activePaymentType = "cashmatic";
    return await cashmaticService.startPayment(amount, callbacks);
  }

  /**
   * Start a Payworld payment
   * @param {number} amount - Total amount
   * @param {object} callbacks - Callback functions
   * @returns {Promise<object>} Payment result
   */
  async startPayworldPayment(amount, callbacks = {}) {
    this.activePaymentType = "payworld";
    return await payworldService.startPayment(amount, callbacks);
  }

  /**
   * Cancel the active payment
   * @returns {Promise<object>} Cancellation result
   */
  async cancelActivePayment() {
    if (!this.activePaymentType) {
      throw new Error("No active payment to cancel");
    }

    let result;
    switch (this.activePaymentType) {
      case "cashmatic":
        result = await cashmaticService.cancelPayment();
        break;
      case "payworld":
        result = await payworldService.cancelPayment();
        break;
      case "viva":
        // Viva doesn't support cancellation after initiation
        throw new Error("Viva payments cannot be cancelled after initiation");
      default:
        throw new Error(`Unknown payment type: ${this.activePaymentType}`);
    }

    this.activePaymentType = null;
    return result;
  }

  /**
   * Check if any payment is in progress
   * @returns {boolean}
   */
  isPaymentInProgress() {
    return (
      cashmaticService.isPaymentInProgress() ||
      payworldService.isPaymentInProgress() ||
      vivaService.isPaymentInProgress()
    );
  }

  /**
   * Get active payment type
   * @returns {string|null}
   */
  getActivePaymentType() {
    return this.activePaymentType;
  }

  /**
   * Cleanup all payment services
   */
  cleanup() {
    cashmaticService.cleanup();
    payworldService.cleanup();
    vivaService.cleanup();
    this.activePaymentType = null;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
