const express = require('express');
const router = express.Router();
const { verifyPayment, paystackWebhook } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/verify', protect, verifyPayment);
router.post('/webhook', paystackWebhook);

module.exports = router;
