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
            const isTopUp = plan === 'TopUp_Individual' || plan === 'TopUp_School';
            const topUpType = isTopUp ? plan : '';

            // 2. Map Paystack Plan Codes to Internal Tiers
            const planMap = {
                [settings.proPlanCode]: 'Pro',
                [settings.schoolBasicPlanCode]: 'School_Basic',
                [settings.schoolStandardPlanCode]: 'School_Standard',
                [settings.schoolProPlanCode]: 'School_Pro'
            };
            const normalizedPlan = (!isTopUp && planMap[plan]) ? planMap[plan] : plan;

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
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionPlan: normalizedPlan,
                    isSchoolAdmin: isSchoolPlan,
                    dailyNoteLimit: isSchoolPlan ? 5 : 3,
                }
            });

            let finalUser = updatedUser;

            // School License Specific Logic
            if (isSchoolPlan) {
                const tierMap = { 'School_Standard': 'Standard', 'School_Pro': 'Pro' };
                const tier = tierMap[normalizedPlan] || 'Basic';

                const existingSchool = await prisma.school.findFirst({
                    where: { ownerId: userId }
                });

                let schoolRecord;
                if (!existingSchool) {
                    const schoolName = updatedUser.schoolName || `${updatedUser.name}'s School`;
                    const schoolAddress = updatedUser.schoolAddress || null;
                    const slug = schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

                    schoolRecord = await prisma.school.create({
                        data: {
                            name: schoolName,
                            slug,
                            ownerId: userId,
                            teacherLimit: 15,
                            planType: tier,
                            address: schoolAddress
                        }
                    });
                } else {
                    // Update existing school tier
                    schoolRecord = await prisma.school.update({
                        where: { id: existingSchool.id },
                        data: { planType: tier }
                    });
                }

                // IMPORTANT: Link User to School
                finalUser = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        schoolId: schoolRecord.id,
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
                await sendPaymentReceipt(finalUser.email, finalUser.name, normalizedPlan, amountPaid, reference);
            } catch (e) { console.error('Email failed'); }

            res.json(formatResponse(true, `Upgraded to ${normalizedPlan} Plan successfully`, finalUser));
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
