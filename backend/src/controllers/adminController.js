const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { getWeeklyLessonUsage } = require('../utils/usage');
const { createAdminLog } = require('../utils/auditLogger');
const usageService = require('../services/usageService');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    let userWhere = {};
    let noteWhere = {};
    let studentWhere = {};

    if (req.user.isSchoolAdmin && req.user.schoolId) {
        userWhere = { schoolId: req.user.schoolId };
        noteWhere = { user: { schoolId: req.user.schoolId } };
        studentWhere = { user: { schoolId: req.user.schoolId } };
    }

    const [
        totalUsers,
        totalNotes,
        totalSavedNotes,
        totalStudents,
        premiumUsers,
        ordersCount,
        productsCount,
        salesAggregate
    ] = await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.usageLog.count({
            where: {
                ...((req.user.isSchoolAdmin && req.user.schoolId) ? { user: { schoolId: req.user.schoolId } } : {}),
                action: { in: ['LESSON_GENERATION', 'ASSESSMENT_GENERATION'] }
            }
        }),
        prisma.lessonNote.count({ where: noteWhere }),
        prisma.student.count({ where: studentWhere }),
        prisma.user.count({
            where: {
                ...userWhere,
                OR: [{ subscriptionPlan: 'Pro' }, { subscriptionPlan: 'School' }]
            }
        }),
        req.user.isSchoolAdmin ? Promise.resolve(0) : prisma.order.count(),
        req.user.isSchoolAdmin ? Promise.resolve(0) : prisma.product.count(),
        req.user.isSchoolAdmin ? Promise.resolve({ _sum: { totalPrice: 0 } }) : prisma.order.aggregate({ _sum: { totalPrice: true }, where: { isPaid: true } })
    ]);

    const stats = {
        totalUsers,
        totalNotes,
        totalSavedNotes,
        totalStudents,
        premiumUsers,
        users: totalUsers,
        orders: ordersCount,
        products: productsCount,
        totalSales: salesAggregate._sum.totalPrice || 0,
    };

    res.json(formatResponse(true, 'Dashboard stats retrieved', stats));
});

// @desc    Get detailed AI analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let where = {
        createdAt: { gte: sevenDaysAgo },
        action: { in: ['LESSON_GENERATION', 'ASSESSMENT_GENERATION'] }
    };

    if (req.user.isSchoolAdmin && req.user.schoolId) {
        where.user = { schoolId: req.user.schoolId };
    }

    const logs = await prisma.usageLog.findMany({
        where,
        orderBy: { createdAt: 'asc' }
    });

    // Group logs by day
    const dailyStats = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize last 7 days keys
    for (let i = 0; i < 7; i++) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayName = days[d.getDay()];
        dailyStats[dayName] = 0;
    }

    // Populate counts
    let totalTokens = 0;
    let modelUsage = {};

    logs.forEach(log => {
        const dayName = days[new Date(log.createdAt).getDay()];
        if (dailyStats[dayName] !== undefined) {
            dailyStats[dayName]++;
        }

        // Parse metadata if available
        if (log.meta) {
            try {
                const meta = JSON.parse(log.meta);
                if (meta.tokens) totalTokens += meta.tokens;
                if (meta.model) {
                    modelUsage[meta.model] = (modelUsage[meta.model] || 0) + 1;
                }
            } catch (e) { }
        }
    });

    // Convert dailyStats to array ordered by day of week (just roughly for the chart, or better, simply key value)
    // Actually the chart expects an array. Let's formatted it as array of values for "Last 7 Days"
    // To implement "Last 7 Days" correctly on chart we need strict ordering from 6 days ago -> Today.

    const chartData = [];
    const chartLabels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayName = days[d.getDay()];
        chartData.push(dailyStats[dayName] || 0); // This logic above was flawed because it overwrites keys.
        // Let's redo grouping by date string to be accurate
    }

    // Correct aggregation
    const usageByDate = {};
    logs.forEach(log => {
        const dateStr = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        usageByDate[dateStr] = (usageByDate[dateStr] || 0) + 1;
    });

    const orderedLabels = [];
    const orderedData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        orderedLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        orderedData.push(usageByDate[label] || 0);
    }


    res.json(formatResponse(true, 'Analytics retrieved', {
        chartData: orderedData,
        chartLabels: orderedLabels,
        totalGenerations: logs.length,
        totalTokens,
        modelUsage
    }));
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    let where = {};
    // Only filter by school for regular school admins, not superadmins
    const userRole = (req.user?.role || '').toLowerCase();
    if (req.user.isSchoolAdmin && req.user.schoolId && userRole !== 'superadmin') {
        where.schoolId = req.user.schoolId;
    } else if (req.query.type === 'individual') {
        where.schoolId = null;
        where.isSchoolAdmin = false;
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptionPlan: true,
            subscriptionStartDate: true,
            subscriptionExpiryDate: true,
            isSchoolAdmin: true,
            teacherLimit: true,
            schoolId: true,
            createdAt: true,
            teacherStatus: true,
            school: {
                select: {
                    id: true,
                    name: true,
                    teacherLimit: true
                }
            },
            ownedSchools: {
                select: {
                    id: true,
                    name: true,
                    teacherLimit: true,
                    _count: {
                        select: {
                            teachers: true
                        }
                    }
                }
            }
        },
    });
    // OPTIMIZATION: Fetch settings once before the loop
    const systemSettings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const defaults = {
        'Free': { lessonLimit: systemSettings?.freePlanLessonLimit || 10 },
        'Pro': { lessonLimit: systemSettings?.proPlanLessonLimit || 100 },
        'School': { lessonLimit: systemSettings?.schoolPlanLessonLimit || 999999 }
    };

    const usersWithUsage = users.map((user) => {
        // We skip live "reset usage" update in the list to avoid N+1 writes and 504 timeouts.
        // Usage will be reset when the user logs in or a cron job runs.
        const plan = user.subscriptionPlan ? user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1).toLowerCase() : 'Free';
        const planLimit = defaults[plan]?.lessonLimit || 10;
        const effectiveLimit = Math.max(user.monthlyLessonLimit || 0, planLimit);
        const used = user.lessonsUsedThisMonth || 0;

        const formattedUsage = {
            used,
            limit: effectiveLimit,
            remaining: Math.max(0, effectiveLimit - used),
            resetDate: user.lastUsageReset
        };
        const { teacherStatus, ...rest } = user;
        return { ...rest, status: teacherStatus, usage: formattedUsage };
    });

    // Sort: paid users (School plans first, then Pro) first, then Free users. Within each tier, newer users first.
    const getPlanPriority = (plan) => {
        if (!plan) return 0;
        const normalized = plan.toLowerCase();
        if (normalized.startsWith('school')) return 2;
        if (normalized === 'pro') return 1;
        return 0;
    };

    usersWithUsage.sort((a, b) => {
        const priorityA = getPlanPriority(a.subscriptionPlan);
        const priorityB = getPlanPriority(b.subscriptionPlan);
        if (priorityB !== priorityA) {
            return priorityB - priorityA;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(formatResponse(true, 'Users retrieved', usersWithUsage));
});

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        include: {
            user: {
                select: { id: true, name: true }
            }
        }
    });
    res.json(formatResponse(true, 'Orders retrieved', orders));
});

// @desc    Create a new admin
// @route   POST /api/admin/create-admin
// @access  Private/SuperAdmin
const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (role && (role.toLowerCase() !== 'admin' && role.toLowerCase() !== 'superadmin')) {
        res.status(400);
        throw new Error('Invalid role specified. Can only be "admin" or "superadmin".');
    }

    const adminExists = await prisma.user.findUnique({
        where: { email },
    });

    if (adminExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || 'admin',
        },
    });

    if (admin) {
        res.status(201).json(
            formatResponse(true, 'Admin created successfully', {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            })
        );
    } else {
        res.status(400);
        throw new Error('Invalid admin data');
    }
});

// @desc    Get all content (Lesson Notes)
// @route   GET /api/admin/content/notes
// @access  Private/Admin
const getAllNotes = asyncHandler(async (req, res) => {
    let noteWhere = {};
    let sharedWhere = { type: 'lesson' };

    if (req.user.isSchoolAdmin && req.user.schoolId) {
        noteWhere = {
            user: {
                schoolId: req.user.schoolId
            }
        };
        sharedWhere.createdBy = {
            schoolId: req.user.schoolId
        };
    }

    const [notes, sharedContent] = await Promise.all([
        prisma.lessonNote.findMany({
            where: noteWhere,
            include: {
                user: {
                    select: { name: true, email: true, schoolId: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        }),
        prisma.sharedContent.findMany({
            where: sharedWhere,
            include: {
                createdBy: {
                    select: { name: true, email: true, schoolId: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        })
    ]);

    // Helper to safely parse JSON
    const safelyParse = (str) => {
        try {
            if (typeof str === 'object') return str;
            return JSON.parse(str);
        } catch (e) { return []; }
    };

    const formattedNotes = notes.map(note => ({
        ...note,
        references: safelyParse(note.references),
        objectives: safelyParse(note.objectives),
        instructionalMaterials: safelyParse(note.instructionalMaterials),
        presentation: safelyParse(note.presentation),
        evaluation: safelyParse(note.evaluation),
        source: 'UserSaved'
    }));

    const formattedShared = sharedContent.map(item => {
        let contentObj = {};
        try {
            contentObj = JSON.parse(item.content);
        } catch (e) { }

        return {
            id: item.id,
            userId: item.createdById,
            user: item.createdBy,
            topic: item.topic,
            subtopic: item.subtopic,
            classLevel: item.classLevel,
            subject: item.subject,
            lessonContent: contentObj.lessonContent || item.content,
            objectives: safelyParse(contentObj.objectives || []),
            references: safelyParse(contentObj.references || []),
            instructionalMaterials: safelyParse(contentObj.instructionalMaterials || []),
            presentation: safelyParse(contentObj.presentation || []),
            evaluation: safelyParse(contentObj.evaluation || []),
            duration: contentObj.duration || '',
            assignment: contentObj.assignment || '',
            conclusion: contentObj.conclusion || '',
            status: 'Generated',
            source: 'AIGenerated',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        };
    });

    // Merge and sort
    const allContent = [...formattedNotes, ...formattedShared]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 200);

    res.json(formatResponse(true, 'Content retrieved', allContent));
});

// @desc    Update content status
// @route   PUT /api/admin/content/notes/:id/status
// @access  Private/Admin
const updateNoteStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' | 'Flagged'

    let where = { id };
    if (req.user.isSchoolAdmin && req.user.schoolId) {
        where.user = { schoolId: req.user.schoolId };
    }

    const result = await prisma.lessonNote.updateMany({
        where,
        data: { status }
    });

    if (result.count === 0) {
        res.status(404);
        throw new Error('Note not found or you do not have permission to update it.');
    }

    res.json(formatResponse(true, `Content ${status}`, { id, status }));
});

// @desc    Create a new user (by Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, isSchoolAdmin, schoolId, subscriptionPlan } = req.body;

    // Restrict Admin/SuperAdmin creation
    if (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin')) {
        res.status(403);
        throw new Error('Forbidden: Admins cannot create other admins or superadmins.');
    }

    // Only SuperAdmin can create School Admins
    if (isSchoolAdmin && req.user.role !== 'superadmin') {
        res.status(403);
        throw new Error('Forbidden: Only SuperAdmins can create School Admins.');
    }

    const userExists = await prisma.user.findUnique({
        where: { email },
    });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            isSchoolAdmin: !!isSchoolAdmin,
            schoolId: schoolId || null,
            subscriptionPlan: subscriptionPlan || 'Free',
            dailyNoteLimit: (schoolId || isSchoolAdmin) ? 5 : 3
        },
    });

    await createAdminLog(req.user.id, req.user.schoolId, 'CREATE_USER', {
        createdUserId: user.id,
        role,
        email
    });

    if (user) {
        res.status(201).json(
            formatResponse(true, 'User created successfully', {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSchoolAdmin: user.isSchoolAdmin,
                schoolId: user.schoolId
            })
        );
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get all schools
// @route   GET /api/admin/schools
// @access  Private/Admin
const getSchools = asyncHandler(async (req, res) => {
    const schools = await prisma.school.findMany({
        include: {
            owner: {
                select: {
                    name: true,
                    email: true,
                    subscriptionStartDate: true,
                    subscriptionExpiryDate: true
                }
            },
            _count: {
                select: {
                    teachers: true,
                    lessonNotes: true,
                    assessments: true
                }
            }
        }
    });
    res.json(formatResponse(true, 'Schools retrieved', schools));
});

// @desc    Provision a new School and link an existing user as owner (admin only)
// @route   POST /api/admin/schools/provision
// @access  Private/Admin
const provisionSchool = asyncHandler(async (req, res) => {
    const { userId, schoolName, slug } = req.body;

    if (req.user.role !== 'superadmin') {
        res.status(403);
        throw new Error('Unauthorized: Only Super Admins can provision new schools.');
    }

    if (!userId || !schoolName) {
        res.status(400);
        throw new Error('userId and schoolName are required');
    }

    // Ensure user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Create school
    const school = await prisma.school.create({
        data: {
            name: schoolName,
            slug: slug || schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            ownerId: userId,
            teacherLimit: 15
        }
    });

    // Link user as school owner
    await prisma.user.update({ where: { id: userId }, data: { schoolId: school.id, isSchoolAdmin: true, subscriptionPlan: 'School', dailyNoteLimit: 5 } });

    res.status(201).json(formatResponse(true, 'School provisioned and user linked as owner', { school }));
});

// @desc    Permanently delete a user and associated data
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUserPermanently = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // Rule: Prevent self-deletion
    if (userId === req.user.id) {
        res.status(400);
        throw new Error('You cannot delete your own account.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Rule: SuperAdmins cannot be deleted via the API
    if (user.role === 'superadmin') {
        res.status(403);
        throw new Error('Forbidden: SuperAdmins cannot be deleted.');
    }

    // Rule: Admins cannot delete other Admins or SuperAdmins
    if (req.user.role === 'admin' && (user.role === 'admin' || user.role === 'superadmin')) {
        res.status(403);
        throw new Error('Forbidden: Admins cannot delete other admins.');
    }

    if (req.user.isSchoolAdmin && user.schoolId !== req.user.schoolId) {
        res.status(403);
        throw new Error('Unauthorized: You can only delete users from your own school.');
    }

    // Delete related data in a safe order to avoid FK constraint issues
    await prisma.$transaction([
        prisma.notificationRead.deleteMany({ where: { userId } }),
        prisma.timetableSlot.deleteMany({ where: { timetable: { userId } } }),
        prisma.timetable.deleteMany({ where: { userId } }),
        prisma.student.deleteMany({ where: { userId } }),
        prisma.question.deleteMany({ where: { assessment: { userId } } }),
        prisma.assessment.deleteMany({ where: { userId } }),
        prisma.lessonNote.deleteMany({ where: { userId } }),
        prisma.sharedContent.deleteMany({ where: { createdById: userId } }),
        prisma.tokenUsage.deleteMany({ where: { userId } }),
        prisma.transaction.deleteMany({ where: { userId } }),
        prisma.orderItem.deleteMany({ where: { order: { userId } } }),
        prisma.order.deleteMany({ where: { userId } }),
        prisma.usageLog.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: req.params.id } })
    ]);

    await createAdminLog(req.user.id, req.user.schoolId, 'DELETE_USER', {
        deletedUserId: req.params.id
    });

    res.json(formatResponse(true, 'User and related data permanently deleted'));
});

// @desc    Update school teacher limit
// @route   PATCH /api/admin/schools/:id/teacher-limit
// @access  Private/Admin
const updateSchoolTeacherLimit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teacherLimit } = req.body;

    if (req.user.isSchoolAdmin && req.user.schoolId !== id) {
        res.status(403);
        throw new Error('Unauthorized: You can only update your own school.');
    }

    if (!teacherLimit || teacherLimit < 1) {
        res.status(400);
        throw new Error('Teacher limit must be at least 1');
    }

    const school = await prisma.school.findUnique({
        where: { id }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    const updatedSchool = await prisma.school.update({
        where: { id: req.params.id },
        data: { teacherLimit: Number(teacherLimit) }
    });

    await createAdminLog(req.user.id, req.user.schoolId, 'UPDATE_TEACHER_LIMIT', {
        schoolId: req.params.id,
        newLimit: teacherLimit
    });

    res.json(formatResponse(true, 'Teacher limit updated', updatedSchool));
});

// @desc    Top up school notes
// @route   POST /api/admin/schools/:id/topup
// @access  Private/SuperAdmin
const topupSchoolNotes = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount < 1) {
        res.status(400);
        throw new Error('Top-up amount must be at least 1');
    }

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    const updatedSchool = await prisma.school.update({
        where: { id },
        data: { additionalNotes: { increment: Number(amount) } }
    });

    await createAdminLog(req.user.id, null, 'TOPUP_SCHOOL_NOTES', {
        schoolId: id,
        schoolName: school.name,
        amount: Number(amount)
    });

    res.json(formatResponse(true, `Added ${amount} notes to ${school.name}`, updatedSchool));
});

// @desc    Update school plan tier
// @route   PATCH /api/admin/schools/:id/tier
// @access  Private/SuperAdmin
const updateSchoolPlanTier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tier } = req.body; // 'Basic', 'Standard', 'Pro'

    if (!['Basic', 'Standard', 'Pro'].includes(tier)) {
        res.status(400);
        throw new Error('Invalid tier. Must be Basic, Standard, or Pro.');
    }

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    const updatedSchool = await prisma.school.update({
        where: { id },
        data: { planType: tier }
    });

    await createAdminLog(req.user.id, null, 'UPDATE_SCHOOL_TIER', {
        schoolId: id,
        schoolName: school.name,
        newTier: tier
    });

    res.json(formatResponse(true, `School plan updated to ${tier}`, updatedSchool));
});

// @desc    Test SMTP configuration
// @route   POST /api/admin/test-smtp
// @access  Private/Admin
const testSmtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email address is required');
    }

    const { sendTestEmail } = require('../utils/emailService');

    try {
        await sendTestEmail(email);
        res.json(formatResponse(true, 'Test email sent successfully! Check your inbox.'));
    } catch (error) {
        res.status(500);
        throw new Error(`Failed to send test email: ${error.message}`);
    }
});

// @desc    Reset user's weekly lesson limit
// @route   POST /api/admin/users/:id/reset-limit
// @access  Private/Admin
const resetUserLimit = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (req.user.isSchoolAdmin && user.schoolId !== req.user.schoolId) {
        res.status(403);
        throw new Error('Unauthorized: You can only reset limits for users in your own school.');
    }

    // Update user's usage counters to 0 and set reset date to now
    await prisma.user.update({
        where: { id: req.params.id },
        data: {
            lessonsUsedThisMonth: 0,
            tokensUsedThisMonth: 0,
            lastUsageReset: new Date(),
            lastLimitReset: new Date() // Keeping this for audit purposes
        }
    });

    await createAdminLog(req.user.id, req.user.schoolId, 'RESET_USER_LIMIT', {
        targetUserId: req.params.id
    });

    res.json(formatResponse(true, 'User limit reset successfully'));
});

// @desc    Get admin activity logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getAdminLogs = asyncHandler(async (req, res) => {
    let where = {};
    if (req.user.isSchoolAdmin && req.user.schoolId) {
        where = { schoolId: req.user.schoolId };
    }

    const logs = await prisma.adminLog.findMany({
        where,
        include: {
            user: {
                select: { name: true, email: true }
            },
            school: {
                select: { name: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    res.json(formatResponse(true, 'Admin logs retrieved', logs));
});

// @desc    Update user status (Suspended/Active)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Security: School admin can only update their own school's members
    if (req.user.isSchoolAdmin && user.schoolId !== req.user.schoolId) {
        res.status(403);
        throw new Error('Unauthorized: You can only manage users in your own school');
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { teacherStatus: status }
    });

    // Log the action
    await createAdminLog(req.user.id, updatedUser.schoolId, 'UPDATE_USER_STATUS', {
        targetUserId: id,
        targetUserName: updatedUser.name,
        newStatus: status
    });
    res.json(formatResponse(true, `User status updated to ${status}`, updatedUser));
});

// @desc    Update user plan
// @route   PUT /api/admin/users/:id/plan
// @access  Private/SuperAdmin
const updateUserPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { plan } = req.body; // 'Free', 'Pro', 'School'

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Don't arbitrarily lowercase everything because School_Basic becomes School_basic.
    // We'll normalize by ensuring exact case matches if it matches our known plans, otherwise keep as is.
    const validPlans = ['Free', 'Pro', 'School', 'School_Basic', 'School_Standard', 'School_Pro'];
    const matchedPlan = validPlans.find(p => p.toLowerCase() === plan.toLowerCase());
    const normalizedPlan = matchedPlan || (plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase());

    const isSchoolPlan = normalizedPlan.startsWith('School_') || normalizedPlan === 'School';

    // 1. Update basic plan info
    const isFree = normalizedPlan === 'Free';
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updateData = {
        subscriptionPlan: normalizedPlan,
        isSchoolAdmin: isSchoolPlan,
        dailyNoteLimit: isSchoolPlan ? 5 : 3,
        subscriptionStartDate: isFree ? null : now,
        subscriptionExpiryDate: isFree ? null : expiry
    };

    let updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
    });

    // 2. If promoted to School, ensure a school exists for them
    if (isSchoolPlan) {
        const tierMap = { 'School_Standard': 'Standard', 'School_Pro': 'Pro', 'School_Basic': 'Basic', 'School': 'Basic' };
        const tier = tierMap[normalizedPlan] || 'Basic';

        let existingSchool = await prisma.school.findFirst({
            where: { ownerId: id }
        });

        if (!existingSchool) {
            const schoolName = `${updatedUser.name}'s School`;
            const slug = schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

            existingSchool = await prisma.school.create({
                data: {
                    name: schoolName,
                    slug,
                    ownerId: id,
                    teacherLimit: 15,
                    planType: tier
                }
            });
        } else {
            // Update existing school's plan type
            existingSchool = await prisma.school.update({
                where: { id: existingSchool.id },
                data: { planType: tier }
            });
        }

        // Link user to their school
        updatedUser = await prisma.user.update({
            where: { id },
            data: {
                schoolId: existingSchool.id,
                isSchoolAdmin: true
            }
        });
    }

    // 3. Log the action
    await createAdminLog(req.user.id, null, 'UPDATE_USER_PLAN', {
        targetUserId: id,
        targetUserName: updatedUser.name,
        newPlan: normalizedPlan
    });

    res.json(formatResponse(true, `User plan updated to ${normalizedPlan}`, updatedUser));
});

// @desc    Send mass email to all or filtered users
// @route   POST /api/admin/mass-email
// @access  Private/SuperAdmin (or Admin if allowed)
const sendMassEmail = asyncHandler(async (req, res) => {
    const { subject, body, targetGroup } = req.body; // targetGroup: 'all', 'pro', 'free', 'school'

    if (!subject || !body) {
        res.status(400);
        throw new Error('Subject and body are required');
    }

    let where = { teacherStatus: 'Active' };
    if (targetGroup === 'pro') where.subscriptionPlan = 'Pro';
    if (targetGroup === 'free') where.subscriptionPlan = 'Free';
    if (targetGroup === 'school') where.subscriptionPlan = 'School';

    const users = await prisma.user.findMany({
        where,
        select: { email: true, name: true }
    });

    if (users.length === 0) {
        return res.json(formatResponse(true, 'No users found to email'));
    }

    const { getTransporter } = require('../utils/emailService');
    const transporter = await getTransporter();

    if (!transporter) {
        res.status(500);
        throw new Error('Email service not configured');
    }

    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    const fromEmail = settings.smtpFromEmail || settings.smtpUser;
    const fromName = settings.smtpFromName || 'TeachAide AI';

    // Create history record
    const massEmailRecord = await prisma.massEmail.create({
        data: {
            subject,
            body,
            targetGroup,
            recipientCount: users.length,
            adminId: req.user.id
        }
    });

    // Start sending in "background"
    res.json(formatResponse(true, `Started sending mass email to ${users.length} users.`, massEmailRecord));

    // Process in batches to avoid overwhelming SMTP or timing out if possible
    // Note: In serverless, this might still be cut off. 
    // But for now, we'll implement it as a robust loop.

    const sendBatch = async (batch) => {
        let successCount = 0;
        let failCount = 0;

        console.log(`Starting mass email send for ${batch.length} recipients...`);

        for (const user of batch) {
            try {
                const personalizedBody = body.replace(/\${user\.name}/g, user.name);

                await transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: user.email,
                    subject: subject,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                            <div style="background: #1e293b; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
                                <h2 style="margin: 0; font-size: 18px;">${settings.siteName || 'TeachAide AI'}</h2>
                            </div>
                            <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; line-height: 1.6;">
                                <p>Hello ${user.name},</p>
                                ${personalizedBody}
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                                <p style="font-size: 12px; color: #64748b;">
                                    You are receiving this because you are a registered user on TeachAide AI.<br>
                                    To manage your notification settings, please visit your account dashboard.
                                </p>
                            </div>
                        </div>
                    `
                });
                successCount++;
                // Small delay between emails to avoid spam filters (e.g. 500ms)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                failCount++;
                console.error(`[MASS_EMAIL_ERROR] Failed to send to ${user.email}:`, err.message);
            }
        }
        console.log(`Mass email finished. Success: ${successCount}, Failed: ${failCount}`);
    };

    // Run the sending process
    (async () => {
        await sendBatch(users);
        console.info(`Finished sending mass email: ${subject}`);
        await createAdminLog(req.user.id, null, 'SEND_MASS_EMAIL', {
            subject,
            recipientCount: users.length,
            targetGroup
        });
    })().catch(err => {
        console.error('Background mass email failed:', err);
        // Log individual failures if needed, but for now we log to console
    });
});

// @desc    Get mass email history
// @route   GET /api/admin/mass-email
// @access  Private/Admin
const getMassEmailHistory = asyncHandler(async (req, res) => {
    const history = await prisma.massEmail.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            admin: {
                select: { name: true, email: true }
            }
        }
    });
    res.json(formatResponse(true, 'Mass email history retrieved', history));
});

const { getErrorLogs, logError, resolveError } = require('./errorLogController');

module.exports = {
    getDashboardStats,
    getUsers,
    getOrders,
    createAdmin,
    createUser,
    getAllNotes,
    updateNoteStatus,
    updateSchoolTeacherLimit,
    testSmtp,
    provisionSchool,
    deleteUserPermanently,
    resetUserLimit,
    updateUserStatus,
    updateUserPlan,
    getAnalytics,
    getSchools,
    getAdminLogs,
    getErrorLogs,
    logError,
    resolveError,
    resolveError,
    sendMassEmail,
    getMassEmailHistory,
    topupSchoolNotes,
    updateSchoolPlanTier
};
