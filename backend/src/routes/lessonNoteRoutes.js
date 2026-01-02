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
        subtopic: z.string().optional().nullable(),
        classLevel: z.string().min(1),
        subject: z.string().min(1),
        duration: z.string().optional().nullable(),
        date: z.string().optional().nullable(),
        references: z.array(z.string()).optional().nullable(),
        objectives: z.array(z.string()).optional().nullable(),
        instructionalMaterials: z.array(z.string()).optional().nullable(),
        previousKnowledge: z.string().optional().nullable(),
        introduction: z.string().optional().nullable(),
        lessonContent: z.string().optional().nullable(),
        presentation: z.array(z.object({
            step: z.string().optional().nullable(),
            teacherActivity: z.string().optional().nullable(),
            pupilActivity: z.string().optional().nullable()
        })).optional().nullable(),
        evaluation: z.array(z.string()).optional().nullable(),
        assignment: z.string().optional().nullable(),
        conclusion: z.string().optional().nullable(),
        generatedByAI: z.boolean().optional(),
        schoolId: z.string().optional().nullable(),
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
