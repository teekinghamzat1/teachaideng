const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Ping to track active session
// @route   POST /api/analytics/ping
// @access  Public
const ping = asyncHandler(async (req, res) => {
    const { sessionId, userId } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!sessionId) {
        return res.status(400).json(formatResponse(false, 'Session ID required'));
    }

    try {
        await prisma.activeSession.upsert({
            where: { sessionId },
            update: {
                userId: userId || null,
                ip,
                userAgent,
                lastSeen: new Date()
            },
            create: {
                sessionId,
                userId: userId || null,
                ip,
                userAgent,
                lastSeen: new Date()
            }
        });

        res.json(formatResponse(true, 'Ping received'));
    } catch (error) {
        console.error('Ping failed:', error);
        res.status(500).json(formatResponse(false, 'Ping failed'));
    }
});

// @desc    Track page view
// @route   POST /api/analytics/track
// @access  Public
const trackPageView = asyncHandler(async (req, res) => {
    const { path, userId } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        await prisma.trafficLog.create({
            data: {
                path,
                userId: userId || null,
                ip,
                userAgent
            }
        });
        res.json(formatResponse(true, 'Traffic logged'));
    } catch (error) {
        console.error('Traffic tracking failed:', error);
        res.status(500).json(formatResponse(false, 'Tracking failed'));
    }
});

// @desc    Get analytics report
// @route   GET /api/analytics/report
// @access  Private/Admin
const getReport = asyncHandler(async (req, res) => {
    const { range = '30d' } = req.query;

    let startDate = new Date();
    if (range === '24h') startDate.setHours(startDate.getHours() - 24);
    else if (range === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (range === 'month') {
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else if (range === 'year') {
        startDate = new Date(startDate.getFullYear(), 0, 1);
    }

    try {
        // 1. Live Users (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const liveUsers = await prisma.activeSession.count({
            where: {
                lastSeen: { gte: fiveMinutesAgo }
            }
        });

        // 2. Traffic Stats
        const trafficData = await prisma.trafficLog.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate }
            },
            _count: {
                id: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // 3. Most Generated Content
        // We'll look at UsageLog for this
        const topTopicsRaw = await prisma.usageLog.findMany({
            where: {
                action: 'LESSON_GENERATION',
                createdAt: { gte: startDate }
            },
            select: {
                meta: true
            }
        });

        const topicCounts = {};
        const subjectCounts = {};

        topTopicsRaw.forEach(log => {
            try {
                const meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : log.meta;
                if (meta.topic) {
                    topicCounts[meta.topic] = (topicCounts[meta.topic] || 0) + 1;
                }
                if (meta.subject) {
                    subjectCounts[meta.subject] = (subjectCounts[meta.subject] || 0) + 1;
                }
            } catch (e) { }
        });

        const topTopics = Object.entries(topicCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topSubjects = Object.entries(subjectCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 4. Summarize traffic by day/hour for chart
        // Basic grouping logic (frontend can handle more complex grouping if we send raw enough data, but let's summarize here)
        const summarizedTraffic = {};
        trafficData.forEach(item => {
            const dateStr = item.createdAt.toISOString().split('T')[0];
            summarizedTraffic[dateStr] = (summarizedTraffic[dateStr] || 0) + item._count.id;
        });

        const chartData = Object.entries(summarizedTraffic).map(([date, visits]) => ({ date, visits }));

        res.json(formatResponse(true, 'Report generated', {
            liveUsers,
            chartData,
            topTopics,
            topSubjects,
            totalVisits: await prisma.trafficLog.count({ where: { createdAt: { gte: startDate } } }),
            uniqueUsers: (await prisma.trafficLog.groupBy({ by: ['ip'], where: { createdAt: { gte: startDate } } })).length
        }));

    } catch (error) {
        console.error('Report failed:', error);
        res.status(500).json(formatResponse(false, 'Failed to generate report'));
    }
});

// @desc    Cleanup old sessions
// @route   DELETE /api/analytics/sessions
// @access  Private/Admin
const cleanupSessions = asyncHandler(async (req, res) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await prisma.activeSession.deleteMany({
        where: {
            lastSeen: { lt: thirtyMinutesAgo }
        }
    });
    res.json(formatResponse(true, 'Expired sessions cleaned up'));
});

module.exports = {
    ping,
    trackPageView,
    getReport,
    cleanupSessions
};
