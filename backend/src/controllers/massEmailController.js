const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Send mass email with tracking
// @route   POST /api/admin/mass-email
// @access  Private/Admin
const sendMassEmailWithTracking = asyncHandler(async (req, res) => {
    const { subject, body, targetGroup } = req.body;

    if (!subject || !body) {
        res.status(400);
        throw new Error('Subject and body are required');
    }

    let where = { teacherStatus: 'Active' };
    if (targetGroup === 'pro') where.subscriptionPlan = 'Pro';
    if (targetGroup === 'free') where.subscriptionPlan = 'Free';
    if (targetGroup === 'school') where.subscriptionPlan = 'School';

    const users = await prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true }
    });

    if (users.length === 0) {
        return res.json(formatResponse(true, 'No users found to email'));
    }

    const { getTransporter } = require('../utils/emailService');
    const transporter = await getTransporter();

    if (!transporter) {
        res.status(500);
        throw new Error('Email service not configured');
    }

    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const fromEmail = settings?.smtpFromEmail || settings?.smtpUser;
    const fromName = settings?.smtpFromName || 'TeachAide AI';

    // Create mass email record with recipient records
    const massEmailRecord = await prisma.massEmail.create({
        data: {
            subject,
            body,
            targetGroup,
            recipientCount: users.length,
            adminId: req.user.id,
            recipients: {
                create: users.map(user => ({
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name,
                    status: 'pending'
                }))
            }
        }
    });

    // Start sending in "background"
    res.json(formatResponse(true, `Started sending mass email to ${users.length} users.`, massEmailRecord));

    // Process emails asynchronously
    (async () => {
        let sentCount = 0;
        let failedCount = 0;

        console.log(`Starting mass email send for ${users.length} recipients...`);

        for (const user of users) {
            try {
                const personalizedBody = body.replace(/\${user\.name}/g, user.name);

                // Find the recipient record
                const recipient = await prisma.emailRecipient.findFirst({
                    where: {
                        massEmailId: massEmailRecord.id,
                        userId: user.id
                    }
                });

                const trackingPixelUrl = `${process.env.API_URL || 'http://localhost:5000'}/api/admin/mass-email/${massEmailRecord.id}/track/${recipient.id}/open`;

                await transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: user.email,
                    subject: subject,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                            <div style="background: #1e293b; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
                                <h2 style="margin: 0; font-size: 18px;">${settings?.siteName || 'TeachAide AI'}</h2>
                            </div>
                            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; line-height: 1.6;">
                                <p>Hello ${user.name},</p>
                                ${personalizedBody}
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                                <p style="font-size: 12px; color: #64748b;">
                                    You are receiving this because you are a registered user on ${settings?.siteName || 'TeachAide AI'}.<br>
                                    To manage your notification settings, please visit your account dashboard.
                                </p>
                                <!-- Tracking pixel -->
                                <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
                            </div>
                        </div>
                    `
                });

                // Update recipient status to sent
                await prisma.emailRecipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: 'sent',
                        sentAt: new Date()
                    }
                });

                sentCount++;

                // Small delay between emails to avoid spam filters
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                failedCount++;
                console.error(`[MASS_EMAIL_ERROR] Failed to send to ${user.email}:`, err.message);

                // Update recipient status to failed
                const recipient = await prisma.emailRecipient.findFirst({
                    where: {
                        massEmailId: massEmailRecord.id,
                        userId: user.id
                    }
                });

                if (recipient) {
                    await prisma.emailRecipient.update({
                        where: { id: recipient.id },
                        data: {
                            status: 'failed',
                            failedAt: new Date(),
                            errorMessage: err.message.substring(0, 500)
                        }
                    });
                }
            }
        }

        // Update mass email record with final counts
        await prisma.massEmail.update({
            where: { id: massEmailRecord.id },
            data: {
                sentCount,
                failedCount
            }
        });

        console.log(`Mass email finished. Sent: ${sentCount}, Failed: ${failedCount}`);
    })().catch(err => {
        console.error('[MASS_EMAIL_BACKGROUND_ERROR]', err);
    });
});

// @desc    Track email open
// @route   GET /api/admin/mass-email/:emailId/track/:recipientId/open
// @access  Public (tracking pixel)
const trackEmailOpen = asyncHandler(async (req, res) => {
    const { emailId, recipientId } = req.params;

    try {
        const recipient = await prisma.emailRecipient.findUnique({
            where: { id: recipientId }
        });

        if (recipient && recipient.massEmailId === emailId && !recipient.openedAt) {
            await prisma.emailRecipient.update({
                where: { id: recipientId },
                data: {
                    status: 'opened',
                    openedAt: new Date()
                }
            });

            // Update mass email opened count
            await prisma.massEmail.update({
                where: { id: emailId },
                data: {
                    openedCount: { increment: 1 }
                }
            });
        }
    } catch (err) {
        console.error('[EMAIL_TRACKING_ERROR]', err);
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(pixel);
});

// @desc    Get mass email history with tracking stats
// @route   GET /api/admin/mass-email
// @access  Private/Admin
const getMassEmailHistory = asyncHandler(async (req, res) => {
    const emails = await prisma.massEmail.findMany({
        include: {
            admin: {
                select: { name: true, email: true }
            },
            _count: {
                select: { recipients: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    res.json(formatResponse(true, 'Mass email history retrieved', emails));
});

// @desc    Get recipients for a specific mass email
// @route   GET /api/admin/mass-email/:id/recipients
// @access  Private/Admin
const getMassEmailRecipients = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.query; // Optional filter by status

    let where = { massEmailId: id };
    if (status) {
        where.status = status;
    }

    const recipients = await prisma.emailRecipient.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    res.json(formatResponse(true, 'Recipients retrieved', recipients));
});

module.exports = {
    sendMassEmailWithTracking,
    trackEmailOpen,
    getMassEmailHistory,
    getMassEmailRecipients
};
