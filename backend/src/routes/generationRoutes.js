const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generateLesson, generateAssessment, generateRemark, generateSEOSummary } = require('../controllers/generationController');

router.post('/lesson', protect, generateLesson);
router.post('/assessment', protect, generateAssessment);
router.post('/remark', protect, generateRemark);
router.post('/seo-summary', protect, generateSEOSummary);

module.exports = router;
