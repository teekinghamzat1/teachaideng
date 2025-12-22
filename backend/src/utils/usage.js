const prisma = require('../config/db');

/**
 * Count lesson generations for a user in the rolling last 7 days.
 * This implementation uses the LessonNote table (count of saved lesson notes)
 * to enforce limits. If you prefer to count UsageLog entries, adjust accordingly.
 */
/**
 * Get accurate weekly usage stats for a user
 */
async function getWeeklyLessonUsage(userId) {
  // Fetch user to check for manual reset and subscription plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastLimitReset: true,
      subscriptionPlan: true
    }
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // If lastLimitReset exists and is more recent than 7 days ago, count only from reset time
  const since = (user && user.lastLimitReset && user.lastLimitReset > sevenDaysAgo)
    ? user.lastLimitReset
    : sevenDaysAgo;

  const [usageCount, noteCount] = await Promise.all([
    prisma.usageLog.count({
      where: {
        userId,
        action: 'LESSON_GENERATION',
        createdAt: { gte: since }
      }
    }),
    prisma.lessonNote.count({
      where: {
        userId,
        createdAt: { gte: since }
      }
    })
  ]);

  const used = Math.max(usageCount, noteCount);

  const { getPlanLimits } = require('../services/usageService');
  const planLimits = await getPlanLimits(user ? user.subscriptionPlan : 'Free');
  let limit = planLimits.lessonLimit;

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    since
  };
}

/**
 * Count lesson generations for a user in the rolling last 7 days.
 */
/**
 * @deprecated Use usageService.canGenerateLesson instead.
 * Remaining for backward compatibility if needed by other components temporarily.
 */
async function checkWeeklyLessonLimit(userId) {
  const stats = await getWeeklyLessonUsage(userId);
  return stats.used;
}

async function createUsageLog(userId, action, metaData = null) {
  try {
    const log = await prisma.usageLog.create({
      data: {
        userId,
        action,
        meta: metaData ? JSON.stringify(metaData) : null
      },
    });
    return log;
  } catch (err) {
    // Don't block main flow on logging errors; surface in logs
    console.error('Failed to write usage log', err);
    return null;
  }
}

module.exports = {
  checkWeeklyLessonLimit,
  getWeeklyLessonUsage,
  createUsageLog,
};
