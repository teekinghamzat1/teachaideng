const asyncHandler = require('express-async-handler');
const usageService = require('../services/usageService');
const formatResponse = require('../utils/formatResponse');

/**
 * Middleware to check if user has lesson capacity before generation
 */
const checkLessonCapacity = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const { canGenerate, reason } = await usageService.canGenerateLesson(userId);

    if (!canGenerate) {
        res.status(403);
        return res.json(formatResponse(
            false,
            "You've reached your monthly lesson limit. Upgrade to Pro for more lessons!",
            {
                upgradeUrl: "/pricing",
                reason
            }
        ));
    }

    next();
});

module.exports = {
    checkLessonCapacity
};
