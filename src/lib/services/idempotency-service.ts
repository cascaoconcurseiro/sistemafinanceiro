/**
 * SERVIÇO DE IDEMPOTÊNCIA
 * Garante que operações duplicadas não sejam executadas
 */

import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export class IdempotencyService {
  /**
   * Verifica se uma operação já foi executada
   */
  static async checkDuplicate(operationUuid: string): Promise<boolean> {
    const existing = await prisma.transaction.findUnique({
      where: { operationUuid }
    });
    
    return !!existing;
  }
  
  /**
   * Gera um UUID único para a operação
   */
  static generateUuid(): string {
    return randomUUID();
  }
  
  /**
   * Busca transação por UUID de operação
   */
  static async getByOperationUuid(operationUuid: string) {
    return await prisma.transaction.findUnique({
      where: { operationUuid }
    });
  }
  
  /**
   * Valida e retorna UUID (gera novo se não fornecido)
   */
  static validateOrGenerate(operationUuid?: string): string {
    if (operationUuid) {
      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(operationUuid)) {
        throw new Error('UUID de operação inválido');
      }
      return operationUuid;
    }
    
    return this.generateUuid();
  }
}
