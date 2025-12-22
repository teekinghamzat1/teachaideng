const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const where = req.query.keyword
        ? {
            name: {
                contains: req.query.keyword,
            },
        }
        : {};

    const count = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
        where,
        take: pageSize,
        skip: pageSize * (page - 1),
        include: { category: true }
    });

    // Parse images JSON string to array
    const parsedProducts = products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
    }));

    res.json(
        formatResponse(true, 'Products retrieved', {
            products: parsedProducts,
            page,
            pages: Math.ceil(count / pageSize),
        })
    );
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { category: true, user: { select: { name: true } } }
    });

    if (product) {
        const parsedProduct = {
            ...product,
            images: product.images ? JSON.parse(product.images) : [],
        };
        res.json(formatResponse(true, 'Product retrieved', parsedProduct));
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image, category, stock } = req.body;

    // Assuming category is an ID
    const createdProduct = await prisma.product.create({
        data: {
            name,
            price: Number(price),
            userId: req.user.id,
            // If frontend sends 'image' (single string), wrap in array. 
            // If it sends 'images' (array), use stringify directly.
            // Based on previous code, frontend sent 'image'
            images: image ? JSON.stringify([image]) : JSON.stringify([]),
            categoryId: category,
            stock: Number(stock),
            description,
        }
    });

    res.status(201).json(formatResponse(true, 'Product created', createdProduct));
});

// @desc    Update a product
// @route   PATCH /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, description, image, category, stock } = req.body;

    const product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (product) {
        const updateData = {};
        if (name) updateData.name = name;
        if (price) updateData.price = Number(price);
        if (description) updateData.description = description;
        if (image) updateData.images = JSON.stringify([image]); // Keep consistency
        if (category) updateData.categoryId = category;
        if (stock) updateData.stock = Number(stock);

        const updatedProduct = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json(formatResponse(true, 'Product updated', updatedProduct));
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });

    if (product) {
        await prisma.product.delete({ where: { id: req.params.id } });
        res.json(formatResponse(true, 'Product removed'));
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
