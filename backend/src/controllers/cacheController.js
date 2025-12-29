const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc Save generated content to shared cache
// @route POST /api/cache
// @access Private
// @desc Save generated content to shared cache
// @route POST /api/cache
// @access Private
const saveGenerated = asyncHandler(async (req, res) => {
  const { type, subject, classLevel, topic, subtopic, content } = req.body;

  if (!type || !subject || !classLevel || !topic || !content) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  const entry = await prisma.sharedContent.create({
    data: {
      type: type.trim(),
      subject: subject.trim(),
      classLevel: classLevel.trim(),
      topic: topic.trim(),
      subtopic: (subtopic || '').trim(),
      content: typeof content === 'string' ? content : JSON.stringify(content),
      createdById: req.user ? req.user.id : undefined,
    }
  });

  res.status(201).json(formatResponse(true, 'Saved generated content', entry));
});

// @desc Query shared generated content
// @route GET /api/cache
// @access Private (readable by authenticated users)
const queryGenerated = asyncHandler(async (req, res) => {
  const { type, subject, classLevel, topic, subtopic, limit = 10 } = req.query;

  if (!type || !subject || !classLevel || !topic) {
    res.status(400);
    throw new Error('type, subject, classLevel and topic are required');
  }

  // Exact match only for all criteria
  const results = await prisma.sharedContent.findMany({
    where: {
      type: String(type).trim(),
      subject: String(subject).trim(),
      classLevel: String(classLevel).trim(),
      topic: { equals: String(topic).trim(), mode: 'insensitive' },
      subtopic: { equals: String(subtopic || '').trim(), mode: 'insensitive' },
    },
    orderBy: { usageCount: 'desc' },
    take: Number(limit)
  });

  res.json(formatResponse(true, 'Shared content retrieved', results));
});

// @desc Increment usage count (optional)
// @route PATCH /api/cache/:id/usage
// @access Private
const incrementUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const entry = await prisma.sharedContent.update({
    where: { id },
    data: { usageCount: { increment: 1 } }
  });
  res.json(formatResponse(true, 'Usage incremented', entry));
});

// @desc Delete shared content (admin or owner)
// @route DELETE /api/cache/:id
// @access Private
const deleteGenerated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const entry = await prisma.sharedContent.findUnique({ where: { id } });
  if (!entry) {
    res.status(404);
    throw new Error('Not found');
  }

  // Allow owner or admins to delete
  if (req.user && req.user.role !== 'Admin' && entry.createdById !== req.user.id) {
    res.status(403);
    throw new Error('Forbidden');
  }

  await prisma.sharedContent.delete({ where: { id } });
  res.json(formatResponse(true, 'Deleted'));
});

module.exports = {
  saveGenerated,
  queryGenerated,
  incrementUsage,
  deleteGenerated
};
