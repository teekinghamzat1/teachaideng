const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const usageService = require('../services/usageService');
const { sendLessonNoteEmail } = require('../utils/emailService');

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
                schoolId: user.schoolId,
                avatar: user.avatar,
                accountType: user.accountType || 'individual',
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
                isSchoolAdmin: updatedUser.isSchoolAdmin,
                schoolId: updatedUser.schoolId,
                avatar: updatedUser.avatar,
                accountType: updatedUser.accountType || 'individual',
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

// @desc    Permanently delete current user and related data
// @route   DELETE /api/users/profile
// @access  Private
const deleteOwnAccount = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Delete related data in a safe order
    await prisma.$transaction([
        prisma.notificationRead.deleteMany({ where: { userId } }),
        prisma.timetableSlot.deleteMany({ where: { timetable: { userId } } }),
        prisma.timetable.deleteMany({ where: { userId } }),
        prisma.student.deleteMany({ where: { userId } }),
        prisma.question.deleteMany({ where: { assessment: { userId } } }),
        prisma.assessment.deleteMany({ where: { userId } }),
        prisma.lessonNote.deleteMany({ where: { userId } }),
        prisma.sharedContent.deleteMany({ where: { createdById: userId } }),
        prisma.tokenUsage.deleteMany({ where: { userId } }),
        prisma.transaction.deleteMany({ where: { userId } }),
        prisma.orderItem.deleteMany({ where: { order: { userId } } }),
        prisma.order.deleteMany({ where: { userId } }),
        prisma.usageLog.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } })
    ]);

    res.json(formatResponse(true, 'Your account and related data have been permanently deleted'));
});

// @desc    Get user usage stats
// @route   GET /api/users/usage
// @access  Private
const getUsageStats = asyncHandler(async (req, res) => {
    // Use the unified usage service associated with monthly limits
    const stats = await usageService.getUserUsage(req.user.id);

    // Map usageService response (lessonsUsed, monthlyLimit, etc.)
    // to the API contract expected by frontend (used, limit, remaining)
    const usage = {
        used: stats.lessonsUsed,
        limit: stats.monthlyLimit,
        remaining: stats.lessonsRemaining,
        resetDate: stats.resetDate
    };

    res.json(formatResponse(true, 'Usage stats retrieved', usage));
});

// @desc    Email a lesson note to yourself
// @route   POST /api/users/email-note
// @access  Private
const emailLessonNote = asyncHandler(async (req, res) => {
    const { lessonNote } = req.body;
    if (!lessonNote) {
        res.status(400);
        throw new Error('Lesson note data is required');
    }

    const success = await sendLessonNoteEmail(req.user.email, lessonNote);
    if (success) {
        res.json(formatResponse(true, 'Lesson note sent to your email successfully'));
    } else {
        res.status(500);
        throw new Error('Failed to send email. Please check your SMTP settings.');
    }
});

module.exports = {
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    getUserTransactions,
    deleteOwnAccount,
    getUsageStats,
    emailLessonNote,
};
