const asyncHandler = require('express-async-handler');
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
const generateLesson = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { topic, subject, classLevel, duration, subtopic } = req.body;

  const estimates = await getEstimates();
  const estimate = estimates.lesson;

  // Enforce dynamic generation limit BEFORE calling GenAI
  const canGen = await usageService.canGenerateLesson(userId);
  if (!canGen.canGenerate) {
    res.status(403);
    return res.json(formatResponse(false, canGen.reason || 'Generation limit reached. Upgrade to continue.'));
  }

  // User tokens are no longer used for billing (backend tracking only)
  // We skip token checks to ensure a smooth dynamic experience based on lesson counts

  // Call GenAI
  let genResult;
  try {
    genResult = await genai.generateLessonNoteViaGenAI({
      topic, subject, classLevel, duration, subtopic,
      userPlan: req.user.subscriptionPlan,
      maxTokens: estimates.maxTokens
    });
  } catch (err) {
    console.error('generateLesson ERROR:', err);
    res.status(err.status || 500);
    const message = err.message?.includes('503') || err.message?.includes('UNAVAILABLE')
      ? 'The AI service is currently busy. Please try again in 10 seconds.'
      : 'Generation failed: ' + err.message;
    return res.json(formatResponse(false, message));
  }

  // Backend-only token tracking for cost control (no charge to user)
  let usageTokens = estimate;
  if (genResult && genResult.usage) {
    if (genResult.usage.totalTokens) usageTokens = Number(genResult.usage.totalTokens);
    else if (genResult.usage.tokenCount) usageTokens = Number(genResult.usage.tokenCount);
  }
  // If charge fails, return error


  // Log usage for successful AI generation so the weekly limit counts generation attempts.
  try {
    const metrics = {
      plan: req.user.subscriptionPlan,
      model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
      tokens: usageTokens,
      inputLength: (topic + subject + classLevel).length,
      outputLength: genResult.text ? genResult.text.length : 0
    };
    const log = await createUsageLog(userId, 'LESSON_GENERATION', metrics);
    if (!log) console.warn(`generateLesson: createUsageLog returned null for user=${userId}`);

    // NEW: Record lesson usage with token tracking
    const inputTokens = genResult.usage?.promptTokenCount || 0;
    const outputTokens = genResult.usage?.candidatesTokenCount || 0;
    await usageService.recordLessonGeneration(userId, inputTokens, outputTokens);
  } catch (err) {
    console.error('Failed to create usage log after generation', err);
    // Do not fail the request if logging fails
  }

  const { sanitizeObjectMarkdown } = require('../utils/markdownUtils');
  let finalJson;
  try {
    finalJson = JSON.parse(genResult.text);
    finalJson = sanitizeObjectMarkdown(finalJson);
  } catch (pErr) {
    console.error('Failed to parse or sanitize AI response', pErr);
    // If it fails to parse as JSON, we still have raw text which we can't easily sanitize as object
  }

  // Return generated text and usage info
  res.json(formatResponse(true, 'Generated', {
    text: finalJson ? JSON.stringify(finalJson) : genResult.text,
    usage: genResult.usage,
    charged: usageTokens
  }));
});

// @route POST /api/generate/assessment
const generateAssessment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { topic, subject, classLevel, questionCount = 5 } = req.body;

  const estimates = await getEstimates();
  const estimate = estimates.assessment;

  // Enforce dynamic generation limit
  const canGen = await usageService.canGenerateLesson(userId); // Use lesson quota for assessments
  if (!canGen.canGenerate) {
    res.status(403);
    return res.json(formatResponse(false, canGen.reason));
  }

  let genResult;
  try {
    genResult = await genai.generateAssessmentViaGenAI({
      topic, subject, classLevel, questionCount,
      maxTokens: estimates.maxTokens
    });
  } catch (err) {
    console.error('generateAssessment ERROR:', err);
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


  // Log usage for Assessment
  try {
    const metrics = {
      plan: req.user.subscriptionPlan,
      model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
      tokens: usageTokens,
      inputLength: (topic + subject + classLevel).length,
      outputLength: genResult.text ? genResult.text.length : 0
    };
    await createUsageLog(userId, 'ASSESSMENT_GENERATION', metrics);
  } catch (logErr) {
    console.error('Failed to log assessment usage', logErr);
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

module.exports = {
  generateLesson,
  generateAssessment,
};
