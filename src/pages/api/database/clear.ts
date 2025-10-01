import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Deletar em ordem para respeitar as foreign keys
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.creditCard.deleteMany();
    await prisma.account.deleteMany();
    await prisma.systemEvent.deleteMany();
    
    return res.status(200).json({ message: 'All data cleared successfully' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
