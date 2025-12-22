const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Create a notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
    const { title, message, type, target } = req.body;

    const notification = await prisma.notification.create({
        data: {
            title,
            message,
            type: type || 'info',
            target: target || 'all',
        },
    });

    res.status(201).json(formatResponse(true, 'Notification created', notification));
});

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    // Get fetched notifications: target 'all' OR target equals current user ID
    // Also include read status
    const notifications = await prisma.notification.findMany({
        where: {
            OR: [
                { target: 'all' },
                { target: req.user.id }
            ]
        },
        include: {
            reads: {
                where: { userId: req.user.id },
                select: { id: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 20
    });

    const formattedNotifications = notifications.map(n => ({
        ...n,
        isRead: n.reads.length > 0,
        reads: undefined
    }));

    res.json(formatResponse(true, 'Notifications retrieved', formattedNotifications));
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await prisma.notificationRead.create({
            data: {
                userId,
                notificationId: id
            }
        });
    } catch (error) {
        // If unique constraint violation, it's already read
        if (error.code !== 'P2002') {
            throw error;
        }
    }

    res.json(formatResponse(true, 'Marked as read'));
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
    });

    if (notification) {
        await prisma.notification.delete({
            where: { id: req.params.id },
        });
        res.json(formatResponse(true, 'Notification removed'));
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

// @desc    Update a notification
// @route   PUT /api/notifications/:id
// @access  Private/Admin
const updateNotification = asyncHandler(async (req, res) => {
    const { title, message, type } = req.body;

    const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
    });

    if (notification) {
        const updatedNotification = await prisma.notification.update({
            where: { id: req.params.id },
            data: {
                title: title || notification.title,
                message: message || notification.message,
                type: type || notification.type,
            },
        });

        res.json(formatResponse(true, 'Notification updated', updatedNotification));
    } else {
        res.status(404);
        throw new Error('Notification not found');
    }
});

module.exports = {
    createNotification,
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    updateNotification
};
