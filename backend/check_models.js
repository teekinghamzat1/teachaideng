const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Available models in Prisma client:');
    const models = Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key] === 'object');
    console.log(models);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
