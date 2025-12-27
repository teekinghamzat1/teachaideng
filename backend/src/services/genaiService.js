// Thin wrapper around Google GenAI. If @google/genai is not installed or API key missing,
// this module will throw so callers can handle gracefully.
let GoogleGenAI;
try {
  GoogleGenAI = require("@google/genai").GoogleGenAI;
} catch (e) {
  GoogleGenAI = null;
}

const Type = (v) => v; // placeholder if needed

const makeClient = () => {
  if (!GoogleGenAI) throw new Error('Google GenAI SDK not installed on backend');
  if (!process.env.GOOGLE_API_KEY && !process.env.API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) throw new Error('Google API key not configured');
  const apiKey = process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

const withRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // 503 Service Unavailable or 429 Too Many Requests are common transient errors
      const isTransient = err.message?.includes('503') ||
        err.message?.includes('UNAVAILABLE') ||
        err.message?.includes('429') ||
        err.status === 503 ||
        err.status === 429;

      if (!isTransient) throw err;

      const delay = initialDelay * Math.pow(2, i);
      console.warn(`GenAI transient error (${err.message}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

async function generateLessonNoteViaGenAI(options) {
  const { topic, subject, classLevel, duration, subtopic, userPlan, limitReached } = options;
  const ai = makeClient();

  const today = new Date().toISOString().split('T')[0];
  const systemPrompt = `You are an expert curriculum developer. Generate a detailed lesson note in strict JSON format.
  
  Topic Refinement Rules:
  1. If the user provides BOTH a "Main Topic" and a "Sub-topic", use them EXACTLY OR VERY CLOSELY as provided for the JSON "topic" and "subtopic" fields. Do not merge them.
  2. If the user provides ONLY a "Main Topic" and it is very broad (e.g., 'Grammar', 'Science', 'Maths'), refine the "topic" to be a formal curriculum title and generate a specific "subtopic".
  3. If a specific "Sub-topic" is provided, ALWAYS keep it in the "subtopic" field. Do not move it to the "topic" field.
  4. Ensure the content is strictly calibrated to the Class Level (${classLevel}).

  Date Context: Today is ${today}. Set the "date" field to this value.

  FORMATTING RULES:
  - DO NOT use markdown formatting in any field.
  - DO NOT use **bold**, *italics*, # headers, or [links].
  - Use plain text and simple capitalization for emphasis.

  The JSON object must have ONLY the following fields:
  - subject: string
  - topic: string (Refined formal main topic)
  - subtopic: string (Specific lesson focus)
  - classLevel: string
  - duration: string
  - date: string (YYYY-MM-DD)
  - objectives: string[] (List of behavioral objectives)
  - references: string[] (List of textbooks or materials)
  - instructionalMaterials: string[] (List of teaching aids)
  - previousKnowledge: string (What pupils already know)
  - introduction: string (How to introduce the lesson)
  - lessonContent: string (Detailed body of the lesson)
  - presentation: { step: string, teacherActivity: string, pupilActivity: string }[] (Step-by-step flow)
  - evaluation: string[] (Questions to ask pupils)
  - conclusion: string (Wrap up)
  - assignment: string (Homework)

  ENSURE ALL FIELDS ARE POPULATED with high-quality, educational content. Return raw JSON.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
    contents: `${systemPrompt}\nUser Topic: ${topic}\nUser Sub-topic: ${subtopic || 'Auto-generate Appropriate Sub-topic'}\nSubject: ${subject}\nClass: ${classLevel}\nDuration: ${duration}`,
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: options.maxTokens || 4096
    }
  }));

  // Try to extract usage metadata if available
  const usage = (response && (response.usage || response.metadata || response)) || {};
  const text = response && response.text ? response.text : null;
  return { text, usage };
}

async function generateAssessmentViaGenAI(options) {
  const { topic, classLevel, subject, questionCount } = options;
  const ai = makeClient();

  const systemPrompt = `You are an expert assessment developer. Generate a high-quality assessment in strict JSON format.
  
  FORMATTING RULES:
  - DO NOT use markdown formatting in any field.
  - Return raw JSON ONLY.
  
  The JSON object must have ONLY one field:
  - questions: { type: string, question: string, options: string[], correctAnswer: string }[]

  Question types: 'MCQ' (Multiple Choice), 'TrueFalse', or 'ShortAnswer'.
  For MCQ, provide 4 options.
  For TrueFalse, provide options: ["True", "False"].
  For ShortAnswer, options should be null or an empty array.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: options.model || 'gemini-1.5-flash',
    contents: `${systemPrompt}\nSubject: ${subject}\nClass: ${classLevel}\nTopic: ${topic}\nNumber of Questions: ${questionCount}`,
    config: {
      responseMimeType: 'application/json',
      maxOutputTokens: options.maxTokens || 4096
    }
  }));

  const usage = (response && (response.usage || response.metadata || response)) || {};
  const text = response && response.text ? response.text : null;
  return { text, usage };
}

module.exports = {
  generateLessonNoteViaGenAI,
  generateAssessmentViaGenAI
};
