const asyncHandler = require('express-async-handler');
const { sendAdminNotification } = require('../utils/emailService');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { hasTokens, chargeTokens } = require('../utils/tokens');
const genai = require('../services/genaiService');
const { checkWeeklyLessonLimit, createUsageLog } = require('../utils/usage');
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
  const { topic, subject, classLevel, duration, subtopic, lessonType, skipCache } = req.body;

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
      console.log(`[CACHE_HIT] Reusing lesson for topic: ${topic}`);

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
      topic, subject, classLevel, duration, subtopic, lessonType,
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
    if (genResult.usage.totalTokens) usageTokens = Number(genResult.usage.totalTokens);
    else if (genResult.usage.tokenCount) usageTokens = Number(genResult.usage.tokenCount);
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
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Class:</strong> ${classLevel}</li>
          <li><strong>Tokens Used:</strong> ${usageTokens}</li>
      </ul>
      `
    ).catch(err => console.error('Failed to notify admin of lesson generation:', err));
  } catch (err) {
    console.error('Failed post-generation tasks (logging/caching)', err);
  }

  const { sanitizeObjectMarkdown } = require('../utils/markdownUtils');
  let finalJson;
  try {
    finalJson = JSON.parse(genResult.text);
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
  const { topic, subject, classLevel, questionCount = 5, skipCache } = req.body;

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
    if (genResult.usage.totalTokens) usageTokens = Number(genResult.usage.totalTokens);
    else if (genResult.usage.tokenCount) usageTokens = Number(genResult.usage.tokenCount);
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
    await createUsageLog(userId, 'ASSESSMENT_GENERATION', metrics);

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
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Class:</strong> ${classLevel}</li>
          <li><strong>Question Count:</strong> ${questionCount}</li>
      </ul>
      `
    ).catch(err => console.error('Failed to notify admin of assessment generation:', err));
  } catch (logErr) {
    console.error('Failed post-assessment generation tasks', logErr);
  }

  const { sanitizeObjectMarkdown } = require('../utils/markdownUtils');
  let finalJson;
  try {
    finalJson = JSON.parse(genResult.text);
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

    const parsed = JSON.parse(genResult.text);

    // Log usage
    createUsageLog(userId, 'REMARK_GENERATION', { subject, topic, studentCount: students?.length || 0 }).catch(() => { });

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

module.exports = {
  generateLesson,
  generateAssessment,
  generateRemark
};
