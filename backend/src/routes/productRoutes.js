const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const productSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        price: z.number().positive(),
        description: z.string().min(1),
        category: z.string(), // ObjectId as string
        stock: z.number().int().nonnegative(),
        image: z.string().optional(),
    }),
});

const updateProductSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        price: z.number().positive().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        stock: z.number().int().nonnegative().optional(),
        image: z.string().optional(),
    }),
});

router.route('/')
    .get(getProducts)
    .post(protect, admin, validate(productSchema), createProduct);

router.route('/:id')
    .get(getProductById)
    .patch(protect, admin, validate(updateProductSchema), updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
