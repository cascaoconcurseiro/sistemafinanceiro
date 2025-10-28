/**
 * Sistema de logging centralizado para auditoria
 * Garante que dados sensíveis não sejam expostos em logs
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
  duration?: number;
  error?: Error;
}

export class AuditLogger {
  private logs: LogEntry[] = [];
  private startTimes: Map<string, number> = new Map();
  private sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'email', 'phone', 'cpf', 'cnpj', 'account', 'card'
  ];

  constructor(private verboseLogging: boolean = false) {}

  debug(module: string, message: string, data?: any): void {
    if (this.verboseLogging) {
      this.log(LogLevel.DEBUG, module, message, data);
    }
  }

  info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  error(module: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, module, message, data, undefined, error);
  }

  critical(module: string, message: string, error?: Error, data?: any): void {
    this.log(LogLevel.CRITICAL, module, message, data, undefined, error);
  }

  startTimer(operation: string): void {
    this.startTimes.set(operation, Date.now());
  }

  endTimer(module: string, operation: string, message?: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      this.warn(module, `Timer não encontrado para operação: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(operation);
    
    this.log(
      LogLevel.INFO, 
      module, 
      message || `Operação ${operation} concluída`,
      undefined,
      duration
    );

    return duration;
  }

  private log(
    level: LogLevel, 
    module: string, 
    message: string, 
    data?: any, 
    duration?: number,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module,
      message,
      data: this.sanitizeData(data),
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error : undefined
    };

    this.logs.push(entry);

    // Console output para desenvolvimento
    if (this.verboseLogging || level !== LogLevel.DEBUG) {
      this.outputToConsole(entry);
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  private sanitizeString(str: string): string {
    // Remove possíveis tokens ou chaves que possam aparecer em strings
    return str.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED_TOKEN]')
              .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARD]')
              .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive => lowerField.includes(sensitive));
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const duration = entry.duration ? ` (${entry.duration}ms)` : '';
    const prefix = `[${timestamp}] [${entry.level}] [${entry.module}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}${duration}`, entry.data);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}${duration}`, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}${duration}`, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}${duration}`, entry.error, entry.data);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 ${prefix} ${entry.message}${duration}`, entry.error, entry.data);
        break;
    }
  }

  getLogs(level?: LogLevel, module?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (module && log.module !== module) return false;
      return true;
    });
  }

  getLogsSummary(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byModule: Record<string, number>;
    errors: LogEntry[];
    warnings: LogEntry[];
  } {
    const byLevel = Object.values(LogLevel).reduce((acc, level) => {
      acc[level] = 0;
      return acc;
    }, {} as Record<LogLevel, number>);

    const byModule: Record<string, number> = {};
    const errors: LogEntry[] = [];
    const warnings: LogEntry[] = [];

    for (const log of this.logs) {
      byLevel[log.level]++;
      byModule[log.module] = (byModule[log.module] || 0) + 1;
      
      if (log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL) {
        errors.push(log);
      } else if (log.level === LogLevel.WARN) {
        warnings.push(log);
      }
    }

    return {
      total: this.logs.length,
      byLevel,
      byModule,
      errors,
      warnings
    };
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clear(): void {
    this.logs = [];
    this.startTimes.clear();
  }

  // Métodos de conveniência para logging de auditoria específica
  auditStart(module: string, operation: string): void {
    this.info(module, `🔍 Iniciando auditoria: ${operation}`);
    this.startTimer(`audit_${module}_${operation}`);
  }

  auditComplete(module: string, operation: string, issuesFound: number): void {
    const duration = this.endTimer(module, `audit_${module}_${operation}`);
    this.info(module, `✅ Auditoria concluída: ${operation} - ${issuesFound} issues encontrados`, {
      operation,
      issuesFound,
      duration
    });
  }

  auditError(module: string, operation: string, error: Error): void {
    this.error(module, `❌ Erro na auditoria: ${operation}`, error);
  }

  issueDetected(module: string, issueType: string, severity: string, location: string): void {
    this.warn(module, `🚨 Issue detectado: ${issueType}`, {
      issueType,
      severity,
      location
    });
  }

  performanceMetric(module: string, metric: string, value: number, unit: string): void {
    this.info(module, `📊 Métrica: ${metric} = ${value}${unit}`, {
      metric,
      value,
      unit
    });
  }
}