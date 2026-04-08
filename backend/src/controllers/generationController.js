const asyncHandler = require('express-async-handler');
const { sendAdminNotification } = require('../utils/emailService');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { hasTokens, chargeTokens } = require('../utils/tokens');
const genai = require('../services/genaiService');
const { checkWeeklyLessonLimit, createUsageLog } = require('../utils/usage');
const { createAdminLog } = require('../utils/auditLogger');
const usageService = require('../services/usageService');

// Helper to get cost estimates from settings
const getEstimates = async () => {
  let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.systemSetting.create({ data: { id: 1 } });
  }
  return {
    lesson: settings.lessonGenerationCost || 600,
    assessment: settings.assessmentGenerationCost || 200,
    maxTokens: settings.maxTokens || 4096
  };
};

// @route POST /api/generate/lesson
// Checks tokens, estimates price, invokes GenAI and charges tokens based on usage
// @route POST /api/generate/lesson
// Checks tokens, estimates price, invokes GenAI and charges tokens based on usage
const generateLesson = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    topic, subject, classLevel, duration, subtopic, lessonType,
    skipCache, smartHint, includeEvaluation, includeTeachingAids, nigerianCurriculum
  } = req.body;

  const estimates = await getEstimates();
  const estimate = estimates.lesson;

  // Enforce dynamic generation limit BEFORE calling GenAI or Cache
  const canGen = await usageService.canGenerateLesson(userId);
  if (!canGen.canGenerate) {
    res.status(403);
    return res.json(formatResponse(false, canGen.reason || 'Generation limit reached. Upgrade to continue.'));
  }

  // 1. Check Cache First (Silent Deduction Logic)
  if (!skipCache) {
    const cachedEntry = await prisma.sharedContent.findFirst({
      where: {
        type: 'lesson',
        subject: subject.trim(),
        classLevel: classLevel.trim(),
        topic: { equals: topic.trim(), mode: 'insensitive' },
        subtopic: { equals: (subtopic || '').trim(), mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (cachedEntry) {
      console.info(`[CACHE_HIT] Reusing lesson for topic: ${topic}`);

      // Still log usage so it counts against user's daily/weekly limit
      try {
        await createUsageLog(userId, 'LESSON_GENERATION', { topic, subject, classLevel, cached: true });
        await usageService.recordLessonGeneration(userId, 0, 0); // Cost 0 tokens but +1 lesson count
        await prisma.sharedContent.update({
          where: { id: cachedEntry.id },
          data: { usageCount: { increment: 1 } }
        });
      } catch (logErr) {
        console.warn('Failed to log cached usage', logErr);
      }

      return res.json(formatResponse(true, 'Generated (Library)', {
        text: cachedEntry.content,
        usage: { totalTokens: 0, cached: true },
        charged: 0
      }));
    }
  }

  // 2. Call GenAI (Cache Miss or Skip)
  let genResult;
  try {
    genResult = await genai.generateLessonNoteViaGenAI({
      topic, subject, classLevel, duration, subtopic, lessonType, smartHint,
      includeEvaluation, includeTeachingAids, nigerianCurriculum,
      userPlan: req.user.subscriptionPlan,
      maxTokens: estimates.maxTokens
    });
  } catch (err) {
    console.error('generateLesson ERROR:', err);

    // Log error to Admin Dashboard
    try {
      await prisma.errorLog.create({
        data: {
          userId,
          message: err.message || 'Generation failed',
          stack: err.stack,
          source: 'BACKEND',
          path: '/api/generate/lesson',
          severity: 'high',
          metadata: JSON.stringify({ topic, subject, classLevel, subtopic })
        }
      });
    } catch (logErr) {
      console.error('Failed to log error to DB:', logErr);
    }

    res.status(err.status || 500);
    const message = err.message?.includes('503') || err.message?.includes('UNAVAILABLE')
      ? 'The AI service is currently busy. Please try again in 10 seconds.'
      : 'Generation failed: ' + err.message;
    return res.json(formatResponse(false, message));
  }

  // Backend-only token tracking
  let usageTokens = estimate;
  if (genResult && genResult.usage) {
    usageTokens = genResult.usage.totalTokenCount || genResult.usage.totalTokens || genResult.usage.tokenCount || estimate;
  }

  // 3. Log usage for successful AI generation
  try {
    const metrics = {
      plan: req.user.subscriptionPlan,
      model: process.env.GENAI_MODEL || 'gemini-1.5-flash',
      tokens: usageTokens,
      inputLength: (topic + subject + classLevel).length,
      outputLength: genResult.text ? genResult.text.length : 0
    };
    await createUsageLog(userId, 'LESSON_GENERATION', metrics);

    const inputTokens = genResult.usage?.promptTokenCount || 0;
    const outputTokens = genResult.usage?.candidatesTokenCount || 0;
    await usageService.recordLessonGeneration(userId, inputTokens, outputTokens);

    // 4. Save to Cache for future silent reuse
    await prisma.sharedContent.create({
      data: {
        type: 'lesson',
        subject: subject.trim(),
        classLevel: classLevel.trim(),
        topic: topic.trim(),
        subtopic: (subtopic || '').trim(),
        content: genResult.text,
        createdById: userId,
        usageCount: 1
      }
    });

    // Notify Admin of Lesson Generation
    sendAdminNotification(
      'New Lesson Note Generated',
      `
      <p>A user has generated a new lesson note.</p>
      <ul>
          <li><strong>User:</strong> ${req.user.name} (${req.user.email})</li>
          <li><strong>Topic:</strong> ${topic}</li>
          <li><strong>Subtopic:</strong> ${subtopic || 'N/A'}</li>
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Class:</strong> ${classLevel}</li>
          <li><strong>Tokens Used:</strong> ${usageTokens}</li>
      </ul>
      `
    ).catch(err => console.error('Failed to notify admin of lesson generation:', err));

    // Log to Admin Activity Feed
    try {
      await createAdminLog(userId, req.user.schoolId, 'GENERATE_LESSON', {
        topic,
        subject,
        classLevel,
        userName: req.user.name,
        cached: !!(skipCache === false && genResult.usage?.cached)
      });
    } catch (logErr) {
      console.warn('Failed to log lesson generation to admin logs', logErr);
    }
  } catch (err) {
    console.error('Failed post-generation tasks (logging/caching)', err);
  }

  const { sanitizeObjectMarkdown } = require('../utils/markdownUtils');

  // Robust JSON Extraction Helper
  const extractJson = (str) => {
    if (!str || typeof str !== 'string') return str;
    const markdownMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) return markdownMatch[1].trim();
    const first = Math.min(
      str.indexOf('{') === -1 ? Infinity : str.indexOf('{'),
      str.indexOf('[') === -1 ? Infinity : str.indexOf('[')
    );
    const last = Math.max(str.lastIndexOf('}'), str.lastIndexOf(']'));
    if (first !== Infinity && last !== -1 && last > first) {
      return str.substring(first, last + 1);
    }
    return str.replace(/```json\s*|\s*```/g, '').trim();
  };

  let finalJson;
  try {
    const cleanedText = extractJson(genResult.text);
    finalJson = JSON.parse(cleanedText);
    finalJson = sanitizeObjectMarkdown(finalJson);
  } catch (pErr) {
    console.error('Failed to parse or sanitize AI response', pErr);
  }

  res.json(formatResponse(true, 'Generated', {
    text: finalJson ? JSON.stringify(finalJson) : genResult.text,
    usage: genResult.usage,
    charged: usageTokens
  }));
});

// @route POST /api/generate/assessment
const generateAssessment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { topic, subject, classLevel, subtopic, questionCount = 5, skipCache } = req.body;

  const estimates = await getEstimates();
  const estimate = estimates.assessment;

  // Enforce dynamic generation limit
  const canGen = await usageService.canGenerateAssessment(userId);
  if (!canGen.canGenerate) {
    res.status(403);
    return res.json(formatResponse(false, canGen.reason));
  }

  // 1. Silent Cache Hit
  if (!skipCache) {
    const cachedEntry = await prisma.sharedContent.findFirst({
      where: {
        type: 'assessment',
        subject: subject.trim(),
        classLevel: classLevel.trim(),
        topic: { equals: topic.trim(), mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (cachedEntry) {
      try {
        await createUsageLog(userId, 'ASSESSMENT_GENERATION', { topic, subject, classLevel, cached: true });
        // Add assessment-specific record usage if exists, otherwise use lesson logic or just log
        // For now, let's assume usageLog is enough or if there's a specific assessment tracker
        await prisma.sharedContent.update({
          where: { id: cachedEntry.id },
          data: { usageCount: { increment: 1 } }
        });
      } catch (e) {
        console.warn('Failed to log cached assessment usage', e);
      }

      return res.json(formatResponse(true, 'Assessment generated (Library)', {
        text: cachedEntry.content,
        usage: { totalTokens: 0, cached: true },
        charged: 0
      }));
    }
  }

  // 2. Generate new
  let genResult;
  try {
    genResult = await genai.generateAssessmentViaGenAI({
      topic, subject, classLevel, questionCount,
      maxTokens: estimates.maxTokens,
      model: 'gemini-1.5-flash'
    });
  } catch (err) {
    console.error('generateAssessment ERROR:', err);

    // Log error to Admin Dashboard
    try {
      await prisma.errorLog.create({
        data: {
          userId,
          message: err.message || 'Assessment generation failed',
          stack: err.stack,
          source: 'BACKEND',
          path: '/api/generate/assessment',
          severity: 'high',
          metadata: JSON.stringify({ topic, subject, classLevel, questionCount })
        }
      });
    } catch (logErr) {
      console.error('Failed to log assessment error to DB:', logErr);
    }

    res.status(err.status || 500);
    const message = err.message?.includes('503') || err.message?.includes('UNAVAILABLE')
      ? 'The AI service is currently busy. Please try again in 10 seconds.'
      : 'Generation failed: ' + err.message;
    return res.json(formatResponse(false, message));
  }

  // Backend-only token tracking
  let usageTokens = estimate;
  if (genResult && genResult.usage) {
    usageTokens = genResult.usage.totalTokenCount || genResult.usage.totalTokens || genResult.usage.tokenCount || estimate;
  }

  // 3. Log usage & Cache
  try {
    const metrics = {
      plan: req.user.subscriptionPlan,
      model: 'gemini-1.5-flash',
      tokens: usageTokens,
      inputLength: (topic + subject + classLevel).length,
      outputLength: genResult.text ? genResult.text.length : 0
    };
    await usageService.recordAssessmentGeneration(userId, metrics);

    // Save to Cache
    await prisma.sharedContent.create({
      data: {
        type: 'assessment',
        subject: subject.trim(),
        classLevel: classLevel.trim(),
        topic: topic.trim(),
        content: genResult.text,
        createdById: userId,
        usageCount: 1
      }
    });

    // Notify Admin of Assessment Generation
    sendAdminNotification(
      'New Quiz Generated',
      `
      <p>A user has generated a new quiz/assessment.</p>
      <ul>
          <li><strong>User:</strong> ${req.user.name} (${req.user.email})</li>
          <li><strong>Topic:</strong> ${topic}</li>
          <li><strong>Subtopic:</strong> ${subtopic || 'N/A'}</li>
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Class:</strong> ${classLevel}</li>
          <li><strong>Question Count:</strong> ${questionCount}</li>
          <li><strong>Tokens Used:</strong> ${usageTokens}</li>
      </ul>
      `
    ).catch(err => console.error('Failed to notify admin of assessment generation:', err));

    // Log to Admin Activity Feed
    try {
      await createAdminLog(userId, req.user.schoolId, 'GENERATE_ASSESSMENT', {
        topic,
        subject,
        classLevel,
        userName: req.user.name
      });
    } catch (logErr) {
      console.warn('Failed to log assessment generation to admin logs', logErr);
    }
  } catch (logErr) {
    console.error('Failed post-assessment generation tasks', logErr);
  }

  const { sanitizeObjectMarkdown } = require('../utils/markdownUtils');

  // Robust JSON Extraction Helper (defined locally for simplicity or could be in utils)
  const extractJson = (str) => {
    if (!str || typeof str !== 'string') return str;
    const markdownMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) return markdownMatch[1].trim();
    const first = Math.min(
      str.indexOf('{') === -1 ? Infinity : str.indexOf('{'),
      str.indexOf('[') === -1 ? Infinity : str.indexOf('[')
    );
    const last = Math.max(str.lastIndexOf('}'), str.lastIndexOf(']'));
    if (first !== Infinity && last !== -1 && last > first) {
      return str.substring(first, last + 1);
    }
    return str.replace(/```json\s*|\s*```/g, '').trim();
  };

  let finalJson;
  try {
    const cleanedText = extractJson(genResult.text);
    finalJson = JSON.parse(cleanedText);
    finalJson = sanitizeObjectMarkdown(finalJson);
  } catch (pErr) {
    console.error('Failed to parse or sanitize AI assessment response', pErr);
  }

  res.json(formatResponse(true, 'Assessment generated', {
    text: finalJson ? JSON.stringify(finalJson) : genResult.text,
    usage: genResult.usage,
    charged: usageTokens
  }));
});

// @route POST /api/generate/remark
const generateRemark = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { classLevel, subject, topic, lessonOutcome, students, style } = req.body;

  if (!classLevel || !subject || !topic) {
    res.status(400);
    throw new Error('Subject, Topic, and Class Level are required');
  }

  // Enforce dynamic generation limit
  const canGen = await usageService.canGenerateRemark(userId);
  if (!canGen.canGenerate) {
    res.status(403);
    return res.json(formatResponse(false, canGen.reason));
  }

  let genResult;
  try {
    genResult = await genai.generateRemarkViaGenAI({
      classLevel,
      subject,
      topic,
      lessonOutcome,
      students,
      style,
      maxTokens: 1024
    });

    // Robust JSON Extraction Helper
    const extractJson = (str) => {
      if (!str || typeof str !== 'string') return str;
      const markdownMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) return markdownMatch[1].trim();
      const first = Math.min(
        str.indexOf('{') === -1 ? Infinity : str.indexOf('{'),
        str.indexOf('[') === -1 ? Infinity : str.indexOf('[')
      );
      const last = Math.max(str.lastIndexOf('}'), str.lastIndexOf(']'));
      if (first !== Infinity && last !== -1 && last > first) {
        return str.substring(first, last + 1);
      }
      return str.replace(/```json\s*|\s*```/g, '').trim();
    };

    const parsed = JSON.parse(extractJson(genResult.text));

    // Log usage via usageService to ensure it's tracked for fair-use limits
    await usageService.recordRemarkGeneration(userId, { subject, topic, studentCount: students?.length || 0 });

    res.json(formatResponse(true, 'Remark generated', {
      remark: parsed.remark,
      usage: genResult.usage
    }));

  } catch (err) {
    console.error('generateRemark ERROR:', err);
    res.status(err.status || 500);
    throw new Error('Failed to generate remark: ' + err.message);
  }
});

// @route POST /api/generate/seo-summary
const generateSEOSummary = asyncHandler(async (req, res) => {
  const { title, textContent } = req.body;
  if (!title || !textContent) {
    res.status(400);
    throw new Error('Title and content are required');
  }

  try {
    const summary = await genai.generateSEOSummaryViaGenAI({
      title,
      textContent
    });
    res.json(formatResponse(true, 'SEO Summary generated', { summary }));
  } catch (err) {
    console.error('generateSEOSummary ERROR:', err);
    res.status(err.status || 500);
    throw new Error('Failed to generate SEO summary: ' + err.message);
  }
});

module.exports = {
  generateLesson,
  generateAssessment,
  generateRemark,
  generateSEOSummary
};
