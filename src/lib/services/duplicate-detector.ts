/**
 * DETECTOR DE DUPLICATAS
 * Detecta transações duplicadas para evitar criação acidental
 */

import { prisma } from '@/lib/prisma';

export class DuplicateDetector {
  /**
   * Detectar se uma transação é duplicata
   * Considera duplicata se:
   * - Mesmo usuário
   * - Mesmo valor
   * - Mesma descrição
   * - Data próxima (±5 minutos)
   */
  static async detectDuplicate(
    userId: string,
    amount: number,
    description: string,
    date: Date
  ): Promise<{ isDuplicate: boolean; existingId?: string }> {
    // Buscar transações similares nos últimos 5 minutos
    const fiveMinutesAgo = new Date(date.getTime() - 5 * 60 * 1000);
    const fiveMinutesLater = new Date(date.getTime() + 5 * 60 * 1000);
    
    const similar = await prisma.transaction.findFirst({
      where: {
        userId,
        amount,
        description,
        date: {
          gte: fiveMinutesAgo,
          lte: fiveMinutesLater
        },
        deletedAt: null
      },
      select: {
        id: true,
        date: true
      }
    });
    
    if (similar) {
      console.warn(`⚠️ [DuplicateDetector] Duplicata detectada!`, {
        existingId: similar.id,
        existingDate: similar.date,
        newDate: date
      });
      
      return {
        isDuplicate: true,
        existingId: similar.id
      };
    }
    
    return { isDuplicate: false };
  }
  
  /**
   * Detectar duplicatas em lote
   * Útil para validar importações
   */
  static async detectBatchDuplicates(
    transactions: Array<{
      userId: string;
      amount: number;
      description: string;
      date: Date;
    }>
  ): Promise<Array<{ index: number; existingId: string }>> {
    const duplicates: Array<{ index: number; existingId: string }> = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const result = await this.detectDuplicate(
        t.userId,
        t.amount,
        t.description,
        t.date
      );
      
      if (result.isDuplicate && result.existingId) {
        duplicates.push({
          index: i,
          existingId: result.existingId
        });
      }
    }
    
    return duplicates;
  }
}
