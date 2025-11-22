/**
 * SISTEMA DE MÉTRICAS DE NEGÓCIO
 * Coleta e expõe métricas importantes do sistema
 */

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private readonly maxMetricsPerType = 1000;

  /**
   * Registrar métrica
   */
  record(name: string, value: number, labels?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      labels,
    };

    const existing = this.metrics.get(name) || [];
    existing.push(metric);

    // Manter apenas as últimas N métricas
    if (existing.length > this.maxMetricsPerType) {
      existing.shift();
    }

    this.metrics.set(name, existing);
  }

  /**
   * Incrementar contador
   */
  increment(name: string, labels?: Record<string, string>) {
    this.record(name, 1, labels);
  }

  /**
   * Registrar duração
   */
  timing(name: string, durationMs: number, labels?: Record<string, string>) {
    this.record(`${name}_duration_ms`, durationMs, labels);
  }

  /**
   * Obter métricas
   */
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const all: Metric[] = [];
    this.metrics.forEach((metrics) => all.push(...metrics));
    return all;
  }

  /**
   * Obter resumo de métricas
   */
  getSummary() {
    const summary: Record<string, any> = {};

    this.metrics.forEach((metrics, name) => {
      const values = metrics.map((m) => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summary[name] = {
        count: values.length,
        sum,
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        latest: values[values.length - 1],
      };
    });

    return summary;
  }

  /**
   * Limpar métricas antigas
   */
  clear(olderThan?: Date) {
    if (!olderThan) {
      this.metrics.clear();
      return;
    }

    this.metrics.forEach((metrics, name) => {
      const filtered = metrics.filter((m) => m.timestamp > olderThan);
      this.metrics.set(name, filtered);
    });
  }
}

// Instância global
export const metrics = new MetricsCollector();

// Métricas de negócio
export const BusinessMetrics = {
  // Transações
  transactionCreated: (type: string) => 
    metrics.increment('transactions_created', { type }),
  
  transactionDeleted: (type: string) => 
    metrics.increment('transactions_deleted', { type }),
  
  transactionAmount: (amount: number, type: string) => 
    metrics.record('transaction_amount', amount, { type }),

  // Performance
  apiRequestDuration: (endpoint: string, durationMs: number) => 
    metrics.timing('api_request', durationMs, { endpoint }),

  // Erros
  errorOccurred: (type: string, endpoint?: string) => 
    metrics.increment('errors', { type, endpoint: endpoint || 'unknown' }),

  // Usuários
  userLogin: () => metrics.increment('user_logins'),
  userRegistration: () => metrics.increment('user_registrations'),

  // Backup
  backupCreated: (success: boolean) => 
    metrics.increment('backups', { success: success.toString() }),

  // Auditoria
  auditEventLogged: (operation: string) => 
    metrics.increment('audit_events', { operation }),
};

// Helper para medir tempo de execução
export function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  return fn().then(
    (result) => {
      const duration = Date.now() - start;
      metrics.timing(name, duration);
      return result;
    },
    (error) => {
      const duration = Date.now() - start;
      metrics.timing(name, duration, { error: 'true' });
      throw error;
    }
  );
}
