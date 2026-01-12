const express = require('express');
const router = express.Router();
const { getActiveTestimonials, submitTestimonial } = require('../controllers/testimonialController');

// Public testimonials endpoint
router.get('/', getActiveTestimonials);
router.post('/', submitTestimonial);

module.exports = router;
