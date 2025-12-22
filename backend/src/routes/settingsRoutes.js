const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getPublicPricing } = require('../controllers/settingsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/pricing', getPublicPricing);
router.get('/', protect, admin, getSettings);
router.put('/', protect, admin, updateSettings);

module.exports = router;
