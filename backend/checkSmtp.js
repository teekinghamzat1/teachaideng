const prisma = require('./src/config/db');

async function checkSmtp() {
    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
        if (!settings) {
            console.log('Error: Settings record with ID 1 does not exist.');
            return;
        }

        console.log('ID:', settings.id);
        console.log('Host:', settings.smtpHost || '(empty)');
        console.log('Port:', settings.smtpPort || '(empty)');
        console.log('User:', settings.smtpUser || '(empty)');
        console.log('Pass:', settings.smtpPassword ? '********' : '(empty)');
        console.log('From:', settings.smtpFromEmail || '(empty)');
        console.log('Name:', settings.smtpFromName || '(empty)');

    } catch (error) {
        console.error('Database Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSmtp();
