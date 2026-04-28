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
    const { path, userId, referrer, utmSource, utmMedium, utmCampaign } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        await prisma.trafficLog.create({
            data: {
                path,
                userId: userId || null,
                ip,
                userAgent,
                referrer: referrer || null,
                utmSource: utmSource || null,
                utmMedium: utmMedium || null,
                utmCampaign: utmCampaign || null
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

        // 5. Acquisition Sources (Channels)
        const sourcesRaw = await prisma.trafficLog.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            select: {
                referrer: true,
                utmSource: true
            }
        });

        const channelCounts = {
            'Direct': 0,
            'Social': 0,
            'Search': 0,
            'Referral': 0
        };

        const detailedSources = {};

        sourcesRaw.forEach(log => {
            let channel = 'Direct';
            let sourceName = 'Direct';

            if (log.utmSource) {
                sourceName = log.utmSource;
                const src = log.utmSource.toLowerCase();
                if (['facebook', 'instagram', 'twitter', 'linkedin', 'whatsapp', 't.co'].some(s => src.includes(s))) {
                    channel = 'Social';
                } else if (['google', 'bing', 'yahoo', 'duckduckgo'].some(s => src.includes(s))) {
                    channel = 'Search';
                } else {
                    channel = 'Referral';
                }
            } else if (log.referrer) {
                try {
                    const url = new URL(log.referrer);
                    const host = url.hostname.toLowerCase();
                    sourceName = host;

                    if (['facebook.com', 'instagram.com', 't.co', 'twitter.com', 'linkedin.com', 'whatsapp.com'].some(s => host.includes(s))) {
                        channel = 'Social';
                    } else if (['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'baidu.com'].some(s => host.includes(s))) {
                        channel = 'Search';
                    } else if (host.includes('teachaide.ai') || host.includes('localhost')) {
                        channel = 'Direct';
                        sourceName = 'Direct';
                    } else {
                        channel = 'Referral';
                    }
                } catch (e) {
                    channel = 'Direct';
                }
            }

            channelCounts[channel]++;
            if (sourceName !== 'Direct') {
                detailedSources[sourceName] = (detailedSources[sourceName] || 0) + 1;
            }
        });

        const topSources = Object.entries(detailedSources)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const channels = Object.entries(channelCounts)
            .map(([name, count]) => ({ name, count }));

        res.json(formatResponse(true, 'Report generated', {
            liveUsers,
            chartData,
            topTopics,
            topSubjects,
            topSources,
            channels,
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

// @desc    Get recent generation logs
// @route   GET /api/analytics/generations
// @access  Private/Admin
const getGenerations = asyncHandler(async (req, res) => {
    try {
        const generations = await prisma.usageLog.findMany({
            where: {
                action: { in: ['LESSON_GENERATION', 'ASSESSMENT_GENERATION'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        // Format data for frontend table
        const formatted = generations.map(log => {
            let meta = {};
            try {
                meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : log.meta || {};
            } catch (e) {}

            return {
                id: log.id,
                action: log.action,
                user: log.user ? { name: log.user.name, email: log.user.email } : { name: 'Unknown', email: 'N/A' },
                topic: meta.topic || 'N/A',
                subject: meta.subject || 'N/A',
                tokens: meta.tokens || 0,
                createdAt: log.createdAt
            };
        });

        res.json(formatResponse(true, 'Generations retrieved', formatted));
    } catch (error) {
        console.error('Failed to retrieve generations:', error);
        res.status(500).json(formatResponse(false, 'Failed to retrieve generations'));
    }
});

module.exports = {
    ping,
    trackPageView,
    getReport,
    cleanupSessions,
    getGenerations
};
