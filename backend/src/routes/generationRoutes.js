const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generateLesson, generateAssessment, getGenerationDebug } = require('../controllers/generationController');

router.post('/lesson', protect, generateLesson);
router.post('/assessment', protect, generateAssessment);
router.get('/debug', protect, getGenerationDebug);

module.exports = router;
