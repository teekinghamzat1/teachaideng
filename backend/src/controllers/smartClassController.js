const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Create a new Smart Class
// @route   POST /api/smart-class
// @access  Private
const createSmartClass = asyncHandler(async (req, res) => {
    const { classLevel, subject, term, startWeek } = req.body;

    if (!classLevel || !subject || !term) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    // Integrity Check: Prevent duplicate active smart classes for the same level and subject
    const existing = await prisma.smartClass.findFirst({
        where: {
            userId: req.user.id,
            classLevel,
            subject,
            isActive: true
        }
    });

    if (existing) {
        res.status(400);
        throw new Error(`You already have an active Smart Class for ${subject} in ${classLevel}`);
    }

    // Create the Smart Class
    const smartClass = await prisma.smartClass.create({
        data: {
            userId: req.user.id,
            classLevel,
            subject,
            term,
            startWeek: parseInt(startWeek) || 1
        }
    });

    // Default Pattern for English
    const patterns = {
        'English': [
            { day: 'Monday', type: 'Vocabulary Development' },
            { day: 'Tuesday', type: 'Comprehension' },
            { day: 'Wednesday', type: 'Normal Lesson' }, // Grammar -> Normal Lesson
            { day: 'Thursday', type: 'Normal Lesson' },   // Composition -> Normal Lesson
            { day: 'Friday', type: 'Normal Lesson' }      // Dictation -> Normal Lesson
        ]
    };

    // Use specific pattern or neutral one
    let patternKey = subject;
    if (subject === 'English Language' || subject.toLowerCase().includes('english')) {
        patternKey = 'English';
    }

    const pattern = patterns[patternKey] || [
        { day: 'Monday', type: 'Normal Lesson' },
        { day: 'Tuesday', type: 'Normal Lesson' },
        { day: 'Wednesday', type: 'Normal Lesson' },
        { day: 'Thursday', type: 'Normal Lesson' },
        { day: 'Friday', type: 'Normal Lesson' }
    ];

    // 4. Try to fetch Reference Scheme for this subject/class/term
    const referenceScheme = await prisma.referenceScheme.findFirst({
        where: {
            subject: { contains: subject, mode: 'insensitive' },
            classLevel,
            term,
            isActive: true
        },
        include: {
            weeks: {
                include: {
                    topics: true
                }
            }
        }
    });

    // Create days for 12 weeks of a term
    const daysData = [];
    for (let w = 1; w <= 12; w++) {
        // Find reference data for this week
        const refWeek = referenceScheme?.weeks.find(rw => rw.weekNumber === w);

        pattern.forEach((p, index) => {
            // Find a specific topic for this lesson type if provided in reference
            let refTopic = refWeek?.topics.find(rt =>
                rt.lessonType?.toLowerCase() === p.type.toLowerCase() ||
                (p.type === 'Vocabulary Development' && rt.topic.toLowerCase().includes('vocabulary'))
            );

            // Fallback: If no strict type match (e.g., Grammar -> Normal Lesson), use the positional index
            // This ensures we still grab the correct curriculum topic even if we simplified the lesson type
            if (!refTopic && refWeek?.topics) {
                // simple sort to ensure stability if IDs are roughly sequential
                const sortedTopics = [...refWeek.topics].sort((a, b) => a.createdAt - b.createdAt);
                refTopic = sortedTopics[index];
            }

            daysData.push({
                smartClassId: smartClass.id,
                weekNumber: w,
                dayOfWeek: p.day,
                lessonType: p.type,
                topic: refTopic?.topic || null,
                subtopic: refTopic?.subtopics ? refTopic.subtopics.split(',')[0].trim() : null,
                originalTopic: refTopic?.topic || null,
                refTopicId: refTopic?.id || null,
                skills: refTopic?.skills || null,
                learningGoal: refTopic?.learningGoal || null,
                resources: refTopic?.resourceSuggestions || null,
                isCompleted: false
            });
        });
    }

    await prisma.smartClassDay.createMany({
        data: daysData
    });

    res.json(formatResponse(true, 'Smart Class created successfully', smartClass));
});

// @desc    Get user's Smart Classes
// @route   GET /api/smart-class
// @access  Private
const getSmartClasses = asyncHandler(async (req, res) => {
    const smartClasses = await prisma.smartClass.findMany({
        where: { userId: req.user.id, isActive: true },
        include: {
            days: {
                orderBy: [
                    { weekNumber: 'asc' },
                    { createdAt: 'asc' }
                ]
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(formatResponse(true, 'Smart Classes retrieved', smartClasses));
});

// @desc    Mark a day as completed
// @route   PUT /api/smart-class/days/:dayId/complete
// @access  Private
const markDayComplete = asyncHandler(async (req, res) => {
    const { dayId } = req.params;

    const day = await prisma.smartClassDay.findUnique({
        where: { id: dayId },
        include: { smartClass: true }
    });

    if (!day || day.smartClass.userId !== req.user.id) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const updatedDay = await prisma.smartClassDay.update({
        where: { id: dayId },
        data: { isCompleted: true }
    });

    res.json(formatResponse(true, 'Day marked as completed', updatedDay));
});

// @desc    Unmark a day as completed
// @route   PUT /api/smart-class/days/:dayId/uncomplete
// @access  Private
const unmarkDayComplete = asyncHandler(async (req, res) => {
    const { dayId } = req.params;

    const day = await prisma.smartClassDay.findUnique({
        where: { id: dayId },
        include: { smartClass: true }
    });

    if (!day || day.smartClass.userId !== req.user.id) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const updatedDay = await prisma.smartClassDay.update({
        where: { id: dayId },
        data: { isCompleted: false }
    });

    res.json(formatResponse(true, 'Day uncompleted', updatedDay));
});

// @desc    Update a day's topic (Override logic)
// @route   PUT /api/smart-class/days/:dayId/topic
// @access  Private
const updateDayTopic = asyncHandler(async (req, res) => {
    const { dayId } = req.params;
    const { topic, subtopic } = req.body;

    const day = await prisma.smartClassDay.findUnique({
        where: { id: dayId },
        include: { smartClass: true }
    });

    if (!day || day.smartClass.userId !== req.user.id) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const updatedDay = await prisma.smartClassDay.update({
        where: { id: dayId },
        data: {
            ...(topic !== undefined && { topic }),
            ...(subtopic !== undefined && { subtopic })
        }
    });

    res.json(formatResponse(true, 'Topic updated', updatedDay));
});

// @desc    Delete a smart class (Deactivate)
// @route   DELETE /api/smart-class/:id
// @access  Private
const deleteSmartClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const smartClass = await prisma.smartClass.findUnique({
        where: { id }
    });

    if (!smartClass || smartClass.userId !== req.user.id) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    await prisma.smartClass.update({
        where: { id },
        data: { isActive: false }
    });

    res.json(formatResponse(true, 'Smart Class deleted'));
});

module.exports = {
    createSmartClass,
    getSmartClasses,
    markDayComplete,
    unmarkDayComplete,
    updateDayTopic,
    deleteSmartClass
};
