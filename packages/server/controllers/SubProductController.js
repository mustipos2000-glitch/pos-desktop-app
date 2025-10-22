const SubProduct = require('../models/SubProduct');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const SubProductController = {
    getAllSubProducts: (req, res) => {
        try {
            const subProducts = SubProduct.getAll();
            res.json({ data: subProducts });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getSubProductById: (req, res) => {
        try {
            const id = req.params.id;
            const subProduct = SubProduct.getById(id);
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
            const subProducts = SubProduct.getByProductId(productId);
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

            // Validate product existence
            const product = db
                .prepare('SELECT id FROM products WHERE id = ?')
                .get(payload.product_id);
            if (!product) {
                return res.status(404).json({ error: 'Product does not exist' });
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

            const subProduct = SubProduct.create(payload);
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

            // Check if sub-product exists
            const existingSubProduct = SubProduct.getById(id);
            if (!existingSubProduct) {
                return res.status(404).json({ error: 'Sub-Product not found' });
            }

            // Validate product existence
            const product = db
                .prepare('SELECT id FROM products WHERE id = ?')
                .get(payload.product_id);
            if (!product) {
                return res.status(404).json({ error: 'Product does not exist' });
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

            const subProduct = SubProduct.update(id, payload);
            res.status(200).json({ message: 'Sub-Product updated successfully', data: subProduct });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteSubProduct: (req, res) => {
        try {
            const id = req.params.id;
            const subProduct = SubProduct.getById(id);

            if (!subProduct) {
                return res.status(404).json({ error: 'Sub-Product not found' });
            }

            SubProduct.delete(id);
            res.json({ message: 'Sub-Product deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = SubProductController;
