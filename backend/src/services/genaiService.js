const axios = require('axios');

/**
 * REST-based Gemini Client
 * Uses axios to avoid dependency issues with SDKs not present in backend package.json
 */
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const getApiKey = () => {
  const key = process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('Google Gemini API key not configured in .env');
  return key;
};

const normalizeModel = (model) => {
  // Use gemini-2.5-flash - faster and more stable
  if (!model || model.includes('1.5-flash') || model.includes('2.0-flash')) return 'gemini-2.5-flash';
  return model.replace('models/', '');
};

const withRetry = async (fn, maxRetries = 5, initialDelay = 2000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const message = err.response?.data?.error?.message || err.message;

      // 429 (Rate Limit), 503 (Busy), 504 (Timeout)
      const isTransient = status === 429 || status === 503 || status === 504 ||
        message.includes('UNAVAILABLE') || message.includes('busy') || message.includes('quota') || message.includes('timeout');

      if (!isTransient) {
        const detailedError = new Error(message);
        detailedError.status = status;
        throw detailedError;
      }

      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, i) + (Math.random() * 1000);
      console.warn(`GenAI Rate Limit/Busy (${status}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

/**
 * Generate Lesson Note
 */
async function generateLessonNoteViaGenAI(options) {
  const { topic, subject, classLevel, duration, subtopic, maxTokens } = options;
  const apiKey = getApiKey();
  const model = normalizeModel(process.env.GENAI_MODEL || 'gemini-2.5-flash');

  const today = new Date().toISOString().split('T')[0];
  const systemPrompt = `You are an expert curriculum developer. Generate a detailed lesson note in strict JSON format.
  
  Topic Refinement Rules:
  1. If the user provides BOTH a "Main Topic" and a "Sub-topic", use them EXACTLY OR VERY CLOSELY as provided.
  2. If the user provides ONLY a "Main Topic" and it is broad, refine it to be a formal curriculum title.
  3. Ensure the content is strictly calibrated to the Class Level (${classLevel}).

  Date Context: Today is ${today}.

  FORMATTING RULES:
  - DO NOT use markdown formatting. Return raw JSON ONLY.

  The JSON object must have ONLY the following fields:
  - subject, topic, subtopic, classLevel, duration, date, objectives, references, instructionalMaterials, previousKnowledge, introduction, lessonContent, presentation (array of {step, teacherActivity, pupilActivity}), evaluation, conclusion, assignment.`;

  const contents = [{
    role: 'user',
    parts: [{ text: `${systemPrompt}\nUser Topic: ${topic}\nUser Sub-topic: ${subtopic || 'Auto'}\nSubject: ${subject}\nClass: ${classLevel}` }]
  }];

  const response = await withRetry(async () => {
    try {
      const res = await axios.post(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens || 4096
        }
      }, { timeout: 60000 });

      const candidate = res.data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      const usage = res.data.usageMetadata || {};

      return { text, usage };
    } catch (err) {
      if (err.response?.status === 429 && model === 'gemini-2.5-flash') {
        console.warn('Primary model 429. Falling back to Lite...');
        const res = await axios.post(`${API_BASE}/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens || 4096
          }
        }, { timeout: 60000 });
        const candidate = res.data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        return { text, usage: res.data.usageMetadata || {} };
      }
      throw err;
    }
  });

  return response;
}

/**
 * Generate Assessment
 */
async function generateAssessmentViaGenAI(options) {
  const { topic, classLevel, subject, questionCount, maxTokens } = options;
  const apiKey = getApiKey();
  const model = normalizeModel(options.model || 'gemini-1.5-flash');

  const systemPrompt = `You are an expert assessment developer. Generate a high-quality assessment in strict JSON format.
  
  FORMATTING RULES:
  - DO NOT use markdown. Return raw JSON ONLY.
  
  The JSON object must have ONLY one field:
  - questions: { type: string, question: string, options: string[], correctAnswer: string }[]

  Question types: 'MCQ', 'TrueFalse', or 'ShortAnswer'.`;

  const contents = [{
    role: 'user',
    parts: [{ text: `${systemPrompt}\nSubject: ${subject}\nClass: ${classLevel}\nTopic: ${topic}\nQuestions: ${questionCount}` }]
  }];

  const response = await withRetry(async () => {
    try {
      const res = await axios.post(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: maxTokens || 4096
        }
      }, { timeout: 60000 });

      const candidate = res.data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      const usage = res.data.usageMetadata || {};

      return { text, usage };
    } catch (err) {
      if (err.response?.status === 429 && model === 'gemini-2.5-flash') {
        const res = await axios.post(`${API_BASE}/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: maxTokens || 4096
          }
        }, { timeout: 60000 });
        const candidate = res.data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        return { text, usage: res.data.usageMetadata || {} };
      }
      throw err;
    }
  });

  return response;
}

module.exports = {
  generateLessonNoteViaGenAI,
  generateAssessmentViaGenAI
};
