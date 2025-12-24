/**
 * PayworldController
 *
 * Praat met Vibbek / Payworld (Pax A35) via TCP:
 * - financialTrxRequest (betaling starten)
 * - abortCardEntryNotification (betaling annuleren)
 *
 * Extra:
 * - In-memory sessions zodat de POS live status kan poll'en:
 *   /payworld/status/:sessionId
 * - Config (IP/poort/posId/currency) in payworld.config.json
 */

const path = require("path");
const fs = require("fs");
const net = require("net");

class PayworldController {
  static trxSyncNumber = 1;
  static sessions = new Map(); // sessionId => { id, state, message, details, ... }

  // ---------- CONFIG ----------

  static getConfigPath() {
    return path.join(__dirname, "..", "config", "payworld.config.json");
  }

  static loadConfig() {
    try {
      const configPath = PayworldController.getConfigPath();
      if (!fs.existsSync(configPath)) {
        console.warn("[Payworld] payworld.config.json not found. Using defaults.");
        return {
          ip: "",
          port: 50000,
          posId: "2001",
          currencyCode: "978",
        };
      }
      const raw = fs.readFileSync(configPath, "utf8");
      const parsed = JSON.parse(raw);
      return {
        ip: parsed.ip || "",
        port: parsed.port || 50000,
        posId: parsed.posId || "2001",
        currencyCode: parsed.currencyCode || "978",
      };
    } catch (err) {
      console.error("[Payworld] Failed to load payworld.config.json:", err);
      return {
        ip: "",
        port: 50000,
        posId: "2001",
        currencyCode: "978",
      };
    }
  }

  static saveConfig(config) {
    const configPath = PayworldController.getConfigPath();
    const safeConfig = {
      ip: config.ip || "",
      port: Number(config.port) || 50000,
      posId: config.posId || "2001",
      currencyCode: config.currencyCode || "978",
    };
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(safeConfig, null, 2), "utf8");
    return safeConfig;
  }

  static getConfigHandler(req, res) {
    try {
      const cfg = PayworldController.loadConfig();
      return res.json({ ok: true, config: cfg });
    } catch (err) {
      console.error("[Payworld] getConfigHandler error:", err);
      return res.status(500).json({
        ok: false,
        error: "Kon Payworld-config niet lezen.",
      });
    }
  }

  static updateConfigHandler(req, res) {
    try {
      const { ip, port, posId, currencyCode } = req.body || {};
      const cfg = PayworldController.saveConfig({ ip, port, posId, currencyCode });
      return res.json({ ok: true, config: cfg });
    } catch (err) {
      console.error("[Payworld] updateConfigHandler error:", err);
      return res.status(500).json({
        ok: false,
        error: "Kon Payworld-config niet opslaan.",
      });
    }
  }

  // ---------- SESSIONS / STATUS ----------

  static createSession(amountInCents) {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const session = {
      id,
      amountInCents,
      state: "IN_PROGRESS", // IN_PROGRESS | APPROVED | DECLINED | CANCELLED | ERROR
      message: "Betaling gestart...",
      details: null,
      lastEvent: null,
      lastUpdate: Date.now(),
    };
    PayworldController.sessions.set(id, session);
    return session;
  }

  static updateSession(id, patch) {
    const s = PayworldController.sessions.get(id);
    if (!s) return;
    Object.assign(s, patch, { lastUpdate: Date.now() });
  }

  static async getStatus(req, res) {
    const { sessionId } = req.params || {};
    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: "Geen sessionId opgegeven.",
      });
    }
    const session = PayworldController.sessions.get(sessionId);
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
  }

  // ---------- ENTRYPOINT: START of CANCEL ----------

  /**
   * Eén endpoint:
   *  - start betaling: body { amount }
   *  - annuleren: body { cancel: true, sessionId? }
   */
  static async startPayment(req, res) {
    const { amount, cancel, sessionId } = req.body || {};

    const config = PayworldController.loadConfig();
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
          PayworldController.updateSession(sessionId, {
            state: "CANCELLED",
            message: "Annuleren aangevraagd vanaf POS...",
            lastEvent: "POS_CANCEL",
          });
        }

        await PayworldController.sendAbort({
          ip: config.ip,
          port: config.port,
        });

        if (sessionId) {
          PayworldController.updateSession(sessionId, {
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
          PayworldController.updateSession(sessionId, {
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

    const session = PayworldController.createSession(amountCents);

    // Background TCP-flow starten, HTTP-call direct antwoord geven
    PayworldController.processPayment({
      sessionId: session.id,
      ip: config.ip,
      port: config.port,
      amountCents,
      posId: config.posId || "2001",
      currencyCode: config.currencyCode || "978",
    }).catch((err) => {
      console.error("[Payworld] processPayment error (uncaught):", err);
      PayworldController.updateSession(session.id, {
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
  }

  // ---------- ACHTERGRONDFLOW ----------

  static async processPayment({ sessionId, ip, port, amountCents, posId, currencyCode }) {
    try {
      PayworldController.updateSession(sessionId, {
        state: "IN_PROGRESS",
        message: "Verbinding met terminal wordt opgebouwd...",
        lastEvent: "CONNECTING",
      });

      const response = await PayworldController.sendFinancialTrxWithStatus({
        sessionId,
        ip,
        port,
        amountCents,
        posId,
        currencyCode,
      });

      if (response && typeof response.approved === "boolean") {
        PayworldController.updateSession(sessionId, {
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
      PayworldController.updateSession(sessionId, {
        state: "ERROR",
        message: err.message || "Onbekende fout tijdens betaling.",
        lastEvent: "ERROR",
        details: { error: err.message },
      });
    }
  }

  /**
   * Stuur financialTrxRequest en verwerk alle inkomende frames.
   * Non-financial berichten updaten live de session-status.
   */
  static sendFinancialTrxWithStatus({
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

      PayworldController.trxSyncNumber =
        (PayworldController.trxSyncNumber + 1) % 1000000 || 1;
      const syncNumber = PayworldController.trxSyncNumber;

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
        PayworldController.updateSession(sessionId, {
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
            PayworldController.updateSession(sessionId, {
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
            PayworldController.updateSession(sessionId, {
              state: "IN_PROGRESS",
              message: `Wachten op autorisatie – ${modeText}.`,
              lastEvent: "CARD_ENTRY",
            });
          } else if (xmlString.includes("cardRemovalNotification")) {
            PayworldController.updateSession(sessionId, {
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

            PayworldController.updateSession(sessionId, {
              state: "IN_PROGRESS",
              message: prefix + text,
              lastEvent: "DISPLAY",
            });
          }

          // errorNotification
          if (xmlString.includes("errorNotification")) {
            PayworldController.updateSession(sessionId, {
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
            const parsed = PayworldController.parseFinancialTrxResponse(xmlString);
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
  }

  /**
   * abortCardEntryNotification (POS → terminal)
   */
  static sendAbort({ ip, port }) {
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
  }

  /**
   * Parse financialTrxResponse (simple regex)
   */
  static parseFinancialTrxResponse(xmlString) {
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
      const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
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
        `Transactie geweigerd (trxResult=${trxResult}, ep2AuthResult=${ep2AuthResult}, code=${ep2AuthResponseCode || "?"})`;
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
  }
}

module.exports = PayworldController;
