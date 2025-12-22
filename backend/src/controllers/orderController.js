const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

const parseOrder = (order) => {
    return {
        ...order,
        shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : null,
        paymentResult: order.paymentResult ? JSON.parse(order.paymentResult) : null,
    };
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
        return;
    } else {
        const order = await prisma.order.create({
            data: {
                userId: req.user.id,
                orderItems: {
                    create: orderItems.map((item) => ({
                        name: item.name,
                        qty: Number(item.qty),
                        image: item.image,
                        price: Number(item.price),
                        productId: item.product || item.id,
                    })),
                },
                shippingAddress: JSON.stringify(shippingAddress),
                paymentMethod,
                taxPrice: Number(taxPrice),
                shippingPrice: Number(shippingPrice),
                totalPrice: Number(totalPrice),
            },
            include: {
                orderItems: true,
            }
        });

        res.status(201).json(formatResponse(true, 'Order created', parseOrder(order)));
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
            user: {
                select: { name: true, email: true }
            },
            orderItems: true,
        }
    });

    if (order) {
        res.json(formatResponse(true, 'Order retrieved', parseOrder(order)));
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PATCH /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (order) {
        const updatedOrder = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                isPaid: true,
                paidAt: new Date(),
                paymentResult: JSON.stringify({
                    id: req.body.id,
                    status: req.body.status,
                    update_time: req.body.update_time,
                    email_address: req.body.email_address,
                }),
            }
        });

        res.json(formatResponse(true, 'Order paid', parseOrder(updatedOrder)));
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to delivered
// @route   PATCH /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (order) {
        const updatedOrder = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                isDelivered: true,
                deliveredAt: new Date(),
                status: 'Delivered'
            }
        });

        res.json(formatResponse(true, 'Order delivered', parseOrder(updatedOrder)));
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: { orderItems: true } // Usually needed for list
    });
    res.json(formatResponse(true, 'User orders retrieved', orders.map(parseOrder)));
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    });
    res.json(formatResponse(true, 'All orders retrieved', orders.map(parseOrder)));
});

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
};
