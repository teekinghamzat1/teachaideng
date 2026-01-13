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
- Subject: ${subject}
- Topic: ${topic}
- Subtopic: ${subtopic || 'None'}
- Lesson Type

You must NEVER generate the same depth or length of content across different class levels.
You must STRICTLY focus on the provided Subject and Topic. Do not generate content for a different subject or topic even if they seem related.

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
   - Generate complete lesson content with all sections filled.

2. Vocabulary / New Words (Pre-Comprehension Lesson):
   IMPORTANT: This is a TWO-PART lesson that must be structured in this EXACT order:
   
   PART A - Vocabulary Development (New Words):
   - First, generate a comprehension passage based on the topic/theme provided
   - Then, identify 5-8 words FROM THE PASSAGE that are likely new to learners at this class level
   - For each new word, provide:
     * The word itself
     * Simple, child-friendly meaning
     * An example sentence using the word
   - Primary 1–2: very simple words, very short sentences
   - Primary 3–6: slightly richer vocabulary, clearer sentences
   
   PART B - Comprehension Passage:
   - Include the FULL comprehension passage immediately after the vocabulary section
   - The passage must be the SAME passage from which you extracted the new words
   - Passage length must match class level (Primary = short, JSS/SSS = longer)
   
   PART C - Teacher Hint:
   - Add this exact note in the lessonContent or presentation section:
     "TEACHER NOTE: Teach the new words first (Day 1). Then read the Comprehension Passage with learners (Day 2)."
   
   CRITICAL: The new words MUST come from the passage, NOT from the topic title.
   CRITICAL: All three parts (Vocabulary, Passage, Teacher Hint) must be grouped together.
   CRITICAL: Ensure all sections contain actual content - no empty sections.

3. Comprehension Lesson:
   - Generate a comprehension passage appropriate for the class level
   - Extract 5-8 new words FROM THE PASSAGE (not from the topic)
   - For each word: provide meaning and example sentence
   - Include comprehension questions based on the passage
   - Provide possible answers or marking guide
   - Add teacher hint: "Teach the new words first (Day 1). Then read the passage with learners (Day 2)."
   - Passage length must match class level
   - Language must be age-appropriate
   - Primary: short and simple passages
   - JSS and SSS: longer and more complex passages
   - Ensure ALL sections have complete content

METADATA HANDLING (CRITICAL):
1. Topic & Subtopic Mapping for "Comprehension":
   - IF Lesson Type is "Comprehension":
     * JSON "topic" field MUST BE exact string: "Vocabulary Development / Reading Comprehension"
     * JSON "subtopic" field MUST BE the User's Provided Topic (e.g., "${topic}")
   - IF Lesson Type is "Normal Lesson":
     * Use User's Topic and Subtopic as provided.

2. Reference Materials:
   - If no specific book is known, use: ["TeachAide AI"]
   - Do NOT say "No specific references provided".

3. Content Guarantee:
   - The "lessonContent" field MUST NEVER be empty.
   - It must contain the full generated text of the lesson.

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
- ALL fields must contain actual content. NO empty strings or missing sections.

SPECIAL FORMATTING FOR VOCABULARY / COMPREHENSION LESSONS:
When Lesson Type is "Vocabulary / New Words" or "Comprehension":
- The "lessonContent" field MUST contain ALL THREE PARTS in this order:
  1. VOCABULARY DEVELOPMENT (NEW WORDS) - List all words with meanings and examples
  2. COMPREHENSION PASSAGE - The full passage text
  3. TEACHER NOTE - "Teach the new words first (Day 1). Then read the Comprehension Passage with learners (Day 2)."
- The "presentation" array should include steps for teaching the words, then reading the passage
- The "evaluation" should include comprehension questions based on the passage
- Ensure the passage and vocabulary are from the SAME content

The JSON object must have ONLY the following fields:
- subject, topic, subtopic, classLevel, duration, date, objectives, references, instructionalMaterials, previousKnowledge, introduction, lessonContent, presentation (array of {step, teacherActivity}), evaluation, conclusion, assignment.
PROCEDURE ENFORCEMENT (TOKEN-EFFICIENT):
- "presentation" MUST contain EXACTLY 6 steps, labeled Step I to Step VI.
- Steps must appear in this exact order.
- Never merge or omit steps, even if no written classwork exists.
- Step content adapts to lesson type and class level:
    * Step I: introduce/explain concept
    * Step II: examples/illustrations
    * Step III: learner participation (oral/discussion/observation)
    * Step IV: reinforcement (board/demo/correction)
    * Step V: application/practice (written/oral/guided)
    * Step VI: summary within presentation
- Do NOT repeat evaluation questions inside the procedure.
- Introduction, Evaluation, and Assignment remain standalone and are NOT steps.
Steps must appear in exact order from Step I to Step VI; do not shuffle.
If no written exercise, Step V adapts to oral/guided practice.
CRITICAL: DO NOT INCLUDE Pupil's Activity in the JSON or as a concept. Focus only on Teacher's Activity to save tokens.
`;

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

/**
 * Generate Lesson Evaluation / Student Remarks
 */
async function generateRemarkViaGenAI(options) {
  const { classLevel, subject, topic, lessonOutcome, students, style, maxTokens } = options;
  const apiKey = getApiKey();
  const model = normalizeModel(process.env.GENAI_MODEL || 'gemini-2.5-flash');

  const systemPrompt = `You are an expert teacher writing a lesson reflection/remark for your records.
  
  CONTEXT:
  - Subject: ${subject}
  - Class: ${classLevel}
  - Topic: ${topic}
  - Overall Lesson Outcome: ${lessonOutcome || 'Successful'}
  
  STUDENT OBSERVATIONS:
  ${students && students.length > 0 ? students.map(s => `- ${s.name}: ${s.observation}`).join('\n') : 'No specific students mentioned.'}

  STYLE: ${style || 'Professional'}

  TASK:
  Generate a cohesive, 2-4 sentence "Teacher's Remark". 
  1. Start with a brief statement about how the lesson on ${topic} went overall.
  2. If students are provided, naturally incorporate them into the paragraph (e.g., "The lesson was successful... John showed great mastery while Sarah struggled with...").
  3. Use teacher-friendly, encouraging language.
  4. Avoid generic filler. Use specific references to the topic.
  5. Return raw JSON with a single field "remark".`;

  const contents = [{
    role: 'user',
    parts: [{ text: systemPrompt }]
  }];

  const response = await withRetry(async () => {
    const res = await axios.post(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens || 1024
      }
    }, { timeout: 30000 });

    const candidate = res.data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    const usage = res.data.usageMetadata || {};

    return { text, usage };
  });

  return response;
}

module.exports = {
  generateLessonNoteViaGenAI,
  generateAssessmentViaGenAI,
  generateRemarkViaGenAI
};
