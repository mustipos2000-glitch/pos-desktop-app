import { CashmaticService } from './cashmaticService';
import ApiService from './api';

// Property-Based Tests using fast-check
import fc from 'fast-check';

// Mock ApiService
jest.mock('./api');

describe('CashmaticService Error Handling', () => {
  let service;

  beforeEach(() => {
    service = new CashmaticService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.stopPayment();
    jest.useRealTimers();
  });

  describe('Validation Errors', () => {
    test('should reject invalid amount (zero)', async () => {
      const result = await service.startPayment(0, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('positive number');
      expect(result.errorDetails.type).toBe('validation');
    });

    test('should reject invalid amount (negative)', async () => {
      const result = await service.startPayment(-10, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('positive number');
      expect(result.errorDetails.type).toBe('validation');
    });

    test('should reject invalid amount (non-numeric)', async () => {
      const result = await service.startPayment('invalid', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('positive number');
      expect(result.errorDetails.type).toBe('validation');
    });

    test('should reject when session already active', async () => {
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session-1' }
      });

      await service.startPayment(50, {});
      const result = await service.startPayment(50, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already active');
      expect(result.errorDetails.type).toBe('validation');
    });
  });

  describe('Network Errors', () => {
    test('should handle network error (API unreachable)', async () => {
      const networkError = new TypeError('Failed to fetch');
      ApiService.startCashmaticPayment.mockRejectedValue(networkError);

      const result = await service.startPayment(50, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('network connection');
      expect(result.errorDetails.type).toBe('network');
    });

    test('should handle network error during polling', (done) => {
      const onError = jest.fn((error) => {
        try {
          expect(error).toMatchObject({
            type: 'polling',
            message: expect.stringContaining('3 retries')
          });
          done();
        } catch (e) {
          done(e);
        }
      });
      
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session' }
      });
      
      const networkError = new TypeError('Failed to fetch');
      ApiService.getCashmaticStatus.mockRejectedValue(networkError);

      service.startPayment(50, { onError }).then(() => {
        // Trigger polling 3 times to exceed max retries
        jest.advanceTimersByTime(3000);
      });
    });
  });

  describe('API Errors', () => {
    test('should handle 404 error (invalid sessionId)', async () => {
      const onError = jest.fn();
      
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session' }
      });
      
      const notFoundError = new Error('HTTP error! status: 404');
      ApiService.getCashmaticStatus.mockRejectedValue(notFoundError);

      await service.startPayment(50, { onError });
      
      // Advance timers to trigger polling
      jest.advanceTimersByTime(1000);
      // Need multiple promise resolution cycles for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session',
          message: expect.stringContaining('Invalid or expired')
        })
      );
    });

    test('should handle 500 error (server error)', async () => {
      const serverError = new Error('HTTP error! status: 500');
      ApiService.startCashmaticPayment.mockRejectedValue(serverError);

      const result = await service.startPayment(50, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error');
      expect(result.errorDetails.type).toBe('api');
    });

    test('should handle missing sessionId in response', async () => {
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: {} // Missing sessionId
      });

      const result = await service.startPayment(50, {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('missing sessionId');
      expect(result.errorDetails.type).toBe('api');
    });

    test('should handle invalid status update', async () => {
      const onError = jest.fn();
      
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session' }
      });
      
      ApiService.getCashmaticStatus.mockResolvedValue({
        data: null // Invalid data
      });

      await service.startPayment(50, { onError });
      
      // Advance timers to trigger polling
      jest.advanceTimersByTime(1000);
      // Need multiple promise resolution cycles for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api',
          message: expect.stringContaining('Invalid status update')
        })
      );
    });
  });

  describe('Error Object Structure', () => {
    test('should create error with all required fields', async () => {
      const result = await service.startPayment(0, {});
      
      expect(result.errorDetails).toHaveProperty('type');
      expect(result.errorDetails).toHaveProperty('message');
      expect(result.errorDetails).toHaveProperty('timestamp');
      expect(result.errorDetails).toHaveProperty('context');
    });

    test('should include sessionId in error when available', async () => {
      const onError = jest.fn();
      
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session-123' }
      });
      
      const error = new Error('HTTP error! status: 404');
      ApiService.getCashmaticStatus.mockRejectedValue(error);

      await service.startPayment(50, { onError });
      
      // Advance timers to trigger polling
      jest.advanceTimersByTime(1000);
      // Need multiple promise resolution cycles for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session-123'
        })
      );
    });
  });

  describe('Error State Handling', () => {
    test('should handle ERROR state from API', async () => {
      const onError = jest.fn();
      
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session' }
      });
      
      ApiService.getCashmaticStatus.mockResolvedValue({
        data: {
          state: 'ERROR',
          requestedAmount: 5000,
          insertedAmount: 0,
          dispensedAmount: 0,
          notDispensedAmount: 0
        }
      });

      await service.startPayment(50, { onError });
      
      // Advance timers to trigger polling
      jest.advanceTimersByTime(1000);
      // Need multiple promise resolution cycles for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api',
          message: expect.stringContaining('ERROR')
        })
      );
    });

    test('should handle FAILED state from API', async () => {
      const onError = jest.fn();
      
      ApiService.startCashmaticPayment.mockResolvedValue({
        data: { sessionId: 'test-session' }
      });
      
      ApiService.getCashmaticStatus.mockResolvedValue({
        data: {
          state: 'FAILED',
          requestedAmount: 5000,
          insertedAmount: 2000,
          dispensedAmount: 0,
          notDispensedAmount: 0
        }
      });

      await service.startPayment(50, { onError });
      
      // Advance timers to trigger polling
      jest.advanceTimersByTime(1000);
      // Need multiple promise resolution cycles for async operations
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api',
          message: expect.stringContaining('FAILED')
        })
      );
    });
  });
});

describe('Property-Based Tests', () => {
  let service;

  beforeEach(() => {
    service = new CashmaticService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.stopPayment();
    jest.useRealTimers();
  });

  /**
   * Feature: cashmatic-service-extraction, Property 5: State consistency
   * Validates: Requirements 4.3
   */
  test('Property 5: State consistency - change equals inserted minus requested', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 100, max: 1000000 }), // requestedAmount in cents
        fc.integer({ min: 100, max: 1000000 }), // insertedAmount in cents
        async (requestedCents, insertedCents) => {
          // Create a raw status object as it would come from the API
          const rawStatus = {
            state: 'IN_PROGRESS',
            requestedAmount: requestedCents,
            insertedAmount: insertedCents,
            dispensedAmount: 0,
            notDispensedAmount: 0
          };

          // Mock the API to return this status
          ApiService.startCashmaticPayment.mockResolvedValue({
            data: { sessionId: 'test-session' }
          });
          
          ApiService.getCashmaticStatus.mockResolvedValue({
            data: rawStatus
          });

          // Start payment and capture status update
          let capturedStatus = null;
          const onStatusUpdate = (status) => {
            capturedStatus = status;
          };

          await service.startPayment(50, { onStatusUpdate });
          
          // Trigger one poll and wait for it to complete
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
          await Promise.resolve();
          
          // Verify the status was captured
          expect(capturedStatus).not.toBeNull();
          
          // Convert cents to euros for comparison
          const requestedEuros = requestedCents / 100;
          const insertedEuros = insertedCents / 100;
          
          // Property: change should equal inserted minus requested when inserted > requested
          if (insertedEuros > requestedEuros) {
            const expectedChange = insertedEuros - requestedEuros;
            // Allow for floating point precision issues
            expect(Math.abs(capturedStatus.change - expectedChange)).toBeLessThan(0.01);
          } else {
            // When inserted <= requested, change should be 0
            expect(capturedStatus.change).toBe(0);
          }
          
          // Clean up
          service.stopPayment();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: cashmatic-service-extraction, Property 8: Status normalization
   * Validates: Requirements 4.1, 4.2, 4.4
   */
  test('Property 8: Status normalization - all required fields present with correct types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000000 }), // requestedAmount in cents
        fc.integer({ min: 0, max: 1000000 }), // insertedAmount in cents
        fc.integer({ min: 0, max: 100000 }),  // dispensedAmount in cents
        fc.integer({ min: 0, max: 100000 }),  // notDispensedAmount in cents
        fc.constantFrom('IDLE', 'IN_PROGRESS', 'RUNNING', 'PAID', 'FINISHED', 'CANCELLED', 'ERROR', 'FAILED'),
        async (requestedCents, insertedCents, dispensedCents, notDispensedCents, state) => {
          // Create a raw status object as it would come from the API
          const rawStatus = {
            state,
            requestedAmount: requestedCents,
            insertedAmount: insertedCents,
            dispensedAmount: dispensedCents,
            notDispensedAmount: notDispensedCents
          };

          // Mock the API to return this status
          ApiService.startCashmaticPayment.mockResolvedValue({
            data: { sessionId: 'test-session-norm' }
          });
          
          ApiService.getCashmaticStatus.mockResolvedValue({
            data: rawStatus
          });

          // Start payment and capture status update
          let capturedStatus = null;
          const onStatusUpdate = (status) => {
            capturedStatus = status;
          };

          await service.startPayment(50, { onStatusUpdate });
          
          // Trigger one poll and wait for it to complete
          jest.advanceTimersByTime(1000);
          await Promise.resolve();
          await Promise.resolve();
          
          // Verify the status was captured
          expect(capturedStatus).not.toBeNull();
          
          // Property: All required fields must be present
          expect(capturedStatus).toHaveProperty('sessionId');
          expect(capturedStatus).toHaveProperty('state');
          expect(capturedStatus).toHaveProperty('requestedAmount');
          expect(capturedStatus).toHaveProperty('insertedAmount');
          expect(capturedStatus).toHaveProperty('dispensedAmount');
          expect(capturedStatus).toHaveProperty('notDispensedAmount');
          expect(capturedStatus).toHaveProperty('change');
          expect(capturedStatus).toHaveProperty('isPaid');
          expect(capturedStatus).toHaveProperty('isComplete');
          expect(capturedStatus).toHaveProperty('isError');
          
          // Property: All fields must have correct types
          expect(typeof capturedStatus.sessionId).toBe('string');
          expect(typeof capturedStatus.state).toBe('string');
          expect(typeof capturedStatus.requestedAmount).toBe('number');
          expect(typeof capturedStatus.insertedAmount).toBe('number');
          expect(typeof capturedStatus.dispensedAmount).toBe('number');
          expect(typeof capturedStatus.notDispensedAmount).toBe('number');
          expect(typeof capturedStatus.change).toBe('number');
          expect(typeof capturedStatus.isPaid).toBe('boolean');
          expect(typeof capturedStatus.isComplete).toBe('boolean');
          expect(typeof capturedStatus.isError).toBe('boolean');
          
          // Property: Amounts must be converted from cents to euros
          expect(capturedStatus.requestedAmount).toBe(requestedCents / 100);
          expect(capturedStatus.insertedAmount).toBe(insertedCents / 100);
          expect(capturedStatus.dispensedAmount).toBe(dispensedCents / 100);
          expect(capturedStatus.notDispensedAmount).toBe(notDispensedCents / 100);
          
          // Property: State-dependent boolean flags must be correct
          expect(capturedStatus.isPaid).toBe(state === 'PAID');
          expect(capturedStatus.isComplete).toBe(['PAID', 'CANCELLED', 'ERROR', 'FAILED', 'FINISHED'].includes(state));
          expect(capturedStatus.isError).toBe(['ERROR', 'FAILED'].includes(state));
          
          // Clean up
          service.stopPayment();
        }
      ),
      { numRuns: 100 }
    );
  });
});
