const prisma = require('./src/config/db');

console.log('Type of prisma.massEmail:', typeof prisma.massEmail);
if (prisma.massEmail) {
    console.log('Members of prisma.massEmail:', Object.keys(prisma.massEmail));
}

process.exit(0);
