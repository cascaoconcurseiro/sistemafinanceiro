/**
 * SERVIÇO DE HISTÓRICO DE SALDOS
 * Mantém histórico de saldos das contas para análise temporal
 */

import { prisma } from '@/lib/prisma';

export class AccountHistoryService {
  /**
   * Registra mudança de saldo
   */
  static async recordBalanceChange(
    accountId: string,
    date: Date,
    newBalance: number,
    description: string
  ) {
    // Buscar último registro
    const previousHistory = await prisma.accountHistory.findFirst({
      where: { accountId },
      orderBy: { date: 'desc' }
    });

    const previousBalance = previousHistory ? Number(previousHistory.balance) : 0;
    const change = newBalance - previousBalance;

    return await prisma.accountHistory.create({
      data: {
        accountId,
        date,
        balance: newBalance,
        change,
        description
      }
    });
  }

  /**
   * Busca saldo em uma data específica
   */
  static async getBalanceAtDate(accountId: string, date: Date): Promise<number> {
    const history = await prisma.accountHistory.findFirst({
      where: {
        accountId,
        date: { lte: date }
      },
      orderBy: { date: 'desc' }
    });

    if (history) {
      return Number(history.balance);
    }

    // Se não tem histórico, calcular a partir das transações
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId,
        date: { lte: date },
        deletedAt: null
      }
    });

    return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }

  /**
   * Gera histórico diário para um período
   */
  static async generateDailyHistory(
    accountId: string,
    startDate: Date,
    endDate: Date
  ) {
    const history: Array<{ date: Date; balance: number; change: number }> = [];
    
    let currentDate = new Date(startDate);
    let previousBalance = await this.getBalanceAtDate(accountId, new Date(startDate.getTime() - 86400000));

    while (currentDate <= endDate) {
      const balance = await this.getBalanceAtDate(accountId, currentDate);
      const change = balance - previousBalance;

      history.push({
        date: new Date(currentDate),
        balance,
        change
      });

      previousBalance = balance;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return history;
  }

  /**
   * Gera histórico mensal
   */
  static async generateMonthlyHistory(
    accountId: string,
    year: number,
    months: number = 12
  ) {
    const history: Array<{ period: string; balance: number; change: number }> = [];
    
    let previousBalance = 0;

    for (let month = 1; month <= months; month++) {
      const lastDay = new Date(year, month, 0);
      const balance = await this.getBalanceAtDate(accountId, lastDay);
      const change = balance - previousBalance;

      history.push({
        period: `${year}-${String(month).padStart(2, '0')}`,
        balance,
        change
      });

      previousBalance = balance;
    }

    return history;
  }

  /**
   * Calcula evolução do saldo
   */
  static async getBalanceEvolution(
    accountId: string,
    startDate: Date,
    endDate: Date
  ) {
    const startBalance = await this.getBalanceAtDate(accountId, startDate);
    const endBalance = await this.getBalanceAtDate(accountId, endDate);
    const change = endBalance - startBalance;
    const percentChange = startBalance !== 0 ? (change / startBalance) * 100 : 0;

    return {
      startDate,
      endDate,
      startBalance,
      endBalance,
      change,
      percentChange
    };
  }

  /**
   * Limpa histórico antigo (manter apenas últimos N dias)
   */
  static async cleanOldHistory(accountId: string, daysToKeep: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.accountHistory.deleteMany({
      where: {
        accountId,
        date: { lt: cutoffDate }
      }
    });

    console.log(`🗑️ Histórico limpo: ${deleted.count} registros removidos`);

    return deleted.count;
  }
}
