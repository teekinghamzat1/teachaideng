const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({});
    res.json(formatResponse(true, 'Categories retrieved', categories));
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;

    const categoryExists = await prisma.category.findUnique({
        where: { name }
    });

    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists');
    }

    const category = await prisma.category.create({
        data: {
            name,
            description,
            image,
        }
    });

    if (category) {
        res.status(201).json(formatResponse(true, 'Category created', category));
    } else {
        res.status(400);
        throw new Error('Invalid category data');
    }
});

// @desc    Update a category
// @route   PATCH /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });

    if (category) {
        const updatedCategory = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                name: req.body.name || category.name,
                description: req.body.description || category.description,
                image: req.body.image || category.image,
            }
        });

        res.json(formatResponse(true, 'Category updated', updatedCategory));
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });

    if (category) {
        await prisma.category.delete({ where: { id: req.params.id } });
        res.json(formatResponse(true, 'Category removed'));
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
