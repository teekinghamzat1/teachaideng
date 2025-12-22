const prisma = require('./src/config/db');
const email = process.argv[2];

if (!email) {
    console.log('Please provide an email: node promote.js <email>');
    process.exit(1);
}

async function main() {
    console.log(`Promoting ${email}...`);
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'Admin' }
        });
        console.log(`Success! ${user.name} is now an Admin.`);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
