const cron = require('node-cron');
const prisma = require('../config/db');
const { sendPlanExpiringSoonEmail, sendPlanExpiredEmail } = require('../utils/emailService');

const processSubscriptions = async () => {
    console.log('[Subscription Cron] Starting subscription check...');
    try {
        const now = new Date();
        
        // 1. Find users whose plan expires in exactly 3 days (between 72 and 96 hours from now)
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

        const expiringUsers = await prisma.user.findMany({
            where: {
                subscriptionExpiryDate: {
                    gte: threeDaysFromNow,
                    lt: fourDaysFromNow
                },
                subscriptionPlan: {
                    not: 'Free'
                }
            }
        });

        for (const user of expiringUsers) {
            try {
                await sendPlanExpiringSoonEmail(user.email, user.name, user.subscriptionPlan, user.subscriptionExpiryDate);
                console.log(`[Subscription Cron] Sent expiring soon email to ${user.email}`);
            } catch (err) {
                console.error(`[Subscription Cron] Failed to send expiring soon email to ${user.email}`, err);
            }
        }

        // 2. Find users whose plan has expired (date is in the past)
        const expiredUsers = await prisma.user.findMany({
            where: {
                subscriptionExpiryDate: {
                    lt: now
                },
                subscriptionPlan: {
                    not: 'Free'
                }
            }
        });

        for (const user of expiredUsers) {
            try {
                // Downgrade the user
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        subscriptionPlan: 'Free',
                        isSchoolAdmin: false,
                        dailyNoteLimit: 3,
                        subscriptionStartDate: null,
                        subscriptionExpiryDate: null
                    }
                });

                // Send expired email
                await sendPlanExpiredEmail(user.email, user.name);
                console.log(`[Subscription Cron] Downgraded and sent expired email to ${user.email}`);
            } catch (err) {
                console.error(`[Subscription Cron] Failed to process expired user ${user.email}`, err);
            }
        }

        console.log(`[Subscription Cron] Completed. Notified: ${expiringUsers.length}. Downgraded: ${expiredUsers.length}.`);
    } catch (error) {
        console.error('[Subscription Cron] Error processing subscriptions:', error);
    }
};

const initSubscriptionCron = () => {
    // Run every day at midnight server time
    cron.schedule('0 0 * * *', processSubscriptions);
    console.log('[Cron] Subscription check scheduled (Runs daily at midnight)');
};

module.exports = {
    initSubscriptionCron,
    processSubscriptions // Exported for manual testing if needed
};
