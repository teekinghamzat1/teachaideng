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
            const normalizedPlan = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();

            // 1. Initial Update of the user's plan
            let updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionPlan: normalizedPlan,
                    isSchoolAdmin: normalizedPlan === 'School'
                }
            });

            // 2. School License Specific Logic
            if (normalizedPlan === 'School') {
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
                            teacherLimit: 15
                        }
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
                        title: 'School Profile Setup Required',
                        message: 'Welcome to the School Plan! Please complete your school profile in the School Management dashboard.',
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

module.exports = { verifyPayment };
