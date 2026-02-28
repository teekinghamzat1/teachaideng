const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateBlogDraftViaGenAI } = require('../services/genaiService');

// Function to process a single draft
async function processNextDraft() {
    try {
        console.log('[Blog Auto-Draft] Checking for queued topics...');
        // Find the highest priority QUEUED topic
        const topicRecord = await prisma.topicQueue.findFirst({
            where: { status: 'QUEUED' },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ]
        });

        if (!topicRecord) {
            console.log('[Blog Auto-Draft] No queued topics found. Exiting.');
            return;
        }

        // Lock it to IN_PROGRESS
        await prisma.topicQueue.update({
            where: { id: topicRecord.id },
            data: { status: 'IN_PROGRESS' }
        });

        console.log(`[Blog Auto-Draft] Processing topic: "${topicRecord.topic}"`);

        // Generate content via AI
        let output;
        try {
            output = await generateBlogDraftViaGenAI({
                topic: topicRecord.topic,
                audience: topicRecord.audience,
                category: topicRecord.category
            });
        } catch (genError) {
            // Re-attempt once or just fail
            console.error('[Blog Auto-Draft] AI generation failed, marking FAILED:', genError.message);
            await prisma.topicQueue.update({
                where: { id: topicRecord.id },
                data: {
                    status: 'FAILED',
                    errorLog: genError.message
                }
            });
            return;
        }

        // Validate and create Draft
        if (!output || !output.title || (!output.body_html && !output.body_markdown)) {
            throw new Error("Invalid format from AI");
        }

        // ensure unique slug
        let finalSlug = output.slug || output.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const existingPost = await prisma.blogPost.findUnique({ where: { slug: finalSlug } });
        if (existingPost) {
            finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }

        const keywordsStr = Array.isArray(output.keywords) ? output.keywords.join(', ') : (output.keywords || '');

        // Save Draft
        await prisma.blogPost.create({
            data: {
                title: output.title,
                slug: finalSlug,
                content: output.body_html || output.body_markdown || "",
                category: topicRecord.category || output.category,
                metaTitle: output.title, // Keep same as title
                metaDescription: output.meta_description,
                keywords: keywordsStr,
                published: false,
                author: 'System Auto-Draft'
            }
        });

        // Mark USED
        await prisma.topicQueue.update({
            where: { id: topicRecord.id },
            data: {
                status: 'USED',
                usedAt: new Date()
            }
        });

        console.log(`[Blog Auto-Draft] Draft successfully created for topic: "${topicRecord.topic}"`);
    } catch (error) {
        console.error('[Blog Auto-Draft] Error in processNextDraft:', error);
    }
}

function initBlogCron() {
    // Schedule for 07:00, 13:00, 19:00 system time
    // cron string: '0 7,13,19 * * *'
    cron.schedule('0 7,13,19 * * *', async () => {
        console.log(`[Blog Auto-Draft] Running scheduled text generation at ${new Date().toISOString()}`);
        await processNextDraft();
    });

    console.log('[Blog Auto-Draft] Cron scheduled for 07:00, 13:00, 19:00 locally.');
}

module.exports = {
    initBlogCron,
    processNextDraft
};
