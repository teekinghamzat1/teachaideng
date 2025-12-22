const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

const parseNote = (note) => {
    return {
        ...note,
        references: note.references ? JSON.parse(note.references) : [],
        objectives: note.objectives ? JSON.parse(note.objectives) : [],
        instructionalMaterials: note.instructionalMaterials ? JSON.parse(note.instructionalMaterials) : [],
        presentation: note.presentation ? JSON.parse(note.presentation) : [],
        evaluation: note.evaluation ? JSON.parse(note.evaluation) : [],
    };
};

// @desc    Create a lesson note
// @route   POST /api/notes
// @access  Private
const createNote = asyncHandler(async (req, res) => {
    const {
        topic, subtopic, classLevel, subject, duration, date,
        references, objectives, instructionalMaterials, previousKnowledge,
        introduction, lessonContent, presentation, evaluation, assignment, conclusion
    } = req.body;

    const note = await prisma.lessonNote.create({
        data: {
            userId: req.user.id,
            topic, subtopic, classLevel, subject, duration,
            date: date ? new Date(date) : undefined,
            references: references ? JSON.stringify(references) : '[]',
            objectives: objectives ? JSON.stringify(objectives) : '[]',
            instructionalMaterials: instructionalMaterials ? JSON.stringify(instructionalMaterials) : '[]',
            previousKnowledge, introduction, lessonContent,
            presentation: presentation ? JSON.stringify(presentation) : '[]',
            evaluation: evaluation ? JSON.stringify(evaluation) : '[]',
            assignment, conclusion
        }
    });

    res.status(201).json(formatResponse(true, 'Lesson note created', parseNote(note)));
});

// @desc    Get user lesson notes
// @route   GET /api/notes
// @access  Private
const getNotes = asyncHandler(async (req, res) => {
    const notes = await prisma.lessonNote.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
    });

    // Parse JSON fields for each note
    const parsedNotes = notes.map(parseNote);

    res.json(formatResponse(true, 'Lesson notes retrieved', parsedNotes));
});

// @desc    Get single lesson note
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = asyncHandler(async (req, res) => {
    const note = await prisma.lessonNote.findUnique({
        where: { id: req.params.id }
    });

    if (note && note.userId === req.user.id) {
        res.json(formatResponse(true, 'Lesson note retrieved', parseNote(note)));
    } else {
        res.status(404);
        throw new Error('Note not found');
    }
});

// @desc    Delete lesson note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = asyncHandler(async (req, res) => {
    const note = await prisma.lessonNote.findUnique({ where: { id: req.params.id } });

    if (note && note.userId === req.user.id) {
        await prisma.lessonNote.delete({ where: { id: req.params.id } });
        res.json(formatResponse(true, 'Lesson note deleted'));
    } else {
        res.status(404);
        throw new Error('Note not found');
    }
});

module.exports = {
    createNote,
    getNotes,
    getNoteById,
    deleteNote,
};
