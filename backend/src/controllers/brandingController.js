const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// Simple in-memory cache for branding settings (refreshed every 5 minutes)
let brandingCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// @desc    Get public branding settings
// @route   GET /api/branding
// @access  Public
const getBrandingSettings = asyncHandler(async (req, res) => {
    try {
        // Check cache first
        const now = Date.now();
        if (brandingCache && (now - cacheTimestamp) < CACHE_DURATION) {
            return res.json(formatResponse(true, 'Branding settings retrieved (cached)', brandingCache));
        }

        // Fetch both in parallel to reduce wait time
        const [userCount, settings] = await Promise.all([
            prisma.user.count().catch(() => 1000), // Fallback to 1000 if count fails
            prisma.systemSetting.findFirst({
                select: {
                    siteName: true,
                    siteTagline: true,
                    siteLogo: true,
                    siteLogoDark: true,
                    siteFavicon: true,
                    brandPrimaryColor: true,
                    brandSecondaryColor: true,
                    brandAccentColor: true,
                    brandFont: true
                }
            })
        ]);

        const brandingData = settings ? { ...settings, userCount } : {
            siteName: 'TeachAide AI',
            siteTagline: 'AI Lesson Notes & Teaching Assistant for Nigerian Educators',
            siteLogo: '',
            siteLogoDark: '',
            siteFavicon: '',
            brandPrimaryColor: '#1F4FD8',
            brandSecondaryColor: '#16A34A',
            brandAccentColor: '#FBBF24',
            brandFont: 'Inter',
            userCount
        };

        // Update cache
        brandingCache = brandingData;
        cacheTimestamp = now;

        res.json(formatResponse(true, 'Branding settings retrieved', brandingData));
    } catch (err) {
        console.error('Failed to retrieve branding settings', err);

        // Return cached data if available, otherwise return defaults
        if (brandingCache) {
            return res.json(formatResponse(true, 'Branding settings retrieved (cached fallback)', brandingCache));
        }

        // Last resort: return hardcoded defaults
        res.json(formatResponse(true, 'Default branding settings', {
            siteName: 'TeachAide AI',
            siteTagline: 'AI Lesson Notes & Teaching Assistant for Nigerian Educators',
            siteLogo: '',
            siteLogoDark: '',
            siteFavicon: '',
            brandPrimaryColor: '#1F4FD8',
            brandSecondaryColor: '#16A34A',
            brandAccentColor: '#FBBF24',
            brandFont: 'Inter',
            userCount: 1000
        }));
    }
});

module.exports = {
    getBrandingSettings
};
