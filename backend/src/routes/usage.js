const express = require('express');
const router = express.Router();
const { getCurrentUsage, resetMonthlyUsage, setUserLimits } = require('../controllers/usageController');
const { protect, admin } = require('../middlewares/authMiddleware');

// User routes
router.get('/current', protect, getCurrentUsage);

// Admin routes
router.post('/reset', protect, admin, resetMonthlyUsage);
router.put('/users/:userId/limits', protect, admin, setUserLimits);

module.exports = router;
