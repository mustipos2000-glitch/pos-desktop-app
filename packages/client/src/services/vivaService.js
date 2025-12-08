import ApiService from "./api";

/**
 * Centralized Viva Payment Service
 * Handles all Viva Wallet payment operations independently
 */
class VivaService {
  constructor() {
    this.isProcessing = false;
    this.callbacks = {
      onStatusUpdate: null,
      onSuccess: null,
      onError: null,
    };
  }

  /**
   * Get Viva configuration from localStorage
   * @returns {object} Viva configuration
   */
  getConfig() {
    let vivaConfig = { merchantId: "", terminalId: "" };
    try {
      const storedConfig = localStorage.getItem("pos_viva_config");
      if (storedConfig) {
        vivaConfig = JSON.parse(storedConfig);
      }
    } catch (e) {
      console.error("Failed to parse Viva config from localStorage", e);
    }
    return vivaConfig;
  }

  /**
   * Validate Viva configuration
   * @returns {boolean} True if config is valid
   */
  isConfigValid() {
    const config = this.getConfig();
    return !!(config.merchantId && config.terminalId);
  }

  /**
   * Start a Viva payment session
   * @param {number} amount - Amount to charge (in euros)
   * @param {object} callbacks - Callback functions for different states
   * @param {string} orderReference - Optional order reference
   * @returns {Promise<object>} Payment result
   */
  async startPayment(amount, callbacks = {}, orderReference = null) {
    if (this.isProcessing) {
      throw new Error("A Viva payment is already in progress");
    }

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than zero for Viva payment.");
    }

    const vivaConfig = this.getConfig();
    if (!vivaConfig.merchantId || !vivaConfig.terminalId) {
      throw new Error(
        "Viva settings are incomplete. Please configure Merchant ID and Terminal ID in Settings -> Payment."
      );
    }

    // Store callbacks
    this.callbacks = {
      onStatusUpdate: callbacks.onStatusUpdate || null,
      onSuccess: callbacks.onSuccess || null,
      onError: callbacks.onError || null,
    };

    this.isProcessing = true;

    try {
      // Notify status update
      if (this.callbacks.onStatusUpdate) {
        this.callbacks.onStatusUpdate({
          state: "IN_PROGRESS",
          message: "Viva betaling gestart. Volg de instructies op de terminal...",
          amount,
        });
      }

      // Start payment on backend
      const response = await ApiService.startVivaPayment({
        amount,
        merchantId: vivaConfig.merchantId,
        terminalId: vivaConfig.terminalId,
        orderReference,
      });

      const data = response?.data || response;

      if (!data || data.ok !== true) {
        console.error("Viva payment failed or returned non-ok response:", data);
        throw new Error(
          "Viva betaling mislukt. Controleer de terminal of probeer opnieuw."
        );
      }

      // Payment successful
      const result = {
        success: true,
        state: "APPROVED",
        message: "Viva betaling voltooid.",
        totalPaid: amount,
        cashAmount: 0,
        cardAmount: amount,
        changeDue: 0,
        details: data,
      };

      if (this.callbacks.onSuccess) {
        this.callbacks.onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error("Error while calling Viva payment endpoint:", error);

      const errorResult = {
        success: false,
        state: "ERROR",
        message:
          "Viva betaling mislukt. Controleer verbinding met server of Viva API.",
        details: { error: error.message },
      };

      if (this.callbacks.onError) {
        this.callbacks.onError(errorResult);
      }

      throw error;
    } finally {
      this.isProcessing = false;
      this.cleanup();
    }
  }

  /**
   * Check if payment is in progress
   */
  isPaymentInProgress() {
    return this.isProcessing;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.isProcessing = false;
    this.callbacks = {
      onStatusUpdate: null,
      onSuccess: null,
      onError: null,
    };
  }
}

// Export singleton instance
export const vivaService = new VivaService();
export default vivaService;
