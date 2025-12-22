const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const categorySchema = z.object({
    body: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
    }),
});

router.route('/')
    .get(getCategories)
    .post(protect, admin, validate(categorySchema), createCategory);

router.route('/:id')
    .patch(protect, admin, validate(categorySchema), updateCategory)
    .delete(protect, admin, deleteCategory);

module.exports = router;
