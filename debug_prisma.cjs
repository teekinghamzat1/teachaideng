require('dotenv').config({ path: './backend/.env' });
const prisma = require('./backend/src/config/db');
console.log('Prisma models:', Object.keys(prisma).filter(k => k[0] === k[0].toLowerCase() && !k.startsWith('_')));
process.exit(0);
