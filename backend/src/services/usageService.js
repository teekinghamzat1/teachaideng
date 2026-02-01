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
/**
 * Check if user can generate an assessment (fair-use limit)
 * Assessments do not consume lesson note credits.
 * @param {string} userId 
 * @returns {Promise<{canGenerate: boolean, reason?: string}>}
 */
async function canGenerateAssessment(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            subscriptionPlan: true
        }
    });

    if (!user) {
        return { canGenerate: false, reason: 'User not found' };
    }

    // Define internal fair-use limits for assessments
    const assessmentLimits = {
        'Free': 50,
        'Pro': 200,
        'School': 1000
    };

    const plan = user.subscriptionPlan ? user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1).toLowerCase() : 'Free';
    const limit = assessmentLimits[plan] || assessmentLimits['Free'];

    // Count assessments generated this month using UsageLog
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await prisma.usageLog.count({
        where: {
            userId,
            action: 'ASSESSMENT_GENERATION',
            createdAt: { gte: firstOfMonth }
        }
    });

    if (count >= limit) {
        return {
            canGenerate: false,
            reason: 'Assessment fair-use limit reached for this month. Please try again next month.'
        };
    }

    return { canGenerate: true };
}

/**
 * Check if user can generate a remark (fair-use limit)
 * @param {string} userId
 * @returns {Promise<{canGenerate: boolean, reason?: string}>}
 */
async function canGenerateRemark(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionPlan: true }
    });

    if (!user) {
        return { canGenerate: false, reason: 'User not found' };
    }

    // Define internal fair-use limits for remarks
    const remarkLimits = {
        'Free': 100,
        'Pro': 500,
        'School': 2000
    };

    const plan = user.subscriptionPlan ? user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1).toLowerCase() : 'Free';
    const limit = remarkLimits[plan] || remarkLimits['Free'];

    // Count remarks generated this month using UsageLog
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await prisma.usageLog.count({
        where: {
            userId,
            action: 'REMARK_GENERATION',
            createdAt: { gte: firstOfMonth }
        }
    });

    if (count >= limit) {
        return {
            canGenerate: false,
            reason: 'Remark generation fair-use limit reached for this month. Please try again next month.'
        };
    }

    return { canGenerate: true };
}

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
/**
 * Check if user's usage needs to be reset based on their plan duration (month/term)
 * @param {string} userId 
 */
async function checkAndResetUsage(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastUsageReset: true, subscriptionPlan: true }
    });

    if (!user) return;

    const planLimits = await getPlanLimits(user.subscriptionPlan);
    const duration = (planLimits.duration || 'month').toLowerCase();

    const now = new Date();
    const lastReset = new Date(user.lastUsageReset);
    let needsReset = false;

    if (duration === 'term') {
        // Term boundaries: Jan 1, May 1, Sept 1
        const getTermStart = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-indexed
            if (month < 4) return new Date(year, 0, 1); // Jan-Apr (Term 2)
            if (month < 8) return new Date(year, 4, 1); // May-Aug (Term 3)
            return new Date(year, 8, 1); // Sept-Dec (Term 1)
        };

        const currentTermStart = getTermStart(now);
        const lastResetTermStart = getTermStart(lastReset);

        needsReset = currentTermStart.getTime() !== lastResetTermStart.getTime();
    } else {
        // Monthly reset (default)
        needsReset =
            now.getMonth() !== lastReset.getMonth() ||
            now.getFullYear() !== lastReset.getFullYear();
    }

    if (needsReset) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                lessonsUsedThisMonth: 0,
                tokensUsedThisMonth: 0,
                lastUsageReset: now
            }
        });
    }
}

/**
 * Get user's current usage stats
 * @param {string} userId 
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

    if (!user) throw new Error('User not found');

    const planLimits = await getPlanLimits(user.subscriptionPlan);
    const effectiveLimit = Math.max(user.monthlyLessonLimit, planLimits.lessonLimit);
    const duration = (planLimits.duration || 'month').toLowerCase();

    const lessonsRemaining = Math.max(0, effectiveLimit - user.lessonsUsedThisMonth);

    // Calculate next reset date
    const resetDate = new Date(user.lastUsageReset);

    if (duration === 'term') {
        // Next Term reset: Move to the start of the next 4-month block
        const month = resetDate.getMonth();
        if (month < 4) { // Currently in Jan-Apr -> Next reset May 1
            resetDate.setMonth(4);
        } else if (month < 8) { // Currently in May-Aug -> Next reset Sept 1
            resetDate.setMonth(8);
        } else { // Currently in Sept-Dec -> Next reset Jan 1 of next year
            resetDate.setFullYear(resetDate.getFullYear() + 1);
            resetDate.setMonth(0);
        }
        resetDate.setDate(1);
    } else {
        // Next Monthly reset: 1st day of next month
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
    }

    resetDate.setHours(0, 0, 0, 0);

    return {
        lessonsUsed: user.lessonsUsedThisMonth,
        lessonsRemaining,
        monthlyLimit: effectiveLimit,
        resetDate,
        duration // Added to help frontend distinguish between 'Monthly Limit' and 'Termly Limit'
    };
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
            'Free': { lessonLimit: 10, tokenLimit: 100000, duration: 'month' },
            'Pro': { lessonLimit: 100, tokenLimit: 1000000, duration: 'month' },
            'School': { lessonLimit: 999999, tokenLimit: 10000000, duration: 'term' }
        };
        return defaults[plan] || defaults['Free'];
    }

    // Normalize plan name to title case (e.g. "pro" -> "Pro")
    const formattedPlan = plan ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() : 'Free';

    const planMap = {
        'Free': {
            lessonLimit: settings.freePlanLessonLimit,
            tokenLimit: settings.freePlanTokenLimit,
            duration: settings.freePlanDuration || 'month'
        },
        'Pro': {
            lessonLimit: settings.proPlanLessonLimit,
            tokenLimit: settings.proPlanTokenLimit,
            duration: settings.proPlanDuration || 'month'
        },
        'School': {
            lessonLimit: settings.schoolPlanLessonLimit,
            tokenLimit: settings.schoolPlanTokenLimit,
            duration: settings.schoolPlanDuration || 'term'
        }
    };

    return planMap[formattedPlan] || planMap['Free'];
}

module.exports = {
    canGenerateLesson,
    canGenerateAssessment,
    canGenerateRemark,
    recordLessonGeneration,
    getUserUsage,
    checkAndResetUsage,
    resetMonthlyUsage,
    setUserLimits,
    getPlanLimits
};
