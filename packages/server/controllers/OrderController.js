const Order = require('../models/Order');
const InventoryHelper = require('../helpers/InventoryHelpers');

const OrderController = {
    getAllOrders: (req, res) => {
        try {
            const orders = Order.getAll();
            res.json({ data: orders });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getOrderById: (req, res) => {
        try {
            const id = req.params.id;
            const order = Order.getById(id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.json({ data: order });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    createOrder: (req, res) => {
        try {
            const { tax, status, note, sub_total, total, discount, details, table_id, customer_id } = req.body;

            console.log('📝 Creating order with', details?.length, 'items');

            if (!details || !Array.isArray(details) || details.length === 0) {
                return res.status(400).json({ error: 'Order must have at least one item' });
            }

            // Validate inventory availability for all items
            const validation = InventoryHelper.validateOrderItems(details);
            console.log('✅ Inventory validation result:', validation);
            
            if (!validation.valid) {
                console.log('❌ Order creation blocked - insufficient inventory');
                return res.status(400).json({ 
                    error: 'Insufficient inventory',
                    details: validation.errors
                });
            }

            const order = { tax, status, note, sub_total, total, discount, table_id, customer_id };
            const newOrder = Order.create(order, details);

            res.status(201).json({ message: 'Order created successfully', data: newOrder });
        } catch (error) {
            console.error('❌ Error creating order:', error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    },

    updateOrder: (req, res) => {
        try {
            const id = req.params.id;
            const { tax, status, note, total, sub_total, discount, details, table_id, customer_id } = req.body;

            console.log('📝 Updating order', id, 'with', details?.length, 'items');

            // Check if order exists
            const existingOrder = Order.getById(id);
            if (!existingOrder) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Validate inventory availability (excluding current order from calculation)
            const validation = InventoryHelper.validateOrderItems(details, id);
            console.log('✅ Inventory validation result (excluding order', id, '):', validation);
            
            if (!validation.valid) {
                console.log('❌ Order update blocked - insufficient inventory');
                return res.status(400).json({ 
                    error: 'Insufficient inventory',
                    details: validation.errors
                });
            }

            const order = Order.update(id, { tax, status, note, total, sub_total, discount, table_id, customer_id }, details);
            if (!order) return res.status(404).json({ error: 'Order not found' });

            res.json({ message: 'Order updated successfully', data: order });
        } catch (err) {
            console.error('❌ Error updating order:', err);
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    },


    deleteOrder: (req, res) => {
        try {
            const id = req.params.id;
            const order = Order.getById(id);
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            Order.delete(id);
            res.json({ message: 'Order deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getOrderByTableId: (req, res) => {
        try {
            const tableId = req.params.tableId;
            const order = Order.getByTableId(tableId);
            if (!order) {
                return res.json({ data: null });
            }
            res.json({ data: order });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getHoldOrders: (req, res) => {
        try {
            const orders = Order.getHoldOrders();
            res.json({ data: orders });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
};

module.exports = OrderController;