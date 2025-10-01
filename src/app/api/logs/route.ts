import { NextRequest, NextResponse } from 'next/server';

// Interface para logs do sistema
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  component?: string;
  data?: any;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  userId?: string;
  component?: string;
}

// Simulação de dados em memória (substituir por banco de dados)
let logs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Sistema iniciado',
    component: 'system'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    level: 'warn',
    message: 'Tentativa de acesso não autorizado',
    component: 'auth'
  }
];

let auditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    action: 'LOGIN',
    severity: 'low',
    details: 'Usuário fez login no sistema',
    component: 'auth'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    action: 'TRANSACTION_CREATE',
    severity: 'medium',
    details: 'Nova transação criada',
    component: 'transactions'
  }
];

// GET - Buscar logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'system' ou 'audit'
    const level = searchParams.get('level');
    const component = searchParams.get('component');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (type === 'audit') {
      let filteredLogs = [...auditLogs];
      
      if (component) {
        filteredLogs = filteredLogs.filter(log => log.component === component);
      }
      
      // Ordenar por timestamp (mais recente primeiro)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return NextResponse.json(filteredLogs.slice(0, limit));
    } else {
      let filteredLogs = [...logs];
      
      if (level) {
        filteredLogs = filteredLogs.filter(log => log.level === level);
      }
      
      if (component) {
        filteredLogs = filteredLogs.filter(log => log.component === component);
      }
      
      // Ordenar por timestamp (mais recente primeiro)
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return NextResponse.json(filteredLogs.slice(0, limit));
    }
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...logData } = body;

    if (type === 'audit') {
      const newAuditLog: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        action: logData.action || 'UNKNOWN',
        severity: logData.severity || 'low',
        details: logData.details || '',
        userId: logData.userId,
        component: logData.component
      };

      auditLogs.push(newAuditLog);
      
      // Manter apenas os últimos 1000 logs de auditoria
      if (auditLogs.length > 1000) {
        auditLogs = auditLogs.slice(-1000);
      }

      return NextResponse.json(newAuditLog, { status: 201 });
    } else {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        level: logData.level || 'info',
        message: logData.message || '',
        component: logData.component,
        data: logData.data
      };

      logs.push(newLog);
      
      // Manter apenas os últimos 1000 logs do sistema
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      return NextResponse.json(newLog, { status: 201 });
    }
  } catch (error) {
    console.error('Erro ao criar log:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Limpar logs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const olderThan = searchParams.get('olderThan'); // timestamp ISO

    if (type === 'audit') {
      if (olderThan) {
        const cutoffDate = new Date(olderThan);
        auditLogs = auditLogs.filter(log => new Date(log.timestamp) > cutoffDate);
      } else {
        auditLogs = [];
      }
      
      return NextResponse.json({ 
        message: 'Logs de auditoria limpos com sucesso',
        remaining: auditLogs.length 
      });
    } else {
      if (olderThan) {
        const cutoffDate = new Date(olderThan);
        logs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
      } else {
        logs = [];
      }
      
      return NextResponse.json({ 
        message: 'Logs do sistema limpos com sucesso',
        remaining: logs.length 
      });
    }
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// OPTIONS - CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
