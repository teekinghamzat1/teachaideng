const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get all teachers for the school
// @route   GET /api/school-admin/teachers
// @access  Private/SchoolAdmin
const getSchoolTeachers = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  const teachers = await prisma.user.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  res.json(formatResponse(true, 'Teachers retrieved', teachers));
});

// @desc    Add a teacher to the school
// @route   POST /api/school-admin/teachers
// @access  Private/SchoolAdmin
const addSchoolTeacher = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const schoolId = req.user.schoolId;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { schoolId },
  });

  res.json(formatResponse(true, 'Teacher added to school', { id: user.id, name: user.name, email: user.email }));
});

// @desc    Remove a teacher from the school
// @route   DELETE /api/school-admin/teachers/:teacherId
// @access  Private/SchoolAdmin
const removeSchoolTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const schoolId = req.user.schoolId;

  const user = await prisma.user.findFirst({
    where: { id: teacherId, schoolId },
  });

  if (!user) {
    res.status(404);
    throw new Error('Teacher not found in this school');
  }

  await prisma.user.update({
    where: { id: teacherId },
    data: { schoolId: null },
  });

  res.json(formatResponse(true, 'Teacher removed from school'));
});

// @desc    Get school usage stats
// @route   GET /api/school-admin/usage
// @access  Private/SchoolAdmin
const getSchoolUsage = asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  const teacherCount = await prisma.user.count({ where: { schoolId } });
  const lessonNoteCount = await prisma.lessonNote.count({
    where: { user: { schoolId } },
  });

  res.json(formatResponse(true, 'School usage stats retrieved', {
    teacherCount,
    lessonNoteCount,
  }));
});

// @desc    Update school settings
// @route   PUT /api/school-admin/settings
// @access  Private/SchoolAdmin
const updateSchoolSettings = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const schoolId = req.user.schoolId;

  const school = await prisma.school.update({
    where: { id: schoolId },
    data: { name },
  });

  res.json(formatResponse(true, 'School settings updated', school));
});

module.exports = {
  getSchoolTeachers,
  addSchoolTeacher,
  removeSchoolTeacher,
  getSchoolUsage,
  updateSchoolSettings,
};
