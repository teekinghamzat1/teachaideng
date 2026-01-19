const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get all reference schemes (optionally filter)
// @route   GET /api/reference-schemes
// @access  Admin
const getSchemes = asyncHandler(async (req, res) => {
    const { subject, classLevel, term } = req.query;

    const where = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (classLevel) where.classLevel = classLevel;
    if (term) where.term = term;

    const schemes = await prisma.referenceScheme.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            // Include count of weeks just for overview
            _count: { select: { weeks: true } }
        }
    });

    res.json(formatResponse(true, 'Schemes retrieved', schemes));
});

// @desc    Get single scheme details with full curriculum
// @route   GET /api/reference-schemes/:id
// @access  Admin
const getScheme = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const scheme = await prisma.referenceScheme.findUnique({
        where: { id },
        include: {
            weeks: {
                include: { topics: true },
                orderBy: { weekNumber: 'asc' }
            }
        }
    });

    if (!scheme) {
        res.status(404);
        throw new Error('Scheme not found');
    }

    res.json(formatResponse(true, 'Scheme retrieved', scheme));
});

// @desc    Create a new scheme
// @route   POST /api/reference-schemes
// @access  Admin
const createScheme = asyncHandler(async (req, res) => {
    const { subject, classLevel, term, source } = req.body;

    if (!subject || !classLevel || !term) {
        res.status(400);
        throw new Error('Missing required fields');
    }

    const existing = await prisma.referenceScheme.findFirst({
        where: { subject, classLevel, term }
    });

    if (existing) {
        res.status(400);
        throw new Error('Scheme already exists for this combination');
    }

    const scheme = await prisma.$transaction(async (tx) => {
        const newScheme = await tx.referenceScheme.create({
            data: { subject, classLevel, term, source }
        });

        // Scaffold 12 weeks
        for (let i = 1; i <= 12; i++) {
            await tx.referenceWeek.create({
                data: {
                    schemeId: newScheme.id,
                    weekNumber: i,
                    themeTitle: `Week ${i} Theme`
                }
            });
        }

        return newScheme;
    });

    res.status(201).json(formatResponse(true, 'Scheme created', scheme));
});

// @desc    Update week topics (Add/Edit/Remove in one go per week)
// @route   PUT /api/reference-schemes/:id/weeks/:weekNumber
// @access  Admin
const updateWeekTopics = asyncHandler(async (req, res) => {
    const { id, weekNumber } = req.params;
    const { topics, themeTitle } = req.body; // topics is array of { id?, topic, subtopics, lessonType }

    const scheme = await prisma.referenceScheme.findUnique({ where: { id } });
    if (!scheme) throw new Error('Scheme not found');

    const weekNum = parseInt(weekNumber);
    let week = await prisma.referenceWeek.findFirst({
        where: { schemeId: id, weekNumber: weekNum }
    });

    if (!week) {
        // Should exist from scaffolding, but safe to create
        week = await prisma.referenceWeek.create({
            data: { schemeId: id, weekNumber: weekNum, themeTitle }
        });
    } else if (themeTitle) {
        await prisma.referenceWeek.update({
            where: { id: week.id },
            data: { themeTitle }
        });
    }

    // Sync Topics
    if (topics && Array.isArray(topics)) {
        await prisma.$transaction(async (tx) => {
            // Get current topics
            const currentTopics = await tx.referenceTopic.findMany({ where: { weekId: week.id } });
            const incomingIds = topics.filter(t => t.id).map(t => t.id);

            // Delete removed
            const toDelete = currentTopics.filter(t => !incomingIds.includes(t.id)).map(t => t.id);
            if (toDelete.length > 0) {
                await tx.referenceTopic.deleteMany({ where: { id: { in: toDelete } } });
            }

            // Upsert
            for (const t of topics) {
                if (t.id) {
                    await tx.referenceTopic.update({
                        where: { id: t.id },
                        data: {
                            topic: t.topic,
                            subtopics: t.subtopics,
                            lessonType: t.lessonType
                        }
                    });
                } else {
                    await tx.referenceTopic.create({
                        data: {
                            weekId: week.id,
                            topic: t.topic,
                            subtopics: t.subtopics,
                            lessonType: t.lessonType
                        }
                    });
                }
            }
        });
    }

    const updatedWeek = await prisma.referenceWeek.findUnique({
        where: { id: week.id },
        include: { topics: true }
    });

    res.json(formatResponse(true, 'Week updated', updatedWeek));
});

// @desc    Delete scheme
// @route   DELETE /api/reference-schemes/:id
// @access  Admin
const deleteScheme = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.referenceScheme.delete({ where: { id } });
    res.json(formatResponse(true, 'Scheme deleted'));
});

module.exports = {
    getSchemes,
    getScheme,
    createScheme,
    updateWeekTopics,
    deleteScheme
};
