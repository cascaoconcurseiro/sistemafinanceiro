/**
 * SERVIÇO DE FLUXO DE CAIXA
 * Calcula projeções e fluxo de caixa futuro
 */

import { prisma } from '@/lib/prisma';

interface MonthlyFlow {
  period: string;
  income: number;
  expenses: number;
  balance: number;
  transactions: number;
}

interface ProjectedBalance {
  currentBalance: number;
  projectedBalance: number;
  futureInstallments: number;
  openInvoices: number;
  recurringTransactions: number;
  projectionDate: Date;
}

export class CashFlowService {
  /**
   * Calcula saldo projetado de uma conta
   */
  static async calculateProjectedBalance(
    userId: string,
    accountId: string,
    futureDate: Date
  ): Promise<ProjectedBalance> {
    // 1. Saldo atual
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    let currentBalance = Number(account.balance);
    let projectedBalance = currentBalance;

    // 2. Parcelas futuras pendentes
    const futureInstallments = await prisma.transaction.findMany({
      where: {
        userId,
        accountId,
        date: { lte: futureDate, gte: new Date() },
        isInstallment: true,
        status: 'pending',
        deletedAt: null
      }
    });

    const installmentsTotal = futureInstallments.reduce((sum, t) => {
      return sum + Number(t.amount);
    }, 0);

    projectedBalance += installmentsTotal;

    console.log(`📊 Parcelas futuras: R$ ${installmentsTotal.toFixed(2)}`);

    // 3. Faturas abertas (se a conta for usada para pagar cartões)
    const openInvoices = await this.getOpenInvoicesForAccount(userId, futureDate);
    const invoicesTotal = openInvoices.reduce((sum, inv) => {
      return sum + Number(inv.totalAmount);
    }, 0);

    projectedBalance -= invoicesTotal;

    console.log(`💳 Faturas abertas: R$ ${invoicesTotal.toFixed(2)}`);

    // 4. Transações recorrentes (estimativa)
    const recurringTotal = await this.estimateRecurringTransactions(
      userId,
      accountId,
      futureDate
    );

    projectedBalance += recurringTotal;

    console.log(`🔄 Recorrentes estimadas: R$ ${recurringTotal.toFixed(2)}`);

    return {
      currentBalance,
      projectedBalance,
      futureInstallments: installmentsTotal,
      openInvoices: invoicesTotal,
      recurringTransactions: recurringTotal,
      projectionDate: futureDate
    };
  }

  /**
   * Calcula fluxo mensal
   */
  static async getMonthlyFlow(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyFlow> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      }
    });

    const income = transactions
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const period = `${year}-${String(month).padStart(2, '0')}`;

    return {
      period,
      income,
      expenses,
      balance: income - expenses,
      transactions: transactions.length
    };
  }

  /**
   * Calcula fluxo de vários meses
   */
  static async getMultiMonthFlow(
    userId: string,
    startYear: number,
    startMonth: number,
    months: number
  ): Promise<MonthlyFlow[]> {
    const flows: MonthlyFlow[] = [];

    let currentYear = startYear;
    let currentMonth = startMonth;

    for (let i = 0; i < months; i++) {
      const flow = await this.getMonthlyFlow(userId, currentYear, currentMonth);
      flows.push(flow);

      // Avançar para próximo mês
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return flows;
  }

  /**
   * Calcula saldo disponível (considerando cheque especial)
   */
  static async getAvailableBalance(accountId: string): Promise<number> {
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    const balance = Number(account.balance);

    if (account.allowNegativeBalance) {
      return balance + Number(account.overdraftLimit);
    }

    return Math.max(0, balance);
  }

  /**
   * Busca faturas abertas
   */
  private static async getOpenInvoicesForAccount(
    userId: string,
    untilDate: Date
  ) {
    return await prisma.invoice.findMany({
      where: {
        userId,
        status: 'open',
        dueDate: { lte: untilDate }
      }
    });
  }

  /**
   * Estima transações recorrentes futuras
   */
  private static async estimateRecurringTransactions(
    userId: string,
    accountId: string,
    futureDate: Date
  ): Promise<number> {
    // Buscar transações recorrentes
    const recurring = await prisma.transaction.findMany({
      where: {
        userId,
        accountId,
        isRecurring: true,
        deletedAt: null
      },
      orderBy: { date: 'desc' },
      take: 10 // Últimas 10 recorrentes
    });

    if (recurring.length === 0) {
      return 0;
    }

    // Calcular média mensal
    const total = recurring.reduce((sum, t) => sum + Number(t.amount), 0);
    const average = total / recurring.length;

    // Calcular quantos meses até a data futura
    const now = new Date();
    const monthsDiff = this.getMonthsDifference(now, futureDate);

    // Estimar total
    return average * monthsDiff;
  }

  /**
   * Calcula diferença em meses entre duas datas
   */
  private static getMonthsDifference(date1: Date, date2: Date): number {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12;
    return months + (date2.getMonth() - date1.getMonth());
  }

  /**
   * Gera relatório de fluxo de caixa
   */
  static async generateCashFlowReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      include: {
        account: { select: { name: true } },
        categoryRef: { select: { name: true, type: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Agrupar por categoria
    const byCategory = new Map<string, number>();
    
    transactions.forEach(t => {
      const category = t.categoryRef?.name || 'Sem Categoria';
      const current = byCategory.get(category) || 0;
      byCategory.set(category, current + Number(t.amount));
    });

    // Agrupar por conta
    const byAccount = new Map<string, number>();
    
    transactions.forEach(t => {
      const account = t.account?.name || 'Sem Conta';
      const current = byAccount.get(account) || 0;
      byAccount.set(account, current + Number(t.amount));
    });

    // Calcular totais
    const income = transactions
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter(t => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    return {
      period: {
        start: startDate,
        end: endDate
      },
      summary: {
        income,
        expenses,
        balance: income - expenses,
        transactions: transactions.length
      },
      byCategory: Object.fromEntries(byCategory),
      byAccount: Object.fromEntries(byAccount),
      transactions
    };
  }
}
