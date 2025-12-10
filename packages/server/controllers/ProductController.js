// const Product = require('../models/Product');
// const db = require('../config/database');
// const fs = require('fs');
// const path = require('path');
// const InventoryHelper = require('../helpers/InventoryHelpers');

// const ProductController = {

//   getAllProducts: (req, res) => {
//     try {
//       const products = Product.getAll();

//       const updatedProducts = products.map((p) => ({
//         ...p,
//         available_qty: InventoryHelper.getAvailableQty(p.id)
//       }));

//       res.json({ data: updatedProducts });
//     } catch (err) {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   },

//   getProductById: (req, res) => {
//     try {
//       const id = req.params.id;
//       const product = Product.getById(id);

//       if (!product) {
//         return res.status(404).json({ error: 'Product not found' });
//       }

//       res.json({ data: product });
//     } catch (err) {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   },

//   createProduct: (req, res) => {
//     try {
//       const payload = req.body;

//       if (!payload.name) {
//         return res.status(400).json({ error: 'Name is required' });
//       }

//       if (req.file) {
//         payload.image = `/uploads/${req.file.filename}`;
//       }

//       if (payload.category_id) {
//         const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(payload.category_id);
//         if (!category) {
//           return res.status(404).json({ error: 'category does not exist' });
//         }
//       }

//       if (typeof payload.vat_takeout === 'undefined') payload.vat_takeout = 0;
//       if (typeof payload.vat_eat_in === 'undefined') payload.vat_eat_in = 0;

//       const product = Product.create(payload);
//       res.status(201).json({ message: 'Product created successfully', data: product });
//     } catch (error) {
//       res.status(500).json({
//         error: 'Internal server error',
//         details: error.message,
//       });
//     }
//   },

//   updateProduct: (req, res) => {
//     try {
//       const id = req.params.id;
//       const payload = req.body;

//       if (!payload.name) {
//         return res.status(400).json({ error: 'Name is required' });
//       }

//       const existingProduct = Product.getById(id);
//       if (!existingProduct) {
//         return res.status(404).json({ error: 'Product not found' });
//       }

//       if (payload.category_id) {
//         const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(payload.category_id);
//         if (!category) {
//           return res.status(404).json({ error: 'category does not exist' });
//         }
//       }

//       if (req.file) {
//         if (existingProduct.image) {
//           const oldImagePath = path.join(__dirname, '../../', existingProduct.image);
//           if (fs.existsSync(oldImagePath)) {
//             fs.unlinkSync(oldImagePath);
//           }
//         }

//         payload.image = `/uploads/${req.file.filename}`;
//       } else {
//         payload.image = existingProduct.image;
//       }

//       const product = Product.update(id, payload);
//       res.status(200).json({ message: 'Product updated successfully', data: product });
//     } catch (err) {
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   },

//   deleteProduct: (req, res) => {
//     try {
//       const id = req.params.id;
//       const product = Product.getById(id);

//       if (!product) {
//         return res.status(404).json({ error: 'Product not found' });
//       }

//       Product.delete(id);
//       res.json({ message: 'Product deleted successfully' });
//     } catch (err) {
//       if (err.message && (err.message.includes('FOREIGN KEY constraint failed') || err.message.includes('sub-product'))) {
//         return res.status(400).json({
//           error: err.message || 'Cannot delete product due to related records.',
//         });
//       }

//       res.status(500).json({ error: err.message });
//     }
//   }

// };

// module.exports = ProductController;

const Product = require('../models/Product');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const InventoryHelper = require('../helpers/InventoryHelpers');

const ProductController = {

  // GET all products
  getAllProducts: (req, res) => {
    try {
      const products = Product.getAll();

      const updatedProducts = products.map((p) => ({
        ...p,
        available_qty: InventoryHelper.getAvailableQty(p.id)
      }));

      res.json({ data: updatedProducts });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET product by ID
  getProductById: (req, res) => {
    try {
      const id = req.params.id;
      const product = Product.getById(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // attach available quantity
      product.available_qty = InventoryHelper.getAvailableQty(product.id);

      res.json({ data: product });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // CREATE product
  createProduct: (req, res) => {
    try {
      const payload = req.body;

      if (!payload.name) return res.status(400).json({ error: 'Name is required' });

      if (req.file) payload.image = `/uploads/${req.file.filename}`;

      if (payload.category_id) {
        const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(payload.category_id);
        if (!category) return res.status(404).json({ error: 'Category does not exist' });
      }

      if (typeof payload.vat_takeout === 'undefined') payload.vat_takeout = 0;
      if (typeof payload.vat_eat_in === 'undefined') payload.vat_eat_in = 0;

      const product = Product.create(payload);
      res.status(201).json({ message: 'Product created successfully', data: product });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  // UPDATE product
  updateProduct: (req, res) => {
    try {
      const id = req.params.id;
      const payload = req.body;

      if (!payload.name) return res.status(400).json({ error: 'Name is required' });

      const existingProduct = Product.getById(id);
      if (!existingProduct) return res.status(404).json({ error: 'Product not found' });

      if (payload.category_id) {
        const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(payload.category_id);
        if (!category) return res.status(404).json({ error: 'Category does not exist' });
      }

      if (req.file) {
        if (existingProduct.image) {
          const oldImagePath = path.join(__dirname, '../../', existingProduct.image);
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
        payload.image = `/uploads/${req.file.filename}`;
      } else {
        payload.image = existingProduct.image;
      }

      const product = Product.update(id, payload);
      res.status(200).json({ message: 'Product updated successfully', data: product });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // DELETE product
  deleteProduct: (req, res) => {
    try {
      const id = req.params.id;
      const product = Product.getById(id);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      Product.delete(id);
      res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      if (err.message && (err.message.includes('FOREIGN KEY constraint failed') || err.message.includes('sub-product'))) {
        return res.status(400).json({ error: err.message || 'Cannot delete product due to related records.' });
      }
      res.status(500).json({ error: err.message });
    }
  },

  // Get On-Hold Order by ID (with available qty validation)
  getHoldOrderById: (req, res) => {
    try {
      const orderId = req.params.id;
      const holdOrder = db.prepare('SELECT * FROM orders WHERE id = ? AND status = "on-hold"').get(orderId);

      if (!holdOrder) return res.status(404).json({ error: 'Hold order not found' });

      const details = db.prepare(`
        SELECT od.*, p.name, p.id as product_id
        FROM order_details od
        JOIN products p ON p.id = od.product_id
        WHERE od.order_id = ?
      `).all(orderId);

      // Add available_qty and validate each product
      const validatedDetails = details.map((item) => {
        const availableQty = InventoryHelper.getAvailableQty(item.product_id);
        return {
          ...item,
          available_qty: availableQty,
          warning: item.qty > availableQty ? 'Quantity exceeds available stock' : null
        };
      });

      res.json({
        data: {
          ...holdOrder,
          details: validatedDetails
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

};

module.exports = ProductController;

