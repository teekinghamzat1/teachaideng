const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get public branding settings
// @route   GET /api/branding
// @access  Public
const getBrandingSettings = asyncHandler(async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const settings = await prisma.systemSetting.findFirst({
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
        });

        if (!settings) {
            // Return defaults if no settings exist
            return res.json(formatResponse(true, 'Default branding settings', {
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
            }));
        }

        res.json(formatResponse(true, 'Branding settings retrieved', { ...settings, userCount }));
    } catch (err) {
        console.error('Failed to retrieve branding settings', err);
        res.status(500);
        throw new Error('Failed to retrieve branding settings');
    }
});

module.exports = {
    getBrandingSettings
};
