import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data, timestamp } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    // Registra o evento no banco de dados
    // Por enquanto, apenas loga no console até termos a tabela de audit logs
    console.log('System Event:', {
      type,
      data,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    res.status(200).json({ 
      success: true, 
      message: 'Event logged successfully' 
    });
  } catch (error) {
    console.error('Error logging system event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to log event' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
