const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const generateToken = require('../utils/generateToken');
const formatResponse = require('../utils/formatResponse');
const { sendWelcomeEmail, sendAdminNotification } = require('../utils/emailService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, accountType } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please fields are required: name, email, password');
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
            role: 'user',
            // store accountType for future billing/feature gating; defaults to 'individual'
            accountType: accountType || 'individual',
            tokens: 2000 // Welcome bonus: 2000 tokens (approx 3-4 lessons)
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
                avatar: user.avatar,
                token: generateToken(user.id),
            })
        );

        // Send welcome email asynchronously
        sendWelcomeEmail(user.email, user.name).catch(err => console.error('Failed to send welcome email:', err));

        // Notify Admin
        sendAdminNotification(
            'New User Registration',
            `
            <p>A new user has registered on TeachAide!</p>
            <ul>
                <li><strong>Name:</strong> ${user.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Account Type:</strong> ${user.accountType}</li>
                <li><strong>Registration Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            `
        ).catch(err => console.error('Failed to notify admin of registration:', err));
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        // If user is not found, provide precise feedback that account is missing/deleted
        if (!user) {
            res.status(404);
            throw new Error('Account not found or has been deleted');
        }

        // Ensure password field exists on user record
        if (!user.password || typeof user.password !== 'string') {
            // Log for debugging, then return a generic incorrect password
            console.warn(`User ${user.email} has no password set on record`);
            res.status(401);
            throw new Error('Incorrect password');
        }

        let passwordMatch = false;
        try {
            passwordMatch = await bcrypt.compare(password, user.password);
        } catch (err) {
            console.error('Error comparing password for user', user.id, err);
            res.status(500);
            throw new Error('Internal error while validating credentials');
        }

        if (user && passwordMatch) {
            // Auto-activate teacher if they're logging in for the first time
            if (user.teacherStatus === 'Invited' && user.schoolId) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { teacherStatus: 'Active' }
                });
                user.teacherStatus = 'Active'; // Update in-memory object
            }

            // Close any existing active support sessions to ensure a fresh start
            try {
                await prisma.chatSession.updateMany({
                    where: {
                        userId: user.id,
                        status: 'active'
                    },
                    data: { status: 'closed' }
                });
            } catch (e) {
                console.warn('Failed to close old support sessions on login', e);
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
                    avatar: user.avatar,
                    token: generateToken(user.id),
                })
            );
        } else {
            // At this point the user exists but password did not match
            res.status(401);
            throw new Error('Incorrect password');
        }
    } catch (err) {
        console.error('Login error for', req?.body?.email, err);
        // Ensure we propagate the error to the error handler middleware
        throw err;
    }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    // Close active support sessions on logout
    if (req.user && req.user.id) {
        try {
            await prisma.chatSession.updateMany({
                where: {
                    userId: req.user.id,
                    status: 'active'
                },
                data: { status: 'closed' }
            });
        } catch (e) {
            console.error('Failed to close support sessions on logout', e);
        }
    }
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
