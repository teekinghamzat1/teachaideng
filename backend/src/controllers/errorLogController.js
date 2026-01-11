const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

/**
 * @desc    Get error logs for admin insight
 * @route   GET /api/admin/error-logs
 * @access  Private/Admin
 */
const getErrorLogs = asyncHandler(async (req, res) => {
    const {
        severity,
        source,
        isResolved,
        page = 1,
        limit = 50
    } = req.query;

    const where = {};
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';

    // Global admin sees all, School admin sees their school (if we had schoolId in ErrorLog)
    // For now, these are system-wide errors.

    const logs = await prisma.errorLog.findMany({
        where,
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
    });

    const total = await prisma.errorLog.count({ where });

    res.json(formatResponse(true, 'Error logs retrieved', {
        logs,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    }));
});

/**
 * @desc    Log a new error (Public or Protected)
 * @route   POST /api/admin/error-logs
 * @access  Public (with secret/protection)
 */
const logError = asyncHandler(async (req, res) => {
    const {
        source,
        path,
        message,
        stack,
        metadata,
        severity = 'low'
    } = req.body;

    // Optional: add a lightweight secret check for public logging to avoid spam
    // if (req.headers['x-log-secret'] !== process.env.LOG_SECRET) { ... }

    const log = await prisma.errorLog.create({
        data: {
            userId: req.user ? req.user.id : null,
            source: source || 'BACKEND',
            path,
            message,
            stack,
            metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
            severity
        }
    });

    res.status(201).json(formatResponse(true, 'Error logged successfully', log));
});

/**
 * @desc    Mark error as resolved
 * @route   PUT /api/admin/error-logs/:id/resolve
 * @access  Private/Admin
 */
const resolveError = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isResolved = true } = req.body;

    const log = await prisma.errorLog.update({
        where: { id },
        data: { isResolved }
    });

    res.json(formatResponse(true, 'Error status updated', log));
});

module.exports = {
    getErrorLogs,
    logError,
    resolveError
};
