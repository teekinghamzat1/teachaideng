const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const tokens = require('../controllers/tokensController');

router.get('/balance', protect, tokens.getBalance);
router.get('/usage', protect, tokens.getUsage);
router.post('/estimate', protect, tokens.estimate);

// Admin routes
router.post('/admin/add', protect, tokens.adminAddTokens);
router.get('/admin/history/:userId', protect, tokens.adminUserHistory);

module.exports = router;
