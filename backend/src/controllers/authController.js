const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const generateToken = require('../utils/generateToken');
const formatResponse = require('../utils/formatResponse');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, accountType } = req.body;

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
            // store accountType for future billing/feature gating; defaults to 'individual'
            accountType: accountType || 'individual'
        },
    });

    if (user) {
        res.status(201).json(
            formatResponse(true, 'User registered successfully', {
                _id: user.id,
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionPlan: user.subscriptionPlan,
                isSchoolAdmin: user.isSchoolAdmin,
                accountType: user.accountType || 'individual',
                token: generateToken(user.id),
            })
        );
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Auto-activate teacher if they're logging in for the first time
        if (user.teacherStatus === 'Invited' && user.schoolId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { teacherStatus: 'Active' }
            });
            user.teacherStatus = 'Active'; // Update in-memory object
        }

        res.json(
            formatResponse(true, 'Login successful', {
                _id: user.id,
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscriptionPlan: user.subscriptionPlan,
                isSchoolAdmin: user.isSchoolAdmin,
                token: generateToken(user.id),
            })
        );
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    res.json(formatResponse(true, 'Logged out successfully'));
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = {
        _id: req.user.id,
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
    };
    res.json(formatResponse(true, 'User profile retrieved', user));
});

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
};
