const express = require('express');
const router = express.Router();
const { getActiveTestimonials } = require('../controllers/testimonialController');

// Public testimonials endpoint
router.get('/', getActiveTestimonials);

module.exports = router;
