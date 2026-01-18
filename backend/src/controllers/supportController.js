const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { sendAdminNotification } = require('../utils/emailService');

// @desc    Start or get active support session
// @route   POST /api/support/sessions
// @access  Private
const startSession = asyncHandler(async (req, res) => {
    let session = await prisma.chatSession.findFirst({
        where: {
            userId: req.user.id,
            status: 'active'
        },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                take: 50
            }
        }
    });

    if (!session) {
        session = await prisma.chatSession.create({
            data: {
                userId: req.user.id,
                status: 'active',
                lastMessage: 'Chat started',
                messages: {
                    create: {
                        senderRole: 'system',
                        content: 'Hello! How can we help you today? An admin will be with you shortly.'
                    }
                }
            },
            include: {
                messages: true
            }
        });
    }
    res.json(formatResponse(true, 'Session started', session));
});

// @desc    Get messages for a session
// @route   GET /api/support/sessions/:sessionId/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId }
    });

    if (!session || (session.userId !== req.user.id && !['admin', 'superadmin', 'Admin'].includes(req.user.role))) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
    });

    console.log('=== GET MESSAGES DEBUG ===');
    console.log('Session ID:', sessionId);
    console.log('Messages count:', messages.length);
    messages.forEach((m, idx) => {
        console.log(`Message ${idx + 1}: senderRole="${m.senderRole}", content="${m.content.substring(0, 30)}..."`);
    });
    console.log('==========================');

    // Mark as read only if requested
    const markAsRead = req.query.markAsRead === 'true';
    if (markAsRead) {
        if (['admin', 'superadmin', 'Admin'].includes(req.user.role)) {
            await prisma.chatSession.update({
                where: { id: sessionId },
                data: { unreadCount: 0 }
            });
            await prisma.chatMessage.updateMany({
                where: { sessionId, senderRole: 'user', isRead: false },
                data: { isRead: true }
            });
        } else {
            await prisma.chatSession.update({
                where: { id: sessionId },
                data: { userUnreadCount: 0 }
            });
            await prisma.chatMessage.updateMany({
                where: { sessionId, senderRole: 'admin', isRead: false },
                data: { isRead: true }
            });
        }
    }

    res.json(formatResponse(true, 'Messages retrieved', messages));
});

// @desc    Send a message
// @route   POST /api/support/sessions/:sessionId/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { content, attachment } = req.body;

    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { user: true }
    });

    if (!session || (session.userId !== req.user.id && !['admin', 'superadmin', 'Admin'].includes(req.user.role))) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const senderRole = ['admin', 'superadmin'].includes(req.user.role?.toLowerCase()) ? 'admin' : 'user';

    console.log('=== SUPPORT MESSAGE DEBUG ===');
    console.log('User ID:', req.user.id);
    console.log('User Role (raw):', req.user.role);
    console.log('User Role (lowercase):', req.user.role?.toLowerCase());
    console.log('Assigned senderRole:', senderRole);
    console.log('Session User ID:', session.userId);
    console.log('Has Attachment:', !!attachment);
    console.log('Is Admin?', ['admin', 'superadmin'].includes(req.user.role?.toLowerCase()));
    console.log('============================');

    const message = await prisma.chatMessage.create({
        data: {
            sessionId,
            senderId: req.user.id,
            senderRole,
            content,
            attachment: attachment || null
        }
    });

    // Update session
    const updateData = {
        lastMessage: content,
        updatedAt: new Date()
    };

    if (senderRole === 'user') {
        updateData.unreadCount = { increment: 1 };
    } else {
        updateData.userUnreadCount = { increment: 1 };
    }

    await prisma.chatSession.update({
        where: { id: sessionId },
        data: updateData
    });

    // Notify admins on FIRST user message
    if (senderRole === 'user') {
        const userMsgCount = await prisma.chatMessage.count({
            where: { sessionId, senderRole: 'user' }
        });

        if (userMsgCount === 1) {
            sendAdminNotification(
                'New Support Chat Message',
                `<p>User <strong>${req.user.name}</strong> (${req.user.email}) has sent a message.</p>
                 <p><strong>Message:</strong> ${content}</p>
                 <p>Please check the admin dashboard to respond.</p>`
            ).catch(err => console.error('Failed to send support notification:', err));
        }
    }

    // If it's a user message and session was quiet, maybe notify again or set a timeout
    // For now, simplicity: just update the session.

    res.json(formatResponse(true, 'Message sent', message));
});

// @desc    Get user sessions
// @route   GET /api/support/my-sessions
// @access  Private
const getUserSessions = asyncHandler(async (req, res) => {
    const sessions = await prisma.chatSession.findMany({
        where: { userId: req.user.id },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(formatResponse(true, 'User sessions retrieved', sessions));
});

// @desc    Get all sessions for admin
// @route   GET /api/support/admin/sessions
// @access  Private/Admin
const getAllSessions = asyncHandler(async (req, res) => {
    const sessions = await prisma.chatSession.findMany({
        include: {
            user: {
                select: { name: true, email: true }
            }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
    });
    res.json(formatResponse(true, 'All sessions retrieved', sessions));
});

// @desc    Close a session
// @route   PUT /api/support/sessions/:sessionId/close
// @access  Private/Admin
const closeSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: 'closed' }
    });
    res.json(formatResponse(true, 'Session closed'));
});

// @desc    Convert session to ticket
// @route   POST /api/support/sessions/:sessionId/ticket
// @access  Private
const convertToTicket = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { subject, description } = req.body;

    const session = await prisma.chatSession.findUnique({
        where: { id: sessionId }
    });

    if (!session || session.userId !== req.user.id) {
        res.status(403);
        throw new Error('Unauthorized');
    }

    const ticket = await prisma.supportTicket.create({
        data: {
            userId: req.user.id,
            sessionId,
            subject,
            description,
            status: 'open',
            priority: 'normal'
        }
    });

    await prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: 'ticketed' }
    });

    // Notify Admin of Ticket
    sendAdminNotification(
        'New Support Ticket Created',
        `<p>User <strong>${req.user.name}</strong> has converted their chat to a ticket.</p>
         <p><strong>Subject:</strong> ${subject}</p>
         <p><strong>Description:</strong> ${description}</p>`
    ).catch(err => console.error('Failed to push ticket notification:', err));

    res.json(formatResponse(true, 'Ticket created', ticket));
});

// @desc    Get all tickets
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
const getTickets = asyncHandler(async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({
        include: {
            user: { select: { name: true, email: true } },
            session: { include: { messages: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(formatResponse(true, 'Tickets retrieved', tickets));
});

// @desc    Update ticket status
// @route   PUT /api/support/tickets/:ticketId
// @access  Private/Admin
const updateTicketStatus = asyncHandler(async (req, res) => {
    const { ticketId } = req.params;
    const { status, priority } = req.body;

    const ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status, priority }
    });

    res.json(formatResponse(true, 'Ticket updated', ticket));
});

module.exports = {
    startSession,
    getMessages,
    sendMessage,
    getUserSessions,
    getAllSessions,
    closeSession,
    convertToTicket,
    getTickets,
    updateTicketStatus
};
