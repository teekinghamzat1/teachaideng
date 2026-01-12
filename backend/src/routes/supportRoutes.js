const express = require('express');
const router = express.Router();
const {
    startSession,
    getMessages,
    sendMessage,
    getUserSessions,
    getAllSessions,
    closeSession,
    convertToTicket,
    getTickets,
    updateTicketStatus
} = require('../controllers/supportController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');

// User & Admin shared routes
router.use(protect);

router.post('/sessions', startSession);
router.get('/sessions/:sessionId/messages', getMessages);
router.post('/sessions/:sessionId/messages', sendMessage);
router.get('/my-sessions', getUserSessions);
router.post('/sessions/:sessionId/ticket', convertToTicket);

// Admin only routes
router.get('/admin/sessions', admin, getAllSessions);
router.put('/sessions/:sessionId/close', admin, closeSession);
router.get('/admin/tickets', admin, getTickets);
router.put('/tickets/:ticketId', admin, updateTicketStatus);

module.exports = router;
