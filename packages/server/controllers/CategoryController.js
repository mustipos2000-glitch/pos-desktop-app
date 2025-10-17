const Category = require('../models/Category');

const CategoryController = {
    getAllCategories: (req, res) => {
        Category.getAll((err, categories) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ data: categories });
        });
    },

    getCategoryById: (req, res) => {
        const id = req.params.id;
        Category.getById(id, (err, category) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json({ data: category });
        });
    },

    createCategory: (req, res) => {
        const { name, next_course, in_web_shop } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        Category.create(name, next_course, in_web_shop, (err, category) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.status(201).json({
                message: 'Category created successfully',
            });
        });
    },

    updateCategory: (req, res) => {
        const id = req.params.id;
        const { name, next_course, in_web_shop } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        Category.update(id, name, next_course, in_web_shop, (err, category) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.status(201).json({
                message: 'Category updated successfully',
            });
        });
    },

    deleteCategory: (req, res) => {
        const id = req.params.id;
        Category.delete(id, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Category deleted successfully' });
        });
    }
};

module.exports = CategoryController;