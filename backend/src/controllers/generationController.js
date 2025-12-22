const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { hasTokens, chargeTokens } = require('../utils/tokens');
const genai = require('../services/genaiService');

// Helper to get cost estimates from settings
const getEstimates = async () => {
  let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.systemSetting.create({ data: { id: 1 } });
  }
  return {
    lesson: settings.lessonGenerationCost || 600,
    assessment: settings.assessmentGenerationCost || 200
  };
};

// @route POST /api/generate/lesson
// Checks tokens, estimates price, invokes GenAI and charges tokens based on usage
const generateLesson = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { topic, subject, classLevel, duration } = req.body;

  const estimates = await getEstimates();
  const estimate = estimates.lesson;

  if (!(await hasTokens(userId, estimate))) {
    res.status(402);
    return res.json(formatResponse(false, 'Insufficient tokens', { required: estimate }));
  }

  // Call GenAI
  let genResult;
  try {
    genResult = await genai.generateLessonNoteViaGenAI({ topic, subject, classLevel, duration, userPlan: req.user.subscriptionPlan });
  } catch (err) {
    res.status(500);
    throw new Error('Generation failed: ' + err.message);
  }

  // Determine actual usage (fallback to estimate)
  let usageTokens = estimate;
  if (genResult && genResult.usage) {
    if (genResult.usage.totalTokens) usageTokens = Number(genResult.usage.totalTokens);
    else if (genResult.usage.tokenCount) usageTokens = Number(genResult.usage.tokenCount);
  }

  // Charge tokens
  try {
    await chargeTokens(userId, usageTokens, { type: 'charge', meta: { topic, subject, classLevel } });
  } catch (err) {
    // If charge fails, return error
    res.status(402);
    throw new Error('Failed to charge tokens: ' + err.message);
  }

  // Return generated text and usage info
  res.json(formatResponse(true, 'Generated', { text: genResult.text, usage: genResult.usage, charged: usageTokens }));
});

// @route POST /api/generate/assessment
const generateAssessment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { topic, subject, classLevel, questionCount = 5 } = req.body;

  const estimates = await getEstimates();
  const estimate = estimates.assessment;

  if (!(await hasTokens(userId, estimate))) {
    res.status(402);
    return res.json(formatResponse(false, 'Insufficient tokens', { required: estimate }));
  }

  let genResult;
  try {
    genResult = await genai.generateAssessmentViaGenAI({ topic, subject, classLevel, questionCount });
  } catch (err) {
    res.status(500);
    throw new Error('Generation failed: ' + err.message);
  }

  let usageTokens = estimate;
  if (genResult && genResult.usage) {
    if (genResult.usage.totalTokens) usageTokens = Number(genResult.usage.totalTokens);
    else if (genResult.usage.tokenCount) usageTokens = Number(genResult.usage.tokenCount);
  }

  try {
    await chargeTokens(userId, usageTokens, { type: 'charge', meta: { topic, subject, classLevel } });
  } catch (err) {
    res.status(402);
    throw new Error('Failed to charge tokens: ' + err.message);
  }

  res.json(formatResponse(true, 'Assessment generated', { text: genResult.text, usage: genResult.usage, charged: usageTokens }));
});

module.exports = {
  generateLesson,
  generateAssessment
};
