const Product = require('../models/Product');
const db = require('../config/database');


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
                        console.log(`🗑️ Deleted old image: ${oldImagePath}`);
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
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = ProductController;
