const express = require('express');
const router = express.Router();
const { getPosts, getAllPosts, getPostBySlug, createPost, updatePost, deletePost } = require('../controllers/blogController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
    .get(getPosts)
    .post(protect, admin, createPost);

router.get('/admin/all', protect, admin, getAllPosts);

router.route('/:id')
    .put(protect, admin, updatePost)
    .delete(protect, admin, deletePost);

router.route('/slug/:slug').get(getPostBySlug);
// Keep existing /:slug for backward compatibility if needed, but separate ID and slug logic is safer. 
// However, since /:id could conflict with /:slug if not careful, let's put slug route last or differentiate.
// Better ID matching is UUID, Slug is readable.
// Route ordering matters: /admin/all must be before /:slug or /:id.


module.exports = router;
