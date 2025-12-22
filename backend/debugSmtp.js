const prisma = require('./src/config/db');

async function main() {
    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        if (settings) {
            console.log('--- SYSTEM SETTINGS ---');
            console.log(`SMTP Host: ${settings.smtpHost}`);
            console.log(`SMTP Port: ${settings.smtpPort}`);
            console.log(`SMTP User: ${settings.smtpUser}`);
            console.log(`SMTP Password: ${settings.smtpPassword ? (settings.smtpPassword.length > 4 ? settings.smtpPassword.substring(0, 2) + '*'.repeat(settings.smtpPassword.length - 2) : '****') : 'MISSING'}`);
            console.log(`SMTP From Email: ${settings.smtpFromEmail}`);
            console.log(`SMTP From Name: ${settings.smtpFromName}`);
            console.log('-----------------------');
        } else {
            console.log('No system settings found in database.');
        }
    } catch (e) {
        console.error('Error fetching settings:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
