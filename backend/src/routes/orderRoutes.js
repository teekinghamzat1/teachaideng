const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const orderSchema = z.object({
    body: z.object({
        orderItems: z.array(z.object({
            name: z.string(),
            qty: z.number(),
            image: z.string(),
            price: z.number(),
            product: z.string(),
        })),
        shippingAddress: z.object({
            address: z.string(),
            city: z.string(),
            postalCode: z.string(),
            country: z.string(),
        }),
        paymentMethod: z.string(),
        itemsPrice: z.number(),
        taxPrice: z.number(),
        shippingPrice: z.number(),
        totalPrice: z.number(),
    }),
});

router.route('/')
    .post(protect, validate(orderSchema), addOrderItems)
    .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').patch(protect, updateOrderToPaid);
router.route('/:id/deliver').patch(protect, admin, updateOrderToDelivered);

module.exports = router;
