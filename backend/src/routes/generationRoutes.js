const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generateLesson, generateAssessment, generateRemark } = require('../controllers/generationController');

router.post('/lesson', protect, generateLesson);
router.post('/assessment', protect, generateAssessment);
router.post('/remark', protect, generateRemark);

module.exports = router;
