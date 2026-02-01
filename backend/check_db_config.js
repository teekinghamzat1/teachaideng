const prisma = require('./src/config/db');

console.log('Available models in prisma instance:');
const models = Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key] === 'object');
console.log(models);

if (prisma.massEmail) {
    console.log('prisma.massEmail is defined');
} else {
    console.log('prisma.massEmail is UNDEFINED');
}

process.exit(0);
