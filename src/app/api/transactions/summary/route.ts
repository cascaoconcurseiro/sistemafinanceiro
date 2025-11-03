import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/database-service';
import { transactionCache } from '../../../../lib/cache';
import { Transaction } from '../../../../types';
import { authenticateRequest } from '@/lib/utils/auth-helpers';

// Tipos para o resumo de transações
interface CategorySummary {
  total: number;
  count: number;
  transactions: Transaction[];
}

interface AccountSummary {
  total: number;
  count: number;
  transactions: Transaction[];
}

interface TransactionSummary {
  total: number;
  count: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: Record<string, CategorySummary>;
  byAccount: Record<string, AccountSummary>;
  transactions: Transaction[];
}

interface CacheParams {
  year: string | null;
  month: string | null;
  type: string | null;
}

// GET - Buscar resumo de transações

export async function GET(request: NextRequest) {
  try {
    // ✅ CORREÇÃO CRÍTICA: Adicionar autenticação
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const type = searchParams.get('type');

    // ✅ CORREÇÃO CRÍTICA: Criar chave de cache incluindo userId
    const cacheParams: CacheParams & { userId: string } = { year, month, type, userId: auth.userId };

    // Tentar obter do cache primeiro (por usuário)
    const cachedSummary = transactionCache.getSummary(cacheParams);
    if (cachedSummary) {
      return NextResponse.json(cachedSummary);
    }

    // ✅ CORREÇÃO CRÍTICA: Buscar apenas transações do usuário autenticado
    let transactions: Transaction[] = await databaseService.getTransactions();

    // Filtrar por usuário
    transactions = transactions.filter((t: Transaction) => t.userId === auth.userId);

    // Verificar se as transações foram carregadas corretamente
    if (!Array.isArray(transactions)) {
      console.warn('Transações não carregadas corretamente, usando array vazio');
      transactions = [];
    }

    console.log(`[Summary API] Transações carregadas: ${transactions.length}`);

    // Filtrar por período se especificado
    if (year && month) {
      const targetYear = parseInt(year);
      const targetMonth = parseInt(month);
      transactions = transactions.filter((t: Transaction) => {
        const date = new Date(t.date);
        return date.getFullYear() === targetYear && date.getMonth() + 1 === targetMonth;
      });
    }

    // Filtrar por tipo se especificado
    if (type && type !== 'all') {
      transactions = transactions.filter((t: Transaction) => t.type === type);
    }

    // Calcular resumo
    const summary: TransactionSummary = {
      total: transactions.reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0),
      count: transactions.length,
      income: transactions
        .filter((t: Transaction) => t.type === 'income')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      expense: Math.abs(transactions
        .filter((t: Transaction) => t.type === 'expense')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)),
      balance: transactions.reduce((sum: number, t: Transaction) => {
        return t.type === 'income' ? sum + t.amount : sum - Math.abs(t.amount);
      }, 0),
      byCategory: {},
      byAccount: {},
      transactions: transactions.slice(-10) // Últimas 10 transações
    };

    // Agrupar por categoria
    transactions.forEach((t: Transaction) => {
      const category = t.categoryId || 'Outros';
      if (!summary.byCategory[category]) {
        summary.byCategory[category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      summary.byCategory[category].total += Math.abs(t.amount);
      summary.byCategory[category].count += 1;
      summary.byCategory[category].transactions.push(t);
    });

    // Agrupar por conta
    transactions.forEach((t: Transaction) => {
      const account = t.accountId || 'default';
      if (!summary.byAccount[account]) {
        summary.byAccount[account] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      summary.byAccount[account].total += t.amount;
      summary.byAccount[account].count += 1;
      summary.byAccount[account].transactions.push(t);
    });

    // Armazenar resultado no cache
    transactionCache.setSummary(cacheParams, summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('TransactionsSummaryAPI - buscar resumo de transações:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
