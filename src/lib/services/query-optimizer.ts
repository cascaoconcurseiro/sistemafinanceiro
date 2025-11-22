/**
 * QUERY OPTIMIZER
 * Otimiza queries do Prisma para evitar N+1 e melhorar performance
 */

import { Prisma } from '@prisma/client';

export class QueryOptimizer {
  /**
   * Select otimizado para transações
   */
  static transactionSelect: Prisma.TransactionSelect = {
    id: true,
    description: true,
    amount: true,
    date: true,
    type: true,
    status: true,
    accountId: true,
    categoryId: true,
    creditCardId: true,
    isShared: true,
    myShare: true,
    totalSharedAmount: true,
    isInstallment: true,
    installmentNumber: true,
    totalInstallments: true,
    tripId: true,
    goalId: true,
    createdAt: true,
    paidBy: true,
    metadata: true,
    sharedWith: true,
    account: {
      select: {
        id: true,
        name: true,
        type: true,
      },
    },
    categoryRef: {
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
      },
    },
    creditCard: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  /**
   * Include otimizado para transações com relacionamentos
   */
  static transactionInclude: Prisma.TransactionInclude = {
    account: {
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
      },
    },
    categoryRef: {
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
      },
    },
    creditCard: {
      select: {
        id: true,
        name: true,
        limit: true,
        currentBalance: true,
      },
    },
    journalEntries: {
      select: {
        id: true,
        entryType: true,
        amount: true,
        description: true,
      },
    },
  };

  /**
   * Select otimizado para contas
   */
  static accountSelect: Prisma.AccountSelect = {
    id: true,
    name: true,
    type: true,
    balance: true,
    currency: true,
    isActive: true,
    bankCode: true,
    bankName: true,
    allowNegativeBalance: true,
    overdraftLimit: true,
  };

  /**
   * Batch loading para evitar N+1
   */
  static async batchLoadAccounts(accountIds: string[]) {
    const { prisma } = await import('@/lib/prisma');
    
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
      },
      select: this.accountSelect,
    });

    // Criar map para acesso rápido
    return new Map(accounts.map(a => [a.id, a]));
  }

  /**
   * Batch loading para categorias
   */
  static async batchLoadCategories(categoryIds: string[]) {
    const { prisma } = await import('@/lib/prisma');
    
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        icon: true,
      },
    });

    return new Map(categories.map(c => [c.id, c]));
  }

  /**
   * Query otimizada para dashboard
   */
  static async getDashboardData(userId: string, startDate: Date, endDate: Date) {
    const { prisma } = await import('@/lib/prisma');

    // Executar queries em paralelo
    const [transactions, accounts, categories, summary] = await Promise.all([
      // Transações do período
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        select: this.transactionSelect,
        orderBy: { date: 'desc' },
        take: 100,
      }),

      // Contas ativas
      prisma.account.findMany({
        where: {
          userId,
          isActive: true,
          deletedAt: null,
        },
        select: this.accountSelect,
      }),

      // Categorias ativas
      prisma.category.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          icon: true,
        },
      }),

      // Resumo financeiro
      prisma.transaction.aggregate({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      transactions,
      accounts,
      categories,
      summary,
    };
  }
}
