import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [
      accountsCount,
      transactionsCount,
      creditCardsCount,
      budgetsCount,
      totalBalance
    ] = await Promise.all([
      prisma.account.count(),
      prisma.transaction.count(),
      prisma.creditCard.count(),
      prisma.budget.count(),
      prisma.account.aggregate({
        _sum: {
          balance: true
        }
      })
    ]);

    const stats = {
      accounts: accountsCount,
      transactions: transactionsCount,
      creditCards: creditCardsCount,
      budgets: budgetsCount,
      totalBalance: totalBalance._sum.balance || 0
    };
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
