const express = require('express');
const router = express.Router();
const {
    getSchoolDetails,
    addTeacher,
    updateTeacherStatus,
    removeTeacher,
    toggleTeacherAdmin,
    updateSchoolSettings,
    updateTeacherLimit
} = require('../controllers/schoolController');
const { protect } = require('../middlewares/authMiddleware');
const { isSchoolAdmin } = require('../middlewares/isSchoolAdmin');

// All school routes require authentication
router.use(protect);

// School management routes - most require isSchoolAdmin
router.get('/', getSchoolDetails);
router.post('/teachers', isSchoolAdmin, addTeacher);
router.patch('/teachers/:id', isSchoolAdmin, updateTeacherStatus);
router.delete('/teachers/:id', isSchoolAdmin, removeTeacher);
router.patch('/teachers/:id/admin', isSchoolAdmin, toggleTeacherAdmin);
router.patch('/teachers/:id/limit', isSchoolAdmin, updateTeacherLimit);
router.patch('/settings', isSchoolAdmin, updateSchoolSettings);

module.exports = router;
