const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get curriculum (subjects and class levels)
// @route   GET /api/curriculum
// @access  Private
const getCurriculum = asyncHandler(async (req, res) => {
    const subjects = await prisma.subject.findMany({ select: { name: true } });
    const classes = await prisma.classLevel.findMany({ select: { name: true } });

    const curriculum = {
        subjects: subjects.map(s => s.name),
        classLevels: classes.map(c => c.name)
    };

    res.json(formatResponse(true, 'Curriculum retrieved', curriculum));
});

// @desc    Update curriculum (Sync: Add new, Remove missing)
// @route   PUT /api/curriculum
// @access  Private/Admin
const updateCurriculum = asyncHandler(async (req, res) => {
    const { subjects, classLevels } = req.body;

    // Transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        // Sync Subjects
        if (subjects && Array.isArray(subjects)) {
            const currentSubjects = await tx.subject.findMany();
            const currentNames = currentSubjects.map(s => s.name);

            const toAdd = subjects.filter(name => !currentNames.includes(name));
            const toDelete = currentNames.filter(name => !subjects.includes(name));

            if (toDelete.length > 0) {
                await tx.subject.deleteMany({ where: { name: { in: toDelete } } });
            }
            for (const name of toAdd) {
                await tx.subject.create({ data: { name } });
            }
        }

        // Sync Classes
        if (classLevels && Array.isArray(classLevels)) {
            const currentClasses = await tx.classLevel.findMany();
            const currentNames = currentClasses.map(c => c.name);

            const toAdd = classLevels.filter(name => !currentNames.includes(name));
            const toDelete = currentNames.filter(name => !classLevels.includes(name));

            if (toDelete.length > 0) {
                await tx.classLevel.deleteMany({ where: { name: { in: toDelete } } });
            }
            for (const name of toAdd) {
                await tx.classLevel.create({ data: { name } });
            }
        }
    });

    // Return updated curriculum
    const updatedSubjects = await prisma.subject.findMany({ select: { name: true } });
    const updatedClasses = await prisma.classLevel.findMany({ select: { name: true } });

    res.json(formatResponse(true, 'Curriculum updated', {
        subjects: updatedSubjects.map(s => s.name),
        classLevels: updatedClasses.map(c => c.name)
    }));
});

// @desc    Seed default curriculum if empty
// @access  Internal
const seedDefaultCurriculum = async () => {
    const count = await prisma.subject.count();
    if (count === 0) {
        const defaultSubjects = [
            'Mathematics', 'English Language', 'Basic Science', 'Social Studies',
            'Civic Education', 'Agricultural Science', 'Home Economics',
            'C.R.S', 'I.R.S', 'Creative Arts'
        ];
        const defaultClasses = [
            'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
            'JSS 1', 'JSS 2', 'JSS 3'
        ];

        if (defaultSubjects.length > 0) {
            for (const name of defaultSubjects) {
                await prisma.subject.upsert({
                    where: { name },
                    update: {},
                    create: { name }
                });
            }
        }
        if (defaultClasses.length > 0) {
            for (const name of defaultClasses) {
                await prisma.classLevel.upsert({
                    where: { name },
                    update: {},
                    create: { name }
                });
            }
        }
    }
};

module.exports = {
    getCurriculum,
    updateCurriculum,
    seedDefaultCurriculum
};
