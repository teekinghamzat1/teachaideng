const express = require('express');
const router = express.Router();
const {
    createNote,
    getNotes,
    getNoteById,
    deleteNote,
    emailNote,
} = require('../controllers/lessonNoteController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const createNoteSchema = z.object({
    body: z.object({
        topic: z.string().min(1),
        subtopic: z.string().optional(),
        classLevel: z.string().min(1),
        subject: z.string().min(1),
        duration: z.string().optional(),
        date: z.string().optional(),
        references: z.array(z.string()).optional(),
        objectives: z.array(z.string()).optional(),
        instructionalMaterials: z.array(z.string()).optional(),
        previousKnowledge: z.string().optional(),
        introduction: z.string().optional(),
        lessonContent: z.string().optional(),
        presentation: z.array(z.object({
            step: z.string(),
            teacherActivity: z.string(),
            pupilActivity: z.string()
        })).optional(),
        evaluation: z.array(z.string()).optional(),
        assignment: z.string().optional(),
        conclusion: z.string().optional(),
        generatedByAI: z.boolean().optional(),
    }),
});

router.route('/')
    .post(protect, validate(createNoteSchema), createNote)
    .get(protect, getNotes);

router.route('/:id')
    .get(protect, getNoteById)
    .delete(protect, deleteNote);

router.post('/:id/email', protect, emailNote);

module.exports = router;
