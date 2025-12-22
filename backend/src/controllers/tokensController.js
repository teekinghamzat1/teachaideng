const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const formatResponse = require('../utils/formatResponse');
const { hasTokens, addTokens, chargeTokens } = require('../utils/tokens');

// @route GET /api/tokens/balance
const getBalance = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(formatResponse(true, 'Balance retrieved', { tokens: user.tokens || 0 }));
});

// @route GET /api/tokens/usage
const getUsage = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const usages = await prisma.tokenUsage.findMany({ where: { userId: req.user.id, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(formatResponse(true, 'Usage retrieved', usages));
});

// @route POST /api/tokens/estimate
// body: { type: 'lesson'|'assessment' }
const estimate = asyncHandler(async (req, res) => {
  const { type } = req.body;
  let settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  if (!settings) settings = await prisma.systemSetting.create({ data: { id: 1 } });
  const value = type === 'assessment' ? settings.assessmentGenerationCost : settings.lessonGenerationCost;
  res.json(formatResponse(true, 'Estimate', { estimatedTokens: value }));
});

// Admin: add tokens to user
// @route POST /api/tokens/admin/add
const adminAddTokens = asyncHandler(async (req, res) => {
  if (!req.user || !(req.user.role && req.user.role.toLowerCase().includes('admin'))) {
    res.status(401);
    throw new Error('Not authorized');
  }
  const { userId, amount } = req.body;
  if (!userId || !amount) {
    res.status(400);
    throw new Error('userId and amount required');
  }
  const result = await addTokens(userId, Number(amount), { type: 'admin_credit', meta: { by: req.user.id } });
  res.json(formatResponse(true, 'Tokens added', result));
});

// Admin: view user token history
// @route GET /api/tokens/admin/history/:userId
const adminUserHistory = asyncHandler(async (req, res) => {
  if (!req.user || !(req.user.role && req.user.role.toLowerCase().includes('admin'))) {
    res.status(401);
    throw new Error('Not authorized');
  }
  const { userId } = req.params;
  const usages = await prisma.tokenUsage.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  res.json(formatResponse(true, 'User history', usages));
});

module.exports = {
  getBalance,
  getUsage,
  estimate,
  adminAddTokens,
  adminUserHistory
};
