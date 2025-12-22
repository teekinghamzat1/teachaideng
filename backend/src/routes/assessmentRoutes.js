const express = require('express');
const router = express.Router();
const {
    createAssessment,
    getAssessments,
    deleteAssessment,
} = require('../controllers/assessmentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createAssessment)
    .get(protect, getAssessments);

router.route('/:id')
    .delete(protect, deleteAssessment);

module.exports = router;
