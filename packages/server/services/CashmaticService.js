// CashmaticService.js - horeca POS integration (no kiosk)
// Uses Cashmatic 460 HTTPS API

const https = require('https');
const axios = require('axios');
const { readConfig } = require('../config/cashmaticConfig');

// In-memory sessions: sessionId -> { token, amount, state, createdAt, insertedAmount }
const sessions = new Map();

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

class CashmaticService {
  static getConfiguredIp() {
    const cfg = readConfig();
    return cfg.ip || '192.168.1.58';
  }

  static getBaseUrl() {
    const ip = this.getConfiguredIp();
    return `https://${ip}:50301`;
  }

  static getHttpClient() {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // self-signed certificate on Cashmatic
    });

    return axios.create({
      httpsAgent,
      timeout: 5000,
    });
  }

  static async login() {
    const client = this.getHttpClient();
    const baseUrl = this.getBaseUrl();
    const cfg = readConfig();
    console.log("inside the Login ");
    const res = await client.post(`${baseUrl}/api/user/Login`, {
      username: cfg.username || 'cp',
      password: cfg.password || '1235',
    });

    const data = res.data || {};
    console.log('Cashmatic login response raw:', data);

    const token =
      data.token ||
      data.accessToken ||
      data.jwt ||
      data.bearer ||
      data.Token ||
      (data.data && (data.data.token || data.data.accessToken || data.data.jwt)) ||
      (typeof data === 'string' ? data : null);

    if (!token) {
      const keys = Object.keys(data || {});
      throw new Error(
        `No token in Cashmatic login response. Got keys: [${keys.join(', ')}]`
      );
    }

    return token;
  }

  static async startPayment(amountInCents) {
    console.log("inside start Payment Amount in Cents is ", amountInCents);

    const token = await this.login();
    const client = this.getHttpClient();
    const baseUrl = this.getBaseUrl();
    console.log("Token", token, "client : ", client, " Base Url ", baseUrl);

    const body = {
      reason: 'POS payment',
      reference: `POS-${Date.now()}`,
      amount: amountInCents,
      queueAllowed: false,
    };

    await client.post(`${baseUrl}/api/transaction/StartPayment`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("api/transcation/startPayment", body, " Base URL : ", baseUrl, " Token : ", token);
    const sessionId = generateSessionId();
    sessions.set(sessionId, {
      token,
      amount: amountInCents,
      state: 'IN_PROGRESS',
      createdAt: Date.now(),
      insertedAmount: 0,
    });
    console.log("Session Id", sessionId);
    return { sessionId };
  }

  static async getStatus(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const client = this.getHttpClient();
    const baseUrl = this.getBaseUrl();

    try {
      const res = await client.post(
        `${baseUrl}/api/device/ActiveTransaction`,
        null,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );

      const body = res.data || {};
      console.log('Cashmatic ActiveTransaction raw:', JSON.stringify(body, null, 2));

      const data = body.data || body;

      // No data at all: treat as end of transaction, re-use session state
      if (!data || (Object.keys(data).length === 0 && data.constructor === Object)) {
        if (session.state === 'FINISHED' || session.state === 'FINISHED_MANUAL') {
          return {
            state: session.state,
            requestedAmount: session.amount,
            insertedAmount: session.insertedAmount || session.amount,
            dispensedAmount: session.dispensedAmount || 0,
            notDispensedAmount: session.notDispensedAmount || 0,
            rawStatus: 'NO_DATA',
          };
        } else if (session.state === 'PAID') {
          return {
            state: 'PAID',
            requestedAmount: session.amount,
            insertedAmount: session.insertedAmount || session.amount,
            dispensedAmount: session.dispensedAmount || 0,
            notDispensedAmount: session.notDispensedAmount || 0,
            rawStatus: 'NO_DATA',
          };
        } else if (session.state === 'CANCELLED') {
          return {
            state: 'CANCELLED',
            requestedAmount: session.amount,
            insertedAmount: session.insertedAmount || 0,
            dispensedAmount: session.dispensedAmount || 0,
            notDispensedAmount: session.notDispensedAmount || 0,
            rawStatus: 'NO_DATA',
          };
        } else {
          session.state = 'CANCELLED';
          sessions.set(sessionId, session);
          return {
            state: 'CANCELLED',
            requestedAmount: session.amount,
            insertedAmount: session.insertedAmount || 0,
            dispensedAmount: session.dispensedAmount || 0,
            notDispensedAmount: session.notDispensedAmount || 0,
            rawStatus: 'NO_DATA',
          };
        }
      }

      // FIX: Use correct API field names from documentation
      const requestedRaw = typeof data.requested !== 'undefined' ? data.requested : session.amount;
      const insertedRaw = typeof data.inserted !== 'undefined' ? data.inserted : 0;

      let requested = Number(requestedRaw);
      let inserted = Number(insertedRaw);

      if (!Number.isFinite(requested) || requested <= 0) {
        requested = session.amount;
      }
      if (!Number.isFinite(inserted) || inserted < 0) {
        inserted = 0;
      }

      const dispensedRaw = typeof data.dispensed !== 'undefined' ? data.dispensed : 0;
      const notDispensedRaw = typeof data.notDispensed !== 'undefined' ? data.notDispensed : 0;

      const dispensed = Number(dispensedRaw) || 0;
      const notDispensed = Number(notDispensedRaw) || 0;

      const operation = (data.operation || body.operation || '').toString().toUpperCase();
      const rawStatus = (data.status || body.status || '').toString().toUpperCase();

      console.log(`[Cashmatic] Session ${sessionId}: operation="${operation}", status="${rawStatus}", requested=${requested}, inserted=${inserted}, dispensed=${dispensed}, notDispensed=${notDispensed}`);

      // Store latest monetary info in session (for the "no data" fallback)
      session.amount = requested;
      session.insertedAmount = inserted;
      session.dispensedAmount = dispensed;
      session.notDispensedAmount = notDispensed;

      let state = session.state || 'IN_PROGRESS';
      console.log(`[Cashmatic] Current session state: ${state}`);

      if (operation && operation !== 'IDLE') {
        // Transaction is still running
        console.log(`[Cashmatic] Operation is active: ${operation}`);
        if (requested > 0 && inserted >= requested) {
          // Money fully inserted, waiting for change
          console.log('[Cashmatic] Payment complete, waiting for change dispensing...');
          state = 'PAID';
        } else {
          console.log('[Cashmatic] Payment in progress...');
          state = 'IN_PROGRESS';
        }
      } else {
        // Operation is IDLE => transaction finished on the device
        console.log('[Cashmatic] Operation is IDLE - transaction ending');
        if (requested > 0 && inserted >= requested) {
          // Payment was completed successfully
          console.log('[Cashmatic] Payment amount satisfied, marking as FINISHED');
          if (notDispensed > 0) {
            // Device could not dispense all change – manual change required
            console.log(`[Cashmatic] Manual change required: ${notDispensed}`);
            state = 'FINISHED_MANUAL';
          } else {
            console.log('[Cashmatic] Change dispensed successfully');
            state = 'FINISHED';
          }
        } else if (session.state === 'PAID' && inserted >= requested) {
          // Was in PAID state and money is complete, now IDLE = transaction finished
          console.log('[Cashmatic] Transitioning from PAID to FINISHED');
          if (notDispensed > 0) {
            state = 'FINISHED_MANUAL';
          } else {
            state = 'FINISHED';
          }
        } else if (
          rawStatus.includes('CANCEL') ||
          rawStatus.includes('ABORT') ||
          rawStatus.includes('STOP')
        ) {
          console.log('[Cashmatic] Transaction cancelled');
          state = 'CANCELLED';
        } else if (
          rawStatus.includes('ERROR') ||
          rawStatus.includes('FAIL')
        ) {
          console.log('[Cashmatic] Transaction error');
          state = 'ERROR';
        } else if (session.state === 'PAID') {
          // If we were in PAID state, don't revert to CANCELLED
          // Keep checking until we get proper completion
          console.log('[Cashmatic] Still in PAID state, waiting for completion...');
          state = 'PAID';
        } else {
          // Only mark as cancelled if payment wasn't completed
          if (inserted < requested) {
            console.log('[Cashmatic] Insufficient payment, marking as CANCELLED');
            state = 'CANCELLED';
          } else {
            // Payment amount was met, mark as finished
            console.log('[Cashmatic] Payment satisfied in IDLE, marking as FINISHED');
            state = notDispensed > 0 ? 'FINISHED_MANUAL' : 'FINISHED';
          }
        }
      }

      console.log(`[Cashmatic] New state: ${state}`);
      session.state = state;
      sessions.set(sessionId, session);

      return {
        state,
        requestedAmount: requested,
        insertedAmount: inserted,
        dispensedAmount: dispensed,
        notDispensedAmount: notDispensed,
        rawStatus,
      };
    } catch (err) {
      console.error('Cashmatic getStatus error:', err.message || err);
      return {
        state: 'ERROR',
        requestedAmount: session.amount,
        insertedAmount: 0,
        dispensedAmount: 0,
        notDispensedAmount: 0,
        errorMessage: 'Error communicating with Cashmatic: ' + (err.message || 'Unknown error'),
      };
    }
  }
  static async finishPayment(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const client = this.getHttpClient();
    const baseUrl = this.getBaseUrl();

    try {
      console.log('Calling Cashmatic CommitPayment API...');
      await client.post(
        `${baseUrl}/api/transaction/CommitPayment`,
        null,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );
      
      console.log('Cashmatic CommitPayment successful');
    } catch (err) {
      console.error('Cashmatic finishPayment error:', err.message || err);
      // Don't throw - payment was successful, just log the error
    }

    // Clean up session
    sessions.delete(sessionId);

    return {
      state: 'FINISHED',
      success: true,
    };
  }

  static async cancelPayment(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const client = this.getHttpClient();
    const baseUrl = this.getBaseUrl();

    try {
      await client.post(
        `${baseUrl}/api/transaction/CancelPayment`,
        null,
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      );
    } catch (err) {
      console.error('Cashmatic cancelPayment error:', err.message || err);
    }

    session.state = 'CANCELLED';
    sessions.set(sessionId, session);

    return {
      state: 'CANCELLED',
    };
  }
}

module.exports = CashmaticService;
