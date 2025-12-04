// import ApiService from './api';

// /**
//  * @fileoverview CashmaticService - A standalone service for managing Cashmatic payment machine integration
//  * 
//  * @description
//  * The CashmaticService provides a clean, callback-based API for interacting with Cashmatic
//  * payment machines. It handles all aspects of payment processing including:
//  * - Payment session initialization
//  * - Automatic status polling
//  * - Currency conversion (euros ↔ cents)
//  * - State management
//  * - Error handling and retry logic
//  * - Callback-based event notifications
//  * 
//  * @example
//  * // Basic usage in a React component
//  * import { cashmaticService } from '../services/cashmaticService';
//  * 
//  * const handlePayment = async () => {
//  *   const result = await cashmaticService.startPayment(50.00, {
//  *     onStatusUpdate: (status) => {
//  *       console.log('Payment status:', status.state);
//  *       console.log('Inserted:', status.insertedAmount, 'euros');
//  *     },
//  *     onSuccess: (result) => {
//  *       console.log('Payment complete!');
//  *       console.log('Total paid:', result.totalPaid);
//  *       console.log('Change:', result.change);
//  *     },
//  *     onCancelled: (info) => {
//  *       console.log('Payment cancelled:', info.reason);
//  *     },
//  *     onError: (error) => {
//  *       console.error('Payment error:', error.message);
//  *     }
//  *   });
//  * 
//  *   if (!result.success) {
//  *     console.error('Failed to start payment:', result.error);
//  *   }
//  * };
//  * 
//  * @example
//  * // Creating a custom instance for multiple concurrent sessions
//  * import { CashmaticService } from '../services/cashmaticService';
//  * 
//  * const customService = new CashmaticService();
//  * await customService.startPayment(25.50, callbacks);
//  * 
//  * @example
//  * // Cancelling a payment
//  * const handleCancel = () => {
//  *   if (cashmaticService.isActive()) {
//  *     cashmaticService.stopPayment();
//  *   }
//  * };
//  * 
//  * @example
//  * // Checking payment status
//  * const status = cashmaticService.getStatus();
//  * if (status) {
//  *   console.log('Current state:', status.state);
//  *   console.log('Amount inserted:', status.insertedAmount);
//  * }
//  */

// /**
//  * @typedef {Object} PaymentStatus
//  * @description Normalized payment status object with all amounts in euros
//  * @property {string} sessionId - Unique session identifier
//  * @property {string} state - Current payment state (IDLE, IN_PROGRESS, RUNNING, PAID, FINISHED, CANCELLED, ERROR, FAILED)
//  * @property {number} requestedAmount - Amount requested in euros
//  * @property {number} insertedAmount - Amount inserted so far in euros
//  * @property {number} dispensedAmount - Change dispensed in euros
//  * @property {number} notDispensedAmount - Change not dispensed in euros
//  * @property {number} change - Calculated change amount (insertedAmount - requestedAmount)
//  * @property {boolean} isPaid - True if state is PAID
//  * @property {boolean} isComplete - True if state is terminal (PAID, CANCELLED, ERROR, FAILED, FINISHED)
//  * @property {boolean} isError - True if state is ERROR or FAILED
//  */

// /**
//  * @typedef {Object} PaymentResult
//  * @description Payment completion result passed to onSuccess callback
//  * @property {string} sessionId - Unique session identifier
//  * @property {number} totalPaid - Total amount paid in euros
//  * @property {number} change - Change amount in euros
//  * @property {number} requestedAmount - Original requested amount in euros
//  */

// /**
//  * @typedef {Object} CancellationInfo
//  * @description Cancellation information passed to onCancelled callback
//  * @property {string} sessionId - Unique session identifier
//  * @property {string} reason - Reason for cancellation (e.g., "Payment stopped by user")
//  */

// /**
//  * @typedef {Object} PaymentError
//  * @description Error object passed to onError callback
//  * @property {string|null} sessionId - Session identifier (null if error occurred before session creation)
//  * @property {string} type - Error type: 'network', 'api', 'validation', 'polling', 'session'
//  * @property {string} message - Human-readable error message
//  * @property {Error|null} originalError - Original error object from the underlying failure
//  * @property {Object} context - Additional context information about the error
//  * @property {string} timestamp - ISO 8601 timestamp when the error occurred
//  */

// /**
//  * @callback OnStatusUpdateCallback
//  * @description Called on each status update during payment polling (approximately every 1 second)
//  * @param {PaymentStatus} status - Current payment status with normalized data
//  * @returns {void}
//  * 
//  * @example
//  * const onStatusUpdate = (status) => {
//  *   console.log(`State: ${status.state}`);
//  *   console.log(`Inserted: €${status.insertedAmount} / €${status.requestedAmount}`);
//  *   updateUI(status);
//  * };
//  */

// /**
//  * @callback OnSuccessCallback
//  * @description Called when payment completes successfully (state becomes PAID)
//  * @param {PaymentResult} result - Payment completion details
//  * @returns {void}
//  * 
//  * @example
//  * const onSuccess = (result) => {
//  *   console.log(`Payment complete! Total: €${result.totalPaid}, Change: €${result.change}`);
//  *   completeOrder(result);
//  *   closePaymentModal();
//  * };
//  */

// /**
//  * @callback OnCancelledCallback
//  * @description Called when payment is cancelled (state becomes CANCELLED or stopPayment is called)
//  * @param {CancellationInfo} info - Cancellation details
//  * @returns {void}
//  * 
//  * @example
//  * const onCancelled = (info) => {
//  *   console.log(`Payment cancelled: ${info.reason}`);
//  *   showMessage('Payment was cancelled');
//  *   closePaymentModal();
//  * };
//  */

// /**
//  * @callback OnErrorCallback
//  * @description Called when an error occurs during payment processing
//  * @param {PaymentError} error - Detailed error information
//  * @returns {void}
//  * 
//  * @example
//  * const onError = (error) => {
//  *   console.error(`Payment error [${error.type}]: ${error.message}`);
//  *   if (error.type === 'network') {
//  *     showMessage('Network error. Please check your connection.');
//  *   } else {
//  *     showMessage(`Payment failed: ${error.message}`);
//  *   }
//  *   closePaymentModal();
//  * };
//  */

// /**
//  * @typedef {Object} PaymentCallbacks
//  * @description Callback functions for payment events
//  * @property {OnStatusUpdateCallback} [onStatusUpdate] - Called on each status update
//  * @property {OnSuccessCallback} [onSuccess] - Called when payment succeeds
//  * @property {OnCancelledCallback} [onCancelled] - Called when payment is cancelled
//  * @property {OnErrorCallback} [onError] - Called on error
//  */

// /**
//  * CashmaticService class - Manages Cashmatic payment sessions, polling, and state
//  * 
//  * @class
//  * @description
//  * This service provides a clean, callback-based API for initiating payments,
//  * monitoring status, and handling completion or errors. It manages polling
//  * internally and converts between euros and cents automatically.
//  * 
//  * The service follows a singleton pattern by default (exported as `cashmaticService`),
//  * but the class can also be instantiated directly for custom use cases requiring
//  * multiple independent payment sessions.
//  */
// class CashmaticService {
//   constructor() {
//     // Session identifier from the backend
//     this.sessionId = null;
    
//     // Polling interval reference
//     this.pollingInterval = null;
    
//     // Current payment status
//     this.currentStatus = null;
    
//     // Callback functions
//     this.callbacks = {
//       onStatusUpdate: null,
//       onSuccess: null,
//       onCancelled: null,
//       onError: null
//     };
    
//     // Retry logic for network errors
//     this.retryCount = 0;
//     this.maxRetries = 3;
//   }

//   /**
//    * Start a new Cashmatic payment session
//    * 
//    * @description
//    * Initiates a new payment session with the Cashmatic machine. This method:
//    * 1. Validates the payment amount
//    * 2. Checks for existing active sessions
//    * 3. Converts euros to cents for API communication
//    * 4. Calls the backend API to start the session
//    * 5. Begins automatic polling for status updates
//    * 6. Invokes callbacks as the payment progresses
//    * 
//    * Only one payment session can be active per service instance at a time.
//    * If a session is already active, this method will return an error.
//    * 
//    * @param {number} amount - Payment amount in euros (e.g., 50.00 for €50)
//    *                          Must be a positive number greater than zero.
//    * @param {Object} callbacks - Object containing callback functions for payment events
//    * @param {Function} [callbacks.onStatusUpdate] - Called on each status update (every ~1 second)
//    *                                                 Receives a normalized status object with payment details
//    * @param {Function} [callbacks.onSuccess] - Called when payment completes successfully (state: PAID)
//    *                                           Receives payment result with totalPaid, change, etc.
//    * @param {Function} [callbacks.onCancelled] - Called when payment is cancelled (state: CANCELLED)
//    *                                             Receives cancellation info with sessionId and reason
//    * @param {Function} [callbacks.onError] - Called when an error occurs during payment
//    *                                         Receives error object with type, message, and context
//    * 
//    * @returns {Promise<Object>} Result object with the following structure:
//    * @returns {boolean} returns.success - True if payment session started successfully, false otherwise
//    * @returns {string} [returns.sessionId] - Unique session identifier (present when success is true)
//    * @returns {string} [returns.error] - Human-readable error message (present when success is false)
//    * @returns {Object} [returns.errorDetails] - Detailed error object (present when success is false)
//    * 
//    * @throws {Error} Does not throw - all errors are returned in the result object
//    * 
//    * @example
//    * // Start a payment with all callbacks
//    * const result = await cashmaticService.startPayment(50.00, {
//    *   onStatusUpdate: (status) => {
//    *     console.log(`State: ${status.state}, Inserted: €${status.insertedAmount}`);
//    *   },
//    *   onSuccess: (result) => {
//    *     console.log(`Payment complete! Change: €${result.change}`);
//    *     completeOrder();
//    *   },
//    *   onCancelled: (info) => {
//    *     console.log('Payment cancelled by user');
//    *   },
//    *   onError: (error) => {
//    *     console.error(`Payment error: ${error.message}`);
//    *   }
//    * });
//    * 
//    * if (result.success) {
//    *   console.log('Payment started, session:', result.sessionId);
//    * } else {
//    *   console.error('Failed to start:', result.error);
//    * }
//    * 
//    * @example
//    * // Handle validation errors
//    * const result = await cashmaticService.startPayment(-10, callbacks);
//    * // result.success === false
//    * // result.error === "Amount must be a positive number greater than zero"
//    * 
//    * @example
//    * // Handle active session error
//    * await cashmaticService.startPayment(50, callbacks);
//    * const result2 = await cashmaticService.startPayment(30, callbacks);
//    * // result2.success === false
//    * // result2.error === "A payment session is already active..."
//    */
//   async startPayment(amount, callbacks) {
//     // Validate amount is greater than zero
//     if (typeof amount !== 'number' || amount <= 0) {
//       const validationError = this._createError(
//         'validation',
//         'Amount must be a positive number greater than zero',
//         null,
//         { amount }
//       );
//       return {
//         success: false,
//         error: validationError.message,
//         errorDetails: validationError
//       };
//     }

//     // Check if session is already active
//     if (this.isActive()) {
//       const validationError = this._createError(
//         'validation',
//         'A payment session is already active. Please stop the current session first.',
//         null,
//         { activeSessionId: this.sessionId }
//       );
//       return {
//         success: false,
//         error: validationError.message,
//         errorDetails: validationError
//       };
//     }

//     // Convert euros to cents
//     const amountInCents = this._convertEurosToCents(amount);

//     try {
//       // Call ApiService.startCashmaticPayment
//       const response = await ApiService.startCashmaticPayment({
//         amount: amountInCents
//       });

//       // Validate response has sessionId
//       if (!response.data || !response.data.sessionId) {
//         const apiError = this._createError(
//           'api',
//           'Invalid response from server: missing sessionId',
//           null,
//           { response }
//         );
//         return {
//           success: false,
//           error: apiError.message,
//           errorDetails: apiError
//         };
//       }

//       // Store sessionId and callbacks
//       this.sessionId = response.data.sessionId;
//       this.callbacks = {
//         onStatusUpdate: callbacks.onStatusUpdate || null,
//         onSuccess: callbacks.onSuccess || null,
//         onCancelled: callbacks.onCancelled || null,
//         onError: callbacks.onError || null
//       };

//       // Start polling
//       this._startPolling();

//       // Return success result
//       return {
//         success: true,
//         sessionId: this.sessionId
//       };
//     } catch (error) {
//       // Determine error type and create descriptive error object
//       const errorObj = this._handleApiError(error, 'startPayment');
      
//       return {
//         success: false,
//         error: errorObj.message,
//         errorDetails: errorObj
//       };
//     }
//   }

//   /**
//    * Stop the current payment session and polling
//    * 
//    * @description
//    * Immediately stops the active payment session and cleans up all resources:
//    * 1. Stops the polling interval
//    * 2. Invokes the onCancelled callback (if provided)
//    * 3. Clears all session state
//    * 4. Allows starting a new payment immediately after
//    * 
//    * This method is idempotent - calling it multiple times has no additional
//    * effect beyond the first call. It's safe to call even when no session is active.
//    * 
//    * Note: This method does NOT communicate with the backend to cancel the payment
//    * on the Cashmatic machine itself. It only stops the client-side polling and
//    * state management.
//    * 
//    * @returns {void} This method does not return a value
//    * 
//    * @example
//    * // Cancel payment when user clicks cancel button
//    * const handleCancelClick = () => {
//    *   cashmaticService.stopPayment();
//    *   // onCancelled callback will be invoked automatically
//    * };
//    * 
//    * @example
//    * // Safe to call multiple times
//    * cashmaticService.stopPayment();
//    * cashmaticService.stopPayment(); // No error, no side effects
//    * 
//    * @example
//    * // Safe to call when no session is active
//    * if (cashmaticService.isActive()) {
//    *   cashmaticService.stopPayment();
//    * }
//    * // Or simply:
//    * cashmaticService.stopPayment(); // Works either way
//    */
//   stopPayment() {
//     // Handle multiple calls gracefully (idempotent)
//     // If there's no active session, just return without error
//     if (!this.isActive()) {
//       return;
//     }

//     // Store sessionId for callback before clearing state
//     const stoppedSessionId = this.sessionId;
    
//     // Stop polling immediately
//     this._stopPolling();

//     // Invoke onCancelled callback if provided
//     if (this.callbacks.onCancelled) {
//       this.callbacks.onCancelled({
//         sessionId: stoppedSessionId,
//         reason: 'Payment stopped by user'
//       });
//     }

//     // Clear session state
//     this._reset();
    
//     // After reset, the service is ready to start a new payment
//   }

//   /**
//    * Get the current payment status
//    * 
//    * @description
//    * Returns the most recent payment status received from the Cashmatic machine.
//    * The status object is updated automatically during polling (approximately every 1 second).
//    * 
//    * The returned status object contains normalized data with amounts converted to euros
//    * and additional computed fields for convenience.
//    * 
//    * @returns {Object|null} Current status object with payment details, or null if no active session
//    * @returns {string} returns.sessionId - Unique session identifier
//    * @returns {string} returns.state - Current payment state (IDLE, IN_PROGRESS, RUNNING, PAID, FINISHED, CANCELLED, ERROR, FAILED)
//    * @returns {number} returns.requestedAmount - Amount requested in euros
//    * @returns {number} returns.insertedAmount - Amount inserted so far in euros
//    * @returns {number} returns.dispensedAmount - Change dispensed in euros
//    * @returns {number} returns.notDispensedAmount - Change not dispensed in euros
//    * @returns {number} returns.change - Calculated change amount (insertedAmount - requestedAmount)
//    * @returns {boolean} returns.isPaid - True if state is PAID
//    * @returns {boolean} returns.isComplete - True if state is terminal (PAID, CANCELLED, ERROR, FAILED, FINISHED)
//    * @returns {boolean} returns.isError - True if state is ERROR or FAILED
//    * 
//    * @example
//    * // Display current payment status
//    * const status = cashmaticService.getStatus();
//    * if (status) {
//    *   console.log(`State: ${status.state}`);
//    *   console.log(`Requested: €${status.requestedAmount}`);
//    *   console.log(`Inserted: €${status.insertedAmount}`);
//    *   console.log(`Change: €${status.change}`);
//    * } else {
//    *   console.log('No active payment session');
//    * }
//    * 
//    * @example
//    * // Check if payment is complete
//    * const status = cashmaticService.getStatus();
//    * if (status && status.isComplete) {
//    *   if (status.isPaid) {
//    *     console.log('Payment successful!');
//    *   } else if (status.isError) {
//    *     console.log('Payment failed');
//    *   }
//    * }
//    */
//   getStatus() {
//     return this.currentStatus;
//   }

//   /**
//    * Check if a payment session is currently active
//    * 
//    * @description
//    * Returns true if there is an active payment session with polling in progress.
//    * A session is considered active from the moment startPayment succeeds until
//    * the payment reaches a terminal state (PAID, CANCELLED, ERROR, FAILED) or
//    * stopPayment is called.
//    * 
//    * Use this method to:
//    * - Prevent starting multiple concurrent sessions
//    * - Conditionally show/hide payment UI
//    * - Determine if stopPayment needs to be called
//    * 
//    * @returns {boolean} True if a payment session is active, false otherwise
//    * 
//    * @example
//    * // Prevent starting a new payment while one is active
//    * if (cashmaticService.isActive()) {
//    *   alert('A payment is already in progress');
//    *   return;
//    * }
//    * await cashmaticService.startPayment(amount, callbacks);
//    * 
//    * @example
//    * // Conditionally render payment modal
//    * const showPaymentModal = cashmaticService.isActive();
//    * 
//    * @example
//    * // Clean up on component unmount
//    * useEffect(() => {
//    *   return () => {
//    *     if (cashmaticService.isActive()) {
//    *       cashmaticService.stopPayment();
//    *     }
//    *   };
//    * }, []);
//    */
//   isActive() {
//     return this.sessionId !== null;
//   }

//   /**
//    * Start polling for payment status
//    * 
//    * @private
//    * @description
//    * Initiates automatic polling of the payment status at 1-second intervals.
//    * Clears any existing polling interval before starting a new one.
//    * Performs an immediate poll before starting the interval.
//    * 
//    * @returns {void}
//    */
//   _startPolling() {
//     // Clear any existing polling interval
//     if (this.pollingInterval) {
//       clearInterval(this.pollingInterval);
//     }

//     // Start polling with 1-second interval
//     this.pollingInterval = setInterval(() => {
//       this._poll();
//     }, 1000);

//     // Do an immediate poll
//     this._poll();
//   }

//   /**
//    * Stop polling and clear interval
//    * 
//    * @private
//    * @description
//    * Stops the automatic polling by clearing the interval timer.
//    * Safe to call multiple times - only clears if an interval exists.
//    * 
//    * @returns {void}
//    */
//   _stopPolling() {
//     if (this.pollingInterval) {
//       clearInterval(this.pollingInterval);
//       this.pollingInterval = null;
//     }
//   }

//   /**
//    * Poll the backend for current payment status
//    * 
//    * @private
//    * @description
//    * Fetches the current payment status from the backend API and handles the response.
//    * Implements retry logic for network errors (up to 3 retries).
//    * Stops polling and invokes error callback if:
//    * - Session ID is invalid (404 error)
//    * - Maximum retry count is exceeded
//    * 
//    * @returns {Promise<void>}
//    */
//   async _poll() {
//     // Don't poll if there's no active session
//     if (!this.sessionId) {
//       return;
//     }

//     try {
//       // Fetch status from API
//       const response = await ApiService.getCashmaticStatus(this.sessionId);
      
//       // Reset retry count on successful response
//       this.retryCount = 0;
      
//       // Handle the status update (will validate data inside)
//       this._handleStatusUpdate(response.data);
//     } catch (error) {
//       // Increment retry count
//       this.retryCount++;

//       // Determine if this is an invalid sessionId error (typically 404)
//       const isInvalidSession = error.message && (
//         error.message.includes('404') || 
//         error.message.includes('not found') ||
//         error.message.includes('invalid session')
//       );

//       // If invalid session, stop immediately without retrying
//       if (isInvalidSession) {
//         this._stopPolling();
        
//         const errorObj = this._createError(
//           'session',
//           'Invalid or expired session ID',
//           error,
//           { sessionId: this.sessionId }
//         );
        
//         if (this.callbacks.onError) {
//           this.callbacks.onError(errorObj);
//         }
        
//         // Reset state
//         this._reset();
//         return;
//       }

//       // If we've exceeded max retries, stop polling and invoke error callback
//       if (this.retryCount >= this.maxRetries) {
//         this._stopPolling();
        
//         const errorObj = this._createError(
//           'polling',
//           `Failed to fetch payment status after ${this.maxRetries} retries`,
//           error,
//           { sessionId: this.sessionId, retryCount: this.retryCount }
//         );
        
//         if (this.callbacks.onError) {
//           this.callbacks.onError(errorObj);
//         }
        
//         // Reset state
//         this._reset();
//       }
//       // Otherwise, we'll retry on the next polling interval
//     }
//   }

//   /**
//    * Handle a status update from the backend
//    * 
//    * @private
//    * @description
//    * Processes raw status data from the API:
//    * 1. Validates the status object
//    * 2. Converts amounts from cents to euros
//    * 3. Calculates change amount
//    * 4. Normalizes the status object with computed fields
//    * 5. Invokes onStatusUpdate callback
//    * 6. Detects terminal states and stops polling
//    * 7. Invokes appropriate terminal callback (onSuccess, onCancelled, onError)
//    * 8. Resets state after terminal callback
//    * 
//    * @param {Object} rawStatus - Raw status object from API with amounts in cents
//    * @param {string} rawStatus.state - Payment state
//    * @param {number} rawStatus.requestedAmount - Requested amount in cents
//    * @param {number} rawStatus.insertedAmount - Inserted amount in cents
//    * @param {number} rawStatus.dispensedAmount - Dispensed amount in cents
//    * @param {number} rawStatus.notDispensedAmount - Not dispensed amount in cents
//    * @returns {void}
//    */
//   _handleStatusUpdate(rawStatus) {
//     // Validate rawStatus has required fields
//     if (!rawStatus || typeof rawStatus !== 'object') {
//       const errorObj = this._createError(
//         'api',
//         'Invalid status update received from server',
//         null,
//         { rawStatus }
//       );
      
//       if (this.callbacks.onError) {
//         this.callbacks.onError(errorObj);
//       }
      
//       this._stopPolling();
//       this._reset();
//       return;
//     }

//     // Convert amounts from cents to euros
//     const requestedAmount = this._convertCentsToEuros(rawStatus.requestedAmount || 0);
//     const insertedAmount = this._convertCentsToEuros(rawStatus.insertedAmount || 0);
//     const dispensedAmount = this._convertCentsToEuros(rawStatus.dispensedAmount || 0);
//     const notDispensedAmount = this._convertCentsToEuros(rawStatus.notDispensedAmount || 0);

//     // Calculate change amount
//     const change = insertedAmount > requestedAmount ? insertedAmount - requestedAmount : 0;

//     // Normalize status object with all required fields
//     const normalizedStatus = {
//       sessionId: this.sessionId,
//       state: rawStatus.state || 'IDLE',
//       requestedAmount,
//       insertedAmount,
//       dispensedAmount,
//       notDispensedAmount,
//       change,
//       isPaid: rawStatus.state === 'PAID',
//       isComplete: ['PAID', 'CANCELLED', 'ERROR', 'FAILED', 'FINISHED'].includes(rawStatus.state),
//       isError: ['ERROR', 'FAILED'].includes(rawStatus.state)
//     };

//     // Update current status
//     this.currentStatus = normalizedStatus;

//     // Invoke onStatusUpdate callback
//     if (this.callbacks.onStatusUpdate) {
//       this.callbacks.onStatusUpdate(normalizedStatus);
//     }

//     // Detect terminal states and stop polling
//     if (normalizedStatus.isComplete) {
//       this._stopPolling();

//       // Invoke appropriate terminal callback
//       if (normalizedStatus.state === 'PAID') {
//         if (this.callbacks.onSuccess) {
//           this.callbacks.onSuccess({
//             sessionId: this.sessionId,
//             totalPaid: insertedAmount,
//             change: change,
//             requestedAmount: requestedAmount
//           });
//         }
//       } else if (normalizedStatus.state === 'CANCELLED') {
//         if (this.callbacks.onCancelled) {
//           this.callbacks.onCancelled({
//             sessionId: this.sessionId,
//             reason: 'Payment was cancelled'
//           });
//         }
//       } else if (normalizedStatus.isError) {
//         const errorObj = this._createError(
//           'api',
//           `Payment failed with state: ${normalizedStatus.state}`,
//           null,
//           { state: normalizedStatus.state, rawStatus }
//         );
        
//         if (this.callbacks.onError) {
//           this.callbacks.onError(errorObj);
//         }
//       }

//       // Reset state after terminal callback
//       this._reset();
//     }
//   }

//   /**
//    * Convert cents to euros
//    * 
//    * @private
//    * @description
//    * Converts an amount from cents to euros by dividing by 100.
//    * Handles zero values explicitly to avoid unnecessary division.
//    * 
//    * @param {number} cents - Amount in cents (e.g., 5000 for €50.00)
//    * @returns {number} Amount in euros (e.g., 50.00)
//    * 
//    * @example
//    * _convertCentsToEuros(5000) // Returns 50.00
//    * _convertCentsToEuros(0)    // Returns 0
//    * _convertCentsToEuros(125)  // Returns 1.25
//    */
//   _convertCentsToEuros(cents) {
//     if (cents === 0) {
//       return 0;
//     }
//     return cents / 100;
//   }

//   /**
//    * Convert euros to cents
//    * 
//    * @private
//    * @description
//    * Converts an amount from euros to cents by multiplying by 100 and rounding.
//    * Uses Math.round to handle floating-point precision issues.
//    * Handles zero values explicitly to avoid unnecessary multiplication.
//    * 
//    * @param {number} euros - Amount in euros (e.g., 50.00 for €50)
//    * @returns {number} Amount in cents (e.g., 5000)
//    * 
//    * @example
//    * _convertEurosToCents(50.00)  // Returns 5000
//    * _convertEurosToCents(0)      // Returns 0
//    * _convertEurosToCents(1.25)   // Returns 125
//    * _convertEurosToCents(10.999) // Returns 1100 (rounded)
//    */
//   _convertEurosToCents(euros) {
//     if (euros === 0) {
//       return 0;
//     }
//     return Math.round(euros * 100);
//   }

//   /**
//    * Reset internal state
//    * 
//    * @private
//    * @description
//    * Clears all internal state to prepare for a new payment session:
//    * - Clears session ID
//    * - Clears current status
//    * - Clears all callbacks
//    * - Resets retry count
//    * 
//    * Called automatically after terminal states or when stopPayment is invoked.
//    * 
//    * @returns {void}
//    */
//   _reset() {
//     this.sessionId = null;
//     this.currentStatus = null;
//     this.callbacks = {
//       onStatusUpdate: null,
//       onSuccess: null,
//       onCancelled: null,
//       onError: null
//     };
//     this.retryCount = 0;
//   }

//   /**
//    * Create a descriptive error object
//    * 
//    * @private
//    * @description
//    * Creates a standardized error object with consistent structure for all error types.
//    * Includes session ID, error type, message, original error, context, and timestamp.
//    * 
//    * @param {string} type - Error type: 'network', 'api', 'validation', 'polling', 'session'
//    * @param {string} message - Human-readable error message
//    * @param {Error|null} [originalError=null] - Original error object from the underlying failure
//    * @param {Object} [context={}] - Additional context information (e.g., operation, status code)
//    * @returns {PaymentError} Structured error object
//    * 
//    * @example
//    * const error = this._createError(
//    *   'network',
//    *   'Unable to reach server',
//    *   originalError,
//    *   { operation: 'startPayment' }
//    * );
//    */
//   _createError(type, message, originalError = null, context = {}) {
//     return {
//       sessionId: this.sessionId,
//       type,
//       message,
//       originalError,
//       context,
//       timestamp: new Date().toISOString()
//     };
//   }

//   /**
//    * Handle API errors and create descriptive error objects
//    * 
//    * @private
//    * @description
//    * Analyzes API errors and creates appropriate error objects with descriptive messages.
//    * Handles different error types:
//    * - Network errors (connection failures, timeouts)
//    * - HTTP errors (404, 400, 500, 503, etc.)
//    * - Generic API errors
//    * 
//    * Provides user-friendly error messages based on error type and HTTP status code.
//    * 
//    * @param {Error} error - The error from the API call
//    * @param {string} operation - The operation that failed (e.g., 'startPayment', 'poll')
//    * @returns {PaymentError} Structured error object with appropriate type and message
//    * 
//    * @example
//    * try {
//    *   await ApiService.startCashmaticPayment(data);
//    * } catch (error) {
//    *   const errorObj = this._handleApiError(error, 'startPayment');
//    *   // errorObj.type might be 'network', 'api', 'session', or 'validation'
//    *   // errorObj.message contains user-friendly description
//    * }
//    */
//   _handleApiError(error, operation) {
//     // Check if it's a network error (API unreachable)
//     if (error.message && (
//       error.message.includes('Failed to fetch') ||
//       error.message.includes('NetworkError') ||
//       error.message.includes('Network request failed') ||
//       error.name === 'TypeError'
//     )) {
//       return this._createError(
//         'network',
//         'Unable to reach the Cashmatic server. Please check your network connection.',
//         error,
//         { operation }
//       );
//     }

//     // Check if it's an HTTP error
//     if (error.message && error.message.includes('HTTP error')) {
//       const statusMatch = error.message.match(/status: (\d+)/);
//       const status = statusMatch ? parseInt(statusMatch[1]) : null;

//       // Handle specific HTTP status codes
//       if (status === 404) {
//         return this._createError(
//           'session',
//           'Session not found or has expired',
//           error,
//           { operation, status }
//         );
//       } else if (status === 400) {
//         return this._createError(
//           'validation',
//           'Invalid request data sent to server',
//           error,
//           { operation, status }
//         );
//       } else if (status === 500) {
//         return this._createError(
//           'api',
//           'Server error occurred while processing payment',
//           error,
//           { operation, status }
//         );
//       } else if (status === 503) {
//         return this._createError(
//           'api',
//           'Cashmatic service is temporarily unavailable',
//           error,
//           { operation, status }
//         );
//       } else {
//         return this._createError(
//           'api',
//           `Server returned error status: ${status}`,
//           error,
//           { operation, status }
//         );
//       }
//     }

//     // Generic API error
//     return this._createError(
//       'api',
//       error.message || 'An unexpected error occurred while communicating with the server',
//       error,
//       { operation }
//     );
//   }
// }

// /**
//  * Default CashmaticService instance
//  * 
//  * @description
//  * A singleton instance of CashmaticService for simple use cases.
//  * This is the recommended way to use the service for most applications.
//  * 
//  * Use this instance when you only need one payment session at a time.
//  * For multiple concurrent sessions, create separate instances using
//  * `new CashmaticService()`.
//  * 
//  * @type {CashmaticService}
//  * @constant
//  * 
//  * @example
//  * // Import and use the default instance
//  * import cashmaticService from '../services/cashmaticService';
//  * 
//  * await cashmaticService.startPayment(50.00, callbacks);
//  * 
//  * @example
//  * // Check if active before starting
//  * if (!cashmaticService.isActive()) {
//  *   await cashmaticService.startPayment(amount, callbacks);
//  * }
//  */
// const cashmaticService = new CashmaticService();

// /**
//  * @exports cashmaticService
//  * @default
//  * @description Default singleton instance of CashmaticService
//  */
// export default cashmaticService;

// /**
//  * @exports CashmaticService
//  * @description CashmaticService class for creating custom instances
//  * 
//  * @example
//  * // Create a custom instance for a specific use case
//  * import { CashmaticService } from '../services/cashmaticService';
//  * 
//  * const kioskService = new CashmaticService();
//  * await kioskService.startPayment(25.00, callbacks);
//  * 
//  * @example
//  * // Multiple concurrent sessions (different instances)
//  * const service1 = new CashmaticService();
//  * const service2 = new CashmaticService();
//  * 
//  * await service1.startPayment(50.00, callbacks1);
//  * await service2.startPayment(30.00, callbacks2);
//  */
// export { CashmaticService };
