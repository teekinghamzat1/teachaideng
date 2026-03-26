const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateBlogDraftViaGenAI } = require('../services/genaiService');

const DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1427504494785-319ce83d21df?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1200'
];

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
                summary: output.meta_description || "",
                category: topicRecord.category || output.category,
                metaTitle: output.title, // Keep same as title
                metaDescription: output.meta_description,
                keywords: keywordsStr,
                published: false,
                author: 'System Auto-Draft',
                image: DEFAULT_IMAGES[Math.floor(Math.random() * DEFAULT_IMAGES.length)]
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

let blogTask = null;

async function initBlogCron() {
    try {
        const settings = await prisma.systemSetting.findUnique({
            where: { id: 1 },
            select: { blogAutoDraftSchedule: true }
        });

        const schedule = settings?.blogAutoDraftSchedule || '0 7,22 * * *';

        if (blogTask) {
            blogTask.stop();
        }

        blogTask = cron.schedule(schedule, async () => {
            console.log(`[Blog Auto-Draft] Running scheduled text generation at ${new Date().toISOString()}`);
            await processNextDraft();
        });

        console.log(`[Blog Auto-Draft] Cron scheduled for: "${schedule}"`);
    } catch (err) {
        console.error('[Blog Auto-Draft] Failed to init cron:', err.message);
        // Fallback
        blogTask = cron.schedule('0 7,22 * * *', async () => {
            await processNextDraft();
        });
    }
}

module.exports = {
    initBlogCron,
    processNextDraft,
    rescheduleBlogDrafts: initBlogCron
};
