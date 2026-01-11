const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');

// @desc    Generate dynamic sitemap.xml
// @route   GET /api/sitemap.xml
// @access  Public
const generateSitemap = asyncHandler(async (req, res) => {
    const baseUrl = 'https://www.teachaide.ng';

    // 1. Get all published blog posts
    const blogPosts = await prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true }
    });

    // 2. Static pages
    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'monthly' },
        { url: '/blog', priority: '0.8', changefreq: 'weekly' },
        { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
        { url: '/help', priority: '0.5', changefreq: 'monthly' },
        { url: '/contact', priority: '0.5', changefreq: 'monthly' },
        { url: '/privacy', priority: '0.3', changefreq: 'monthly' },
    ];

    // 3. Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    // Add dynamic blog posts
    blogPosts.forEach(post => {
        const lastMod = post.updatedAt.toISOString().split('T')[0];
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
});

module.exports = { generateSitemap };
