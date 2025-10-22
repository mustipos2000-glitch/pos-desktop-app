const Product = require('../models/Product');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const SubProductController = {
    getAllSubProducts: (req, res) => {
        try {
            const subProducts = Product.getAllSubProducts();
            res.json({ data: subProducts });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getSubProductById: (req, res) => {
        try {
            const id = req.params.id;
            const subProduct = Product.getById(id);
            if (!subProduct) {
                return res.status(404).json({ error: 'Sub-Product not found' });
            }
            res.json({ data: subProduct });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getSubProductsByProductId: (req, res) => {
        try {
            const productId = req.params.productId;
            const subProducts = Product.getSubProductsByParentId(productId);
            res.json({ data: subProducts });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    createSubProduct: (req, res) => {
        try {
            const payload = req.body;
            if (!payload.name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            if (!payload.product_id) {
                return res.status(400).json({ error: 'Product ID is required' });
            }

            // Set parent_id from product_id
            payload.parent_id = payload.product_id;

            // Validate parent product existence (must be a main product)
            const product = db
                .prepare('SELECT id FROM products WHERE id = ? AND parent_id IS NULL')
                .get(payload.parent_id);
            if (!product) {
                return res.status(404).json({ error: 'Parent product does not exist' });
            }

            // Attach uploaded image if exists
            if (req.file) {
                payload.image = `/uploads/${req.file.filename}`;
            }

            // Validate category existence if category_id provided
            if (payload.category_id) {
                const category = db
                    .prepare('SELECT id FROM categories WHERE id = ?')
                    .get(payload.category_id);
                if (!category) {
                    return res.status(404).json({ error: 'Category does not exist' });
                }
            }

            // Basic tax defaults if not provided
            if (typeof payload.vat_takeout === 'undefined') payload.vat_takeout = 0;
            if (typeof payload.vat_eat_in === 'undefined') payload.vat_eat_in = 0;

            const subProduct = Product.create(payload);
            res.status(201).json({ message: 'Sub-Product created successfully', data: subProduct });
        } catch (error) {
            res.status(500).json({
                error: 'Internal server error',
                details: error.message,
            });
        }
    },

    updateSubProduct: (req, res) => {
        try {
            const id = req.params.id;
            const payload = req.body;
            if (!payload.name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            if (!payload.product_id) {
                return res.status(400).json({ error: 'Product ID is required' });
            }

            // Set parent_id from product_id
            payload.parent_id = payload.product_id;

            // Check if sub-product exists
            const existingSubProduct = Product.getById(id);
            if (!existingSubProduct) {
                return res.status(404).json({ error: 'Sub-Product not found' });
            }

            // Validate parent product existence (must be a main product)
            const product = db
                .prepare('SELECT id FROM products WHERE id = ? AND parent_id IS NULL')
                .get(payload.parent_id);
            if (!product) {
                return res.status(404).json({ error: 'Parent product does not exist' });
            }

            // Validate category existence if category_id provided
            if (payload.category_id) {
                const category = db
                    .prepare('SELECT id FROM categories WHERE id = ?')
                    .get(payload.category_id);
                if (!category) {
                    return res.status(404).json({ error: 'Category does not exist' });
                }
            }

            // If new file uploaded
            if (req.file) {
                // Delete old image if exists
                if (existingSubProduct.image) {
                    const oldImagePath = path.join(__dirname, '../../', existingSubProduct.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                        console.log(`🗑️ Deleted old image: ${oldImagePath}`);
                    }
                }
                payload.image = `/uploads/${req.file.filename}`;
            } else {
                // Keep old image if not uploading new one
                payload.image = existingSubProduct.image;
            }

            const subProduct = Product.update(id, payload);
            res.status(200).json({ message: 'Sub-Product updated successfully', data: subProduct });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteSubProduct: (req, res) => {
        try {
            const id = req.params.id;
            const subProduct = Product.getById(id);

            if (!subProduct) {
                return res.status(404).json({ error: 'Sub-Product not found' });
            }

            Product.delete(id);
            res.json({ message: 'Sub-Product deleted successfully' });
        } catch (err) {
            console.error('Delete sub-product error:', err);
            if (err.message && err.message.includes('order')) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Internal server error: ' + err.message });
        }
    }
};

module.exports = SubProductController;
