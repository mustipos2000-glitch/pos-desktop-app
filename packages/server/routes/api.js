const express = require('express');
const multer = require('multer');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const GroupController = require('../controllers/GroupController');
const UserController = require('../controllers/UserController');
const MemberController = require('../controllers/MemberController');
const MemberFeeController = require('../controllers/MemberFeeController');
const RentalChargeController = require('../controllers/RentalChargeController');
const MosquePaymentController = require('../controllers/MosquePaymentController');
const ProductController = require('../controllers/ProductController');
const SubProductController = require('../controllers/SubProductController');
const OrderController = require('../controllers/OrderController');
const RoomController = require('../controllers/RoomController');
const PrTableController = require('../controllers/PrTableController');
const PrinterController = require('../controllers/printerController');
const PaymentController = require('../controllers/PaymentController');
const PaymentTerminalController = require('../controllers/PaymentTerminalController');
const CustomerController = require('../controllers/CustomerController');
const InventoryController = require('../controllers/InventoryController');
const ReportController = require('../controllers/ReportController');
const ScaleController = require('../controllers/ScaleController');
const PromotionController = require('../controllers/PromotionController');



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

// Member Fee routes
router.get('/member-fees', MemberFeeController.getAllMemberFees);
router.get('/member-fees/:id', MemberFeeController.getMemberFeeById);
router.post('/member-fees', MemberFeeController.createMemberFee);
router.put('/member-fees/:id', MemberFeeController.updateMemberFee);
router.delete('/member-fees/:id', MemberFeeController.deleteMemberFee);

// Rental Charge routes
router.get('/rental-charges', RentalChargeController.getAllRentalCharges);
router.get('/rental-charges/:id', RentalChargeController.getRentalChargeById);
router.post('/rental-charges', RentalChargeController.createRentalCharge);
router.put('/rental-charges/:id', RentalChargeController.updateRentalCharge);
router.delete('/rental-charges/:id', RentalChargeController.deleteRentalCharge);

// Mosque Payment routes
router.get('/mosque-payments', MosquePaymentController.getAllPayments);
router.get('/mosque-payments/:id', MosquePaymentController.getPaymentById);
router.get('/mosque-payments/transaction/:transactionId', MosquePaymentController.getPaymentByTransactionId);
router.get('/mosque-payments/member/:memberId', MosquePaymentController.getPaymentsByMemberId);
router.post('/mosque-payments', MosquePaymentController.createPayment);
router.put('/mosque-payments/:id', MosquePaymentController.updatePayment);
router.delete('/mosque-payments/:id', MosquePaymentController.deletePayment);
router.get('/mosque-payments/stats/by-type', MosquePaymentController.getStatsByType);
router.get('/mosque-payments/stats/by-method', MosquePaymentController.getStatsByMethod);

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
router.get('/products/barcode/:barcode', ProductController.getProductByBarcode);
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
router.get('/orders/hold', OrderController.getHoldOrders);
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
router.get('/printers/main', PrinterController.getMainPrinter);
router.get('/printers/:id', PrinterController.getPrinterById);
router.post('/printers', PrinterController.createPrinter);
router.put('/printers/:id', PrinterController.updatePrinter);
router.delete('/printers/:id', PrinterController.deletePrinter);
router.post('/printers/:id/test', PrinterController.testPrinter);
router.post('/printers/print-receipt', PrinterController.printReceipt);
router.post('/printers/print-kitchen', PrinterController.printKitchenOrder);
router.post('/printers/print-kitchen-batch', PrinterController.printKitchenOrderBatch);
router.post('/printers/print-custom', PrinterController.printCustom);
router.post('/printers/open-drawer', PrinterController.openDrawer);

// Payment routes
router.post('/payments/send-receipt-email', PaymentController.sendReceiptEmail);

// Cashmatic routes (for payment machine integration)
router.post('/cashmatic/start', PaymentController.processCashmaticPayment);
router.get('/cashmatic/status/:sessionId', PaymentController.getPaymentStatus);
router.post('/cashmatic/finish/:sessionId', PaymentController.finishCashmaticPayment);
router.post('/cashmatic/cancel/:sessionId', PaymentController.cancelCashmaticPayment);

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

// Inventory routes
router.get('/inventory', InventoryController.getAllInventory);
router.get('/inventory/:id', InventoryController.getInventoryById);
router.post('/inventory', InventoryController.createInventory);
router.put('/inventory/:id', InventoryController.updateInventory);
router.delete('/inventory/:id', InventoryController.deleteInventory);



// Report routes
router.get('/reports/x-report', ReportController.getXReport);
router.get('/reports/z-report', ReportController.getZReport);
router.get('/reports/history', ReportController.getReportHistory);

// Scale routes
router.post('/scale/connect', ScaleController.connect);
router.post('/scale/disconnect', ScaleController.disconnect);
router.get('/scale/weight', ScaleController.getWeight);
router.post('/scale/tare', ScaleController.tare);
router.get('/scale/test', ScaleController.testConnection);
router.get('/scale/status', ScaleController.getStatus);
router.get('/scale/ports', ScaleController.getAvailablePorts);
router.post('/scale/calculate-price', ScaleController.calculatePrice);

// Promotion routes
router.get('/promotions', PromotionController.getAllPromotions);
router.get('/promotions/:id', PromotionController.getPromotionById);
router.get('/promotions/product/:productId', PromotionController.getActivePromotionByProductId);
router.post('/promotions', PromotionController.createPromotion);
router.put('/promotions/:id', PromotionController.updatePromotion);
router.delete('/promotions/:id', PromotionController.deletePromotion);

module.exports = router;