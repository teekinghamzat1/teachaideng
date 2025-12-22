const prisma = require('../config/db');

/**
 * Check if a user has at least `amount` tokens.
 * @param {string} userId
 * @param {number} amount
 */
async function hasTokens(userId, amount) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  return (user.tokens || 0) >= amount;
}

/**
 * Deduct tokens from a user and record the charge in TokenUsage.
 * @param {string} userId
 * @param {number} amount
 * @param {object} options - { type, meta }
 */
async function chargeTokens(userId, amount, options = {}) {
  if (amount <= 0) return;
  const { type = 'charge', meta } = options;

  // Use a transaction to decrement tokens and insert usage record
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if ((user.tokens || 0) < amount) throw new Error('Insufficient tokens');

    const newTokens = (user.tokens || 0) - amount;
    await tx.user.update({ where: { id: userId }, data: { tokens: newTokens } });

    const usage = await tx.tokenUsage.create({ data: {
      userId,
      amount: amount,
      type,
      meta: meta ? JSON.stringify(meta) : undefined
    }});

    return { user: { ...user, tokens: newTokens }, usage };
  });

  return updated;
}

/**
 * Add tokens to a user (admin action). Records as 'admin_credit' or 'credit'.
 */
async function addTokens(userId, amount, options = {}) {
  if (amount <= 0) return;
  const { type = 'admin_credit', meta } = options;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newTokens = (user.tokens || 0) + amount;
    await tx.user.update({ where: { id: userId }, data: { tokens: newTokens } });

    const usage = await tx.tokenUsage.create({ data: {
      userId,
      amount: amount,
      type,
      meta: meta ? JSON.stringify(meta) : undefined
    }});

    return { user: { ...user, tokens: newTokens }, usage };
  });

  return updated;
}

/**
 * Reset monthly tokens for all users. This will set lastTokenReset to now for each user.
 * Optionally can top-up tokens depending on business rules (not implemented here).
 */
async function resetMonthlyTokens() {
  const now = new Date();
  // For now, only update lastTokenReset timestamp. Business logic for granting tokens can be added later.
  const users = await prisma.user.findMany();
  const updates = users.map((u) => prisma.user.update({ where: { id: u.id }, data: { lastTokenReset: now } }));
  await prisma.$transaction(updates);

  // Record a TokenUsage reset entry for audit (amount=0)
  await prisma.tokenUsage.createMany({ data: users.map(u => ({ userId: u.id, amount: 0, type: 'reset', meta: JSON.stringify({ resetAt: now.toISOString() }) })) });

  return { resetAt: now, count: users.length };
}

module.exports = {
  hasTokens,
  chargeTokens,
  addTokens,
  resetMonthlyTokens
};
