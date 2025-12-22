const asyncHandler = require('express-async-handler');
const usageService = require('../services/usageService');
const formatResponse = require('../utils/formatResponse');
const { protect, admin } = require('../middlewares/authMiddleware');

/**
 * @desc    Get current user's lesson usage
 * @route   GET /api/usage/current
 * @access  Private
 */
const getCurrentUsage = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const usage = await usageService.getUserUsage(userId);

    res.json(formatResponse(true, 'Usage retrieved', usage));
});

/**
 * @desc    Manually reset monthly usage (Admin only)
 * @route   POST /api/admin/usage/reset
 * @access  Private/Admin
 */
const resetMonthlyUsage = asyncHandler(async (req, res) => {
    const count = await usageService.resetMonthlyUsage();

    res.json(formatResponse(true, `Monthly usage reset for ${count} users`));
});

/**
 * @desc    Set custom limits for a user (Admin only)
 * @route   PUT /api/admin/users/:userId/limits
 * @access  Private/Admin
 */
const setUserLimits = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { lessonLimit, tokenLimit } = req.body;

    if (!lessonLimit || !tokenLimit) {
        res.status(400);
        throw new Error('Both lessonLimit and tokenLimit are required');
    }

    await usageService.setUserLimits(userId, lessonLimit, tokenLimit);

    res.json(formatResponse(true, 'User limits updated', {
        userId,
        lessonLimit,
        tokenLimit
    }));
});

module.exports = {
    getCurrentUsage,
    resetMonthlyUsage,
    setUserLimits
};
