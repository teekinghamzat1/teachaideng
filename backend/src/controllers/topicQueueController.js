const asyncHandler = require('express-async-handler');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processNextDraft } = require('../cron/blogAutoDraft');

// @desc    Get all topics in queue
// @route   GET /api/topics
// @access  Private/Admin
const getTopics = asyncHandler(async (req, res) => {
    const topics = await prisma.topicQueue.findMany({
        orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
        ]
    });
    res.json(topics);
});

// @desc    Add a topic to queue
// @route   POST /api/topics
// @access  Private/Admin
const addTopic = asyncHandler(async (req, res) => {
    const { topic, audience, category, priority } = req.body;

    const newTopic = await prisma.topicQueue.create({
        data: {
            topic,
            audience: audience || 'Teachers',
            category: category || 'General',
            priority: priority || 0,
            status: 'QUEUED'
        }
    });

    res.status(201).json(newTopic);
});

// @desc    Update a topic
// @route   PUT /api/topics/:id
// @access  Private/Admin
const updateTopic = asyncHandler(async (req, res) => {
    const { topic, audience, category, priority, status } = req.body;

    const existingTopic = await prisma.topicQueue.findUnique({
        where: { id: req.params.id }
    });

    if (existingTopic) {
        const updatedTopic = await prisma.topicQueue.update({
            where: { id: req.params.id },
            data: {
                topic: topic || existingTopic.topic,
                audience: audience || existingTopic.audience,
                category: category || existingTopic.category,
                priority: priority !== undefined ? priority : existingTopic.priority,
                status: status || existingTopic.status
            }
        });
        res.json(updatedTopic);
    } else {
        res.status(404);
        throw new Error('Topic not found');
    }
});

// @desc    Delete a topic
// @route   DELETE /api/topics/:id
// @access  Private/Admin
const deleteTopic = asyncHandler(async (req, res) => {
    const existingTopic = await prisma.topicQueue.findUnique({
        where: { id: req.params.id }
    });

    if (existingTopic) {
        await prisma.topicQueue.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Topic removed' });
    } else {
        res.status(404);
        throw new Error('Topic not found');
    }
});

const triggerWorker = asyncHandler(async (req, res) => {
    // Process the next draft manually asynchronously
    // Don't await it so we can close request quickly
    processNextDraft().catch(e => console.error("Manual trigger failed:", e));
    res.json({ message: 'Worker triggered' });
});

// @desc    Get current draft schedule
// @route   GET /api/topics/schedule
// @access  Private/Admin
const getSchedule = asyncHandler(async (req, res) => {
    const settings = await prisma.systemSetting.findUnique({
        where: { id: 1 },
        select: { blogAutoDraftSchedule: true }
    });
    res.json({ schedule: settings?.blogAutoDraftSchedule || '0 7,13,19 * * *' });
});

// @desc    Update draft schedule
// @route   PUT /api/topics/schedule
// @access  Private/Admin
const updateSchedule = asyncHandler(async (req, res) => {
    const { schedule } = req.body;

    // validate cron string roughly
    if (!schedule || schedule.split(' ').length < 5) {
        res.status(400);
        throw new Error('Invalid cron schedule format');
    }

    await prisma.systemSetting.update({
        where: { id: 1 },
        data: { blogAutoDraftSchedule: schedule }
    });

    const { rescheduleBlogDrafts } = require('../cron/blogAutoDraft');
    await rescheduleBlogDrafts();

    res.json({ message: 'Schedule updated', schedule });
});

module.exports = {
    getTopics,
    addTopic,
    updateTopic,
    deleteTopic,
    triggerWorker,
    getSchedule,
    updateSchedule
};
