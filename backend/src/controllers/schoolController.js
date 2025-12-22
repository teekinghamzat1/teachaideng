const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const bcrypt = require('bcryptjs');

// @desc    Get school details and teacher list
// @route   GET /api/school
// @access  Private (School Admin only)
const getSchoolDetails = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Find school where user is either the owner OR a teacher
    const school = await prisma.school.findFirst({
        where: {
            OR: [
                { ownerId: userId }, // School owner
                {
                    teachers: {
                        some: {
                            id: userId
                        }
                    }
                } // Any teacher in the school
            ]
        },
        include: {
            teachers: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    teacherStatus: true,
                    isSchoolAdmin: true,
                    monthlyLessonLimit: true,
                    lessonsUsedThisMonth: true,
                    createdAt: true,
                    updatedAt: true
                }
            },
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!school) {
        // Return 200 with null instead of 404/403 to avoid noisy errors for general users
        return res.json(formatResponse(true, 'No school associated with this account', { school: null, stats: null }));
    }

    // Check if user is a teacher admin and if admin access is allowed
    const isOwner = school.ownerId === userId;
    const isTeacherAdmin = school.teachers.some(t => t.id === userId && t.isSchoolAdmin);

    // If it's a teacher admin but access is disabled, we still allow basic detail retrieval for profile page,
    // but management actions are blocked by the isSchoolAdmin middleware which checks this field too? 
    // Actually, let's keep it simple: any member can see the details.

    const teacherCount = school.teachers.length;
    const stats = {
        totalTeachers: teacherCount,
        activeTeachers: school.teachers.filter(t => t.teacherStatus === 'Active').length,
        invitedTeachers: school.teachers.filter(t => t.teacherStatus === 'Invited').length,
        suspendedTeachers: school.teachers.filter(t => t.teacherStatus === 'Suspended').length,
        teacherLimit: school.teacherLimit,
        slotsRemaining: school.teacherLimit - teacherCount
    };

    res.json(formatResponse(true, 'School details retrieved', { school, stats }));
});

// @desc    Add/Invite a teacher to school
// @route   POST /api/school/teachers
// @access  Private (School Admin only)
const addTeacher = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { name, email, gender } = req.body;

    if (!name || !email) {
        res.status(400);
        throw new Error('Name and email are required');
    }

    // Find school
    const school = await prisma.school.findFirst({
        where: { ownerId: userId },
        include: {
            teachers: true
        }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    // Check teacher limit
    if (school.teachers.length >= school.teacherLimit) {
        res.status(400);
        throw new Error(`Teacher limit reached(${school.teacherLimit}).Please contact admin to increase your limit.`);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        res.status(400);
        throw new Error('A user with this email already exists');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create teacher account
    const teacher = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: 'teacher',
            schoolId: school.id,
            teacherStatus: 'Invited',
            subscriptionPlan: 'School' // Teachers inherit school plan
        }
    });

    // Send invitation email with temporary password
    const { sendTeacherInvitation } = require('../utils/emailService');
    try {
        const schoolOwner = await prisma.user.findUnique({
            where: { id: school.ownerId },
            select: { name: true }
        });

        await sendTeacherInvitation(
            teacher.email,
            teacher.name,
            school.name,
            tempPassword,
            schoolOwner?.name || 'School Administrator'
        );
        console.log(`Teacher invitation email sent to ${email} `);
    } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't fail the entire operation if email fails
        // Teacher is still created, admin can manually share credentials
    }

    res.status(201).json(formatResponse(true, 'Teacher invited successfully', {
        teacher: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            teacherStatus: teacher.teacherStatus
        },
        tempPassword // REMOVE IN PRODUCTION - send via email instead
    }));
});

// @desc    Update teacher status
// @route   PATCH /api/school/teachers/:id
// @access  Private (School Admin only)
const updateTeacherStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const teacherId = req.params.id;
    const { teacherStatus } = req.body;

    if (!['Active', 'Suspended', 'Invited'].includes(teacherStatus)) {
        res.status(400);
        throw new Error('Invalid teacher status');
    }

    // Verify school ownership
    const school = await prisma.school.findFirst({
        where: { ownerId: userId }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
        where: {
            id: teacherId,
            schoolId: school.id
        }
    });

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found in your school');
    }

    // Update status
    const updatedTeacher = await prisma.user.update({
        where: { id: teacherId },
        data: { teacherStatus }
    });

    res.json(formatResponse(true, 'Teacher status updated', {
        teacher: {
            id: updatedTeacher.id,
            name: updatedTeacher.name,
            email: updatedTeacher.email,
            teacherStatus: updatedTeacher.teacherStatus
        }
    }));
});

// @desc    Remove teacher from school (permanently delete account)
// @route   DELETE /api/school/teachers/:id
// @access  Private (School Admin only)
const removeTeacher = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const teacherId = req.params.id;

    // Verify school ownership
    const school = await prisma.school.findFirst({
        where: { ownerId: userId }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    // Verify teacher belongs to this school and get their details
    const teacher = await prisma.user.findFirst({
        where: {
            id: teacherId,
            schoolId: school.id
        }
    });

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found in your school');
    }

    // Store teacher details for email notification
    const teacherEmail = teacher.email;
    const teacherName = teacher.name;
    const schoolName = school.name;

    // Permanently delete the teacher account
    await prisma.user.delete({
        where: { id: teacherId }
    });

    // Send removal notification email
    const { sendTeacherRemovalNotification } = require('../utils/emailService');
    try {
        await sendTeacherRemovalNotification(teacherEmail, teacherName, schoolName);
    } catch (error) {
        console.error('Failed to send removal notification email:', error);
        // Continue - account is already deleted
    }

    res.json(formatResponse(true, 'Teacher account permanently deleted and notification sent'));
});

// @desc    Toggle teacher admin status
// @route   PATCH /api/school/teachers/:id/admin
// @access  Private (School Admin only)
const toggleTeacherAdmin = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const teacherId = req.params.id;
    const { isAdmin } = req.body;

    // Verify school ownership
    const school = await prisma.school.findFirst({
        where: { ownerId: userId }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found');
    }

    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
        where: {
            id: teacherId,
            schoolId: school.id
        }
    });

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found in your school');
    }

    // Prevent demoting the school owner
    if (teacher.id === school.ownerId) {
        res.status(400);
        throw new Error('Cannot change admin status of school owner');
    }

    // Update admin status
    const updatedTeacher = await prisma.user.update({
        where: { id: teacherId },
        data: { isSchoolAdmin: isAdmin }
    });

    res.json(formatResponse(true, `Teacher ${isAdmin ? 'promoted to' : 'removed from'} admin`, {
        teacher: {
            id: updatedTeacher.id,
            name: updatedTeacher.name,
            email: updatedTeacher.email,
            isSchoolAdmin: updatedTeacher.isSchoolAdmin
        }
    }));
});

// @desc    Update school settings
// @route   PATCH /api/school/settings
// @access  Private (School Owner only)
const updateSchoolSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { allowAdminAccess } = req.body;

    // Find school owned by this user (only owner can change settings)
    const school = await prisma.school.findFirst({
        where: { ownerId: userId }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found. Only school owners can change settings.');
    }

    // Update settings
    const updatedSchool = await prisma.school.update({
        where: { id: school.id },
        data: { allowAdminAccess }
    });

    res.json(formatResponse(true, 'School settings updated', {
        allowAdminAccess: updatedSchool.allowAdminAccess
    }));
});

// @desc    Update teacher lesson limit
// @route   PATCH /api/school/teachers/:id/limit
// @access  Private (School Admin only)
const updateTeacherLimit = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const teacherId = req.params.id;
    const { monthlyLessonLimit } = req.body;

    if (monthlyLessonLimit === undefined || monthlyLessonLimit < 0) {
        res.status(400);
        throw new Error('Valid monthly lesson limit is required');
    }

    // Verify school ownership (or teacher admin rights)
    const school = await prisma.school.findFirst({
        where: {
            OR: [
                { ownerId: userId },
                {
                    teachers: {
                        some: {
                            id: userId,
                            isSchoolAdmin: true
                        }
                    }
                }
            ]
        }
    });

    if (!school) {
        res.status(404);
        throw new Error('School not found or access denied');
    }

    // Verify teacher belongs to this school
    const teacher = await prisma.user.findFirst({
        where: {
            id: teacherId,
            schoolId: school.id
        }
    });

    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found in your school');
    }

    // Update limit
    const updatedUser = await prisma.user.update({
        where: { id: teacherId },
        data: { monthlyLessonLimit: parseInt(monthlyLessonLimit) }
    });

    res.json(formatResponse(true, 'Teacher limit updated', {
        id: updatedUser.id,
        name: updatedUser.name,
        monthlyLessonLimit: updatedUser.monthlyLessonLimit
    }));
});

module.exports = {
    getSchoolDetails,
    addTeacher,
    updateTeacherStatus,
    removeTeacher,
    toggleTeacherAdmin,
    updateSchoolSettings,
    updateTeacherLimit
};
