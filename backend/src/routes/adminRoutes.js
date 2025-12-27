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
    getAnalytics
} = require('../controllers/adminController');

const {
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonialActive
} = require('../controllers/testimonialController');

const { provisionSchool } = require('../controllers/adminController');
const { deleteUserPermanently } = require('../controllers/adminController');
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

router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/orders', getOrders);
router.post('/create-admin', validate(createAdminSchema), superAdmin, createAdmin);

// Content Management
router.get('/content/notes', getAllNotes);
router.put('/content/notes/:id/status', updateNoteStatus);

// School Management
router.patch('/schools/:id/teacher-limit', updateSchoolTeacherLimit);

// Admin-only: create a school and link an existing user as owner (placeholder for future onboarding)
router.post('/schools/provision', provisionSchool);

// Permanently delete a user and all related data
router.delete('/users/:id', deleteUserPermanently);

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

module.exports = router;
