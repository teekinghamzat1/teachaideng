const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Save timetable
// @route   POST /api/timetable
// @access  Private
const saveTimetable = asyncHandler(async (req, res) => {
    const { className, slots } = req.body;

    // Creating a new timetable entry. 
    // Assuming 'slots' is an array of objects { day, time, subject }

    // Check if user already has a timetable? 
    // The prompt says "save", could mean update. 
    // Mongoose implementation was creating new one.
    // Let's create new one but maybe we want to delete old ones if it's a replacement?
    // Let's just create new one for now as per Mongoose logic.

    const timetable = await prisma.timetable.create({
        data: {
            userId: req.user.id,
            className: className || 'Default Class',
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
