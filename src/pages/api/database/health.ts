import { NextApiRequest, NextApiResponse } from 'next';
import { databaseAdapter } from '../../../lib/database/database-adapter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Testa a conexão com o banco através do databaseAdapter
    await databaseAdapter.testConnection();
    
    res.status(200).json({ 
      success: true, 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
}
