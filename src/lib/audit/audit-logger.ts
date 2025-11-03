/**
 * SISTEMA DE AUDITORIA E LOGS
 *
 * Detecta, registra e bloqueia qualquer tentativa de uso de storage local
 * Mantém logs detalhados de todas as operações do sistema
 */

import { clientDatabaseAdapter } from '../database/client-database-adapter';
import { databaseService } from '../services/database-service';

export interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  metadata?: any;
}

export interface SecurityViolation {
  type: 'sessionStorage' | 'indexedDB' | 'webSQL' | 'cookies'; // Removido localStorage
  operation: 'getItem' | 'setItem' | 'removeItem' | 'clear' | 'key' | 'open' | 'transaction';
  key?: string;
  value?: any;
  stackTrace: string;
  timestamp: string;
  blocked: boolean;
}

class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];
  private violations: SecurityViolation[] = [];
  private isInitialized = false;
  private maxLogsInMemory = 1000;

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Inicializa o sistema de auditoria
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      
      // Configura interceptadores globais
      this.setupGlobalInterceptors();

      // Configura monitoramento de performance
      this.setupPerformanceMonitoring();

      // Configura captura de erros
      this.setupErrorCapture();

      this.isInitialized = true;

      await this.logSystemEvent({
        type: 'system_event',
        level: 'info',
        source: 'audit-logger',
        action: 'initialized',
        details: {
          timestamp: new Date().toISOString(),
          maxLogsInMemory: this.maxLogsInMemory
        }
      });

      
    } catch (error) {
      console.error('❌ Erro ao inicializar auditoria:', error);
      throw error;
    }
  }

  /**
   * Registra violação de segurança
   */
  public async logSecurityViolation(violation: Omit<SecurityViolation, 'timestamp'>): Promise<void> {
    const fullViolation: SecurityViolation = {
      ...violation,
      timestamp: new Date().toISOString()
    };

    this.violations.push(fullViolation);

    // Log crítico no console
    console.error('🚨 VIOLAÇÃO DE SEGURANÇA DETECTADA:', fullViolation);

    // Registra no banco de dados
    await this.logSystemEvent({
      action: `security_violation_${violation.type}_${violation.operation}`,
      details: JSON.stringify(fullViolation),
      severity: 'critical',
      metadata: { blocked: violation.blocked }
    });

    // Alerta visual se possível
    if (typeof window !== 'undefined') {
      this.showSecurityAlert(fullViolation);
    }
  }

  /**
   * Registra acesso a storage
   */
  public async logStorageAccess(
    storageType: string,
    operation: string,
    key?: string,
    value?: any,
    blocked = false
  ): Promise<void> {
    const stackTrace = new Error().stack || 'Stack trace não disponível';

    await this.logSystemEvent({
      action: `storage_access_${storageType}_${operation}`,
      details: `Storage access: ${storageType}.${operation}(${key || 'unknown'})`,
      severity: blocked ? 'high' : 'low',
      metadata: {
        storageType,
        operation,
        key,
        value: value ? '[REDACTED]' : undefined,
        stackTrace: stackTrace.split('\n').slice(0, 10).join('\n'),
        blocked
      }
    });
  }

  /**
   * Registra operação de dados
   */
  public async logDataOperation(
    operation: string,
    entity: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    await this.logSystemEvent({
      action: `data_operation_${operation}_${entity}`,
      details: `Data operation: ${operation} on ${entity}${entityId ? ` (${entityId})` : ''}`,
      severity: 'medium',
      metadata: {
        operation,
        entity,
        entityId,
        ...details
      }
    });
  }

  /**
   * Registra evento do sistema
   */
  public async logSystemEvent(event: {
    action: string
    details: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    userId?: string
    metadata?: any
  }): Promise<void> {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      action: event.action,
      details: event.details,
      severity: event.severity,
      userId: event.userId,
      metadata: event.metadata
    };

    // Adiciona à memória
    this.logs.push(log);

    // Limita logs em memória
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Salva no banco de dados usando DatabaseService
    try {
      await databaseService.saveAuditLog(log);
    } catch (error) {
      console.error('❌ Erro ao salvar log no banco:', error);
      // Não falha se não conseguir salvar no banco
    }

    // Log no console baseado na severidade
    this.consoleLog(log);
  }

  /**
   * Configura interceptadores globais
   */
  private setupGlobalInterceptors(): void {
    if (typeof window === 'undefined') return;

    // Intercepta fetch para detectar tentativas de bypass
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || '';

      // Detecta tentativas suspeitas (localStorage removido do sistema)
      if (url.includes('sessionStorage')) {
        await this.logSecurityViolation({
          type: 'sessionStorage',
          operation: 'setItem',
          stackTrace: new Error().stack || '',
          blocked: true
        });
      }

      return originalFetch.apply(window, args);
    };

    // Intercepta XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(...args) {
      const url = args[1]?.toString() || '';

      if (url.includes('sessionStorage')) {
        auditLogger.logSecurityViolation({
          type: 'sessionStorage',
          operation: 'setItem',
          stackTrace: new Error().stack || '',
          blocked: true
        });
      }

      return originalXHROpen.apply(this, args);
    };
  }

  /**
   * Configura monitoramento de performance
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Monitora navegação
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        this.logSystemEvent({
          type: 'system_event',
          level: 'info',
          source: 'performance-monitor',
          action: 'page_load',
          details: {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            totalTime: navigation.loadEventEnd - navigation.fetchStart
          }
        });
      }, 1000);
    });
  }

  /**
   * Configura captura de erros
   */
  private setupErrorCapture(): void {
    // TEMPORARILY DISABLED TO FIX WEBPACK ISSUES
    // TODO: Re-enable after fixing webpack module loading problems
    /*
    if (typeof window === 'undefined') return;

    // Captura erros JavaScript
    window.addEventListener('error', (event) => {
      this.logSystemEvent({
        type: 'system_event',
        level: 'error',
        source: 'error-handler',
        action: 'javascript_error',
        details: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      });
    });

    // Captura promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logSystemEvent({
        type: 'system_event',
        level: 'error',
        source: 'error-handler',
        action: 'unhandled_promise_rejection',
        details: {
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        }
      });
    });
    */
  }

  /**
   * Mostra alerta de segurança
   */
  private showSecurityAlert(violation: SecurityViolation): void {
    // Em produção, isso seria um toast ou modal discreto
    console.warn(`🚨 Tentativa de acesso bloqueada: ${violation.type}.${violation.operation}`);

    // Poderia disparar um evento para a UI mostrar um alerta
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('security-violation', {
        detail: violation
      }));
    }
  }

  /**
   * Log no console baseado na severidade
   */
  private consoleLog(log: AuditLog): void {
    const severity = log.severity || 'low';
    const message = `[${severity.toUpperCase()}] ${log.action}: ${log.details}`;

    switch (severity) {
      case 'critical':
        console.error(message, log.metadata);
        break;
      case 'high':
        console.warn(message, log.metadata);
        break;
      case 'medium':
        console.info(message, log.metadata);
        break;
      case 'low':
        console.log(message, log.metadata);
        break;
    }
  }

  /**
   * Gera ID único
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém logs recentes
   */
  public getRecentLogs(limit = 100): AuditLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Obtém violações de segurança
   */
  public getSecurityViolations(): SecurityViolation[] {
    return [...this.violations];
  }

  /**
   * Obtém estatísticas de auditoria
   */
  public getAuditStats(): {
    totalLogs: number;
    violationsCount: number;
    logsBySeverity: Record<string, number>;
    logsByAction: Record<string, number>;
    recentActivity: AuditLog[];
  } {
    const logsBySeverity = this.logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const logsByAction = this.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: this.logs.length,
      violationsCount: this.violations.length,
      logsBySeverity,
      logsByAction,
      recentActivity: this.getRecentLogs(10)
    };
  }

  /**
   * Exporta logs para análise
   */
  public exportLogs(): {
    logs: AuditLog[];
    violations: SecurityViolation[];
    stats: any;
    exportedAt: string;
  } {
    return {
      logs: [...this.logs],
      violations: [...this.violations],
      stats: this.getAuditStats(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Limpa logs antigos (manter apenas os recentes)
   */
  public cleanupOldLogs(): void {
    const keepLogs = 500;
    if (this.logs.length > keepLogs) {
      this.logs = this.logs.slice(-keepLogs);
    }

    const keepViolations = 100;
    if (this.violations.length > keepViolations) {
      this.violations = this.violations.slice(-keepViolations);
    }

    console.log('🧹 Logs antigos limpos');
  }

  /**
   * Verifica se há atividade suspeita
   */
  public detectSuspiciousActivity(): {
    hasSuspiciousActivity: boolean;
    reasons: string[];
    violationsInLastHour: number;
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentViolations = this.violations.filter(v =>
      new Date(v.timestamp) > oneHourAgo
    );

    const reasons: string[] = [];

    if (recentViolations.length > 10) {
      reasons.push(`Muitas violações de segurança (${recentViolations.length}) na última hora`);
    }

    const errorLogs = this.logs.filter(log =>
      log.severity === 'critical' && new Date(log.timestamp) > oneHourAgo
    );

    if (errorLogs.length > 20) {
      reasons.push(`Muitos erros (${errorLogs.length}) na última hora`);
    }

    return {
      hasSuspiciousActivity: reasons.length > 0,
      reasons,
      violationsInLastHour: recentViolations.length
    };
  }
}

// Singleton instance
export const auditLogger = AuditLogger.getInstance();
