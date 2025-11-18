const SubProduct = require('../models/SubProduct');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const SubProductController = {
    getAllSubProducts: (req, res) => {
        try {
            const { group_id } = req.query;
            
            const filters = {};
            
            // Add group_id filter if provided
            if (group_id) {
                filters.group_id = parseInt(group_id);
            }
            
            const subProducts = SubProduct.getAll(filters);
            res.json({ data: subProducts });
        } catch (err) {
            console.error('Get all sub-products error:', err);
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

            // Validate product existence if product_id provided
            if (payload.product_id) {
                const product = db
                    .prepare('SELECT id FROM products WHERE id = ?')
                    .get(payload.product_id);
                if (!product) {
                    return res.status(404).json({ error: 'Product does not exist' });
                }
            }

            // Validate group existence if group_id provided
            if (payload.group_id) {
                const group = db
                    .prepare('SELECT id FROM groups WHERE id = ?')
                    .get(payload.group_id);
                if (!group) {
                    return res.status(404).json({ error: 'Group does not exist' });
                }
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

            // Check if sub-product exists
            const existingSubProduct = SubProduct.getById(id);
            if (!existingSubProduct) {
                return res.status(404).json({ error: 'Sub-Product not found' });
            }

            // Validate product existence if product_id provided
            if (payload.product_id) {
                const product = db
                    .prepare('SELECT id FROM products WHERE id = ?')
                    .get(payload.product_id);
                if (!product) {
                    return res.status(404).json({ error: 'Product does not exist' });
                }
            }

            // Validate group existence if group_id provided
            if (payload.group_id) {
                const group = db
                    .prepare('SELECT id FROM groups WHERE id = ?')
                    .get(payload.group_id);
                if (!group) {
                    return res.status(404).json({ error: 'Group does not exist' });
                }
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
            console.error('Delete sub-product error:', err);
            if (err.message && err.message.includes('order')) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Internal server error: ' + err.message });
        }
    },

    // Assign multiple sub-products to a product
    assignSubProductsToProduct: (req, res) => {
        try {
            const { product_id, sub_product_ids } = req.body;

            // Validate required fields
            if (!product_id) {
                return res.status(400).json({ error: 'product_id is required' });
            }

            if (!sub_product_ids || !Array.isArray(sub_product_ids) || sub_product_ids.length === 0) {
                return res.status(400).json({ error: 'sub_product_ids must be a non-empty array' });
            }

            // Validate product exists
            const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
            if (!product) {
                return res.status(404).json({ error: 'Product does not exist' });
            }

            // Validate all sub-products exist
            const placeholders = sub_product_ids.map(() => '?').join(',');
            const subProducts = db.prepare(`SELECT id FROM sub_products WHERE id IN (${placeholders})`).all(...sub_product_ids);

            if (subProducts.length !== sub_product_ids.length) {
                return res.status(404).json({ error: 'One or more sub-products do not exist' });
            }

            // Insert into junction table (using INSERT OR IGNORE to prevent duplicates)
            const insertStmt = db.prepare('INSERT OR IGNORE INTO product_sub_products (product_id, sub_product_id) VALUES (?, ?)');
            const insertMany = db.transaction((productId, subProductIds) => {
                for (const subProductId of subProductIds) {
                    insertStmt.run(productId, subProductId);
                }
            });

            insertMany(product_id, sub_product_ids);

            res.json({
                message: 'Sub-products assigned to product successfully',
                assigned_count: sub_product_ids.length,
                product_id: product_id,
                sub_product_ids: sub_product_ids
            });
        } catch (error) {
            console.error('Assign sub-products error:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    },

    // Unassign multiple sub-products from a product
    unassignSubProductsFromProduct: (req, res) => {
        try {
            const { product_id, sub_product_ids } = req.body;

            // Validate required fields
            if (!product_id) {
                return res.status(400).json({ error: 'product_id is required' });
            }

            if (!sub_product_ids || !Array.isArray(sub_product_ids) || sub_product_ids.length === 0) {
                return res.status(400).json({ error: 'sub_product_ids must be a non-empty array' });
            }

            // Validate all sub-products exist
            const placeholders = sub_product_ids.map(() => '?').join(',');
            const subProducts = db.prepare(`SELECT id FROM sub_products WHERE id IN (${placeholders})`).all(...sub_product_ids);

            if (subProducts.length !== sub_product_ids.length) {
                return res.status(404).json({ error: 'One or more sub-products do not exist' });
            }

            // Delete from junction table
            const deleteStmt = db.prepare('DELETE FROM product_sub_products WHERE product_id = ? AND sub_product_id = ?');
            const deleteMany = db.transaction((productId, subProductIds) => {
                for (const subProductId of subProductIds) {
                    deleteStmt.run(productId, subProductId);
                }
            });

            deleteMany(product_id, sub_product_ids);

            res.json({
                message: 'Sub-products unassigned from product successfully',
                unassigned_count: sub_product_ids.length,
                product_id: product_id,
                sub_product_ids: sub_product_ids
            });
        } catch (error) {
            console.error('Unassign sub-products error:', error);
            res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    }
};

module.exports = SubProductController;
