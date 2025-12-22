const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generateLesson, generateAssessment } = require('../controllers/generationController');

router.post('/lesson', protect, generateLesson);
router.post('/assessment', protect, generateAssessment);

module.exports = router;
