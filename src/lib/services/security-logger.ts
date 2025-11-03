/**
 * SECURITY LOGGER
 * Registra eventos de segurança e atividades suspeitas
 */

import { prisma } from '@/lib/prisma';

export class SecurityLogger {
  /**
   * Registrar atividade suspeita
   */
  static async logSuspiciousActivity(
    userId: string,
    action: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'WARNING',
          source: 'TRANSACTION_SERVICE',
          description: `${action} by user ${userId}`,
          details: JSON.stringify(details),
          ipAddress,
          userAgent,
          blocked: false,
          resolved: false,
          timestamp: new Date()
        }
      });
      
      console.warn(`⚠️ [Security] Suspicious activity: ${action}`, {
        userId,
        ipAddress
      });
    } catch (error) {
      console.error('❌ [Security] Failed to log suspicious activity:', error);
    }
  }
  
  /**
   * Registrar falha de validação
   */
  static async logFailedValidation(
    userId: string,
    reason: string,
    transaction: any,
    ipAddress?: string
  ) {
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'VALIDATION_FAILED',
          severity: 'INFO',
          source: 'VALIDATION_SERVICE',
          description: `Validation failed: ${reason}`,
          details: JSON.stringify({ 
            userId, 
            transaction: {
              amount: transaction.amount,
              type: transaction.type,
              description: transaction.description
            }
          }),
          ipAddress,
          blocked: true,
          resolved: false,
          timestamp: new Date()
        }
      });
      
      console.log(`ℹ️ [Security] Validation failed: ${reason}`, {
        userId
      });
    } catch (error) {
      console.error('❌ [Security] Failed to log validation failure:', error);
    }
  }
  
  /**
   * Registrar tentativa de acesso não autorizado
   */
  static async logUnauthorizedAccess(
    userId: string | null,
    resource: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          source: 'AUTH_SERVICE',
          description: `Unauthorized access attempt to ${resource}`,
          details: JSON.stringify({ userId, resource }),
          ipAddress,
          userAgent,
          blocked: true,
          resolved: false,
          timestamp: new Date()
        }
      });
      
      console.error(`🚨 [Security] Unauthorized access attempt:`, {
        userId,
        resource,
        ipAddress
      });
    } catch (error) {
      console.error('❌ [Security] Failed to log unauthorized access:', error);
    }
  }
  
  /**
   * Registrar duplicata detectada
   */
  static async logDuplicateDetected(
    userId: string,
    transactionDetails: any,
    existingId: string
  ) {
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'DUPLICATE_DETECTED',
          severity: 'INFO',
          source: 'DUPLICATE_DETECTOR',
          description: `Duplicate transaction detected`,
          details: JSON.stringify({ 
            userId, 
            transactionDetails,
            existingId
          }),
          blocked: true,
          resolved: false,
          timestamp: new Date()
        }
      });
      
      console.log(`ℹ️ [Security] Duplicate detected:`, {
        userId,
        existingId
      });
    } catch (error) {
      console.error('❌ [Security] Failed to log duplicate:', error);
    }
  }
  
  /**
   * Registrar rate limit excedido
   */
  static async logRateLimitExceeded(
    userId: string,
    endpoint: string,
    ipAddress?: string
  ) {
    try {
      await prisma.securityEvent.create({
        data: {
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'WARNING',
          source: 'RATE_LIMITER',
          description: `Rate limit exceeded for ${endpoint}`,
          details: JSON.stringify({ userId, endpoint }),
          ipAddress,
          blocked: true,
          resolved: false,
          timestamp: new Date()
        }
      });
      
      console.warn(`⚠️ [Security] Rate limit exceeded:`, {
        userId,
        endpoint,
        ipAddress
      });
    } catch (error) {
      console.error('❌ [Security] Failed to log rate limit:', error);
    }
  }
}
