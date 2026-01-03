const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { getWeeklyLessonUsage } = require('../utils/usage');
const { createAdminLog } = require('../utils/auditLogger');

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

    const totalUsers = await prisma.user.count({ where: userWhere });
    const totalNotes = await prisma.lessonNote.count({ where: noteWhere });
    const totalStudents = await prisma.student.count({ where: studentWhere });
    const premiumUsers = await prisma.user.count({
        where: {
            ...userWhere,
            OR: [{ subscriptionPlan: 'Pro' }, { subscriptionPlan: 'School' }]
        }
    });

    const stats = {
        totalUsers,
        totalNotes,
        totalStudents,
        premiumUsers,
        // Keeping original ones just in case
        users: totalUsers,
        orders: req.user.isSchoolAdmin ? 0 : await prisma.order.count(),
        products: req.user.isSchoolAdmin ? 0 : await prisma.product.count(),
        totalSales: req.user.isSchoolAdmin ? 0 : (await prisma.order.aggregate({ _sum: { totalPrice: true }, where: { isPaid: true } }))._sum.totalPrice || 0,
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
    if (req.user.isSchoolAdmin && req.user.schoolId) {
        where.schoolId = req.user.schoolId;
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptionPlan: true,
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
    const usersWithUsage = await Promise.all(users.map(async (user) => {
        const usage = await getWeeklyLessonUsage(user.id);
        // Map teacherStatus to status for frontend compatibility
        const { teacherStatus, ...rest } = user;
        return { ...rest, status: teacherStatus, usage };
    }));

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
    let where = {};
    if (req.user.isSchoolAdmin && req.user.schoolId) {
        where = {
            user: {
                schoolId: req.user.schoolId
            }
        };
    }

    const notes = await prisma.lessonNote.findMany({
        where,
        include: {
            user: {
                select: { name: true, email: true, schoolId: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    // Helper to safely parse JSON
    const safelyParse = (str) => {
        try { return JSON.parse(str); } catch (e) { return []; }
    };

    const formattedNotes = notes.map(note => ({
        ...note,
        references: typeof note.references === 'string' ? safelyParse(note.references) : note.references,
        objectives: typeof note.objectives === 'string' ? safelyParse(note.objectives) : note.objectives,
        instructionalMaterials: typeof note.instructionalMaterials === 'string' ? safelyParse(note.instructionalMaterials) : note.instructionalMaterials,
        presentation: typeof note.presentation === 'string' ? safelyParse(note.presentation) : note.presentation,
        evaluation: typeof note.evaluation === 'string' ? safelyParse(note.evaluation) : note.evaluation,
    }));

    res.json(formatResponse(true, 'Notes retrieved', formattedNotes));
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
                select: { name: true, email: true }
            },
            _count: {
                select: { teachers: true }
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
    await prisma.user.update({ where: { id: userId }, data: { schoolId: school.id, isSchoolAdmin: true, subscriptionPlan: 'School' } });

    res.status(201).json(formatResponse(true, 'School provisioned and user linked as owner', { school }));
});

// @desc    Permanently delete a user and associated data
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUserPermanently = asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
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

    // Update user's lastLimitReset to now
    await prisma.user.update({
        where: { id: req.params.id },
        data: { lastLimitReset: new Date() }
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
    getAnalytics,
    getSchools,
    getAdminLogs
};
