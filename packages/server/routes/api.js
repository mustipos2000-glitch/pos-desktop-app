const express = require('express');
const multer = require('multer');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const UserController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const OrderController = require('../controllers/OrderController');


const upload = multer({ dest: 'uploads/' }); // saves uploaded files in /uploads

// User routes
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);
router.post('/users/verify', UserController.verifyPincode);

// Category routes
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);
router.post('/categories', CategoryController.createCategory);
router.put('/categories/:id', CategoryController.updateCategory);
router.delete('/categories/:id', CategoryController.deleteCategory);

// Product routes
router.get('/products', ProductController.getAllProducts);
router.get('/products/:id', ProductController.getProductById);
// ✅ if you're uploading image + text form-data
router.post('/products', upload.single('image'), ProductController.createProduct);
router.put('/products/:id', upload.single('image'), ProductController.updateProduct);

router.delete('/products/:id', ProductController.deleteProduct);

// Order routes
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.post('/orders', OrderController.createOrder);
router.put('/orders/:id', OrderController.updateOrder);
router.delete('/orders/:id', OrderController.deleteOrder);

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
