const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    console.log('Recalculating usage for schools...');
    const schools = await prisma.school.findMany({ 
        include: { teachers: true } 
    }); 
    
    for (const s of schools) { 
        const teacherIds = s.teachers.map(t => t.id); 
        if (teacherIds.length === 0) continue; 
        
        const usages = await prisma.usageLog.count({ 
            where: { 
                userId: { in: teacherIds }, 
                action: 'LESSON_GENERATION' 
            } 
        }); 
        
        console.log('School:', s.name, 'Teachers:', teacherIds.length, 'Total Generated:', usages); 
        
        await prisma.school.update({ 
            where: { id: s.id }, 
            data: { notesUsedThisMonth: usages } 
        }); 
    } 
    console.log('Done.');
} 

main().catch(console.error).finally(() => prisma.$disconnect());
