const express = require('express');
const router = express.Router();
const {
  getSchoolDetails,
  addTeacher,
  updateTeacherStatus,
  removeTeacher,
  toggleTeacherAdmin,
  updateSchoolSettings,
  updateTeacherLimit,
  updateSchoolProfile
} = require('../controllers/schoolAdminController');
const { protect } = require('../middlewares/authMiddleware');
const { isSchoolAdmin } = require('../middlewares/isSchoolAdmin');

router.use(protect, isSchoolAdmin);

// School Management
router.get('/details', getSchoolDetails);
router.post('/teachers', addTeacher);
router.post('/teachers/:id/status', updateTeacherStatus);
router.delete('/teachers/:id', removeTeacher);
router.post('/teachers/:id/toggle-admin', toggleTeacherAdmin);
router.put('/teachers/:id/limit', updateTeacherLimit);
router.put('/settings', updateSchoolSettings);
router.put('/profile', updateSchoolProfile);

module.exports = router;
