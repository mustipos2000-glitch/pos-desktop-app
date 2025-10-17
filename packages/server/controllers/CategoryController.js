const Category = require('../models/Category');

const CategoryController = {
    getAllCategories: (req, res) => {
        try {
            const categories = Category.getAll();
            res.json({ data: categories });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getCategoryById: (req, res) => {
        try {
            const id = req.params.id;
            const category = Category.getById(id);
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json({ data: category });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    createCategory: (req, res) => {
        try {
            const { name, next_course, in_web_shop } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const category = Category.create(name, next_course, in_web_shop);
            res.status(201).json({
                message: 'Category created successfully',
                data: category
            });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    updateCategory: (req, res) => {
        try {
            const id = req.params.id;
            const { name, next_course, in_web_shop } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Name is required' });
            }

            const category = Category.update(id, name, next_course, in_web_shop);
            res.status(200).json({
                message: 'Category updated successfully',
                data: category
            });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteCategory: (req, res) => {
        try {
            const id = req.params.id;
            Category.delete(id);
            res.json({ message: 'Category deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = CategoryController;
