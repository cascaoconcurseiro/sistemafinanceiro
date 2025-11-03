import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { prisma } from '@/lib/prisma';
import { calculateAllBalances } from '@/lib/utils/financial-calculations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
        const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
      console.error('❌ [API Unified] Falha na autenticação:', auth.error);
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const userId = auth.userId;

    
    // Buscar todos os dados em paralelo
    const [accounts, transactions, contacts, trips, goals, budgets, investments, categories] = await Promise.all([
      // Contas
      prisma.account.findMany({
        where: { userId, deletedAt: null },
        orderBy: { name: 'asc' }
      }),

      // Transações
      prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        orderBy: { date: 'desc' }
      }),

      // Contatos/Família
      prisma.familyMember.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
      }),

      // Viagens
      prisma.trip.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' }
      }),

      // Metas (se existir)
      prisma.goal?.findMany?.({
        where: { userId }
      }).catch(() => []) || [],

      // Orçamentos (se existir)
      prisma.budget?.findMany?.({
        where: { userId }
      }).catch(() => []) || [],

      // Investimentos
      prisma.investment?.findMany?.({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []) || [],

      // Categorias (se existir)
      prisma.category?.findMany?.({
        where: { userId }
      }).catch(() => []) || []
    ]);

    // Calcular saldos
    const balances = calculateAllBalances(accounts, transactions);

    const result = {
      accounts: accounts.map(account => ({
        ...account,
        balance: balances[account.id] || 0
      })),
      transactions: transactions.map(t => ({
        ...t,
        metadata: t.metadata ? JSON.parse(t.metadata as string) : null
      })),
      contacts: contacts,
      trips,
      goals: goals || [],
      budgets: budgets || [],
      investments: investments || [],
      categories: categories || [],
      balances: {
        totalBalance: Object.values(balances).reduce((sum, balance) => sum + balance, 0),
        accountBalances: balances
      },
      meta: {
        totalRecords: accounts.length + transactions.length + contacts.length + trips.length + (investments?.length || 0),
        lastUpdated: new Date().toISOString()
      }
    };

    console.log('✅ [API Unified] Dados unificados enviados:', {
      accounts: result.accounts.length,
      transactions: result.transactions.length,
      contacts: result.contacts.length,
      trips: result.trips.length,
      investments: result.investments.length,
      totalRecords: result.meta.totalRecords
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [API Unified] Erro ao buscar dados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
