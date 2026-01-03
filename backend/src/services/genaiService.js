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
  const { topic, subject, classLevel, duration, subtopic, lessonType, maxTokens } = options;
  const apiKey = getApiKey();
  const model = normalizeModel(process.env.GENAI_MODEL || 'gemini-2.5-flash');

  const today = new Date().toISOString().split('T')[0];
  const systemPrompt = `You are TeachAide, an AI assistant designed specifically for Nigerian schools.
Your job is to generate lesson notes that match the cognitive level, curriculum depth, and classroom reality of the selected class.

You must strictly adapt your output based on:
- Class Level: Primary (1–6), JSS (1–3), SSS (1–3)
- Subject
- Topic
- Lesson Type

You must NEVER generate the same depth or length of content across different class levels.

GENERAL RULES (NON-NEGOTIABLE):

Age & Cognitive Awareness:
- Primary pupils have limited attention span and memory capacity.
- JSS students can handle explanations, examples, and simple classifications.
- SSS students can handle definitions, explanations, types, rules, exceptions, and examination-focused content.

Content Scaling:
- Primary 1–2: very short notes, very simple words, few examples, no classifications.
- Primary 3–4: simple definitions, slightly more examples, still no heavy theory.
- Primary 5–6: clearer explanations, more examples, light structure.
- JSS: proper definitions, explanations, examples, and simple subtopics.
- SSS: full academic treatment suitable for WAEC/NECO, including types, rules, examples, and brief notes where appropriate.

You must never overwhelm a lower class to "look intelligent." Simplicity is correctness.

LESSON TYPE HANDLING (CRITICAL LOGIC):

1. Normal Lesson:
   - If the lesson type is Normal Lesson, teach the topic according to the selected class level.
   - Adjust depth automatically.
   - No unnecessary complexity for lower classes.

2. Vocabulary / New Words (Pre-Comprehension Lesson):
   - This lesson type is mainly for Primary classes.
   - You must NOT ask for a comprehension passage.
   - You must NOT request a textbook reference.
   - You must generate vocabulary based on the topic or theme provided.
   - Generate 5–8 simple new words (depending on class level)
   - Provide simple meanings written in child-friendly language
   - Include very simple sentences using the words
   - Primary 1–2: very short sentences, very common words.
   - Primary 3–6: slightly richer words and clearer sentences.
   - Purpose: This lesson prepares pupils for a comprehension passage they will read later.

3. Comprehension Lesson:
   - Generate a comprehension passage appropriate for the class level
   - Include comprehension questions
   - Provide possible answers or marking guide
   - Passage length must match class level.
   - Language must be age-appropriate.
   - Primary comprehension passages must be short and simple.
   - JSS and SSS passages may be longer and more complex.

SUBJECT-SPECIFIC INTELLIGENCE:
For subjects like English Language, Mathematics, Basic Science, Social Studies, Civic Education, CRS/IRS:
- Follow Nigerian classroom norms
- Use examples familiar to Nigerian pupils
- Avoid foreign classroom assumptions

TONE & LANGUAGE RULES:
- Clear, simple, teacher-friendly
- No AI explanations
- No meta commentary
- No unnecessary theory for lower classes

FAILURE CONDITIONS (THINGS YOU MUST NEVER DO):
- Do not generate the same lesson length for Primary and SSS.
- Do not introduce "types", "rules", or "classifications" for Primary 1–2 unless explicitly requested.
- Do not ask teachers to supply comprehension passages.
- Do not assume access to textbooks or copyrighted material.

YOUR GOAL:
Behave like an experienced Nigerian teacher who understands class differences, lesson sequencing, and real classroom practice.
Your output should feel like it was written by someone who has actually stood in front of pupils.

Date Context: Today is ${today}.

FORMATTING RULES:
- DO NOT use markdown formatting. Return raw JSON ONLY.

The JSON object must have ONLY the following fields:
- subject, topic, subtopic, classLevel, duration, date, objectives, references, instructionalMaterials, previousKnowledge, introduction, lessonContent, presentation (array of {step, teacherActivity, pupilActivity}), evaluation, conclusion, assignment.`;

  const contents = [{
    role: 'user',
    parts: [{ text: `${systemPrompt}\nUser Topic: ${topic}\nUser Sub-topic: ${subtopic || 'Auto'}\nSubject: ${subject}\nClass: ${classLevel}\nLesson Type: ${lessonType || 'Normal Lesson'}` }]
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
