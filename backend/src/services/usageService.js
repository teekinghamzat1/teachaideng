const prisma = require('../config/db');

/**
 * Usage Service
 * Handles lesson-based usage tracking with token accounting
 * Users see only lessons, backend tracks tokens for cost control
 */

/**
 * Check if user can generate a lesson
 * @param {string} userId 
 * @returns {Promise<{canGenerate: boolean, reason?: string}>}
 */
async function canGenerateLesson(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            monthlyLessonLimit: true,
            lessonsUsedThisMonth: true,
            subscriptionPlan: true
        }
    });

    if (!user) {
        return { canGenerate: false, reason: 'User not found' };
    }

    // Check if monthly reset is needed
    await checkAndResetUsage(userId);

    // Refresh user data after potential reset
    const refreshedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            monthlyLessonLimit: true,
            lessonsUsedThisMonth: true,
            subscriptionPlan: true
        }
    });

    // Use dynamic plan limits
    const planLimits = await getPlanLimits(refreshedUser.subscriptionPlan);
    // If user limit is default (10) or less than plan limit, use plan limit. 
    // This allows Admin to override specific users with HIGHER limits if needed, 
    // but ensures plan updates propagate to everyone else.
    // For simplicity in this fix: Use the GREATER of the two.
    const effectiveLimit = Math.max(refreshedUser.monthlyLessonLimit, planLimits.lessonLimit);

    if (refreshedUser.lessonsUsedThisMonth >= effectiveLimit) {
        return {
            canGenerate: false,
            reason: `Monthly lesson limit reached (${effectiveLimit} lessons)`
        };
    }

    return { canGenerate: true };
}

/**
 * Record lesson generation with token usage
 * @param {string} userId 
 * @param {number} inputTokens 
 * @param {number} outputTokens 
 */
async function recordLessonGeneration(userId, inputTokens = 0, outputTokens = 0) {
    const totalTokens = inputTokens + outputTokens;

    await prisma.user.update({
        where: { id: userId },
        data: {
            lessonsUsedThisMonth: { increment: 1 },
            tokensUsedThisMonth: { increment: totalTokens }
        }
    });

    // Usage recorded
}

/**
 * Get user's current usage stats (lessons only for frontend)
 * @param {string} userId 
 * @returns {Promise<{lessonsUsed: number, lessonsRemaining: number, monthlyLimit: number, resetDate: Date}>}
 */
async function getUserUsage(userId) {
    // Check and reset if needed
    await checkAndResetUsage(userId);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            monthlyLessonLimit: true,
            lessonsUsedThisMonth: true,
            lastUsageReset: true,
            subscriptionPlan: true
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const planLimits = await getPlanLimits(user.subscriptionPlan);
    // Logic: If user has a specific custom override (very high number), use it. 
    // Otherwise use plan limit.
    // To support "Update numbers from admin dashboard", we prioritize the plan limit 
    // if the user's stored limit seems like a default (e.g. <= 15 for Free).
    // Safest approach: Use Max(userStored, planLimit).
    const effectiveLimit = Math.max(user.monthlyLessonLimit, planLimits.lessonLimit);

    const lessonsRemaining = Math.max(0, effectiveLimit - user.lessonsUsedThisMonth);

    // Calculate next reset date (first day of next month)
    const resetDate = new Date(user.lastUsageReset);
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);

    return {
        lessonsUsed: user.lessonsUsedThisMonth,
        lessonsRemaining,
        monthlyLimit: effectiveLimit,
        resetDate
    };
}

/**
 * Check if user needs monthly reset and perform it
 * @param {string} userId 
 */
async function checkAndResetUsage(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastUsageReset: true }
    });

    if (!user) return;

    const now = new Date();
    const lastReset = new Date(user.lastUsageReset);

    // Check if we're in a new month
    const needsReset =
        now.getMonth() !== lastReset.getMonth() ||
        now.getFullYear() !== lastReset.getFullYear();

    if (needsReset) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                lessonsUsedThisMonth: 0,
                tokensUsedThisMonth: 0,
                lastUsageReset: now
            }
        });
        // Monthly usage reset performed
    }
}

/**
 * Reset monthly usage for all users (cron job)
 */
async function resetMonthlyUsage() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await prisma.user.updateMany({
        where: {
            lastUsageReset: {
                lt: firstOfMonth
            }
        },
        data: {
            lessonsUsedThisMonth: 0,
            tokensUsedThisMonth: 0,
            lastUsageReset: now
        }
    });

    return result.count;
}

/**
 * Admin: Set custom limits for a user
 * @param {string} userId 
 * @param {number} lessonLimit 
 * @param {number} tokenLimit 
 */
async function setUserLimits(userId, lessonLimit, tokenLimit) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            monthlyLessonLimit: lessonLimit,
            monthlyTokenLimit: tokenLimit
        }
    });

    // Custom limits set
}

/**
 * Get plan limits from system settings
 * @param {string} plan - 'Free', 'Pro', or 'School'
 * @returns {Promise<{lessonLimit: number, tokenLimit: number}>}
 */
async function getPlanLimits(plan) {
    const settings = await prisma.systemSetting.findUnique({
        where: { id: 1 }
    });

    if (!settings) {
        // Fallback defaults
        const defaults = {
            'Free': { lessonLimit: 10, tokenLimit: 100000 },
            'Pro': { lessonLimit: 100, tokenLimit: 1000000 },
            'School': { lessonLimit: 999999, tokenLimit: 10000000 }
        };
        return defaults[plan] || defaults['Free'];
    }

    // Normalize plan name to title case (e.g. "pro" -> "Pro")
    const formattedPlan = plan ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() : 'Free';

    const planMap = {
        'Free': {
            lessonLimit: settings.freePlanLessonLimit,
            tokenLimit: settings.freePlanTokenLimit
        },
        'Pro': {
            lessonLimit: settings.proPlanLessonLimit,
            tokenLimit: settings.proPlanTokenLimit
        },
        'School': {
            lessonLimit: settings.schoolPlanLessonLimit,
            tokenLimit: settings.schoolPlanTokenLimit
        }
    };

    return planMap[formattedPlan] || planMap['Free'];
}

module.exports = {
    canGenerateLesson,
    recordLessonGeneration,
    getUserUsage,
    checkAndResetUsage,
    resetMonthlyUsage,
    setUserLimits,
    getPlanLimits
};
