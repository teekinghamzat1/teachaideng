const express = require('express');
const router = express.Router();
const { ping, trackPageView, getReport, cleanupSessions } = require('../controllers/analyticsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/ping', ping);
router.post('/track', trackPageView);
router.get('/report', protect, admin, getReport);
router.delete('/sessions', protect, admin, cleanupSessions);

module.exports = router;
