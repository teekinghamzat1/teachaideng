const { resetMonthlyTokens } = require('../utils/tokens');

// Schedule a monthly reset: compute ms until next month and set timeout
function msUntilNextMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return next.getTime() - now.getTime();
}

async function performReset() {
  try {
    const result = await resetMonthlyTokens();
    console.log('Monthly token reset performed:', result);
  } catch (err) {
    console.error('Monthly token reset failed:', err);
  }
}

function startMonthlyReset() {
  // Run first at next month boundary
  const firstDelay = msUntilNextMonth();
  setTimeout(() => {
    performReset();
    // After first run, schedule every 30 days (approx monthly)
    setInterval(performReset, 1000 * 60 * 60 * 24 * 30);
  }, firstDelay);
}

module.exports = { startMonthlyReset, performReset };
