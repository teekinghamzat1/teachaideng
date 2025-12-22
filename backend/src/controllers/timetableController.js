const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Save timetable
// @route   POST /api/timetable
// @access  Private
const saveTimetable = asyncHandler(async (req, res) => {
    const { className, boardName, title, configuration, slots } = req.body;

    // Delete existing timetable for user to replace it with fresh data (including fresh slots)
    await prisma.timetableSlot.deleteMany({
        where: { timetable: { userId: req.user.id } }
    });
    await prisma.timetable.deleteMany({
        where: { userId: req.user.id }
    });

    const timetable = await prisma.timetable.create({
        data: {
            userId: req.user.id,
            className: className || 'Default Class',
            boardName: boardName || '',
            title: title || '',
            configuration: configuration || '{}',
            slots: {
                create: slots && Array.isArray(slots) ? slots.map(slot => ({
                    day: slot.day,
                    time: slot.time,
                    subject: slot.subject
                })) : []
            }
        },
        include: { slots: true }
    });

    res.status(201).json(formatResponse(true, 'Timetable saved', timetable));
});

// @desc    Get user timetable
// @route   GET /api/timetable
// @access  Private
const getTimetable = asyncHandler(async (req, res) => {
    const timetable = await prisma.timetable.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: { slots: true }
    });
    res.json(formatResponse(true, 'Timetable retrieved', timetable));
});

module.exports = {
    saveTimetable,
    getTimetable,
};
