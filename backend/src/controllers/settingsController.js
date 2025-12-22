const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
    let settings = await prisma.systemSetting.findUnique({
        where: { id: 1 }
    });

    if (!settings) {
        // Initialize default settings if not exists
        settings = await prisma.systemSetting.create({
            data: { id: 1 }
        });
    }

    res.json(formatResponse(true, 'System settings retrieved', settings));
});

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    const {
        maintenanceMode,
        allowSignup,
        defaultModel,
        maxTokens,
        lessonGenerationCost,
        assessmentGenerationCost,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpFromEmail,
        smtpFromName
    } = req.body;

    const settings = await prisma.systemSetting.upsert({
        where: { id: 1 },
        update: {
            maintenanceMode,
            allowSignup,
            defaultModel,
            maxTokens,
            lessonGenerationCost,
            assessmentGenerationCost,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpFromEmail,
            smtpFromName
        },
        create: {
            id: 1,
            maintenanceMode,
            allowSignup,
            defaultModel,
            maxTokens,
            lessonGenerationCost,
            assessmentGenerationCost,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPassword,
            smtpFromEmail,
            smtpFromName
        }
    });

    res.json(formatResponse(true, 'System settings updated', settings));
});

module.exports = {
    getSettings,
    updateSettings
};
