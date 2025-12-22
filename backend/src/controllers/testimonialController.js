const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');

// Public: Get active testimonials
const getActiveTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 12
    });

    res.json(formatResponse(true, 'Testimonials retrieved', testimonials));
});

// Admin: Get all testimonials
const getAllTestimonials = asyncHandler(async (req, res) => {
    const testimonials = await prisma.testimonial.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.json(formatResponse(true, 'All testimonials retrieved', testimonials));
});

// Admin: Create testimonial
const createTestimonial = asyncHandler(async (req, res) => {
    const { name, role, organization, content, avatarUrl, rating, isActive } = req.body;

    const testimonial = await prisma.testimonial.create({
        data: {
            name,
            role,
            organization: organization || null,
            content,
            avatarUrl: avatarUrl || null,
            rating: rating || null,
            isActive: isActive !== undefined ? isActive : true,
        }
    });

    res.status(201).json(formatResponse(true, 'Testimonial created', testimonial));
});

// Admin: Update testimonial
const updateTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role, organization, content, avatarUrl, rating, isActive } = req.body;

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
        res.status(404);
        throw new Error('Testimonial not found');
    }

    const updated = await prisma.testimonial.update({
        where: { id },
        data: {
            name: name || existing.name,
            role: role || existing.role,
            organization: organization !== undefined ? organization : existing.organization,
            content: content || existing.content,
            avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
            rating: rating !== undefined ? rating : existing.rating,
            isActive: isActive !== undefined ? isActive : existing.isActive,
        }
    });

    res.json(formatResponse(true, 'Testimonial updated', updated));
});

// Admin: Delete testimonial
const deleteTestimonial = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
        res.status(404);
        throw new Error('Testimonial not found');
    }

    await prisma.testimonial.delete({ where: { id } });
    res.json(formatResponse(true, 'Testimonial removed'));
});

// Admin: Toggle active
const toggleTestimonialActive = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) {
        res.status(404);
        throw new Error('Testimonial not found');
    }

    const updated = await prisma.testimonial.update({
        where: { id },
        data: { isActive: !existing.isActive }
    });

    res.json(formatResponse(true, 'Testimonial toggled', updated));
});

module.exports = {
    getActiveTestimonials,
    getAllTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    toggleTestimonialActive
};
