const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

const parseAssessment = (assessment) => {
    return {
        ...assessment,
        questions: assessment.questions ? assessment.questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
        })) : []
    };
};

// @desc    Create an assessment
// @route   POST /api/assessments
// @access  Private
const createAssessment = asyncHandler(async (req, res) => {
    const { topic, classLevel, subject, questions } = req.body;

    const assessment = await prisma.assessment.create({
        data: {
            userId: req.user.id,
            schoolId: req.body.schoolId || req.user.schoolId, // Support both explicit and derived schoolId
            topic,
            classLevel,
            subject,
            questions: {
                create: questions.map(q => ({
                    type: q.type,
                    question: q.question,
                    options: q.options ? JSON.stringify(q.options) : null,
                    correctAnswer: q.correctAnswer
                }))
            }
        },
        include: { questions: true }
    });

    res.status(201).json(formatResponse(true, 'Assessment created', parseAssessment(assessment)));
});

// @desc    Get user assessments
// @route   GET /api/assessments
// @access  Private
const getAssessments = asyncHandler(async (req, res) => {
    const assessments = await prisma.assessment.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: { questions: true }
    });
    res.json(formatResponse(true, 'Assessments retrieved', assessments.map(parseAssessment)));
});

// @desc    Delete assessment
// @route   DELETE /api/assessments/:id
// @access  Private
const deleteAssessment = asyncHandler(async (req, res) => {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });

    if (assessment && assessment.userId === req.user.id) {
        await prisma.assessment.delete({ where: { id: req.params.id } });
        res.json(formatResponse(true, 'Assessment deleted'));
    } else {
        res.status(404);
        throw new Error('Assessment not found');
    }
});

module.exports = {
    createAssessment,
    getAssessments,
    deleteAssessment,
};
