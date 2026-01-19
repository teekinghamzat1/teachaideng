const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Nigerian Curriculum Data...');

    const terms = ['1st'];
    const levels = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
    const subjects = ['English Language', 'Mathematics', 'Basic Science'];

    // --- English Curriculum Data (Primary 1-3 Sample) ---
    const englishData = {
        'Primary 1': [
            {
                week: 1, theme: 'My Home & Family', topics: [
                    { type: 'Vocabulary Development', topic: 'Family Members', sub: 'Father, Mother, Sister, Brother', skills: 'Identification' },
                    { type: 'Comprehension Passage', topic: 'Our Small House', sub: 'Reading & Observation', skills: 'Listening' },
                    { type: 'Grammar', topic: 'Nouns (Person)', sub: 'Names of people in the house', skills: 'Part of Speech' },
                    { type: 'Composition', topic: 'My Family', sub: 'Introductory sentences', skills: 'Writing' },
                    { type: 'Dictation', topic: 'Spelling family words', sub: 'Letter sounds', skills: 'Spelling' }
                ]
            },
            {
                week: 2, theme: 'My School', topics: [
                    { type: 'Vocabulary Development', topic: 'Classroom Objects', sub: 'Tables, Chairs, Chalkboard', skills: 'Identification' },
                    { type: 'Comprehension Passage', topic: 'A Day at School', sub: 'Simple sentences', skills: 'Reading' },
                    { type: 'Grammar', topic: 'Nouns (Things)', sub: 'Common objects', skills: 'Part of Speech' },
                    { type: 'Composition', topic: 'My Classroom', sub: 'Description', skills: 'Writing' },
                    { type: 'Dictation', topic: 'School words', sub: 'Recognition', skills: 'Spelling' }
                ]
            },
            {
                week: 3, theme: 'Building Reading Skills', topics: [
                    { type: 'Vocabulary Development', topic: 'Action Words (Verbs)', sub: 'Run, Eat, Play, Sit', skills: 'Vocabulary' },
                    { type: 'Comprehension Passage', topic: 'Playing in the Park', sub: 'Simple action sequence', skills: 'Comprehension' },
                    { type: 'Grammar', topic: 'Simple Verbs', sub: 'Using "Is" and "Are"', skills: 'Syntax' },
                    { type: 'Composition', topic: 'What I Do at Home', sub: 'Action sentences', skills: 'Expression' },
                    { type: 'Dictation', topic: 'Action verbs', sub: 'Phonics', skills: 'Listening' }
                ]
            }
            // ... more weeks would follow a similar pattern
        ]
    };

    // Helper to fill 12 weeks if data is missing (for demo purposes)
    const generate12Weeks = (baseData) => {
        const full = [...baseData];
        for (let i = baseData.length + 1; i <= 12; i++) {
            full.push({
                week: i,
                theme: `Academic Focus: Module ${i}`,
                topics: baseData[0].topics.map(t => ({ ...t, topic: `${t.topic} (Extended)` }))
            });
        }
        return full;
    };

    for (const level of levels) {
        for (const subject of subjects) {
            console.log(`Creating ${subject} for ${level}...`);

            const scheme = await prisma.referenceScheme.create({
                data: {
                    subject,
                    classLevel: level,
                    term: '1st',
                    source: 'Nigerian NERDC Standards'
                }
            });

            // Sample topics based on subject
            let baseData = [];
            if (subject === 'English Language') {
                baseData = [
                    {
                        week: 1, theme: 'Introduction & Greetings', topics: [
                            { type: 'Vocabulary Development', topic: 'Greetings', sub: 'Morning, Afternoon, Evening', skills: 'Communication' },
                            { type: 'Comprehension Passage', topic: 'Greeting my Elders', sub: 'Respect & Culture', skills: 'Listening' },
                            { type: 'Grammar', topic: 'Common Nouns', sub: 'Names of people', skills: 'Grammar' },
                            { type: 'Composition', topic: 'Introducing Myself', sub: 'Self-expression', skills: 'Writing' },
                            { type: 'Dictation', topic: 'Three letter words', sub: 'Phonics', skills: 'Spelling' }
                        ]
                    }
                ];
            } else if (subject === 'Mathematics') {
                baseData = [
                    {
                        week: 1, theme: 'Numbers and Numeration', topics: [
                            { type: 'Lesson 1', topic: 'Counting 1-50', sub: 'Number objects', skills: 'Numeracy' },
                            { type: 'Lesson 2', topic: 'Writing Numbers', sub: 'Number formation', skills: 'Fine motor' },
                            { type: 'Lesson 3', topic: 'Number Value', sub: 'Quantity matching', skills: 'Logic' },
                            { type: 'Lesson 4', topic: 'Comparing Numbers', sub: 'More or Less', skills: 'Comparison' },
                            { type: 'Lesson 5', topic: 'Review & Quiz', sub: 'Weekly mastery', skills: 'Retention' }
                        ]
                    }
                ];
            } else {
                baseData = [
                    {
                        week: 1, theme: 'Our Environment', topics: [
                            { type: 'Lesson 1', topic: 'Living Things', sub: 'People, Plants, Animals', skills: 'Classification' },
                            { type: 'Lesson 2', topic: 'Needs of Living Things', sub: 'Air, Food, Water', skills: 'Observation' },
                            { type: 'Lesson 3', topic: 'Non-Living Things', sub: 'Stones, Tables, Cars', skills: 'Differentiation' },
                            { type: 'Lesson 4', topic: 'Taking care of Plants', sub: 'Watering plants', skills: 'Practical science' },
                            { type: 'Lesson 5', topic: 'Summary', sub: 'Environment check', skills: 'Summarization' }
                        ]
                    }
                ];
            }

            const fullWeeks = generate12Weeks(baseData);

            for (const weekData of fullWeeks) {
                const week = await prisma.referenceWeek.create({
                    data: {
                        schemeId: scheme.id,
                        weekNumber: weekData.week,
                        themeTitle: weekData.theme
                    }
                });

                for (const t of weekData.topics) {
                    await prisma.referenceTopic.create({
                        data: {
                            weekId: week.id,
                            topic: t.topic,
                            subtopics: t.sub,
                            skills: t.skills,
                            lessonType: t.type,
                            learningGoal: `Learners will master ${t.topic}`,
                            resourceSuggestions: 'Visual aids, Flashcards, Nigerian textbooks'
                        }
                    });
                }
            }
        }
    }

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
