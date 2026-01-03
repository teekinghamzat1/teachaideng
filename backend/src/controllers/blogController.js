const asyncHandler = require('express-async-handler');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get all published blog posts
// @route   GET /api/blog
// @access  Public
const getPosts = asyncHandler(async (req, res) => {
    const posts = await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            slug: true,
            summary: true,
            image: true,
            author: true,
            createdAt: true
        }
    });
    res.json(posts);
});

// @desc    Get single blog post by slug
// @route   GET /api/blog/:slug
// @access  Public
const getPostBySlug = asyncHandler(async (req, res) => {
    const post = await prisma.blogPost.findUnique({
        where: { slug: req.params.slug }
    });

    if (post && post.published) {
        res.json(post);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Create a blog post (Admin only)
// @route   POST /api/blog
// @access  Private/Admin
const createPost = asyncHandler(async (req, res) => {
    const { title, content, summary, image, author, published, slug, metaTitle, metaDescription, keywords } = req.body;

    // Simple slug generation if not provided
    let finalSlug = slug;
    if (!finalSlug) {
        finalSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const post = await prisma.blogPost.create({
        data: {
            title,
            content,
            summary,
            image,
            author: author || 'TeachAide Team',
            published: published || false,
            slug: finalSlug,
            metaTitle,
            metaDescription,
            keywords
        }
    });

    res.status(201).json(post);
});

module.exports = {
    getPosts,
    getPostBySlug,
    createPost
};
