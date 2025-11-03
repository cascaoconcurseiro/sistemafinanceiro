/**
 * SERVIÇO DE VALIDAÇÃO TEMPORAL
 * Valida datas de transações e períodos
 */

import { prisma } from '@/lib/prisma';

export class TemporalValidationService {
  /**
   * Valida data de transação
   */
  static async validateTransactionDate(
    userId: string,
    date: Date,
    accountId?: string,
    creditCardId?: string
  ): Promise<void> {
    // 1. Não pode ser anterior à criação da conta
    if (accountId) {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });
      
      if (account && date < account.createdAt) {
        throw new Error(
          `Data não pode ser anterior à criação da conta (${account.createdAt.toLocaleDateString('pt-BR')})`
        );
      }
    }
    
    // 2. Não pode ser anterior à criação do cartão
    if (creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: creditCardId }
      });
      
      if (card && date < card.createdAt) {
        throw new Error(
          `Data não pode ser anterior à criação do cartão (${card.createdAt.toLocaleDateString('pt-BR')})`
        );
      }
    }
    
    // 3. Não pode ser muito no futuro (5 anos)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
    
    if (date > maxFutureDate) {
      throw new Error('Data não pode ser superior a 5 anos no futuro');
    }
    
    // 4. Validar período fechado
    await this.validatePeriodOpen(userId, date);
  }
  
  /**
   * Valida se período está aberto para edição
   */
  static async validatePeriodOpen(userId: string, date: Date): Promise<void> {
    // Buscar transações no mesmo período que estejam em período fechado
    const closedTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        closedPeriod: true,
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), 1),
          lte: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
        }
      }
    });
    
    if (closedTransaction) {
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      throw new Error(
        `Período ${period} está fechado. Não é possível criar/editar transações.`
      );
    }
  }
  
  /**
   * Valida range de datas
   */
  static validateDateRange(startDate: Date, endDate: Date): void {
    if (startDate > endDate) {
      throw new Error('Data inicial não pode ser posterior à data final');
    }
    
    // Máximo de 10 anos de range
    const maxRange = 10 * 365 * 24 * 60 * 60 * 1000; // 10 anos em ms
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      throw new Error('Período não pode ser superior a 10 anos');
    }
  }
  
  /**
   * Formata período (YYYY-MM)
   */
  static formatPeriod(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  
  /**
   * Parse período (YYYY-MM) para datas
   */
  static parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const [year, month] = period.split('-').map(Number);
    
    if (!year || !month || month < 1 || month > 12) {
      throw new Error('Período inválido. Use formato YYYY-MM');
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    return { startDate, endDate };
  }
}
