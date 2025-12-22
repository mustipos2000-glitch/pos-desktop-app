const PaymentService = require('../services/PaymentService');
const EmailService = require('../services/EmailService');
const CashmaticService = require('../services/CashmaticService');
const fs = require('fs');
const path = require('path');
const net = require('net');

const PaymentController = {
  sessions: new Map(), // In-memory session store for Payworld payments

  // Process Cashmatic payment
  processCashmaticPayment: async (req, res) => {
      console.log("enter.....");

    try {      
      const { amount } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'amount should be greater then ' });
      }
      console.log("Sending to Cashmatic to start payment and sent the amount");

      const session = await CashmaticService.startPayment(amount);
      console.log("Session is : ", session);

      return res.json({ data: session });
    } catch (error) {
      console.error('Cashmatic startPayment error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get payment status (used by /cashmatic/status/:sessionId)
  getPaymentStatus: async (req, res) => {
    try {
      const { sessionId } = req.params;
      console.log("Getting payment status for sessionId:", sessionId);
      
      const result = await CashmaticService.getStatus(sessionId);
      console.log("Status result:", result);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      // CashmaticService.getStatus returns { state, requestedAmount, insertedAmount, etc. }
      res.json({ 
        success: true, 
        data: result 
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get payment status: ' + (error.message || 'Unknown error')
      });
    }
  },

  // Finish Cashmatic payment (close transaction and print receipt)
  finishCashmaticPayment: async (req, res) => {
    try {
      console.log("In side finish Cashmatic Payemnt machine ", req, res);
      
      const { sessionId } = req.params;
      console.log("Finishing Cashmatic payment for sessionId:", sessionId);

      const result = await CashmaticService.finishPayment(sessionId);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      res.json({ 
        success: true, 
        data: result 
      });
    } catch (error) {
      console.error('Finish Cashmatic payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to finish payment: ' + (error.message || 'Unknown error')
      });
    }
  },

  // Cancel Cashmatic payment
  cancelCashmaticPayment: async (req, res) => {
    try {
      const { sessionId } = req.params;
      console.log("Cancelling Cashmatic payment for sessionId:", sessionId);

      const result = await CashmaticService.cancelPayment(sessionId);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Session not found' 
        });
      }

      res.json({ 
        success: true, 
        data: result 
      });
    } catch (error) {
      console.error('Cancel Cashmatic payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to cancel payment: ' + (error.message || 'Unknown error')
      });
    }
  },


  async processPayworldPayment(req, res) {
    const { amount, cancel, sessionId } = req.body || {};

    const config = PaymentController.loadConfig();
    if (!config.ip || !config.port) {
      return res.status(500).json({
        ok: false,
        provider: "payworld",
        error:
          "Payworld config ontbreekt. Vul IP en poort in via Settings (Payworld).",
      });
    }

    // 🔴 ANNULEREN VANUIT POS
    if (cancel) {
      console.log("[Payworld] Cancel requested from POS.");
      try {
        if (sessionId) {
          PaymentController.updateSession(sessionId, {
            state: "CANCELLED",
            message: "Annuleren aangevraagd vanaf POS...",
            lastEvent: "POS_CANCEL",
          });
        }

        await PaymentController.sendAbort({
          ip: config.ip,
          port: config.port,
        });

        if (sessionId) {
          PaymentController.updateSession(sessionId, {
            state: "CANCELLED",
            message: "Transactie geannuleerd op terminal.",
            lastEvent: "POS_CANCEL_DONE",
          });
        }

        return res.json({
          ok: true,
          provider: "payworld",
          cancelled: true,
        });
      } catch (err) {
        console.error("[Payworld] ERROR while cancelling:", err);
        if (sessionId) {
          PaymentController.updateSession(sessionId, {
            state: "ERROR",
            message: "Fout bij annuleren op terminal.",
            lastEvent: "POS_CANCEL_ERROR",
            details: { error: err.message },
          });
        }
        return res.status(500).json({
          ok: false,
          provider: "payworld",
          error: "Fout bij annuleren op Payworld terminal.",
          details: err.message,
        });
      }
    }

    // 🔵 NORMALE BETALING STARTEN
    if (!amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        provider: "payworld",
        error: "Invalid amount for Payworld",
      });
    }

    const amountCents = Math.round(Number(amount) * 100);
    console.log("[Payworld] Start betaling:", amount, "=>", amountCents, "cents");

    const session = PaymentController.createSession(amountCents);

    // Background TCP-flow starten, HTTP-call direct antwoord geven
    PaymentController.processPayment({
      sessionId: session.id,
      ip: config.ip,
      port: config.port,
      amountCents,
      posId: config.posId || "2001",
      currencyCode: config.currencyCode || "978",
    }).catch((err) => {
      console.error("[Payworld] processPayment error (uncaught):", err);
      PaymentController.updateSession(session.id, {
        state: "ERROR",
        message: err.message || "Onbekende fout tijdens betaling.",
        lastEvent: "PROCESS_ERROR",
        details: { error: err.message },
      });
    });

    // POS krijgt meteen een sessionId terug en kan poll'en
    return res.json({
      ok: true,
      provider: "payworld",
      sessionId: session.id,
      amountInCents: amountCents,
    });
  },

  updateSession(id, patch) {
    const s = PaymentController.sessions.get(id);
    if (!s) return;
    Object.assign(s, patch, { lastUpdate: Date.now() });
  },

  getConfigPath() {
    return path.join(__dirname, "..", "config", "payworld.config.json");
  },

  sendAbort({ ip, port }) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();

      const xml = `<?xml version="1.0" encoding="utf-8"?>
<vcs-device:abortCardEntryNotification xmlns:vcs-device="http://www.vibbek.com/device">
  <abortCode>01</abortCode>
</vcs-device:abortCardEntryNotification>`;

      const xmlBytes = Buffer.from(xml, "utf8");
      const lenHeader = Buffer.alloc(4);
      lenHeader.writeUInt32BE(xmlBytes.length, 0);
      const payload = Buffer.concat([lenHeader, xmlBytes]);

      client.setTimeout(10000);

      client.connect(port, ip, () => {
        console.log(`[Payworld] Sending abortCardEntryNotification to ${ip}:${port}`);
        client.write(payload, () => {
          client.end();
          resolve({ ok: true });
        });
      });

      client.on("error", (err) => {
        client.destroy();
        reject(err);
      });

      client.on("timeout", () => {
        client.destroy();
        reject(new Error("Timeout while sending abort to Payworld"));
      });
    });
  },

  async processPayment({ sessionId, ip, port, amountCents, posId, currencyCode }) {
    console.log("Start Payment : " + sessionId, ip, amountCents, posId,currencyCode);
    
    try {
      PaymentController.updateSession(sessionId, {
        state: "IN_PROGRESS",
        message: "Verbinding met terminal wordt opgebouwd...",
        lastEvent: "CONNECTING",
      });
      console.log("Sending Financial Transcation with status ");
      
      const response = await PaymentController.sendFinancialTrxWithStatus({
        sessionId,
        ip,
        port,
        amountCents,
        posId,
        currencyCode,
      });

      if (response && typeof response.approved === "boolean") {
        PaymentController.updateSession(sessionId, {
          state: response.approved ? "APPROVED" : "DECLINED",
          message: response.approved
            ? "Transactie goedgekeurd."
            : response.error || "Transactie geweigerd.",
          lastEvent: response.approved ? "APPROVED" : "DECLINED",
          details: response,
        });
      }
    } catch (err) {
      console.error("[Payworld] processPayment caught error:", err);
      PaymentController.updateSession(sessionId, {
        state: "ERROR",
        message: err.message || "Onbekende fout tijdens betaling.",
        lastEvent: "ERROR",
        details: { error: err.message },
      });
    }
  },
  createSession(amountInCents) {
    const id = `${Date.now()
      } - ${Math.floor(Math.random() * 1e6)}`;
    const session = {
      id,
      amountInCents,
      state: "IN_PROGRESS", // IN_PROGRESS | APPROVED | DECLINED | CANCELLED | ERROR
      message: "Betaling gestart...",
      details: null,
      lastEvent: null,
      lastUpdate: Date.now(),
    };
    PaymentController.sessions.set(id, session);
    return session;
  },
  loadConfig() {
    try {
      const configPath = PaymentController.getConfigPath();
      if (!fs.existsSync(configPath)) {
        console.warn("[Payworld] payworld.config.json not found. Using defaults.");
        return {
          ip: "182.168.1.22",
          port: 50000,
          posId: "2001",
          currencyCode: "978",
        };
      }
      const raw = fs.readFileSync(configPath, "utf8");
      const parsed = JSON.parse(raw);
      return {
        ip: parsed.ip || "182.168.1.22",
        port: parsed.port || 50000,
        posId: parsed.posId || "2001",
        currencyCode: parsed.currencyCode || "978",
      };
    } catch (err) {
      console.error("[Payworld] Failed to load payworld.config.json:", err);
      return {
        ip: "182.168.1.22",
        port: 50000,
        posId: "2001",
        currencyCode: "978",
      };
    }
  },

  sendFinancialTrxWithStatus({
    sessionId,
    ip,
    port,
    amountCents,
    posId,
    currencyCode,
  }) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let buffer = Buffer.alloc(0);
      let resolved = false;

      PaymentController.trxSyncNumber =
        (PaymentController.trxSyncNumber + 1) % 1000000 || 1;
      const syncNumber = PaymentController.trxSyncNumber;

      const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <vcs-pos:financialTrxRequest xmlns:vcs-pos="http://www.vibbek.com/pos">
        <posId>${posId}</posId>
        <trxSyncNumber>${syncNumber}</trxSyncNumber>
        <trxData>
          <amount>${amountCents}</amount>
          <currency>${currencyCode}</currency>
          <transactionType>0</transactionType>
          <partialApprovalCap>1</partialApprovalCap>
          <noDCC>true</noDCC>
        </trxData>
        <trxInfo>AAAf</trxInfo>
        <receiptFormat>1</receiptFormat>
        <selectedLang>en</selectedLang>
      </vcs-pos:financialTrxRequest>`;

      const xmlBytes = Buffer.from(xml, "utf8");
      const lenHeader = Buffer.alloc(4);
      lenHeader.writeUInt32BE(xmlBytes.length, 0);
      const payload = Buffer.concat([lenHeader, xmlBytes]);

      client.setTimeout(60000);

      client.connect(port, ip, () => {
        console.log(`[Payworld] Connected to ${ip}:${port}`);
        PaymentController.updateSession(sessionId, {
          state: "IN_PROGRESS",
          message: "Verbonden. Wachten op kaart...",
          lastEvent: "CONNECTED",
        });
        client.write(payload);
      });

      client.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        processBuffer();
      });

      const processBuffer = () => {
        while (buffer.length >= 4) {
          const msgLen = buffer.readUInt32BE(0);
          if (buffer.length < 4 + msgLen) return;

          const xmlBytes = buffer.slice(4, 4 + msgLen);
          buffer = buffer.slice(4 + msgLen);
          const xmlString = xmlBytes.toString("utf8");

          console.log("[Payworld] Received frame XML:", xmlString);

          // abortNotification → klant/terminal heeft afgebroken
          if (
            xmlString.includes("vcs-device:trxAbortNotification") ||
            xmlString.includes("<trxAbortNotification")
          ) {
            console.log("[Payworld] trxAbortNotification ontvangen.");
            PaymentController.updateSession(sessionId, {
              state: "CANCELLED",
              message: "Klant of terminal heeft de transactie geannuleerd.",
              lastEvent: "TRX_ABORT",
            });
            if (!resolved) {
              resolved = true;
              client.destroy();
              resolve({
                approved: false,
                aborted: true,
                error: "Transactie geannuleerd op terminal (trxAbortNotification).",
                rawXml: xmlString,
              });
            }
            return;
          }

          // cardEntry / cardRemoval
          if (xmlString.includes("cardEntryNotification")) {
            const modeMatch = xmlString.match(/<cardEntryMode>(\d+)<\/cardEntryMode>/);
            let modeText = "kaart aangeboden";
            if (modeMatch) {
              const mode = parseInt(modeMatch[1], 10);
              if (mode === 0) modeText = "kaart aangeboden (magstripe)";
              else if (mode === 1) modeText = "kaart ingestoken (chip/contact)";
              else if (mode === 2) modeText = "kaart getapt (contactloos)";
            }
            PaymentController.updateSession(sessionId, {
              state: "IN_PROGRESS",
              message: `Wachten op autorisatie – ${modeText}.`,
              lastEvent: "CARD_ENTRY",
            });
          } else if (xmlString.includes("cardRemovalNotification")) {
            PaymentController.updateSession(sessionId, {
              state: "IN_PROGRESS",
              message: "Kaart verwijderd uit terminal.",
              lastEvent: "CARD_REMOVAL",
            });
          }

          // displayNotification
          if (xmlString.includes("displayNotification")) {
            const typeMatch = xmlString.match(/displayType="([^"]*)"/);
            const displayType = typeMatch ? typeMatch[1] : "CARDHOLDER";

            const lineRegex = /<line>(.*?)<\/line>/g;
            const lines = [];
            let m;
            while ((m = lineRegex.exec(xmlString)) !== null) {
              const line = (m[1] || "").trim();
              if (line) lines.push(line);
            }
            const text = lines.join(" | ") || "Bericht op terminal.";

            const prefix =
              displayType === "ATTENDANT"
                ? "[Personeel] "
                : "[Klant] ";

            PaymentController.updateSession(sessionId, {
              state: "IN_PROGRESS",
              message: prefix + text,
              lastEvent: "DISPLAY",
            });
          }

          // errorNotification
          if (xmlString.includes("errorNotification")) {
            PaymentController.updateSession(sessionId, {
              state: "ERROR",
              message: "Foutmelding vanuit terminal (errorNotification).",
              lastEvent: "ERROR_NOTIFICATION",
              details: { rawXml: xmlString },
            });
          }

          // financialTrxResponse (finale antwoord)
          const isFinancial =
            xmlString.includes("financialTrxResponse") ||
            xmlString.includes("<vcs-pos:financialTrxResponse");

          if (!isFinancial) {
            console.log("[Payworld] Non-financial message processed.");
            continue;
          }

          try {
            const parsed = PaymentController.parseFinancialTrxResponse(xmlString);
            if (!resolved) {
              resolved = true;
              client.destroy();
              resolve(parsed);
              return;
            }
          } catch (err) {
            if (!resolved) {
              resolved = true;
              client.destroy();
              reject(err);
              return;
            }
          }
        }
      };

      client.on("timeout", () => {
        if (!resolved) {
          resolved = true;
          client.destroy();
          reject(new Error("Timeout waiting for Payworld financialTrxResponse"));
        }
      });

      client.on("error", (err) => {
        if (!resolved) {
          resolved = true;
          client.destroy();
          reject(err);
        }
      });

      client.on("close", () => {
        if (!resolved) {
          resolved = true;
          reject(new Error("Connection closed before financialTrxResponse"));
        }
      });
    });
  },

  parseFinancialTrxResponse(xmlString) {
    const isFinancial =
      xmlString.includes("financialTrxResponse") ||
      xmlString.includes("<vcs-pos:financialTrxResponse");

    if (!isFinancial) {
      return {
        approved: false,
        error: "Onverwachte response van terminal (geen financialTrxResponse)",
        rawXml: xmlString,
      };
    }

    const getTag = (tag) => {
      const re = new RegExp(`<${tag}[^>] *> ([^<] *)</${tag} >`);
      const m = xmlString.match(re);
      return m ? m[1] : null;
    };

    const trxResultStr = getTag("trxResult");
    const ep2AuthResponseCode = getTag("ep2AuthResponseCode");
    const ep2AuthResultStr = getTag("ep2AuthResult");
    const ep2AuthCode = getTag("ep2AuthCode");
    const amountAuthStr = getTag("amountAuth");
    const transactionRefNumber = getTag("transactionRefNumber");
    const cardNumber = getTag("cardNumber");
    const cardAppLabel = getTag("cardAppLabel");
    const cardAppId = getTag("cardAppId");

    const trxResult = trxResultStr != null ? parseInt(trxResultStr, 10) : null;
    const ep2AuthResult =
      ep2AuthResultStr != null ? parseInt(ep2AuthResultStr, 10) : null;
    const amountAuth = amountAuthStr != null ? parseInt(amountAuthStr, 10) : null;

    const approved = trxResult === 0;

    let errorMessage = null;
    if (!approved) {
      errorMessage =
        `Transactie geweigerd (trxResult=${trxResult}, ep2AuthResult=${ep2AuthResult}, code=${ep2AuthResponseCode || "?"
        })`;
    }

    return {
      approved,
      trxResult,
      ep2AuthResult,
      ep2AuthResponseCode,
      ep2AuthCode,
      amountAuth,
      transactionRefNumber,
      cardNumber,
      cardAppLabel,
      cardAppId,
      rawXml: xmlString,
      error: errorMessage,
    };
  },

  // Get Payworld payment status
  getPayworldStatus: async (req, res) => {
    const { sessionId } = req.params || {};
    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: "Geen sessionId opgegeven.",
      });
    }
    const session = PaymentController.sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        ok: false,
        error: "Session niet gevonden.",
      });
    }
    return res.json({
      ok: true,
      id: session.id,
      state: session.state,
      message: session.message,
      details: session.details,
      lastEvent: session.lastEvent,
      lastUpdate: session.lastUpdate,
      amountInCents: session.amountInCents,
    });
  },

  // Cancel Payworld payment
  cancelPayworldPayment: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await PaymentService.cancelPayworldPayment(sessionId);

      if (result.success) {
        res.json({ success: true, message: 'Payworld payment cancelled successfully' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Cancel Payworld payment error:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel Payworld payment' });
    }
  },

  // Process Viva payment
  processVivaPayment: async (req, res) => {
    try {
      const { amount, merchantId, terminalId, orderReference } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      if (!merchantId || !terminalId) {
        return res.status(400).json({ error: 'Merchant ID and Terminal ID are required' });
      }

      console.log(`💳 Processing Viva payment: €${amount} `);

      // Note: Viva is currently a client-side integration
      // This endpoint exists for consistency but may need full implementation
      // For now, return a success response as the client handles the actual payment
      res.json({
        success: true,
        ok: true,
        message: 'Viva payment processed successfully',
        data: {
          amount,
          method: 'viva',
          status: 'completed',
          merchantId,
          terminalId,
          orderReference,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Viva payment error:', error);
      res.status(500).json({ success: false, ok: false, error: 'Failed to process Viva payment' });
    }
  },

  // Send receipt via email
  sendReceiptEmail: async (req, res) => {
    try {
      const receiptData = req.body;

      if (!receiptData.email) {
        return res.status(400).json({ success: false, error: 'Email address is required' });
      }

      console.log(`📧 Sending receipt to: ${receiptData.email} `);

      const result = await EmailService.sendReceiptEmail(receiptData);

      if (result.success) {
        res.json({
          success: true,
          message: 'Receipt sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Send receipt email error:', error);
      res.status(500).json({ success: false, error: 'Failed to send receipt email' });
    }
  }
};

module.exports = PaymentController;
