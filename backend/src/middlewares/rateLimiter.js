const rateLimit = require('express-rate-limit');
const formatResponse = require('../utils/formatResponse');

// General API Rate Limiter
// 100 requests per 15 minutes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse(false, 'Too many requests from this IP, please try again after 15 minutes'),
});

// Stricter Limiter for Auth and Generation endpoints
// 20 requests per 15 minutes
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: formatResponse(false, 'Too many sensitive requests from this IP, please try again after 15 minutes'),
    handler: (req, res, next, options) => {
        console.warn(`[RATE_LIMIT_BLOCK] IP: ${req.ip} exceeded limit on ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
    }
});

module.exports = {
    apiLimiter,
    strictLimiter
};
