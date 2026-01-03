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

// @desc    Get ALL blog posts (Admin - including drafts)
// @route   GET /api/blog/admin/all
// @access  Private/Admin
const getAllPosts = asyncHandler(async (req, res) => {
    const posts = await prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
});

// @desc    Update a blog post
// @route   PUT /api/blog/:id
// @access  Private/Admin
const updatePost = asyncHandler(async (req, res) => {
    const { title, content, summary, image, author, published, slug, metaTitle, metaDescription, keywords } = req.body;

    const post = await prisma.blogPost.findUnique({
        where: { id: req.params.id }
    });

    if (post) {
        const updatedPost = await prisma.blogPost.update({
            where: { id: req.params.id },
            data: {
                title: title || post.title,
                content: content || post.content,
                summary: summary || post.summary,
                image: image || post.image,
                author: author || post.author,
                published: published !== undefined ? published : post.published,
                slug: slug || post.slug,
                metaTitle: metaTitle || post.metaTitle,
                metaDescription: metaDescription || post.metaDescription,
                keywords: keywords || post.keywords
            }
        });
        res.json(updatedPost);
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

// @desc    Delete a blog post
// @route   DELETE /api/blog/:id
// @access  Private/Admin
const deletePost = asyncHandler(async (req, res) => {
    const post = await prisma.blogPost.findUnique({
        where: { id: req.params.id }
    });

    if (post) {
        await prisma.blogPost.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Post removed' });
    } else {
        res.status(404);
        throw new Error('Post not found');
    }
});

module.exports = {
    getPosts,
    getAllPosts,
    getPostBySlug,
    createPost,
    updatePost,
    deletePost
};
