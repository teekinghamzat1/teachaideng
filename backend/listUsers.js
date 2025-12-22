const prisma = require('./src/config/db');

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        console.log('--- USERS IN DB ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('-------------------');
    } catch (e) {
        console.error('Error fetching users:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
