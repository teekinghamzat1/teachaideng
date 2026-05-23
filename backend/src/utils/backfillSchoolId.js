const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
    console.log('Starting backfill...'); 
    const usersWithSchool = await prisma.user.findMany({ 
        where: { schoolId: { not: null } }, 
        select: { id: true, schoolId: true } 
    }); 
    console.log('Found', usersWithSchool.length, 'users with schoolId'); 
    
    let updatedNotes = 0; 
    let updatedAssessments = 0; 
    
    for (const user of usersWithSchool) { 
        const notes = await prisma.lessonNote.updateMany({ 
            where: { userId: user.id, schoolId: null }, 
            data: { schoolId: user.schoolId } 
        }); 
        updatedNotes += notes.count; 
        
        const assessments = await prisma.assessment.updateMany({ 
            where: { userId: user.id, schoolId: null }, 
            data: { schoolId: user.schoolId } 
        }); 
        updatedAssessments += assessments.count; 
    } 
    
    console.log('Backfill complete.'); 
    console.log('Updated', updatedNotes, 'LessonNotes and', updatedAssessments, 'Assessments.'); 
} 

main().catch(console.error).finally(() => prisma.$disconnect());
