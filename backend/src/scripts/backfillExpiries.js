const prisma = require('../config/db');

async function main() {
  console.log('Starting subscription backfill script...');

  // 1. Fetch users on a paid plan who do not have a subscription expiry date set.
  // We include their last completed transaction of type 'credit' to determine their payment date.
  const users = await prisma.user.findMany({
    where: {
      subscriptionExpiryDate: null,
      subscriptionPlan: {
        not: 'Free',
      },
    },
    include: {
      transactions: {
        where: {
          type: 'credit',
          status: 'completed',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  console.log(`Found ${users.length} paid users without subscriptionExpiryDate.`);

  let updatedCount = 0;

  for (const user of users) {
    const isSchoolPlan = user.subscriptionPlan.startsWith('School') || user.subscriptionPlan === 'School';
    const durationDays = isSchoolPlan ? 90 : 30;
    
    const lastTx = user.transactions[0];
    // If there is no completed transaction, fallback to user.createdAt, or finally now.
    const startDate = lastTx ? lastTx.createdAt : (user.createdAt || new Date());
    const expiry = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    console.log(`Processing: User ${user.email} | Plan: ${user.subscriptionPlan}`);
    if (lastTx) {
      console.log(`  -> Found last completed transaction on: ${lastTx.createdAt}`);
    } else {
      console.log(`  -> No completed transaction found. Falling back to account creation: ${user.createdAt || 'now'}`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStartDate: startDate,
        subscriptionExpiryDate: expiry,
      },
    });

    console.log(`  -> Updated user expiry to: ${expiry} (${durationDays} days from start date)\n`);
    updatedCount++;
  }

  console.log(`Done. Processed and updated ${updatedCount} users.`);
}

main()
  .catch((err) => {
    console.error('Error during backfill execution:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
