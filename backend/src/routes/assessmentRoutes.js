const express = require('express');
const router = express.Router();
const {
    createAssessment,
    getAssessments,
    deleteAssessment,
} = require('../controllers/assessmentController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const createAssessmentSchema = z.object({
    body: z.object({
        topic: z.string().min(1),
        classLevel: z.string().min(1),
        subject: z.string().min(1),
        questions: z.array(z.object({
            type: z.string().min(1),
            question: z.string().min(1),
            options: z.array(z.string()).optional().nullable(),
            correctAnswer: z.string().min(1)
        })).min(1)
    }),
});

router.route('/')
    .post(protect, validate(createAssessmentSchema), createAssessment)
    .get(protect, getAssessments);

router.route('/:id')
    .delete(protect, deleteAssessment);

module.exports = router;
