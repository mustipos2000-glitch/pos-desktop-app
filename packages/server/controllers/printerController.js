const Printer = require('../models/Printer');

const PrinterController = {
  getAllPrinters: (req, res) => {
    try {
      const printers = Printer.getAll();
      res.json({ data: printers });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getPrinterById: (req, res) => {
    try {
      const id = req.params.id;
      const printer = Printer.getById(id);
      if (!printer) {
        return res.status(404).json({ error: 'Printer not found' });
      }
      res.json({ data: printer });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  createPrinter: (req, res) => {
    try {
      const payload = req.body;
      if (!payload.name || !payload.type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const printer = Printer.create(payload);
      res.status(201).json({ message: 'Printer created successfully', data: printer });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  updatePrinter: (req, res) => {
    try {
      const id = req.params.id;
      const payload = req.body;
      if (!payload.name || !payload.type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }

      const existingPrinter = Printer.getById(id);
      if (!existingPrinter) {
        return res.status(404).json({ error: 'Printer not found' });
      }

      const printer = Printer.update(id, payload);
      res.status(200).json({ message: 'Printer updated successfully', data: printer });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  deletePrinter: (req, res) => {
    try {
      const id = req.params.id;
      const printer = Printer.getById(id);

      if (!printer) {
        return res.status(404).json({ error: 'Printer not found' });
      }

      Printer.delete(id);
      res.json({ message: 'Printer deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = PrinterController;
