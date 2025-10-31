const express = require('express');
const multer = require('multer');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const UserController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const SubProductController = require('../controllers/SubProductController');
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
router.post('/categories/:id/move-up', CategoryController.moveUp);
router.post('/categories/:id/move-down', CategoryController.moveDown);

// Product routes
router.get('/products', ProductController.getAllProducts);
router.get('/products/:id', ProductController.getProductById);
// ✅ if you're uploading image + text form-data
router.post('/products', upload.single('image'), ProductController.createProduct);
router.put('/products/:id', upload.single('image'), ProductController.updateProduct);
router.delete('/products/:id', ProductController.deleteProduct);

// Sub-Product routes
router.get('/sub-products', SubProductController.getAllSubProducts);
router.get('/sub-products/:id', SubProductController.getSubProductById);
router.get('/products/:productId/sub-products', SubProductController.getSubProductsByProductId);
router.post('/sub-products', upload.single('image'), SubProductController.createSubProduct);
router.put('/sub-products/:id', upload.single('image'), SubProductController.updateSubProduct);
router.delete('/sub-products/:id', SubProductController.deleteSubProduct);

// Order routes
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.post('/orders', OrderController.createOrder);
router.put('/orders/:id', OrderController.updateOrder);
router.delete('/orders/:id', OrderController.deleteOrder);

module.exports = router;