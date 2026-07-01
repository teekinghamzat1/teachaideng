const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const formatResponse = require('../utils/formatResponse');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Helper to extract user ID from request for rate limiting
const getUserIdFromRequest = (req) => {
    // If auth middleware already ran
    if (req.user && req.user.id) {
        return req.user.id;
    }
    
    // Otherwise try to decode token from header
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);
            return decoded.id;
        } catch (error) {
            // Invalid token, just fallback to IP below
        }
    }
    
    return ipKeyGenerator(req.ip);
};

// General API Rate Limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getUserIdFromRequest,
    skip: () => process.env.NODE_ENV !== 'production',
    message: formatResponse(false, 'Too many requests from this user, please try again later'),
});

// Stricter Limiter for Auth and Generation endpoints
const strictLimiter = rateLimit({
    windowMs: parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 50,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getUserIdFromRequest,
    skip: () => process.env.NODE_ENV !== 'production',
    message: formatResponse(false, 'Too many sensitive requests from this user, please try again later'),
    handler: (req, res, next, options) => {
        const id = getUserIdFromRequest(req);
        console.warn(`[RATE_LIMIT_BLOCK] User/IP: ${id} exceeded limit on ${req.originalUrl}`);
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = {
    apiLimiter,
    strictLimiter
};
