// Enhanced Logger utility for development and debugging

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component?: string;
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';
  private maxLogs = 1000; // Limit memory usage
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  // Make sessionId accessible
  public getSessionId(): string {
    return this.sessionId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Capture unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        this.error(
          `Unhandled Error: ${event.message}`,
          'GlobalErrorHandler',
          {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
            stack: event.error?.stack
          }
        );
      });

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.error(
          `Unhandled Promise Rejection: ${event.reason}`,
          'GlobalErrorHandler',
          {
            reason: event.reason,
            stack: event.reason?.stack
          }
        );
      });
    }
  }

  private getContextInfo(): Partial<LogEntry> {
    const context: Partial<LogEntry> = {
      sessionId: this.sessionId,
    };

    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
    }

    return context;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    component?: string,
    data?: any
  ): LogEntry {
    const context = this.getContextInfo();
    
    // Capture stack trace for errors and warnings
    let stack: string | undefined;
    if (level === 'error' || level === 'warn') {
      try {
        throw new Error();
      } catch (e) {
        stack = (e as Error).stack;
      }
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      stack,
      ...context,
    };

    // Tentar salvar na API
    this.saveLogToAPI(entry).catch(error => {
      console.warn('Erro ao salvar log na API:', error);
    });

    return entry;
  }

  private async saveLogToAPI(entry: LogEntry): Promise<void> {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'system',
          level: entry.level,
          message: entry.message,
          component: entry.component,
          data: entry.data
        })
      });
    } catch (error) {
      // Silenciar erro para não criar loop infinito
      console.warn('Falha ao salvar log na API:', error);
    }
  }

  private log(entry: LogEntry) {
    // Salvar no array local para fallback
    this.logs.push(entry);
    
    // Manter apenas os últimos 100 logs locais
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
    
    if (this.isDevelopment) {
      const prefix = entry.component ? `[${entry.component}]` : '';
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const logMessage = `${timestamp} ${prefix} ${entry.message}`;
      
      switch (entry.level) {
        case 'error':
          console.error(logMessage, entry.data);
          if (entry.stack) {
            console.error('Stack trace:', entry.stack);
          }
          break;
        case 'warn':
          console.warn(logMessage, entry.data);
          if (entry.stack) {
            console.warn('Stack trace:', entry.stack);
          }
          break;
        case 'debug':
          console.debug(logMessage, entry.data);
          break;
        default:
          console.log(logMessage, entry.data);
      }
    }

    // Send critical errors to external service in production
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // In production, this would send to your logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    try {
      // Placeholder for external logging service
      if (typeof window !== 'undefined' && window.fetch) {
        // Example implementation:
        // fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // }).catch(() => {}); // Silent fail for logging
      }
    } catch (error) {
      // Silent fail - don't let logging errors break the app
    }
  }

  info(message: string, component?: string, data?: any) {
    this.log(this.createLogEntry('info', message, component, data));
  }

  warn(message: string, component?: string, data?: any) {
    this.log(this.createLogEntry('warn', message, component, data));
  }

  error(message: string, component?: string, data?: any) {
    this.log(this.createLogEntry('error', message, component, data));
  }

  debug(message: string, component?: string, data?: any) {
    this.log(this.createLogEntry('debug', message, component, data));
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      const response = await fetch('/api/logs?type=system');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Erro ao buscar logs da API, retornando logs locais:', error);
    }
    return [...this.logs];
  }

  async clearLogs(): Promise<void> {
    try {
      await fetch('/api/logs?type=system', { method: 'DELETE' });
    } catch (error) {
      console.warn('Erro ao limpar logs via API:', error);
    }
    this.logs = [];
  }

  async getLogsByComponent(component: string): Promise<LogEntry[]> {
    try {
      const response = await fetch(`/api/logs?type=system&component=${component}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Erro ao buscar logs por componente da API:', error);
    }
    return this.logs.filter(log => log.component === component);
  }

  async getLogsByLevel(level: LogEntry['level']): Promise<LogEntry[]> {
    try {
      const response = await fetch(`/api/logs?type=system&level=${level}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Erro ao buscar logs por nível da API:', error);
    }
    return this.logs.filter(log => log.level === level);
  }

  // Enhanced methods for better error tracking
  async getErrorLogs(): Promise<LogEntry[]> {
    return this.getLogsByLevel('error');
  }

  async getLogsByTimeRange(startTime: Date, endTime: Date): Promise<LogEntry[]> {
    try {
      const logs = await this.getLogs();
      return logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= startTime && logTime <= endTime;
      });
    } catch (error) {
      console.warn('Erro ao buscar logs por período:', error);
      return this.logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= startTime && logTime <= endTime;
      });
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Method to manually set user context
  setUserContext(userId: string) {
    // Store user context for future logs
    if (typeof window !== 'undefined') {
      (window as any).__logger_userId = userId;
    }
  }

  // Enhanced error method with automatic context detection
  errorWithContext(message: string, error: Error | any, component?: string, additionalContext?: any) {
    const errorData = {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      ...additionalContext,
    };

    this.error(message, component, errorData);
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger as named export
export { logger };

// Component-specific loggers
export const logComponents = {
  auth: (message: string, data?: any) => logger.info(message, 'Auth', data),
  ui: (message: string, data?: any) => logger.info(message, 'UI', data),
  api: (message: string, data?: any) => logger.info(message, 'API', data),
  navigation: (message: string, data?: any) => logger.info(message, 'Navigation', data),
  form: (message: string, data?: any) => logger.info(message, 'Form', data),
  modal: (message: string, data?: any) => logger.info(message, 'Modal', data),
  notification: (message: string, data?: any) => logger.info(message, 'Notification', data),
  search: (message: string, data?: any) => logger.info(message, 'Search', data),
  dashboard: (message: string, data?: any) => logger.info(message, 'Dashboard', data),
  transaction: (message: string, data?: any) => logger.info(message, 'Transaction', data),
  goal: (message: string, data?: any) => logger.info(message, 'Goal', data),
  warn: (message: string, data?: any) => logger.warn(message, 'Component', data),
};

export const logError = {
  auth: (message: string, error?: any) => logger.error(message, 'Auth', error),
  ui: (message: string, error?: any) => logger.error(message, 'UI', error),
  api: (message: string, error?: any) => logger.error(message, 'API', error),
  navigation: (message: string, error?: any) => logger.error(message, 'Navigation', error),
  form: (message: string, error?: any) => logger.error(message, 'Form', error),
  modal: (message: string, error?: any) => logger.error(message, 'Modal', error),
  notification: (message: string, error?: any) => logger.error(message, 'Notification', error),
  search: (message: string, error?: any) => logger.error(message, 'Search', error),
  dashboard: (message: string, error?: any) => logger.error(message, 'Dashboard', error),
  transaction: (message: string, error?: any) => logger.error(message, 'Transaction', error),
  goal: (message: string, error?: any) => logger.error(message, 'Goal', error),
  storage: (message: string, error?: any) => logger.error(message, 'Storage', error),
  components: (message: string, error?: any) => logger.error(message, 'Components', error),
  hooks: (message: string, error?: any) => logger.error(message, 'Hooks', error),
  performance: (message: string, error?: any) => logger.error(message, 'Performance', error),
  pwa: (message: string, error?: any) => logger.error(message, 'PWA', error),
  // Enhanced error logging with context
  withContext: (message: string, error: Error | any, component?: string, context?: any) => 
    logger.errorWithContext(message, error, component, context),
};

// React hook for component logging
export function useLogger(componentName: string) {
  return {
    debug: (message: string, data?: any) =>
      logger.debug(message, componentName, data),
    info: (message: string, data?: any) =>
      logger.info(message, componentName, data),
    warn: (message: string, data?: any) =>
      logger.warn(message, componentName, data),
    error: (message: string, error?: Error | any) =>
      logger.error(message, componentName, error),
    errorWithContext: (message: string, error: Error | any, additionalContext?: any) =>
      logger.errorWithContext(message, error, componentName, additionalContext),
  };
}

// Global logger utilities
export const loggerUtils = {
  // Get all error logs from the last hour
  getRecentErrors: async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const logs = await logger.getLogsByTimeRange(oneHourAgo, new Date());
    return logs.filter(log => log.level === 'error');
  },
  
  // Export logs for debugging
  exportLogs: () => logger.exportLogs(),
  
  // Clear all logs
  clearLogs: () => logger.clearLogs(),
  
  // Set user context
  setUser: (userId: string) => logger.setUserContext(userId),
  
  // Get session info
  getSessionId: () => logger.getSessionId(),
};

// Função helper para capturar erros de API de forma consistente
export function handleApiError(error: any, component: string, operation: string) {
  const message = `Erro em ${operation}`;
  logger.error(message, component, error);
  
  return {
    error: process.env.NODE_ENV === 'development' ? error?.message || 'Erro interno do servidor' : 'Erro interno do servidor',
    timestamp: new Date().toISOString(),
    operation,
  };
}

export default logger;
