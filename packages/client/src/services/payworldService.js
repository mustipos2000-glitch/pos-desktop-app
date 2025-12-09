import ApiService from "./api";

/**
 * Centralized Payworld Payment Service
 * Handles all Payworld/PAX A35 payment operations independently
 */
class PayworldService {
  constructor() {
    this.sessionId = null;
    this.pollingInterval = null;
    this.isPolling = false;
    this.finalized = false;
    this.pollingStartTime = null;
    this.pollCount = 0;
    this.maxPollingDuration = 2 * 60 * 1000; // 2 minutes in milliseconds
    this.maxPollCount = 60; // Maximum number of polls (2 min / 2 sec = 60)
    this.callbacks = {
      onStatusUpdate: null,
      onSuccess: null,
      onError: null,
      onCancel: null,
      onDeclined: null,
    };
  }

  /**
   * Start a Payworld payment session
   * @param {number} amount - Amount to charge (in euros)
   * @param {object} callbacks - Callback functions for different states
   * @returns {Promise<object>} Session information
   */
  async startPayment(amount, callbacks = {}) {
    if (this.isPolling) {
      throw new Error("A Payworld payment is already in progress");
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
      onDeclined: callbacks.onDeclined || null,
    };

    this.finalized = false;

    try {
      // Initial status
      const initialStatus = {
        state: "IN_PROGRESS",
        message: "Payworld payment started. Connecting to terminal...",
        details: null,
        amount,
      };

      // Notify status update
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(initialStatus);
      }

      // Start payment on backend
      const response = await ApiService.startPayworldPayment({
        amount,
      });

      const data = response || {};
      this.sessionId = data.sessionId || (data.data && data.data.sessionId);

      if (!this.sessionId) {
        throw new Error("No Payworld session ID received from server.");
      }

      // Update status
      const connectedStatus = {
        state: "IN_PROGRESS",
        message:
          "Connection established. Follow the instructions on the terminal...",
        details: null,
        amount,
      };

      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(connectedStatus);
      }

      // Start polling
      this.startPolling();

      return {
        success: true,
        sessionId: this.sessionId,
        status: connectedStatus,
      };
    } catch (error) {
      console.error("Payworld start error:", error);
      this.cleanup();

      const errorStatus = {
        state: "ERROR",
        message:
          "Payment could not be started. Check settings / connection.",
        details: { error: error.message },
        amount,
      };

      if (this.callbacks.onError) {
        this.callbacks.onError(errorStatus);
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
    this.pollingStartTime = Date.now();
    this.pollCount = 0;
    this.pollingInterval = setInterval(() => {
      this.pollStatus();
    }, 2000); // Increased to 2 seconds to reduce API load
  }

  /**
   * Poll the payment status from backend
   */
  async pollStatus() {
    if (!this.sessionId || !this.isPolling) return;

    // Check timeout
    const elapsed = Date.now() - this.pollingStartTime;
    this.pollCount++;

    if (elapsed > this.maxPollingDuration || this.pollCount > this.maxPollCount) {
      console.warn(`Payworld polling timeout after ${Math.round(elapsed / 1000)}s (${this.pollCount} polls)`);
      this.stopPolling();

      const timeoutStatus = {
        state: "ERROR",
        message: "Payment timeout: No response from terminal after 2 minutes.",
        details: { timeout: true, elapsed: Math.round(elapsed / 1000) },
      };

      if (this.callbacks.onError) {
        this.callbacks.onError(timeoutStatus);
      }

      this.cleanup();
      return;
    }

    try {
      const response = await ApiService.getPayworldStatus(this.sessionId);
      const data = response.data || response;

      if (!data || data.ok === false) return;

      const state = data.state || "IN_PROGRESS";
      const message = data.message || "";
      const details = data.details || null;

      const status = {
        state,
        message,
        details,
      };

      // Notify status update
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate(status);
      }

      // Handle APPROVED state
      if (state === "APPROVED" && !this.finalized) {
        this.finalized = true;
        this.stopPolling();

        const result = {
          success: true,
          state,
          message: "Payworld payment completed.",
          details,
          totalPaid: details?.amount || 0,
          cashAmount: 0,
          cardAmount: details?.amount || 0,
          changeDue: 0,
        };

        if (this.callbacks.onSuccess) {
          this.callbacks.onSuccess(result);
        }

        this.cleanup();
      }
      // Handle DECLINED state
      else if (state === "DECLINED") {
        this.stopPolling();

        const result = {
          success: false,
          state,
          message: "Payworld payment declined.",
          details,
        };

        if (this.callbacks.onDeclined) {
          this.callbacks.onDeclined(result);
        }

        this.cleanup();
      }
      // Handle CANCELLED state
      else if (state === "CANCELLED") {
        this.stopPolling();

        const result = {
          success: false,
          state,
          message: "Payworld payment cancelled.",
          details,
        };

        if (this.callbacks.onCancel) {
          this.callbacks.onCancel(result);
        }

        this.cleanup();
      }
      // Handle ERROR state
      else if (state === "ERROR") {
        this.stopPolling();

        const result = {
          success: false,
          state,
          message: "Error during Payworld payment.",
          details,
        };

        if (this.callbacks.onError) {
          this.callbacks.onError(result);
        }

        this.cleanup();
      }
    } catch (error) {
      console.error("Payworld polling error:", error);
      this.stopPolling();

      const errorStatus = {
        state: "ERROR",
        message: "Error retrieving Payworld status.",
        details: { error: error.message },
      };

      if (this.callbacks.onError) {
        this.callbacks.onError(errorStatus);
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
   * Cancel the current payment on terminal
   */
  async cancelPayment() {
    if (!this.sessionId) {
      throw new Error("No active Payworld session to cancel.");
    }

    try {
      // Notify cancellation in progress
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate({
          state: "IN_PROGRESS",
          message: "Payment is being cancelled on the terminal...",
          details: null,
        });
      }

      // Cancel on backend
      await ApiService.cancelPayworldPayment(this.sessionId);

      this.stopPolling();

      const result = {
        success: true,
        state: "CANCELLED",
        message: "Payworld payment cancelled on the terminal.",
        details: null,
      };

      if (this.callbacks.onCancel) {
        this.callbacks.onCancel(result);
      }

      this.cleanup();

      return result;
    } catch (error) {
      console.error("Error cancelling Payworld:", error);

      const errorResult = {
        success: false,
        state: "ERROR",
        message: "Failed to cancel on terminal.",
        details: { error: error.message },
      };

      if (this.callbacks.onError) {
        this.callbacks.onError(errorResult);
      }

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
      finalized: this.finalized,
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
    this.finalized = false;
    this.pollingStartTime = null;
    this.pollCount = 0;
    this.callbacks = {
      onStatusUpdate: null,
      onSuccess: null,
      onError: null,
      onCancel: null,
      onDeclined: null,
    };
  }
}

// Export singleton instance
export const payworldService = new PayworldService();
export default payworldService;
