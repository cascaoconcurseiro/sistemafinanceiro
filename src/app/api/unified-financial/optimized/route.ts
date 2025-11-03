/**
 * 🚀 Simple Unified Financial API
 * Basic unified endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/utils/auth-helpers';
import { calculateAllBalances } from '@/lib/utils/financial-calculations';

// Função para normalizar tipos de transação
function normalizeTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'income': 'RECEITA',
    'expense': 'DESPESA',
    'transfer': 'TRANSFERENCIA',
    'transferencia': 'TRANSFERENCIA'
  };
  const lowerType = type.toLowerCase();
  return typeMap[lowerType] || type.toUpperCase();
}

// Simple function to calculate balances
function calculateSimpleBalances(accounts: any[], transactions: any[]) {
  const accountBalances: Record<string, number> = {};
  let totalBalance = 0;
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  // ✅ CORREÇÃO: Calculate account balances from transactions ONLY (starting from 0)
  // O saldo inicial da conta NÃO deve ser somado, pois as transações já representam todo o histórico
  accounts.forEach(account => {
    const accountTransactions = transactions.filter(t => t.accountId === account.id);

    // ✅ IMPORTANTE: Começar do ZERO, não do saldo inicial
    // As transações já representam todo o movimento da conta
    const balance = accountTransactions.reduce((sum, t) => {
      // ✅ CORREÇÃO CRÍTICA: SEMPRE usar o valor TOTAL quando vinculado a uma conta
      // O myShare é apenas para relatórios, NÃO para saldo de conta
      // Se você pagou R$ 100 por outra pessoa, R$ 100 saiu da sua conta
      const amount = Math.abs(Number(t.amount));

      const normalizedType = normalizeTransactionType(t.type);

      // Usar tipos normalizados
      if (normalizedType === 'RECEITA') {
        return sum + amount;
      } else if (normalizedType === 'DESPESA') {
        return sum - amount;
      }
      return sum;
    }, 0); // ✅ Começar do ZERO

    console.log(`💰 [Unified API] Conta ${account.name}: ${accountTransactions.length} transações, saldo final ${balance}`);

    accountBalances[account.id] = balance;
    totalBalance += balance;
  });

  // Calculate monthly income/expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  transactions.forEach(t => {
    const transDate = new Date(t.date);
    if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
      // ✅ CORREÇÃO: SEMPRE usar o valor TOTAL quando vinculado a uma conta
      const amount = Math.abs(t.amount);

      const normalizedType = normalizeTransactionType(t.type);

      if (normalizedType === 'RECEITA') {
        monthlyIncome += amount;
      } else if (normalizedType === 'DESPESA') {
        monthlyExpenses += amount;
      }
    }
  });

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance: monthlyIncome - monthlyExpenses,
    accountBalances
  };
}

// Fetch all unified financial data
async function fetchUnifiedFinancialData(userId: string) {
  
  try {
    // ✅ CORREÇÃO: Fetch basic data - apenas contas ativas e tipos válidos
    const validAccountTypes = ['checking', 'savings', 'investment', 'credit_card', 'cash'];
    const [accounts, creditCards] = await Promise.all([
      prisma.account.findMany({
        where: {
          userId,
          deletedAt: null,
          isActive: true, // ✅ Apenas contas ativas
          type: { in: validAccountTypes } // ✅ Apenas tipos válidos de conta
        },
        orderBy: { name: 'asc' }
      }),
      prisma.creditCard.findMany({
        where: { userId, isActive: true },
        orderBy: { name: 'asc' }
      })
    ]);

    console.log('🏦 [Unified API] Contas encontradas:', accounts.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      isActive: a.isActive
    })));

    console.log('💳 [Unified API] Cartões encontrados:', creditCards.map(c => ({
      id: c.id,
      name: c.name,
      limit: c.limit,
      currentBalance: c.currentBalance
    })));

    // ✅ CORREÇÃO: Ordenar por createdAt para manter ordem cronológica de criação
    const transactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' }, // ✅ Ordem cronológica de criação
      take: 1000
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    // ✅ CORREÇÃO: Buscar dados reais do banco
    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const contacts = await prisma.familyMember.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });

    // Mock data for other entities (não implementados ainda)
    const budgets: any[] = [];
    const investments: any[] = [];

    // Use the same balance calculation as /api/accounts
        let correctBalances: Record<string, number> = {};
    try {
      correctBalances = calculateAllBalances(accounts, transactions);
          } catch (balanceError) {
      console.error('❌ [Unified API] Erro ao calcular saldos:', balanceError);
      // Usar saldos vazios se houver erro
      correctBalances = {};
    }

    // Calculate simple stats for compatibility
        let simpleBalances;
    try {
      simpleBalances = calculateSimpleBalances(
        accounts.map(a => ({ ...a, balance: Number(a.balance) || 0 })),
        transactions.map(t => ({ ...t, amount: Number(t.amount) || 0 }))
      );
          } catch (statsError) {
      console.error('❌ [Unified API] Erro ao calcular estatísticas:', statsError);
      // Usar valores padrão se houver erro
      simpleBalances = {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyBalance: 0,
        accountBalances: {}
      };
    }

    // ✅ CORREÇÃO: NÃO combinar cartões com contas
    // Cartões de crédito são PASSIVOS (dívidas) e devem ser tratados separadamente
    // Eles NÃO devem aparecer na lista de contas nem no cálculo de saldo total
    const allAccounts = accounts.map(account => ({
      ...account,
      balance: correctBalances[account.id] || 0
    }));
    
    // Cartões ficam separados para uso específico na página de cartões
    const creditCardsData = creditCards.map(card => ({
      id: card.id,
      name: card.name,
      limit: Number(card.limit),
      currentBalance: Number(card.currentBalance),
      availableLimit: Number(card.limit) - Number(card.currentBalance),
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      isActive: card.isActive,
      userId: card.userId,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt
    }));

    // Format response data - usar saldo calculado correto
    const unifiedData = {
      accounts: allAccounts, // ✅ Apenas contas bancárias
      creditCards: creditCardsData, // ✅ Cartões separados
      transactions: transactions.map(transaction => ({
        ...transaction,
        amount: Number(transaction.amount) || 0,
        myShare: transaction.myShare ? Number(transaction.myShare) : null,
        totalSharedAmount: transaction.totalSharedAmount ? Number(transaction.totalSharedAmount) : null
      })),
      categories,
      contacts,
      trips,
      goals,
      budgets,
      investments,
      balances: {
        ...simpleBalances,
        accountBalances: correctBalances
      },
      meta: {
        totalAccounts: allAccounts.length,
        totalCreditCards: creditCardsData.length,
        totalTransactions: transactions.length,
        totalCategories: categories.length,
        lastUpdated: new Date().toISOString()
      }
    };

        console.log('📊 [Unified API] Retornando dados:', {
      totalAccounts: allAccounts.length,
      totalCreditCards: creditCardsData.length,
      accounts: allAccounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
      creditCards: creditCardsData.map(c => ({ id: c.id, name: c.name, limit: c.limit, available: c.availableLimit }))
    });
    return unifiedData;

  } catch (error) {
    console.error('❌ [Simple Unified API] Error fetching data:', error);
    throw error;
  }
}

// Simple GET handler
export async function GET(request: NextRequest) {
  
  try {
    const auth = await authenticateRequest(request);
    if (!auth.success || !auth.userId) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = auth.userId;
    
    const unifiedData = await fetchUnifiedFinancialData(userId);

    console.log('✅ [Unified API] Dados retornados:', {
      accounts: unifiedData.accounts?.length || 0,
      transactions: unifiedData.transactions?.length || 0,
      totalBalance: unifiedData.balances?.totalBalance || 0
    });

    return NextResponse.json(unifiedData);
  } catch (error) {
    console.error('❌ [Unified API] Erro completo:', error);
    console.error('❌ [Unified API] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('❌ [Unified API] Mensagem:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : String(error),
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

// Add dynamic export for Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
