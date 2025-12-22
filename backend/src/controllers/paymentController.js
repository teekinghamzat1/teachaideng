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
        // If no key configured, we might verify via frontend callback alone (less secure) or mock it for dev
        // For security, always verify on backend.

        let isValid = false;
        let amountPaid = 0;

        if (secretKey) {
            console.log(`Verifying payment ref: ${reference}`);
            try {
                const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                    headers: { Authorization: `Bearer ${secretKey}` }
                });

                console.log("Paystack Response Status:", response.data.status);
                console.log("Paystack Data Status:", response.data.data.status); // success, abandoned, etc.

                if (response.data.status && response.data.data.status === 'success') {
                    isValid = true;
                    amountPaid = response.data.data.amount / 100; // Paystack returns kobo
                } else {
                    console.warn("Payment verification returned success: false or unexpected status");
                }
            } catch (axiosErr) {
                console.error("Axios Call Failed:", axiosErr.message);
                if (axiosErr.response) console.error("Axios Response:", axiosErr.response.data);
                throw axiosErr;
            }
        } else {
            // DEV FALLBACK without Key - ONLY FOR DEMO/TESTING
            console.warn("Paystack Secret Key missing. Accepting payment blindly for demo.");
            isValid = true; // Assume success if code reaches here in dev
            amountPaid = plan === 'Pro' ? 2500 : 20000;
        }

        if (isValid) {
            // Normalize plan name
            const normalizedPlan = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();

            // Update User Plan
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionPlan: normalizedPlan,
                    isSchoolAdmin: normalizedPlan === 'School' ? true : false
                }
            });

            // If School Plan, create school if it doesn't exist
            if (plan === 'School') {
                const existingSchool = await prisma.school.findFirst({
                    where: { ownerId: userId }
                });

                if (!existingSchool) {
                    const schoolName = updatedUser.schoolName || `${updatedUser.name}'s School`;
                    const slug = schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

                    await prisma.school.create({
                        data: {
                            name: schoolName,
                            slug,
                            ownerId: userId,
                            teacherLimit: updatedUser.teacherLimit || 15
                        }
                    });

                    console.log(`School created for user ${updatedUser.email}: ${schoolName}`);
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
                    // orderId is a Foreign Key to Order table. Since we don't create an Order record for subscriptions, we must leave this null.
                    // orderId: null
                }
            });

            // Send receipt email
            const { sendPaymentReceipt } = require('../utils/emailService');
            try {
                await sendPaymentReceipt(
                    updatedUser.email,
                    updatedUser.name,
                    plan,
                    amountPaid,
                    reference
                );
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
                // Don't fail the payment if email fails
            }

            res.json(formatResponse(true, `Upgraded to ${plan} Plan successfully`, updatedUser));
        } else {
            res.status(400);
            throw new Error('Payment verification failed');
        }

    } catch (error) {
        console.error("PAYMENT ERROR:", error.message);
        if (error.response) {
            console.error("Paystack API Error:", error.response.data);
        }
        res.status(400);
        // Pass the actual error message to the frontend for better debugging
        throw new Error(error.response?.data?.message || error.message || 'Payment verification failed');
    }
});

module.exports = {
    verifyPayment
};
