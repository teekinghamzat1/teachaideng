const prisma = require('./src/config/db');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, name: true, role: true }
    });
    console.log('--- USER LIST ---');
    users.forEach(u => console.log(`Email: ${u.email} | Name: ${u.name} | Role: ${u.role}`));
    console.log('-----------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
