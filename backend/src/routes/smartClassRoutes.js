const express = require('express');
const router = express.Router();
const {
    createSmartClass,
    getSmartClasses,
    markDayComplete,
    unmarkDayComplete,
    updateDayTopic,
    deleteSmartClass
} = require('../controllers/smartClassController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getSmartClasses)
    .post(createSmartClass);

router.route('/days/:dayId/complete')
    .put(markDayComplete);

router.route('/days/:dayId/uncomplete')
    .put(unmarkDayComplete);

router.route('/days/:dayId/topic')
    .put(updateDayTopic);

router.route('/:id')
    .delete(deleteSmartClass);

module.exports = router;
