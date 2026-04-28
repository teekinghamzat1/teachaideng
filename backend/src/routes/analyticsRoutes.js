const express = require('express');
const router = express.Router();
const { ping, trackPageView, getReport, cleanupSessions, getGenerations } = require('../controllers/analyticsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/ping', ping);
router.post('/track', trackPageView);
router.get('/report', protect, admin, getReport);
router.get('/generations', protect, admin, getGenerations);
router.delete('/sessions', protect, admin, cleanupSessions);

module.exports = router;
