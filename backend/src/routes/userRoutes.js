const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    getUserTransactions,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        avatar: z.string().optional(),
    }),
});

router.route('/profile')
    .get(protect, getUserProfile)
    .patch(protect, validate(updateProfileSchema), updateUserProfile);

router.get('/orders', protect, getUserOrders);
router.get('/transactions', protect, getUserTransactions);

module.exports = router;
