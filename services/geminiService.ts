import { GoogleGenAI, Type } from "@google/genai";
import { LessonNote, Assessment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLessonNote = async (
  userInputTopic: string,
  subject: string,
  classLevel: string,
  duration: string = "40 minutes",
  userPlan: 'Free' | 'Pro' | 'School' = 'Free',
  limitReached: boolean = false
): Promise<LessonNote> => {
  try {
    const isFree = userPlan === 'Free';

    // Construct the System Instruction / Prompt based on User Rules
    const systemPrompt = `
PROMPT FOR GOOGLE AI STUDIO (SYSTEM INSTRUCTION)

You are the engine powering a Teacher Assistant App.
Your job is to generate accurate, Nigerian-standard lesson notes for all subjects and classes from Nursery to SSS.
Your responses must always follow the strict rules below.

APP RULES

The app has usage tiers:

FREE PLAN:
Maximum of 2 full lesson notes per week.
Only basic subjects (Mathematics, English, Basic Science, Basic Technology, Social Studies).
No DOC/PDF export formatting.
Shorter and less detailed output.

PAID PLAN (Pro/School):
Unlimited lesson notes with fair-usage limits.
All subjects are allowed.
Full details, formatting, scheme, and objectives.

The current user is on: **${userPlan.toUpperCase()} PLAN**.

${limitReached ? `STOP IMMEDIATELY. The user has reached their limit. Respond with an error message in the 'lessonContent' field: "Your free weekly limit for lesson notes has been used. Upgrade to continue."` : ''}

When generating lesson notes, never call unnecessary external information.
Stay inside the Nigerian curriculum style.

Be extremely concise in prompts and internal tokens.
Do not add extra explanations unless part of the lesson.

LESSON NOTE FORMAT:
Generate the content strictly according to the user's plan.
- If FREE: Generate a Basic and shorter version (Max 3 objectives, short presentation, 3 evaluation questions).
- If PAID: Generate Full details, detailed presentation (Step 1-4), Bloom's taxonomy objectives.

INSTRUCTION ON CONTENT:
- **Reference Materials**: List standard Nigerian textbooks.
- **Content**: Use explicit line breaks for all lists.
- **Structure**: Strictly follow Nigerian Ministry of Education standard.
- **Objectives**: Specific and measurable.

OUTPUT FORMAT:
You MUST output strictly in valid JSON format matching the schema provided. 
Map the "LESSON NOTE FORMAT" fields to the JSON properties.
`;

    // If limit (mock check in prompt, though better handled in code)
    if (limitReached && isFree) {
      throw new Error("Your free weekly limit for lesson notes has been used. Upgrade to continue.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}

      REQUEST DETAILS:
      Subject: ${subject}
      Class: ${classLevel}
      Topic: ${userInputTopic}
      Duration: ${duration}
      
      Generate the lesson note now in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: "Broad Subject Area" },
            subtopic: { type: Type.STRING, description: "Specific Lesson Focus" },
            classLevel: { type: Type.STRING },
            subject: { type: Type.STRING },
            duration: { type: Type.STRING },
            references: { type: Type.ARRAY, items: { type: Type.STRING } },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructionalMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
            previousKnowledge: { type: Type.STRING },
            introduction: { type: Type.STRING },
            lessonContent: { type: Type.STRING, description: "Detailed notes. Use \\n for formatting." },
            presentation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING },
                  teacherActivity: { type: Type.STRING },
                  pupilActivity: { type: Type.STRING },
                },
              },
            },
            evaluation: { type: Type.ARRAY, items: { type: Type.STRING } },
            conclusion: { type: Type.STRING },
            assignment: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text generated");
    }

    const data = JSON.parse(text) as LessonNote;
    return { ...data, subject, classLevel, duration };
  } catch (error) {
    console.error("Error generating lesson note:", error);
    throw error;
  }
};

export const generateAssessment = async (
  topic: string,
  classLevel: string,
  subject: string,
  questionCount: number = 5
): Promise<Assessment> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a student assessment quiz for a Nigerian school.
          Subject: ${subject}
          Class: ${classLevel}
          Topic: ${topic}
          Number of Questions: ${questionCount}
          
          Include a mix of Multiple Choice Questions (MCQ), True/False, and Short Answer.
          Provide the correct answer for grading purposes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["MCQ", "TrueFalse", "ShortAnswer"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Only for MCQ" },
                  correctAnswer: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    const data = JSON.parse(text);

    return {
      id: '', // Set by DB
      userId: '', // Set by DB
      topic,
      classLevel,
      subject,
      createdAt: new Date().toISOString(),
      questions: data.questions
    };
  } catch (error) {
    console.error("Error generating assessment", error);
    throw error;
  }
}