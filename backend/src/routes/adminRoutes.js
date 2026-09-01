const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getUsers,
    getOrders,
    createAdmin,
    createUser,
    getAllNotes,
    updateNoteStatus,
    updateSchoolTeacherLimit,
    testSmtp,
    resetUserLimit,
    updateUserStatus,
    updateUserPlan,
    getAnalytics,
    getSchools,
    getAdminLogs,
    getErrorLogs,
    logError,
    resolveError,
    provisionSchool,
    deleteUserPermanently,
    topupSchoolNotes,
    updateSchoolPlanTier
} = require('../controllers/adminController');

const {
    sendMassEmailWithTracking,
    trackEmailOpen,
    getMassEmailHistory,
    getMassEmailRecipients
} = require('../controllers/massEmailController');

const {
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonialActive
} = require('../controllers/testimonialController');

const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');
const { superAdmin } = require('../middlewares/superAdminMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const createAdminSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
    }),
});

// Public error logging endpoint (allows logging even if not logged in or admin)
router.post('/error-logs', logError);

// Public email tracking endpoint (tracking pixel - no auth required)
router.get('/mass-email/:emailId/track/:recipientId/open', trackEmailOpen);

router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/logs', getAdminLogs);
router.get('/error-logs', getErrorLogs);
router.put('/error-logs/:id/resolve', resolveError);
const { validateCreateUser } = require('../middlewares/userValidation');
router.get('/users', getUsers);
router.post('/users', validateCreateUser, createUser);
router.get('/orders', getOrders);
router.post('/create-admin', validate(createAdminSchema), superAdmin, createAdmin);

// Content Management
router.get('/content/notes', getAllNotes);
router.put('/content/notes/:id/status', updateNoteStatus);

// School Management
router.patch('/schools/:id/teacher-limit', updateSchoolTeacherLimit);
router.post('/schools/:id/topup', superAdmin, topupSchoolNotes);
router.patch('/schools/:id/tier', superAdmin, updateSchoolPlanTier);
router.get('/schools', getSchools);

// Admin-only: create a school and link an existing user as owner (placeholder for future onboarding)
router.post('/schools/provision', provisionSchool);

// Permanently delete a user and all related data
router.delete('/users/:id', deleteUserPermanently);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/plan', superAdmin, updateUserPlan);

// SMTP Testing
router.post('/test-smtp', testSmtp);

// Manual Limit Reset
router.post('/users/:id/reset-limit', resetUserLimit);

// Admin Testimonial Management
router.get('/testimonials', getAllTestimonials);
router.post('/testimonials', createTestimonial);
router.patch('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);
router.patch('/testimonials/:id/toggle', toggleTestimonialActive);

// Mass Emailing with Tracking
router.post('/mass-email', sendMassEmailWithTracking);
router.get('/mass-email', getMassEmailHistory);
router.get('/mass-email/:id/recipients', getMassEmailRecipients);

module.exports = router;
