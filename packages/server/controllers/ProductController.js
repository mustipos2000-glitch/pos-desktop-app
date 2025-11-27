const Product = require('../models/Product');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');


const ProductController = {
    getAllProducts: (req, res) => {
        try {
            const products = Product.getAll();
            res.json({ data: products });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getProductById: (req, res) => {
        try {
            const id = req.params.id;
            const product = Product.getById(id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json({ data: product });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    createProduct: (req, res) => {
        try {
            const payload = req.body;
            if (!payload.name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            // ✅ attach uploaded image if exists
            if (req.file) {
                payload.image = `/uploads/${req.file.filename}`;
            }

            // ✅ Validate category existence if category_id provided
            if (payload.category_id) {
                const category = db
                    .prepare('SELECT id FROM categories WHERE id = ?')
                    .get(payload.category_id);
                if (!category) {
                    return res.status(404).json({ error: 'category does not exist' });
                }
            }

            // Basic tax defaults if not provided: these should be set explicitly by the client
            if (typeof payload.vat_takeout === 'undefined') payload.vat_takeout = 0;
            if (typeof payload.vat_eat_in === 'undefined') payload.vat_eat_in = 0;

            const product = Product.create(payload);
            res.status(201).json({ message: 'Product created successfully', data: product });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error.message, // shows actual reason in response
            });
        }
    },

    updateProduct: (req, res) => {
        try {
            const id = req.params.id;
            const payload = req.body;
            if (!payload.name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            // Check if product exists
            const existingProduct = Product.getById(id);
            if (!existingProduct) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // ✅ Validate category existence if category_id provided
            if (payload.category_id) {
                const category = db
                    .prepare('SELECT id FROM categories WHERE id = ?')
                    .get(payload.category_id);
                if (!category) {
                    return res.status(404).json({ error: 'category does not exist' });
                }
            }

            // ✅ If new file uploaded
            if (req.file) {
                // delete old image if exists
                if (existingProduct.image) {
                    const oldImagePath = path.join(__dirname, '../../', existingProduct.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                // set new image path
                payload.image = `/uploads/${req.file.filename}`;
            } else {
                // keep old image if not uploading new one
                payload.image = existingProduct.image;
            }
            
            const product = Product.update(id, payload);
            res.status(200).json({ message: 'Product updated successfully', data: product });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteProduct: (req, res) => {
        try {
            const id = req.params.id;
            const product = Product.getById(id);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            Product.delete(id);
            res.json({ message: 'Product deleted successfully' });
        } catch (err) {
            console.error('Delete product error:', err);
            // Check if it's a foreign key constraint error
            if (err.message && (err.message.includes('FOREIGN KEY constraint failed') || err.message.includes('sub-product'))) {
                return res.status(400).json({ 
                    error: err.message || 'Cannot delete product because it has associated sub-products. Please delete the sub-products first.' 
                });
            }
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = ProductController;