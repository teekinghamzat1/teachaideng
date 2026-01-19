const rateLimit = require('express-rate-limit');
const formatResponse = require('../utils/formatResponse');

// General API Rate Limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    message: formatResponse(false, 'Too many requests from this IP, please try again later'),
});

// Stricter Limiter for Auth and Generation endpoints
const strictLimiter = rateLimit({
    windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 50,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production',
    message: formatResponse(false, 'Too many sensitive requests from this IP, please try again later'),
    handler: (req, res, next, options) => {
        console.warn(`[RATE_LIMIT_BLOCK] IP: ${req.ip} exceeded limit on ${req.originalUrl}`);
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = {
    apiLimiter,
    strictLimiter
};
