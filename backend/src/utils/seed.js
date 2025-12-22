const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const importData = async () => {
    try {
        console.log('Cleaning database...');
        // Delete in order to respect Foreign Keys
        await prisma.transaction.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.student.deleteMany();
        await prisma.timetableSlot.deleteMany();
        await prisma.timetable.deleteMany();
        await prisma.question.deleteMany();
        await prisma.assessment.deleteMany();
        await prisma.lessonNote.deleteMany();
        await prisma.user.deleteMany();

        console.log('Seeding Users...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const user1 = await prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'john@example.com',
                password: hashedPassword,
                role: 'user',
            }
        });

        const user2 = await prisma.user.create({
            data: {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: hashedPassword,
                role: 'user',
            }
        });

        const adminUser = await prisma.user.create({
            data: {
                name: 'Admin User',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'superadmin',
            }
        });

        console.log('Seeding Categories...');
        const electronics = await prisma.category.create({
            data: {
                name: 'Electronics',
                description: 'Gadgets and devices',
            }
        });

        const clothing = await prisma.category.create({
            data: {
                name: 'Clothing',
                description: 'Apparel and fashion',
            }
        });

        console.log('Seeding Products...');
        const products = [
            {
                name: 'Airpods Wireless Bluetooth Headphones',
                images: JSON.stringify(['/images/airpods.jpg']),
                description: 'Bluetooth technology lets you connect it with compatible devices wirelessly High-quality AAC audio offers immersive listening experience Built-in microphone allows you to take calls while working',
                categoryId: electronics.id,
                price: 89.99,
                stock: 10,
                userId: adminUser.id,
            },
            {
                name: 'iPhone 11 Pro 256GB Memory',
                images: JSON.stringify(['/images/phone.jpg']),
                description: 'Introducing the iPhone 11 Pro. A transformative triple-camera system that adds tons of capability without complexity. An unprecedented leap in battery life',
                categoryId: electronics.id,
                price: 599.99,
                stock: 7,
                userId: adminUser.id,
            },
            {
                name: 'Cannon EOS 80D DSLR Camera',
                images: JSON.stringify(['/images/camera.jpg']),
                description: 'Characterized by versatile imaging specs, the Canon EOS 80D further clarifies itself using a pair of robust focusing systems and an intuitive design',
                categoryId: electronics.id,
                price: 929.99,
                stock: 5,
                userId: adminUser.id,
            },
        ];

        for (const product of products) {
            await prisma.product.create({ data: product });
        }

        console.log('Seeding Teachaide Content (Notes, Students, etc.)...');

        // --- PRO TIP: Sample Teacher has 5 notes, 10 students, 2 assessments ---

        // 1. Lesson Notes
        const note1 = await prisma.lessonNote.create({
            data: {
                userId: user1.id,
                topic: 'Introduction to Photosynthesis',
                subtopic: 'Light vs Dark Reactions',
                classLevel: 'JSS 2',
                subject: 'Basic Science',
                duration: '40 mins',
                date: new Date(),
                status: 'Approved',
                references: JSON.stringify(['Modern Biology Textbook', 'Wikipedia']),
                objectives: JSON.stringify(['Define photosynthesis', 'Differentiate between light and dark reactions']),
                instructionalMaterials: JSON.stringify(['Chart', 'Plant specimen']),
                presentation: JSON.stringify([
                    { step: 'Step 1', teacherActivity: 'Introduces topic', pupilActivity: 'Listens' },
                    { step: 'Step 2', teacherActivity: 'Explains diagram', pupilActivity: 'Draws diagram' }
                ]),
                evaluation: JSON.stringify(['What is chlorophyll?']),
                conclusion: 'Class ended with a summary.',
            }
        });

        await prisma.lessonNote.create({
            data: {
                userId: user1.id,
                topic: 'Algebraic Expressions',
                subtopic: 'Simplification',
                classLevel: 'JSS 3',
                subject: 'Mathematics',
                duration: '40 mins',
                status: 'Flagged',
                references: '[]', objectives: '[]', instructionalMaterials: '[]', presentation: '[]', evaluation: '[]'
            }
        });

        // 2. Students
        const studentNames = ['Adeola Smith', 'Chinedu Okeke', 'Fatima Musa', 'Segun Alabi', 'Ngozi Eze'];
        for (const name of studentNames) {
            await prisma.student.create({
                data: {
                    userId: user1.id,
                    name,
                    age: Math.floor(Math.random() * 3) + 12, // 12-14
                    gender: Math.random() > 0.5 ? 'Male' : 'Female',
                    subject: 'Basic Science',
                    notes: 'Attentive student'
                }
            });
        }

        // 3. Assessments
        const assessment = await prisma.assessment.create({
            data: {
                userId: user1.id,
                topic: 'Forces and Motion',
                classLevel: 'JSS 1',
                subject: 'Basic Science',
                questions: {
                    create: [
                        {
                            type: 'MCQ',
                            question: 'What is the unit of Force?',
                            correctAnswer: 'Newton',
                            options: JSON.stringify(['Joule', 'Newton', 'Watt', 'Pascal'])
                        },
                        {
                            type: 'TrueFalse',
                            question: 'Friction opposes motion.',
                            correctAnswer: 'True',
                        }
                    ]
                }
            }
        });

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await prisma.transaction.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.user.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
