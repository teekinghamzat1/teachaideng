const express = require('express');
const router = express.Router();
const {
    saveTimetable,
    getTimetable,
} = require('../controllers/timetableController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, saveTimetable)
    .get(protect, getTimetable);

module.exports = router;
