const express = require('express');
const router = express.Router();
const { getTopics, addTopic, updateTopic, deleteTopic, triggerWorker, getSchedule, updateSchedule } = require('../controllers/topicQueueController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, admin, getTopics)
    .post(protect, admin, addTopic);

router.post('/trigger', protect, admin, triggerWorker);
router.get('/schedule', protect, admin, getSchedule);
router.put('/schedule', protect, admin, updateSchedule);

router.route('/:id')
    .put(protect, admin, updateTopic)
    .delete(protect, admin, deleteTopic);

module.exports = router;
