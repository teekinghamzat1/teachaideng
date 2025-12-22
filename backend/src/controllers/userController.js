const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    if (user) {
        res.json(
            formatResponse(true, 'User profile retrieved', {
                _id: user.id,
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionPlan: user.subscriptionPlan,
                isSchoolAdmin: user.isSchoolAdmin,
                avatar: user.avatar,
            })
        );
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    if (user) {
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.avatar) updateData.avatar = req.body.avatar;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
        });

        res.json(
            formatResponse(true, 'User profile updated', {
                _id: updatedUser.id,
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                subscriptionPlan: updatedUser.subscriptionPlan,
                avatar: updatedUser.avatar,
            })
        );
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user orders
// @route   GET /api/users/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user.id }
    });
    res.json(formatResponse(true, 'User orders retrieved', orders));
});

// @desc    Get user transactions
// @route   GET /api/users/transactions
// @access  Private
const getUserTransactions = asyncHandler(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id }
    });
    res.json(formatResponse(true, 'User transactions retrieved', transactions));
});

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    getUserTransactions,
};
