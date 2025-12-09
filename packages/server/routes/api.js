const express = require('express');
const multer = require('multer');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const GroupController = require('../controllers/GroupController');
const UserController = require('../controllers/UserController');
const MemberController = require('../controllers/MemberController');
const ProductController = require('../controllers/ProductController');
const SubProductController = require('../controllers/SubProductController');
const OrderController = require('../controllers/OrderController');
const RoomController = require('../controllers/RoomController');
const PrTableController = require('../controllers/PrTableController');
const PrinterController = require('../controllers/printerController');
const PaymentController = require('../controllers/PaymentController');
const PaymentTerminalController = require('../controllers/PaymentTerminalController');
const CustomerController = require('../controllers/CustomerController');


const upload = multer({ dest: 'uploads/' }); // saves uploaded files in /uploads

// User routes
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.post('/users', UserController.createUser);
router.put('/users/:id', UserController.updateUser);
router.patch('/users/:id/permissions', UserController.updatePermissions);
router.delete('/users/:id', UserController.deleteUser);
router.post('/users/verify', UserController.verifyPincode);

// Member routes
router.get('/members', MemberController.getAllMembers);
router.get('/members/search', MemberController.searchMembers);
router.get('/members/:id', MemberController.getMemberById);
router.post('/members', MemberController.createMember);
router.put('/members/:id', MemberController.updateMember);
router.delete('/members/:id', MemberController.deleteMember);

// Category routes
router.get('/categories', CategoryController.getAllCategories);
router.get('/categories/:id', CategoryController.getCategoryById);
router.post('/categories', CategoryController.createCategory);
router.put('/categories/:id', CategoryController.updateCategory);
router.delete('/categories/:id', CategoryController.deleteCategory);
router.post('/categories/:id/move-up', CategoryController.moveUp);
router.post('/categories/:id/move-down', CategoryController.moveDown);

// Group routes
router.get('/groups', GroupController.getAllGroups);
router.get('/groups/:id', GroupController.getGroupById);
router.post('/groups', GroupController.createGroup);
router.put('/groups/:id', GroupController.updateGroup);
router.delete('/groups/:id', GroupController.deleteGroup);

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
router.post('/sub-products/assign-to-product', SubProductController.assignSubProductsToProduct);
router.post('/sub-products/unassign-from-product', SubProductController.unassignSubProductsFromProduct);

// Order routes
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/table/:tableId', OrderController.getOrderByTableId);
router.get('/orders/:id', OrderController.getOrderById);
router.post('/orders', OrderController.createOrder);
router.put('/orders/:id', OrderController.updateOrder);
router.delete('/orders/:id', OrderController.deleteOrder);

// Room routes
router.get('/rooms', RoomController.getAllRooms);
router.get('/rooms/:id', RoomController.getRoomById);
router.post('/rooms', RoomController.createRoom);
router.put('/rooms/:id', RoomController.updateRoom);
router.delete('/rooms/:id', RoomController.deleteRoom);

// PrTable routes
router.get('/pr-tables', PrTableController.getAllPrTables);
router.get('/pr-tables/:id', PrTableController.getPrTableById);
router.post('/pr-tables', PrTableController.createPrTable);
router.put('/pr-tables/:id', PrTableController.updatePrTable);
router.delete('/pr-tables/:id', PrTableController.deletePrTable);

// Printer routes
router.get('/printers', PrinterController.getAllPrinters);
router.get('/printers/:id', PrinterController.getPrinterById);
router.post('/printers', PrinterController.createPrinter);
router.put('/printers/:id', PrinterController.updatePrinter);
router.delete('/printers/:id', PrinterController.deletePrinter);
router.post('/printers/:id/test', PrinterController.testPrinter);
router.post('/printers/print-receipt', PrinterController.printReceipt);
router.post('/printers/print-kitchen', PrinterController.printKitchenOrder);
router.post('/printers/print-kitchen-batch', PrinterController.printKitchenOrderBatch);
router.post('/printers/print-custom', PrinterController.printCustom);

// Payment routes
// router.post('/payments/cashmatic', PaymentController.processCashmaticPayment); // UNUSED - Use /cashmatic/start instead
// router.post('/payments/bancontact', PaymentController.processBancontactPayment); // UNUSED - Not implemented in client
// router.get('/payments/status/:transactionId', PaymentController.getPaymentStatus); // UNUSED - Use /cashmatic/status/:sessionId instead
// router.post('/payments/cancel/:transactionId', PaymentController.cancelPayment); // UNUSED - Not implemented in client
router.post('/payments/send-receipt-email', PaymentController.sendReceiptEmail);

// Cashmatic routes (for payment machine integration)
router.post('/cashmatic/start', PaymentController.processCashmaticPayment);
router.get('/cashmatic/status/:sessionId', PaymentController.getPaymentStatus);

// Payworld routes (for Bancontact payment terminal integration)
router.post('/payworld/start', PaymentController.processPayworldPayment);
router.get('/payworld/status/:sessionId', PaymentController.getPayworldStatus);
router.post('/payworld/cancel/:sessionId', PaymentController.cancelPayworldPayment);

// Viva routes (for Viva Wallet payment integration)
router.post('/viva/start', PaymentController.processVivaPayment);

// Payment Terminal routes
router.get('/payment-terminals', PaymentTerminalController.getAllTerminals);
router.get('/payment-terminals/:id', PaymentTerminalController.getTerminalById);
router.post('/payment-terminals', PaymentTerminalController.createTerminal);
router.put('/payment-terminals/:id', PaymentTerminalController.updateTerminal);
router.delete('/payment-terminals/:id', PaymentTerminalController.deleteTerminal);
router.post('/payment-terminals/:id/test', PaymentTerminalController.testTerminal);

// Customer routes
router.get('/customers', CustomerController.getAllCustomers);
router.get('/customers/search', CustomerController.searchCustomers);
router.get('/customers/:id', CustomerController.getCustomerById);
router.post('/customers', CustomerController.createCustomer);
router.put('/customers/:id', CustomerController.updateCustomer);
router.delete('/customers/:id', CustomerController.deleteCustomer);

module.exports = router;