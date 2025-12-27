const asyncHandler = require('express-async-handler');

// Middleware to check if user is a school admin
const isSchoolAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, no user found');
    }

    // Check if user has School Plan and is marked as school admin
    if (req.user.subscriptionPlan !== 'School' || !req.user.isSchoolAdmin || !req.user.schoolId) {
        res.status(403);
        throw new Error('Access denied. School License, admin privileges, and a school ID are required.');
    }

    next();
});

module.exports = { isSchoolAdmin };
