const PaymentTerminal = require('../models/PaymentTerminal');
const PaymentService = require('../services/PaymentService');

const PaymentTerminalController = {
  getAllTerminals: (req, res) => {
    try {
      const terminals = PaymentTerminal.getAll();
      res.json({ data: terminals });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getTerminalById: (req, res) => {
    try {
      const id = req.params.id;
      const terminal = PaymentTerminal.getById(id);
      if (!terminal) {
        return res.status(404).json({ error: 'Payment terminal not found' });
      }
      res.json({ data: terminal });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createTerminal: (req, res) => {
    try {
      const payload = req.body;
      
      // Validate connection string format
      const validationError = validateConnectionString(payload.connection_string, payload.connection_type);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
      
      const terminal = PaymentTerminal.create(payload);
      res.json({ data: terminal });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  updateTerminal: (req, res) => {
    try {
      const id = req.params.id;
      const payload = req.body;
      
      // Validate connection string format
      const validationError = validateConnectionString(payload.connection_string, payload.connection_type);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const terminal = PaymentTerminal.update(id, payload);
      if (!terminal) {
        return res.status(404).json({ error: 'Payment terminal not found' });
      }
      res.json({ data: terminal });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deleteTerminal: (req, res) => {
    try {
      const id = req.params.id;
      const success = PaymentTerminal.delete(id);
      if (!success) {
        return res.status(404).json({ error: 'Payment terminal not found' });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Test terminal connection
  testTerminal: async (req, res) => {
    try {
      const id = req.params.id;
      const terminal = PaymentTerminal.getById(id);
      
      if (!terminal) {
        return res.status(404).json({ error: 'Payment terminal not found' });
      }
      
      console.log(`🧪 Testing ${terminal.type} terminal: ${terminal.name}`);
      
      const result = await PaymentService.testTerminalConnection(terminal);
      
      if (result.success) {
        res.json({ success: true, message: 'Terminal connection successful' });
      } else {
        res.status(500).json({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Test terminal error:', error);
      res.status(500).json({ success: false, error: 'Failed to test terminal' });
    }
  }
};

/**
 * Validate connection string format
 */
function validateConnectionString(connectionString, connectionType) {
  if (!connectionString || typeof connectionString !== 'string') {
    return 'Connection string must be a non-empty string';
  }

  const trimmed = connectionString.trim();
  
  if (connectionType === 'tcp') {
    // TCP format: tcp://192.168.1.100:9100 or 192.168.1.100:9100
    const tcpPattern = /^(tcp:\/\/)?[\d\.]+:\d+$/;
    if (!tcpPattern.test(trimmed)) {
      return 'Invalid TCP connection string. Format: tcp://IP:PORT or IP:PORT';
    }
  } else if (connectionType === 'serial') {
    // Serial format: COM3 or /dev/ttyUSB0
    const serialPattern = /^(COM\d+|\/dev\/(ttyUSB|ttyACM|ttyS)\d+)$/i;
    if (!serialPattern.test(trimmed)) {
      return 'Invalid serial connection string. Format: COM3 or /dev/ttyUSB0';
    }
  } else if (connectionType === 'api') {
    // API format: http://... or https://...
    const apiPattern = /^https?:\/\/.+/;
    if (!apiPattern.test(trimmed)) {
      return 'Invalid API connection string. Format: http://... or https://...';
    }
  }
  
  return null; // No error
}

module.exports = PaymentTerminalController;
