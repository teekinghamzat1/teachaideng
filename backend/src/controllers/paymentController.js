const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const axios = require('axios');
const formatResponse = require('../utils/formatResponse');

// @desc    Verify Payment and Upgrade User
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
    const { reference, plan } = req.body;
    const userId = req.user.id;

    if (!reference || !plan) {
        res.status(400);
        throw new Error('Missing payment reference or plan');
    }

    try {
        // Verify with Paystack
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        let isValid = false;
        let amountPaid = 0;

        if (!secretKey) {
            console.error("CRITICAL: Paystack Secret Key is missing in environment variables.");
            res.status(500);
            throw new Error('Payment configuration error. Please contact support.');
        }

        try {
            const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${secretKey}` }
            });

            if (response.data.status && response.data.data.status === 'success') {
                isValid = true;
                amountPaid = response.data.data.amount / 100; // Paystack returns kobo
            } else {
                console.warn("Payment verification failed with status:", response.data.data?.status);
            }
        } catch (axiosErr) {
            console.error("Paystack Verification API Error:", axiosErr.response?.data?.message || axiosErr.message);
            throw new Error('Payment verification service unavailable');
        }

        if (isValid) {
            const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
            let normalizedPlan = plan;
            let isTopUp = false;
            let topUpType = '';

            // 1. Handle Top-Ups
            if (plan === 'TopUp_Individual' || plan === 'TopUp_School') {
                isTopUp = true;
                topUpType = plan;
            }

            // 2. Map Paystack Plan Codes to Internal Tiers
            if (!isTopUp) {
                if (plan === settings.proPlanCode) normalizedPlan = 'Pro';
                else if (plan === settings.schoolBasicPlanCode) normalizedPlan = 'School_Basic';
                else if (plan === settings.schoolStandardPlanCode) normalizedPlan = 'School_Standard';
                else if (plan === settings.schoolProPlanCode) normalizedPlan = 'School_Pro';
            }

            if (isTopUp) {
                // TOP-UP LOGIC
                if (topUpType === 'TopUp_Individual') {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { additionalNotes: { increment: settings.individualTopUpAmount || 100 } }
                    });
                } else if (topUpType === 'TopUp_School') {
                    const user = await prisma.user.findUnique({ where: { id: userId } });
                    if (user.schoolId) {
                        await prisma.school.update({
                            where: { id: user.schoolId },
                            data: { additionalNotes: { increment: settings.schoolTopUpAmount || 500 } }
                        });
                    }
                }

                // Log Transaction
                await prisma.transaction.create({
                    data: {
                        userId,
                        amount: amountPaid,
                        type: 'credit',
                        status: 'completed',
                        reference
                    }
                });

                return res.json(formatResponse(true, 'Top-up added successfully', {}));
            }

            // REGULAR PLAN UPGRADE LOGIC
            const isIndividualPro = normalizedPlan === 'Pro';
            const isSchoolPlan = normalizedPlan.startsWith('School_') || normalizedPlan === 'School';

            // Initial Update of the user's plan
            let updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionPlan: normalizedPlan,
                    isSchoolAdmin: isSchoolPlan,
                    dailyNoteLimit: isSchoolPlan ? 5 : 3,
                    // When upgrading to a paid plan, we might want to reset the lessons used if it's a fresh subscription
                    // but usually the reset logic handles this monthly.
                }
            });

            // School License Specific Logic
            if (isSchoolPlan) {
                let tier = 'Basic';
                if (normalizedPlan === 'School_Standard') tier = 'Standard';
                else if (normalizedPlan === 'School_Pro') tier = 'Pro';

                let existingSchool = await prisma.school.findFirst({
                    where: { ownerId: userId }
                });

                if (!existingSchool) {
                    const schoolName = updatedUser.schoolName || `${updatedUser.name}'s School`;
                    const slug = schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

                    existingSchool = await prisma.school.create({
                        data: {
                            name: schoolName,
                            slug,
                            ownerId: userId,
                            teacherLimit: 15,
                            planType: tier
                        }
                    });
                } else {
                    // Update existing school tier
                    existingSchool = await prisma.school.update({
                        where: { id: existingSchool.id },
                        data: { planType: tier }
                    });
                }

                // IMPORTANT: Link User to School
                updatedUser = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        schoolId: existingSchool.id,
                        isSchoolAdmin: true
                    }
                });

                // Notify User
                await prisma.notification.create({
                    data: {
                        title: 'School Profile Updated',
                        message: `Your school is now on the ${tier} plan! Manage your teachers and notes in the dashboard.`,
                        type: 'info',
                        target: userId
                    }
                });
            }

            // 3. Log Transaction
            await prisma.transaction.create({
                data: {
                    userId,
                    amount: amountPaid,
                    type: 'credit',
                    status: 'completed',
                    reference
                }
            });

            // 4. Send Receipt
            const { sendPaymentReceipt } = require('../utils/emailService');
            try {
                await sendPaymentReceipt(updatedUser.email, updatedUser.name, normalizedPlan, amountPaid, reference);
            } catch (e) { console.error('Email failed'); }

            res.json(formatResponse(true, `Upgraded to ${normalizedPlan} Plan successfully`, updatedUser));
        } else {
            res.status(400);
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        res.status(400);
        throw new Error(error.message || 'Payment verification failed');
    }
});


// @desc    Handle Paystack Webhooks for Subscriptions
// @route   POST /api/payment/webhook
// @access  Public
const paystackWebhook = asyncHandler(async (req, res) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', secretKey).update(JSON.stringify(req.body)).digest('hex');
    if (hash === req.headers['x-paystack-signature']) {
        const event = req.body;
        
        try {
            if (event.event === 'charge.success') {
                const { reference, amount, customer, plan } = event.data;
                const email = customer?.email;

                // Find user by email
                if (email) {
                    const user = await prisma.user.findUnique({ where: { email } });
                    
                    if (user) {
                        // Log recurring transaction
                        await prisma.transaction.upsert({
                            where: { reference },
                            update: {},
                            create: {
                                userId: user.id,
                                amount: amount / 100,
                                type: 'credit',
                                status: 'completed',
                                reference
                            }
                        });
                    }
                }
            } else if (event.event === 'subscription.disable' || event.event === 'invoice.payment_failed') {
                // If subscription fails or is cancelled, downgrade to Free
                const { customer } = event.data;
                const email = customer?.email;

                if (email) {
                    const user = await prisma.user.findUnique({ where: { email } });
                    if (user) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                subscriptionPlan: 'Free',
                                isSchoolAdmin: false,
                                dailyNoteLimit: 3
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Webhook processing error:', error);
        }
    }
    
    // Always return 200 to Paystack to acknowledge receipt
    res.status(200).send('OK');
});

module.exports = { verifyPayment, paystackWebhook };
