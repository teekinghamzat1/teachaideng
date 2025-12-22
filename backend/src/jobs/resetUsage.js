const cron = require('node-cron');
const usageService = require('../services/usageService');

/**
 * Monthly Usage Reset Cron Job
 * Runs at midnight on the 1st of every month
 * Resets lessonsUsedThisMonth and tokensUsedThisMonth for all users
 */
function initializeUsageResetCron() {
    // Run at 00:00 on day 1 of every month
    cron.schedule('0 0 1 * *', async () => {
        console.log('[CRON] Running monthly usage reset...');
        try {
            const count = await usageService.resetMonthlyUsage();
            console.log(`[CRON] Monthly usage reset completed: ${count} users reset`);
        } catch (error) {
            console.error('[CRON] Monthly usage reset failed:', error);
        }
    }, {
        scheduled: true,
        timezone: "UTC"
    });

    console.log('[CRON] Monthly usage reset job initialized (runs at 00:00 UTC on 1st of each month)');
}

module.exports = { initializeUsageResetCron };
