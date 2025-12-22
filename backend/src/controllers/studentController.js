const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Add a student
// @route   POST /api/students
// @access  Private
const addStudent = asyncHandler(async (req, res) => {
    const { name, age, gender, subject, notes } = req.body;

    const student = await prisma.student.create({
        data: {
            userId: req.user.id,
            name,
            age: Number(age), // Ensure number
            gender,
            subject,
            notes,
        }
    });

    res.status(201).json(formatResponse(true, 'Student added', student));
});

// @desc    Get all students for a user
// @route   GET /api/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
    const students = await prisma.student.findMany({
        where: { userId: req.user.id }
    });
    res.json(formatResponse(true, 'Students retrieved', students));
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
const deleteStudent = asyncHandler(async (req, res) => {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });

    if (student && student.userId === req.user.id) {
        await prisma.student.delete({ where: { id: req.params.id } });
        res.json(formatResponse(true, 'Student removed'));
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
});

module.exports = {
    addStudent,
    getStudents,
    deleteStudent,
};
