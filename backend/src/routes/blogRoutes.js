const express = require('express');
const router = express.Router();
const { getPosts, getPostBySlug, createPost } = require('../controllers/blogController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getPosts)
    .post(protect, admin, createPost);

router.route('/:slug').get(getPostBySlug);

module.exports = router;
