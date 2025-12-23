const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get public pricing settings
// @route   GET /api/settings/pricing
// @access  Public
const getPublicPricing = asyncHandler(async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 },
            select: {
                freePlanName: true,
                freePlanPrice: true,
                freePlanDuration: true,
                proPlanName: true,
                proPlanPrice: true,
                proPlanDuration: true,
                schoolPlanName: true,
                schoolPlanPrice: true,
                schoolPlanDuration: true,
                freePlanLessonLimit: true,
                proPlanLessonLimit: true,
                schoolPlanLessonLimit: true,
            }
        });

        // If not found, these will be null. Pricing.tsx handles nulls with defaults.
        res.json(formatResponse(true, 'Pricing settings retrieved', settings || {}));
    } catch (err) {
        console.error('Failed to retrieve pricing settings', err);
        res.status(500);
        throw new Error('Failed to retrieve pricing settings');
    }
});

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = asyncHandler(async (req, res) => {
    try {
        let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        if (!settings) {
            // Initialize defaults from .env if available
            const initialData = {
                id: 1,
                port: parseInt(process.env.PORT) || 5000,
                databaseUrl: process.env.DATABASE_URL || "",
                nodeEnv: process.env.NODE_ENV || "development",
                jwtSecret: process.env.JWT_SECRET || "",
                jwtExpire: process.env.JWT_EXPIRE || "30d",
                googleGeminiApiKey: process.env.GOOGLE_GEMINI_API_KEY || "",
                cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
                cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
                cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
                paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
                paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
                smtpHost: process.env.SMTP_HOST || "",
                smtpPort: parseInt(process.env.SMTP_PORT) || 587,
                smtpUser: process.env.SMTP_USER || "",
                smtpPassword: process.env.SMTP_PASSWORD || "",
                smtpFromEmail: process.env.SMTP_FROM_EMAIL || "",
                smtpFromName: process.env.SMTP_FROM_NAME || "TeachAide AI",
                siteName: "TeachAide AI",
                siteTagline: "Lesson Notes in Seconds",
                siteLogo: "",
                siteLogoDark: "",
                siteFavicon: "",
                brandPrimaryColor: "#1F4FD8",
                brandSecondaryColor: "#16A34A",
                brandAccentColor: "#FBBF24",
                brandFont: "Inter"
            };
            settings = await prisma.systemSetting.create({ data: initialData });
        }
        // Mask sensitive fields before sending to client
        const maskedSettings = { ...settings };
        const sensitiveFields = [
            'smtpPassword', 'googleGeminiApiKey', 'cloudinaryApiKey',
            'cloudinaryApiSecret', 'paystackSecretKey', 'paystackPublicKey',
            'jwtSecret', 'databaseUrl'
        ];

        sensitiveFields.forEach(field => {
            if (maskedSettings[field]) {
                maskedSettings[field] = '**********';
            }
        });

        res.json(formatResponse(true, 'System settings retrieved', maskedSettings));
    } catch (err) {
        console.error('Failed to retrieve system settings', err);
        res.status(500);
        throw new Error('Failed to retrieve system settings');
    }
});

// @desc    Get public system settings (non-sensitive)
// @route   GET /api/settings/public
// @access  Public
const getPublicSettings = asyncHandler(async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 },
            select: {
                maintenanceMode: true,
                siteName: true,
                siteTagline: true,
                siteLogo: true,
                siteLogoDark: true,
                siteFavicon: true,
                brandPrimaryColor: true,
                brandSecondaryColor: true,
                brandFont: true,
                allowSignup: true
            }
        });

        res.json(formatResponse(true, 'Public settings retrieved', settings || {}));
    } catch (err) {
        console.error('Failed to retrieve public settings', err);
        res.status(500);
        throw new Error('Failed to retrieve public settings');
    }
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
        smtpFromName,
        googleGeminiApiKey,
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
        paystackSecretKey,
        paystackPublicKey,
        jwtSecret,
        jwtExpire,
        databaseUrl,
        port,
        nodeEnv,
        siteName,
        siteTagline,
        siteLogo,
        siteLogoDark,
        siteFavicon,
        brandPrimaryColor,
        brandSecondaryColor,
        brandAccentColor,
        brandFont,
        freePlanLessonLimit,
        proPlanLessonLimit,
        schoolPlanLessonLimit,
        freePlanTokenLimit,
        proPlanTokenLimit,
        schoolPlanTokenLimit
    } = req.body;

    try {
        // Fetch existing settings to handle masked sensitive fields
        const existingSettings = await prisma.systemSetting.findUnique({ where: { id: 1 } });

        const updateData = {
            maintenanceMode,
            allowSignup,
            defaultModel,
            maxTokens,
            lessonGenerationCost: Number(lessonGenerationCost),
            assessmentGenerationCost: Number(assessmentGenerationCost),
            smtpHost: (smtpHost || '').trim().replace(/\n/g, ''),
            smtpPort: Number(smtpPort),
            smtpUser: (smtpUser || '').trim(),
            smtpFromEmail: (smtpFromEmail || '').trim(),
            smtpFromName: (smtpFromName || '').trim(),
            cloudinaryCloudName: (cloudinaryCloudName || '').trim(),
            jwtExpire: (jwtExpire || '').trim(),
            port: Number(port),
            nodeEnv: (nodeEnv || '').trim(),
            siteName: (siteName || 'TeachAide AI').trim(),
            siteTagline: (siteTagline || 'Lesson Notes in Seconds').trim(),
            siteLogo: (siteLogo || '').trim(),
            siteLogoDark: (siteLogoDark || '').trim(),
            siteFavicon: (siteFavicon || '').trim(),
            brandPrimaryColor: (brandPrimaryColor || '#1F4FD8').trim(),
            brandSecondaryColor: (brandSecondaryColor || '#16A34A').trim(),
            brandAccentColor: (brandAccentColor || '#FBBF24').trim(),
            brandFont: (brandFont || 'Inter').trim(),
            freePlanLessonLimit: Number(freePlanLessonLimit) || 0,
            proPlanLessonLimit: Number(proPlanLessonLimit) || 0,
            schoolPlanLessonLimit: Number(schoolPlanLessonLimit) || 0,
            freePlanTokenLimit: Number(freePlanTokenLimit) || 0,
            proPlanTokenLimit: Number(proPlanTokenLimit) || 0,
            schoolPlanLessonLimit: Number(schoolPlanLessonLimit) || 0,
            freePlanTokenLimit: Number(freePlanTokenLimit) || 0,
            proPlanTokenLimit: Number(proPlanTokenLimit) || 0,
            schoolPlanTokenLimit: Number(schoolPlanTokenLimit) || 0,
            freePlanName: (req.body.freePlanName || '').trim(),
            freePlanPrice: Number(req.body.freePlanPrice) || 0,
            freePlanDuration: (req.body.freePlanDuration || '').trim(),
            proPlanName: (req.body.proPlanName || '').trim(),
            proPlanPrice: Number(req.body.proPlanPrice) || 0,
            proPlanDuration: (req.body.proPlanDuration || '').trim(),
            schoolPlanName: (req.body.schoolPlanName || '').trim(),
            schoolPlanPrice: Number(req.body.schoolPlanPrice) || 0,
            schoolPlanDuration: (req.body.schoolPlanDuration || '').trim()
        };

        // Only update sensitive fields if they aren't masked (e.g., *******)
        if (smtpPassword && !smtpPassword.startsWith('***')) updateData.smtpPassword = smtpPassword;
        if (googleGeminiApiKey && !googleGeminiApiKey.startsWith('***')) updateData.googleGeminiApiKey = googleGeminiApiKey;
        if (cloudinaryApiKey && !cloudinaryApiKey.startsWith('***')) updateData.cloudinaryApiKey = cloudinaryApiKey;
        if (cloudinaryApiSecret && !cloudinaryApiSecret.startsWith('***')) updateData.cloudinaryApiSecret = cloudinaryApiSecret;
        if (paystackSecretKey && !paystackSecretKey.startsWith('***')) updateData.paystackSecretKey = paystackSecretKey;
        if (paystackPublicKey && !paystackPublicKey.startsWith('***')) updateData.paystackPublicKey = paystackPublicKey;
        if (jwtSecret && !jwtSecret.startsWith('***')) updateData.jwtSecret = jwtSecret;
        if (databaseUrl && !databaseUrl.startsWith('***')) updateData.databaseUrl = databaseUrl;

        const settings = await prisma.systemSetting.upsert({
            where: { id: 1 },
            update: updateData,
            create: { id: 1, ...updateData }
        });

        // Sync with .env file
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '../../.env');

        try {
            let envContent = '';
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
            }

            const envMap = {
                'PORT': settings.port,
                'NODE_ENV': settings.nodeEnv,
                'DATABASE_URL': settings.databaseUrl,
                'JWT_SECRET': settings.jwtSecret,
                'JWT_EXPIRE': settings.jwtExpire,
                'GOOGLE_GEMINI_API_KEY': settings.googleGeminiApiKey,
                'GENAI_MODEL': settings.defaultModel,
                'CLOUDINARY_CLOUD_NAME': settings.cloudinaryCloudName,
                'CLOUDINARY_API_KEY': settings.cloudinaryApiKey,
                'CLOUDINARY_API_SECRET': settings.cloudinaryApiSecret,
                'PAYSTACK_SECRET_KEY': settings.paystackSecretKey,
                'PAYSTACK_PUBLIC_KEY': settings.paystackPublicKey,
                'SMTP_HOST': settings.smtpHost,
                'SMTP_PORT': settings.smtpPort,
                'SMTP_USER': settings.smtpUser,
                'SMTP_PASSWORD': settings.smtpPassword,
                'SMTP_FROM_EMAIL': settings.smtpFromEmail,
                'SMTP_FROM_NAME': settings.smtpFromName
            };

            Object.entries(envMap).forEach(([key, value]) => {
                if (value === undefined || value === null) return;

                const regex = new RegExp(`^${key}=.*`, 'gm');
                if (regex.test(envContent)) {
                    // Replace all occurrences of the key with the new value
                    envContent = envContent.replace(regex, `${key}=${value}`);
                } else {
                    envContent += `\n${key}=${value}`;
                }
                // Update current process env
                process.env[key] = String(value);
            });

            fs.writeFileSync(envPath, envContent.trim() + '\n');
        } catch (envError) {
            console.error('Failed to sync settings to .env file:', envError);
        }

        res.json(formatResponse(true, 'System settings updated and synced to .env', settings));
    } catch (err) {
        console.error('Failed to update system settings', err);
        res.status(500);
        throw new Error('Failed to update system settings');
    }
});

module.exports = {
    getSettings,
    updateSettings,
    getPublicPricing,
    getPublicSettings
};
