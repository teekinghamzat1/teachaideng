const express = require('express');
const router = express.Router();
const {
  getSchoolTeachers,
  addSchoolTeacher,
  removeSchoolTeacher,
  getSchoolUsage,
  updateSchoolSettings,
} = require('../controllers/schoolAdminController');
const { protect } = require('../middlewares/authMiddleware');
const { isSchoolAdmin } = require('../middlewares/isSchoolAdmin');

router.use(protect, isSchoolAdmin);

// Teacher Management
router.get('/teachers', getSchoolTeachers);
router.post('/teachers', addSchoolTeacher);
router.delete('/teachers/:teacherId', removeSchoolTeacher);

// School Usage & Settings
router.get('/usage', getSchoolUsage);
router.put('/settings', updateSchoolSettings);

module.exports = router;
