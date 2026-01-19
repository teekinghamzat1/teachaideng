const express = require('express');
const router = express.Router();
const {
    getSchemes,
    getScheme,
    createScheme,
    updateWeekTopics,
    deleteScheme
} = require('../controllers/referenceSchemeController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, admin, getSchemes)
    .post(protect, admin, createScheme);

router.route('/:id')
    .get(protect, admin, getScheme)
    .delete(protect, admin, deleteScheme);

router.route('/:id/weeks/:weekNumber')
    .put(protect, admin, updateWeekTopics);

module.exports = router;
