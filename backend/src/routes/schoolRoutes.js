const express = require('express');
const router = express.Router();
const {
    getSchoolDetails,
    addTeacher,
    updateTeacherStatus,
    removeTeacher,
    toggleTeacherAdmin,
    updateSchoolSettings
} = require('../controllers/schoolController');
const { protect } = require('../middlewares/authMiddleware');
const { isSchoolAdmin } = require('../middlewares/isSchoolAdmin');

// All routes require authentication and school admin role
router.use(protect);
router.use(isSchoolAdmin);

// School management routes
router.get('/', getSchoolDetails);
router.post('/teachers', addTeacher);
router.patch('/teachers/:id', updateTeacherStatus);
router.delete('/teachers/:id', removeTeacher);
router.patch('/teachers/:id/admin', toggleTeacherAdmin);
router.patch('/settings', updateSchoolSettings);

module.exports = router;
