/**
 * SERVIÇO DE FECHAMENTO DE PERÍODO
 * Gerencia fechamento e reabertura de períodos contábeis
 */

import { prisma } from '@/lib/prisma';
import { TemporalValidationService } from './temporal-validation-service';

export class PeriodClosureService {
  /**
   * Fecha um período contábil
   */
  static async closePeriod(
    userId: string,
    period: string,
    closedBy: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validar formato do período
      const { startDate, endDate } = TemporalValidationService.parsePeriod(period);
      
      // 2. Verificar se já está fechado
      const existingClosed = await tx.transaction.findFirst({
        where: {
          userId,
          closedPeriod: true,
          date: { gte: startDate, lte: endDate }
        }
      });
      
      if (existingClosed) {
        throw new Error(`Período ${period} já está fechado`);
      }
      
      // 3. Marcar todas transações do período como fechadas
      const result = await tx.transaction.updateMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          deletedAt: null
        },
        data: {
          closedPeriod: true,
          updatedBy: closedBy
        }
      });
      
      console.log(`✅ Período ${period} fechado: ${result.count} transações`);
      
      return {
        period,
        transactionsAffected: result.count,
        closedAt: new Date(),
        closedBy
      };
    });
  }
  
  /**
   * Reabre um período contábil
   */
  static async reopenPeriod(
    userId: string,
    period: string,
    reopenedBy: string,
    reason: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validar formato do período
      const { startDate, endDate } = TemporalValidationService.parsePeriod(period);
      
      // 2. Verificar se está fechado
      const existingClosed = await tx.transaction.findFirst({
        where: {
          userId,
          closedPeriod: true,
          date: { gte: startDate, lte: endDate }
        }
      });
      
      if (!existingClosed) {
        throw new Error(`Período ${period} não está fechado`);
      }
      
      // 3. Desmarcar transações
      const result = await tx.transaction.updateMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate }
        },
        data: {
          closedPeriod: false,
          updatedBy: reopenedBy
        }
      });
      
      console.log(`✅ Período ${period} reaberto: ${result.count} transações`);
      console.log(`📝 Motivo: ${reason}`);
      
      return {
        period,
        transactionsAffected: result.count,
        reopenedAt: new Date(),
        reopenedBy,
        reason
      };
    });
  }
  
  /**
   * Lista períodos fechados
   */
  static async getClosedPeriods(userId: string) {
    const closedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        closedPeriod: true
      },
      select: {
        date: true
      },
      distinct: ['date']
    });
    
    // Agrupar por período
    const periods = new Set<string>();
    closedTransactions.forEach(t => {
      const period = TemporalValidationService.formatPeriod(t.date);
      periods.add(period);
    });
    
    return Array.from(periods).sort();
  }
  
  /**
   * Verifica se período está fechado
   */
  static async isPeriodClosed(userId: string, date: Date): Promise<boolean> {
    const period = TemporalValidationService.formatPeriod(date);
    const { startDate, endDate } = TemporalValidationService.parsePeriod(period);
    
    const closedTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        closedPeriod: true,
        date: { gte: startDate, lte: endDate }
      }
    });
    
    return !!closedTransaction;
  }
  
  /**
   * Estatísticas do período
   */
  static async getPeriodStats(userId: string, period: string) {
    const { startDate, endDate } = TemporalValidationService.parsePeriod(period);
    
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
    
    const isClosed = transactions.some(t => t.closedPeriod);
    
    return {
      period,
      totalTransactions: transactions.length,
      income,
      expenses,
      balance: income - expenses,
      isClosed
    };
  }
}
