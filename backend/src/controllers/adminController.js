const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalUsers = await prisma.user.count();
    const totalNotes = await prisma.lessonNote.count();
    const totalStudents = await prisma.student.count();
    const premiumUsers = 0; // Placeholder until premium logic is defined or derived from Orders

    const stats = {
        totalUsers,
        totalNotes,
        totalStudents,
        premiumUsers,
        // Keeping original ones just in case
        users: totalUsers,
        orders: await prisma.order.count(),
        products: await prisma.product.count(),
        totalSales: (await prisma.order.aggregate({ _sum: { totalPrice: true }, where: { isPaid: true } }))._sum.totalPrice || 0,
    };

    res.json(formatResponse(true, 'Dashboard stats retrieved', stats));
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
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
    res.json(formatResponse(true, 'Users retrieved', users));
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
// @access  Private/SuperAdmin (or Admin for now)
const createAdmin = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

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
            role: 'superadmin', // or admin
        },
    });

    if (admin) {
        res.status(201).json(
            formatResponse(true, 'Admin created successfully', {
                _id: admin.id,
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
    const notes = await prisma.lessonNote.findMany({
        include: {
            user: {
                select: { name: true, email: true }
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

    const note = await prisma.lessonNote.update({
        where: { id },
        data: { status }
    });

    res.json(formatResponse(true, `Content ${status}`, note));
});

// @desc    Create a new user (by Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

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
        },
    });

    if (user) {
        res.status(201).json(
            formatResponse(true, 'User created successfully', {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            })
        );
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Provision a new School and link an existing user as owner (admin only)
// @route   POST /api/admin/schools/provision
// @access  Private/Admin
const provisionSchool = asyncHandler(async (req, res) => {
    const { userId, schoolName, slug } = req.body;

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

// @desc    Update school teacher limit
// @route   PATCH /api/admin/schools/:id/teacher-limit
// @access  Private/Admin
const updateSchoolTeacherLimit = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { teacherLimit } = req.body;

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
        where: { id },
        data: { teacherLimit: parseInt(teacherLimit) }
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

module.exports = {
    getDashboardStats,
    getUsers,
    getOrders,
    createAdmin,
    createUser,
    getAllNotes,
    updateNoteStatus,
    updateSchoolTeacherLimit,
    testSmtp
    ,
    provisionSchool
};
