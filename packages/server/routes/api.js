const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
// Import users routes
const userRoutes = require('./users');

// User routes
router.use('/users', userRoutes);

// Category routes
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);
router.post('/categories', CategoryController.createCategory);
router.put('/categories/:id', CategoryController.updateCategory);
router.delete('/categories/:id', CategoryController.deleteCategory);

// Example API routes
router.get('/products', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Product 1', price: 10.99 },
      { id: 2, name: 'Product 2', price: 20.99 }
    ]
  });
});

router.post('/orders', (req, res) => {
  const order = req.body;
  res.status(201).json({
    message: 'Order created successfully',
    order
  });
});

module.exports = router;
