const prisma = require('../config/db');

/**
 * Usage Service
 * Handles lesson-based usage tracking with token accounting
 */

async function canGenerateAssessment(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionPlan: true }
    });

    if (!user) return { canGenerate: false, reason: 'User not found' };

    const assessmentLimits = { 'Free': 50, 'Pro': 200, 'School': 1000 };
    const plan = user.subscriptionPlan ? user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1).toLowerCase() : 'Free';
    const limit = assessmentLimits[plan] || assessmentLimits['Free'];

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = await prisma.usageLog.count({
        where: { userId, action: 'ASSESSMENT_GENERATION', createdAt: { gte: firstOfMonth } }
    });

    if (count >= limit) return { canGenerate: false, reason: 'Assessment fair-use limit reached for this month. Please try again next month.' };
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
    await checkAndResetUsage(userId);
    
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { school: true }
    });

    if (!user) return { canGenerate: false, reason: 'User not found' };

    // School logic
    if (user.schoolId && user.school) {
        // Teacher daily limit check
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        const dailyLimit = user.dailyNoteLimit || settings?.schoolTeacherDailyLimit || 5;
        if (user.notesUsedToday >= dailyLimit) {
            return {
                canGenerate: false,
                reason: "You’ve reached today’s generation limit. You can continue tomorrow."
            };
        }
        
        // School monthly limit check
        let schoolBaseLimit = settings?.schoolBasicPlanLessonLimit || 500;
        if (user.school.planType === 'Standard') schoolBaseLimit = settings?.schoolStandardPlanLessonLimit || 1500;
        else if (user.school.planType === 'Pro') schoolBaseLimit = settings?.schoolProPlanLessonLimit || 5000;
        
        const totalCapacity = schoolBaseLimit + user.school.additionalNotes;
        if (user.school.notesUsedThisMonth >= totalCapacity) {
             return {
                canGenerate: false,
                reason: "You’ve completed your lesson generation capacity for this month. You can upgrade your plan or add more notes to continue."
             };
        }
        return { canGenerate: true };
    }

    // Individual logic
    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const dailyLimit = user.dailyNoteLimit || settings?.individualDailyLimit || 3;
    if (user.notesUsedToday >= dailyLimit) {
        return {
            canGenerate: false,
            reason: `You've reached today's generation limit (${dailyLimit} per day). You can continue tomorrow.`
        };
    }

    const planLimits = await getPlanLimits(user.subscriptionPlan);
    const effectiveLimit = Math.max(user.monthlyLessonLimit, planLimits.lessonLimit) + (user.additionalNotes || 0);

    if (user.lessonsUsedThisMonth >= effectiveLimit) {
        return {
            canGenerate: false,
            reason: `Monthly lesson limit reached (${effectiveLimit} lessons)`
        };
    }

    return { canGenerate: true };
}

async function recordLessonGeneration(userId, inputTokens = 0, outputTokens = 0) {
    const totalTokens = inputTokens + outputTokens;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    await prisma.user.update({
        where: { id: userId },
        data: {
            lessonsUsedThisMonth: { increment: 1 },
            tokensUsedThisMonth: { increment: totalTokens },
            notesUsedToday: { increment: 1 }
        }
    });

    if (user && user.schoolId) {
        await prisma.school.update({
            where: { id: user.schoolId },
            data: { notesUsedThisMonth: { increment: 1 } }
        });
    }
}

async function checkAndResetUsage(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastUsageReset: true, lastDailyReset: true, subscriptionPlan: true, schoolId: true }
    });

    if (!user) return;

    const now = new Date();
    
    // 1. Daily Reset for User
    const lastDaily = new Date(user.lastDailyReset || now);
    const needsDailyReset = now.getDate() !== lastDaily.getDate() ||
                            now.getMonth() !== lastDaily.getMonth() ||
                            now.getFullYear() !== lastDaily.getFullYear();

    if (needsDailyReset) {
        await prisma.user.update({
            where: { id: userId },
            data: { notesUsedToday: 0, lastDailyReset: now }
        });
    }

    // 2. Monthly Reset for Individual User (lessonsUsedThisMonth)
    const planLimits = await getPlanLimits(user.subscriptionPlan);
    const duration = (planLimits.duration || 'month').toLowerCase();
    
    const lastReset = new Date(user.lastUsageReset);
    let needsMonthlyReset = false;

    if (duration === 'term') {
        const getTermStart = (date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            if (month < 4) return new Date(year, 0, 1);
            if (month < 8) return new Date(year, 4, 1);
            return new Date(year, 8, 1);
        };
        needsMonthlyReset = getTermStart(now).getTime() !== getTermStart(lastReset).getTime();
    } else {
        needsMonthlyReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    }

    if (needsMonthlyReset) {
        await prisma.user.update({
            where: { id: userId },
            data: { 
                lessonsUsedThisMonth: 0, 
                tokensUsedThisMonth: 0, 
                additionalNotes: 0,
                lastUsageReset: now 
            }
        });
    }

    // 3. Monthly Reset for School
    if (user.schoolId) {
        const school = await prisma.school.findUnique({ where: { id: user.schoolId } });
        if (school) {
            const lastSchoolReset = new Date(school.lastUsageReset || now);
            const needsSchoolMonthlyReset = now.getMonth() !== lastSchoolReset.getMonth() ||
                                            now.getFullYear() !== lastSchoolReset.getFullYear();
            if (needsSchoolMonthlyReset) {
                // Monthly, resets usages and clears previous additional topups
                await prisma.school.update({
                    where: { id: user.schoolId },
                    data: { notesUsedThisMonth: 0, additionalNotes: 0, lastUsageReset: now }
                });
            }
        }
    }
}

async function getUserUsage(userId) {
    await checkAndResetUsage(userId);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { school: true }
    });

    if (!user) throw new Error('User not found');

    if (user.schoolId && user.school) {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        let schoolBaseLimit = settings?.schoolBasicPlanLessonLimit || 500;
        if (user.school.planType === 'Standard') schoolBaseLimit = settings?.schoolStandardPlanLessonLimit || 1500;
        else if (user.school.planType === 'Pro') schoolBaseLimit = settings?.schoolProPlanLessonLimit || 5000;
        
        const totalCapacity = schoolBaseLimit + user.school.additionalNotes;
        const lessonsRemaining = Math.max(0, totalCapacity - user.school.notesUsedThisMonth);
        
        const resetDate = new Date(user.school.lastUsageReset || new Date());
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
        resetDate.setHours(0, 0, 0, 0);

        return {
            lessonsUsed: user.school.notesUsedThisMonth,
            lessonsRemaining,
            monthlyLimit: totalCapacity,
            resetDate,
            duration: 'month'
        };
    }

    const planLimits = await getPlanLimits(user.subscriptionPlan);
    const effectiveLimit = Math.max(user.monthlyLessonLimit, planLimits.lessonLimit);
    const duration = (planLimits.duration || 'month').toLowerCase();

    const lessonsRemaining = Math.max(0, effectiveLimit - user.lessonsUsedThisMonth);
    const resetDate = new Date(user.lastUsageReset);

    if (duration === 'term') {
        const month = resetDate.getMonth();
        if (month < 4) resetDate.setMonth(4);
        else if (month < 8) resetDate.setMonth(8);
        else { resetDate.setFullYear(resetDate.getFullYear() + 1); resetDate.setMonth(0); }
        resetDate.setDate(1);
    } else {
        resetDate.setMonth(resetDate.getMonth() + 1);
        resetDate.setDate(1);
    }
    resetDate.setHours(0, 0, 0, 0);

    return {
        lessonsUsed: user.lessonsUsedThisMonth,
        lessonsRemaining,
        monthlyLimit: effectiveLimit,
        resetDate,
        duration
    };
}

async function resetMonthlyUsage() {
    return 0; // Handled dynamically via checkAndResetUsage
}

async function setUserLimits(userId, lessonLimit, tokenLimit) {
    await prisma.user.update({
        where: { id: userId },
        data: { monthlyLessonLimit: lessonLimit, monthlyTokenLimit: tokenLimit }
    });
}

async function getPlanLimits(plan) {
    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    if (!settings) {
        return { lessonLimit: 10, tokenLimit: 100000, duration: 'month' };
    }

    const formattedPlan = plan ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() : 'Free';
    const planMap = {
        'Free': { lessonLimit: settings.freePlanLessonLimit, tokenLimit: settings.freePlanTokenLimit, duration: settings.freePlanDuration || 'month' },
        'Pro': { lessonLimit: settings.proPlanLessonLimit, tokenLimit: settings.proPlanTokenLimit, duration: settings.proPlanDuration || 'month' },
        'School': { lessonLimit: settings.schoolBasicPlanLessonLimit, tokenLimit: settings.schoolPlanTokenLimit, duration: settings.schoolPlanDuration || 'month' }
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
