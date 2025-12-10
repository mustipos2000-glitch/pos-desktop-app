import ApiService from "./api";

/**
 * Centralized Cashmatic Payment Service
 * Handles all Cashmatic payment operations independently
 */
class CashmaticService {
  constructor() {
    this.sessionId = null;
    this.pollingInterval = null;
    this.isPolling = false;
    this.callbacks = {
      onStatusUpdate: null,
      onSuccess: null,
      onError: null,
      onCancel: null,
    };
  }

  /**
   * Start a Cashmatic payment session
   * @param {number} amount - Amount to charge (in euros)
   * @param {object} callbacks - Callback functions for different states
   * @returns {Promise<object>} Session information
   */
  async startPayment(amount, callbacks = {}) {
    if (this.isPolling) {
      throw new Error("A Cashmatic payment is already in progress");
    }

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    // Store callbacks
    this.callbacks = {
      onStatusUpdate: callbacks.onStatusUpdate || null,
      onSuccess: callbacks.onSuccess || null,
      onError: callbacks.onError || null,
      onCancel: callbacks.onCancel || null,
    };

    try {
      // Convert amount to cents
      const amountInCents = Math.round(amount * 100);

      // Start payment on backend
      const response = await ApiService.startCashmaticPayment({
        amount: amountInCents,
      });

      const data = response.data || response;
      this.sessionId = data.sessionId;

      if (!this.sessionId) {
        throw new Error("No session ID received from server");
      }

      // Initialize status info
      const initialInfo = {
        requested: amount,
        inserted: 0,
        dispensed: 0,
        notDispensed: 0,
        state: "IN_PROGRESS",
      };

      // Notify status update
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(initialInfo);
      }

      // Start polling
      this.startPolling();

      return {
        success: true,
        sessionId: this.sessionId,
        info: initialInfo,
      };
    } catch (error) {
      console.error("Error starting Cashmatic payment:", error);
      this.cleanup();
      
      if (this.callbacks.onError) {
        this.callbacks.onError({
          message: "Failed to start Cashmatic payment",
          error: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Start polling for payment status
   */
  startPolling() {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollingInterval = setInterval(() => {
      this.pollStatus();
    }, 1000);
  }

  /**
   * Poll the payment status from backend
   */
  async pollStatus() {
    if (!this.sessionId || !this.isPolling) return;

    try {
      const response = await ApiService.getCashmaticStatus(this.sessionId);
      const statusData = response.data || response;

      // Convert amounts from cents to euros
      const requested = (statusData.requestedAmount || 0) / 100;
      const inserted = (statusData.insertedAmount || 0) / 100;
      const dispensed = (statusData.dispensedAmount || 0) / 100;
      const notDispensed = (statusData.notDispensedAmount || 0) / 100;
      const state = statusData.state;

      const info = {
        requested,
        inserted,
        dispensed,
        notDispensed,
        state,
      };

      // Notify status update
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(info);
      }

      // Handle terminal states
      if (state === "FINISHED" || state === "FINISHED_MANUAL") {
        this.stopPolling();

        const result = {
          success: true,
          state,
          info,
          totalPaid: requested,
          cashAmount: requested,
          cardAmount: 0,
          changeDue: 0,
          manualChangeRequired: state === "FINISHED_MANUAL",
          message:
            state === "FINISHED"
              ? "Cashmatic payment completed."
              : "Cashmatic payment completed – give manual change.",
        };

        if (this.callbacks.onSuccess) {
          this.callbacks.onSuccess(result);
        }

        this.cleanup();
      } else if (state === "CANCELLED") {
        this.stopPolling();

        const result = {
          success: false,
          state,
          info,
          message: "Cashmatic payment cancelled.",
        };

        if (this.callbacks.onCancel) {
          this.callbacks.onCancel(result);
        }

        this.cleanup();
      } else if (state === "ERROR" || state === "FAILED") {
        this.stopPolling();

        const result = {
          success: false,
          state,
          info,
          message: "Error during Cashmatic payment.",
        };

        if (this.callbacks.onError) {
          this.callbacks.onError(result);
        }

        this.cleanup();
      }
    } catch (error) {
      console.error("Cashmatic polling error:", error);
      this.stopPolling();

      if (this.callbacks.onError) {
        this.callbacks.onError({
          message: "Error communicating with Cashmatic.",
          error: error.message,
        });
      }

      this.cleanup();
    }
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  /**
   * Cancel the current payment session
   */
  async cancelPayment() {
    if (!this.sessionId) {
      throw new Error("No active Cashmatic session to cancel");
    }

    try {
      // Cancel on backend
      await ApiService.cancelCashmatic(this.sessionId);
      
      this.stopPolling();
      
      if (this.callbacks.onCancel) {
        this.callbacks.onCancel({
          success: true,
          message: "Cashmatic payment cancelled by user.",
        });
      }

      this.cleanup();
    } catch (error) {
      console.error("Error cancelling Cashmatic payment:", error);
      // Still cleanup even if backend call fails
      this.stopPolling();
      this.cleanup();
      throw error;
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      isPolling: this.isPolling,
    };
  }

  /**
   * Check if payment is in progress
   */
  isPaymentInProgress() {
    return this.isPolling && this.sessionId !== null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopPolling();
    this.sessionId = null;
    this.callbacks = {
      onStatusUpdate: null,
      onSuccess: null,
      onError: null,
      onCancel: null,
    };
  }
}

// Export singleton instance
export const cashmaticService = new CashmaticService();
export default cashmaticService;
