const prisma = require('../config/db');

/**
 * Log an administrative action to the database.
 * @param {string} userId - ID of the admin performing the action
 * @param {string} schoolId - ID of the school associated with the action
 * @param {string} actionType - Type of action performed (e.g. "CREATE_USER")
 * @param {Object} details - Additional metadata about the action
 */
const createAdminLog = async (userId, schoolId, actionType, details = null) => {
    try {
        await prisma.adminLog.create({
            data: {
                userId,
                schoolId,
                actionType,
                details: details ? JSON.stringify(details) : null
            }
        });
    } catch (err) {
        console.error('Failed to create admin log:', err);
    }
};

module.exports = { createAdminLog };
