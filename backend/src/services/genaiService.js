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
  if (!process.env.GOOGLE_API_KEY && !process.env.API_KEY) throw new Error('Google API key not configured');
  const apiKey = process.env.GOOGLE_API_KEY || process.env.API_KEY;
  return new GoogleGenAI({ apiKey });
};

async function generateLessonNoteViaGenAI(options) {
  const { topic, subject, classLevel, duration, userPlan, limitReached } = options;
  const ai = makeClient();

  const systemPrompt = `You are an assistant that outputs JSON lesson notes (same rules as frontend).`;

  const response = await ai.models.generateContent({
    model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
    contents: `${systemPrompt}\nSubject: ${subject}\nClass: ${classLevel}\nTopic: ${topic}\nDuration: ${duration}`,
    config: { responseMimeType: 'application/json' }
  });

  // Try to extract usage metadata if available
  const usage = (response && (response.usage || response.metadata || response)) || {};
  const text = response && response.text ? response.text : null;
  return { text, usage };
}

async function generateAssessmentViaGenAI(options) {
  const { topic, classLevel, subject, questionCount } = options;
  const ai = makeClient();
  const response = await ai.models.generateContent({
    model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
    contents: `Assessment\nSubject: ${subject}\nClass: ${classLevel}\nTopic: ${topic}\nQuestions: ${questionCount}`,
    config: { responseMimeType: 'application/json' }
  });
  const usage = (response && (response.usage || response.metadata || response)) || {};
  const text = response && response.text ? response.text : null;
  return { text, usage };
}

module.exports = {
  generateLessonNoteViaGenAI,
  generateAssessmentViaGenAI
};
