import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export interface StorageAuditLog {
  timestamp: string;
  type: 'localStorage' | 'sessionStorage' | 'indexedDB';
  operation: 'getItem' | 'setItem' | 'removeItem' | 'clear' | 'open' | 'transaction';
  key?: string;
  stackTrace: string;
  blocked: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auditLog: StorageAuditLog = req.body;

    // Valida os dados recebidos
    if (!auditLog.timestamp || !auditLog.type || !auditLog.operation) {
      return res.status(400).json({ error: 'Dados de auditoria inválidos' });
    }

    // Salva no banco de dados
    await prisma.auditLog.create({
      data: {
        type: 'security_event',
        level: auditLog.blocked ? 'critical' : 'warning',
        source: auditLog.type,
        action: auditLog.operation,
        details: JSON.stringify({
          key: auditLog.key,
          stackTrace: auditLog.stackTrace,
          blocked: auditLog.blocked,
          timestamp: auditLog.timestamp
        }),
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.headers['x-forwarded-for'] as string || req.connection.remoteAddress || '',
        timestamp: new Date(auditLog.timestamp)
      }
    });

    // Log crítico no servidor
    console.error(`🚨 TENTATIVA DE ACESSO BLOQUEADA: ${auditLog.type}.${auditLog.operation}${auditLog.key ? ` (${auditLog.key})` : ''}`);
    console.error(`📍 IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    console.error(`🕐 Timestamp: ${auditLog.timestamp}`);

    res.status(200).json({ success: true, message: 'Log de auditoria registrado' });

  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
