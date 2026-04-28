const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log("Searching for single entries that need splitting...");
    
    // Find all topics that contain a comma
    const messedUpTopics = await prisma.topicQueue.findMany({
        where: {
            topic: { contains: ',' },
            status: 'QUEUED'
        }
    });

    console.log(`Found ${messedUpTopics.length} entries to process.`);

    for (const item of messedUpTopics) {
        const individualTopics = item.topic.split(',').map(t => t.trim()).filter(t => t.length > 0);
        console.log(`Splitting entry "${item.id}" into ${individualTopics.length} topics...`);

        // Create new topics
        for (const t of individualTopics) {
            await prisma.topicQueue.create({
                data: {
                    topic: t,
                    audience: item.audience,
                    category: item.category,
                    priority: item.priority,
                    status: 'QUEUED'
                }
            });
        }

        // Delete the original messed up one
        await prisma.topicQueue.delete({
            where: { id: item.id }
        });
    }

    console.log("Cleanup complete!");
    process.exit(0);
}

cleanup().catch(e => {
    console.error(e);
    process.exit(1);
});
