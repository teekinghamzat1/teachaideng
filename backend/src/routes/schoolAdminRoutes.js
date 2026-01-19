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
  updateSchoolProfile,
  getActivityLogs
} = require('../controllers/schoolAdminController');
const { protect } = require('../middlewares/authMiddleware');
const { isSchoolAdmin } = require('../middlewares/isSchoolAdmin');
const validate = require('../middlewares/validate');
const { z } = require('zod');

// Validation Schemas
const addTeacherSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

router.use(protect, isSchoolAdmin);

// School Management
router.get('/details', getSchoolDetails);
router.get('/activity', getActivityLogs);
router.post('/teachers', validate(addTeacherSchema), addTeacher);
router.post('/teachers/:id/status', updateTeacherStatus);
router.delete('/teachers/:id', removeTeacher);
router.post('/teachers/:id/toggle-admin', toggleTeacherAdmin);
router.put('/teachers/:id/limit', updateTeacherLimit);
router.put('/settings', updateSchoolSettings);
router.put('/profile', validate(updateProfileSchema), updateSchoolProfile);

module.exports = router;
