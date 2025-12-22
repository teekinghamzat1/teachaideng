const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotifications,
    markNotificationAsRead,
    deleteNotification,
    updateNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');

router.get('/', protect, getNotifications);
router.post('/', protect, admin, createNotification);
router.put('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, admin, deleteNotification);
router.put('/:id', protect, admin, updateNotification);

module.exports = router;
