const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const bcrypt = require('bcryptjs');
const { createAdminLog } = require('../utils/auditLogger');

// @desc    Get school details and teacher list
// @route   GET /api/school-admin/details
// @access  Private/SchoolAdmin
const getSchoolDetails = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
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
          createdAt: true
        }
      },
      owner: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  const stats = {
    totalTeachers: school.teachers.length,
    activeTeachers: school.teachers.filter(t => t.teacherStatus === 'Active').length,
    invitedTeachers: school.teachers.filter(t => t.teacherStatus === 'Invited').length,
    suspendedTeachers: school.teachers.filter(t => t.teacherStatus === 'Suspended').length,
    teacherLimit: school.teacherLimit,
    slotsRemaining: Math.max(0, school.teacherLimit - school.teachers.length)
  };

  res.json(formatResponse(true, 'School details retrieved', { school, stats }));
});

// @desc    Add teacher to school
// @route   POST /api/school-admin/teachers
const addTeacher = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const schoolId = req.user.schoolId;

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const teacher = await prisma.$transaction(async (tx) => {
    // Check for existing user first within the transaction
    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400); // Set status here
      throw new Error('User with this email already exists.');
    }

    const school = await tx.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: { teachers: true },
        },
      },
    });

    // School not found check
    if (!school) {
      res.status(404);
      throw new Error('School not found.');
    }

    // Check teacher limit
    if (school._count.teachers >= school.teacherLimit) {
      res.status(400); // Set status here
      throw new Error('Teacher limit reached for this school.');
    }

    // Create the new teacher
    const newTeacher = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
        schoolId,
        teacherStatus: 'Invited',
        subscriptionPlan: 'School',
      },
    });

    return newTeacher;
  });

  // Send invitation email with temporary password
  const { sendTeacherInvitation } = require('../utils/emailService');
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true }
    });

    await sendTeacherInvitation(
      teacher.email,
      teacher.name,
      school?.name || 'Your School',
      tempPassword,
      req.user.name
    );
    console.info(`Teacher invitation email sent to ${email}`);
  } catch (emailError) {
    console.error('Failed to send invitation email:', emailError.message);
    console.error('Full error:', emailError);
    // Don't fail the entire operation if email fails
    // Teacher is still created, admin can manually share credentials
  }

  // If transaction is successful, log and respond
  await createAdminLog(req.user.id, schoolId, 'ADD_TEACHER', { email, name });

  res.status(201).json(formatResponse(true, 'Teacher invited', {
    teacher: { id: teacher.id, name, email },
  }));
});

// @desc    Update teacher status
// @route   POST /api/school-admin/teachers/:id/status
const updateTeacherStatus = asyncHandler(async (req, res) => {
  const { teacherStatus } = req.body;
  const schoolId = req.user.schoolId;
  const teacherId = req.params.id;

  const result = await prisma.user.updateMany({
    where: {
      id: teacherId,
      schoolId: schoolId,
    },
    data: {
      teacherStatus: teacherStatus,
    },
  });

  if (result.count === 0) {
    res.status(404);
    throw new Error('Teacher not found in this school or no change was made.');
  }


  await createAdminLog(req.user.id, schoolId, 'UPDATE_TEACHER_STATUS', {
    teacherId: req.params.id,
    newStatus: teacherStatus
  });

  res.json(formatResponse(true, 'Status updated'));
});

// @desc    Remove teacher
// @route   DELETE /api/school-admin/teachers/:id
const removeTeacher = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const teacherId = req.params.id;

  const result = await prisma.user.deleteMany({
    where: {
      id: teacherId,
      schoolId: schoolId,
    },
  });

  if (result.count === 0) {
    res.status(404);
    throw new Error('Teacher not found in this school');
  }

  // Note: teacherName is omitted from the log to ensure atomicity.
  // The 'findFirst' before 'delete' creates a TOCTOU vulnerability.
  await createAdminLog(req.user.id, schoolId, 'REMOVE_TEACHER', {
    teacherId: teacherId,
  });

  res.json(formatResponse(true, 'Teacher removed'));
});

// @desc    Toggle teacher admin
// @route   POST /api/school-admin/teachers/:id/toggle-admin
const toggleTeacherAdmin = asyncHandler(async (req, res) => {
  const { isAdmin } = req.body;
  const schoolId = req.user.schoolId;
  const teacherId = req.params.id;

  const result = await prisma.user.updateMany({
    where: {
      id: teacherId,
      schoolId: schoolId,
    },
    data: {
      isSchoolAdmin: isAdmin,
    },
  });

  if (result.count === 0) {
    res.status(404);
    throw new Error('Teacher not found in this school.');
  }

  await createAdminLog(req.user.id, schoolId, 'TOGGLE_TEACHER_ADMIN', {
    teacherId: teacherId,
    isAdmin
  });

  res.json(formatResponse(true, 'Admin status updated'));
});

// @desc    Update school settings
// @route   PUT /api/school-admin/settings
const updateSchoolSettings = asyncHandler(async (req, res) => {
  const { allowAdminAccess } = req.body;
  const schoolId = req.user.schoolId;

  await prisma.school.update({
    where: { id: schoolId },
    data: { allowAdminAccess }
  });

  await createAdminLog(req.user.id, schoolId, 'UPDATE_SCHOOL_SETTINGS', { allowAdminAccess });

  res.json(formatResponse(true, 'Settings updated'));
});

// @desc    Update teacher limit
// @route   PUT /api/school-admin/teachers/:id/limit
const updateTeacherLimit = asyncHandler(async (req, res) => {
  const { monthlyLessonLimit } = req.body;
  const schoolId = req.user.schoolId;
  const teacherId = req.params.id;

  const result = await prisma.user.updateMany({
    where: {
      id: teacherId,
      schoolId: schoolId,
    },
    data: {
      monthlyLessonLimit: parseInt(monthlyLessonLimit),
    },
  });

  if (result.count === 0) {
    res.status(404);
    throw new Error('Teacher not found in this school.');
  }


  await createAdminLog(req.user.id, schoolId, 'UPDATE_TEACHER_LIMIT', {
    teacherId: req.params.id,
    newLimit: monthlyLessonLimit
  });

  res.json(formatResponse(true, 'Limit updated'));
});

// @desc    Update school profile details
// @route   PUT /api/school-admin/profile
const updateSchoolProfile = asyncHandler(async (req, res) => {
  const { name, address, phone, email, website, capacity } = req.body;
  const schoolId = req.user.schoolId;

  const updatedSchool = await prisma.school.update({
    where: { id: schoolId },
    data: {
      name,
      address,
      phone,
      email,
      website,
      capacity: parseInt(capacity) || 0
    }
  });

  await createAdminLog(req.user.id, schoolId, 'UPDATE_SCHOOL_PROFILE', {
    name,
    address,
    phone
  });

  res.json(formatResponse(true, 'Profile updated', updatedSchool));
});

// @desc    Get school activity logs
// @route   GET /api/school-admin/activity
const getActivityLogs = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  const activity = await prisma.usageLog.findMany({
    where: { schoolId },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  res.json(formatResponse(true, 'Activity logs retrieved', activity));
});

module.exports = {
  getSchoolDetails,
  addTeacher,
  updateTeacherStatus,
  removeTeacher,
  toggleTeacherAdmin,
  updateSchoolSettings,
  updateTeacherLimit,
  updateSchoolProfile,
  getActivityLogs
};
