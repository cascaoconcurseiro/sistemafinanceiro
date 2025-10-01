export interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuditLogger {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  async log(
    entry: Omit<AuditLog, 'id' | 'timestamp' | 'severity'> & {
      severity?: AuditLog['severity'];
    }
  ): Promise<void> {
    if (!this.isClient()) return;

    const auditEntry: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      severity: entry.severity || this.determineSeverity(entry.action),
      ...entry,
    };

    try {
      // Tentar salvar no banco de dados via API
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'audit',
          data: auditEntry
        }),
      });
    } catch (error) {
      console.warn('Erro ao salvar log de auditoria:', error);
    }

    // Log critical events to console
    if (auditEntry.severity === 'critical') {
      console.warn('CRITICAL AUDIT EVENT:', auditEntry);
    }
  }

  private determineSeverity(action: string): AuditLog['severity'] {
    const criticalActions = [
      'delete_account',
      'delete_all_data',
      'export_data',
      'security_breach',
    ];
    const highActions = [
      'create_account',
      'update_account',
      'delete_transaction',
      'bulk_delete',
    ];
    const mediumActions = [
      'create_transaction',
      'update_transaction',
      'login',
      'logout',
    ];

    if (criticalActions.some((a) => action.includes(a))) return 'critical';
    if (highActions.some((a) => action.includes(a))) return 'high';
    if (mediumActions.some((a) => action.includes(a))) return 'medium';
    return 'low';
  }

  async getLogs(): Promise<AuditLog[]> {
    if (!this.isClient()) return [];

    try {
      const response = await fetch('/api/logs?type=audit');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Erro ao buscar logs de auditoria da API:', error);
    }
    
    return [];
  }

  async getLogsByAction(action: string): Promise<AuditLog[]> {
    const logs = await this.getLogs();
    return logs.filter((log) => log.action === action);
  }

  async getLogsBySeverity(severity: AuditLog['severity']): Promise<AuditLog[]> {
    const logs = await this.getLogs();
    return logs.filter((log) => log.severity === severity);
  }

  async getLogsInDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    const logs = await this.getLogs();
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  // Limpar logs antigos (agora via API)
  async clearOldLogs(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await fetch(`/api/logs?type=audit&olderThan=${thirtyDaysAgo.toISOString()}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erro ao limpar logs antigos via API:', error);
    }
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  // Convenience methods for common audit events
  async logAccountCreation(accountData: any, userId?: string): Promise<void> {
    await this.log({
      action: 'create_account',
      userId,
      details: {
        accountName: accountData.name,
        accountType: accountData.type,
        initialBalance: accountData.balance,
      },
      severity: 'high',
    });
  }

  async logAccountUpdate(
    accountId: string,
    changes: any,
    userId?: string
  ): Promise<void> {
    await this.log({
      action: 'update_account',
      userId,
      details: {
        accountId,
        changes,
      },
      severity: 'high',
    });
  }

  async logAccountDeletion(accountId: string, userId?: string): Promise<void> {
    await this.log({
      action: 'delete_account',
      userId,
      details: {
        accountId,
      },
      severity: 'critical',
    });
  }

  async logTransactionCreation(
    transactionData: any,
    userId?: string
  ): Promise<void> {
    await this.log({
      action: 'create_transaction',
      userId,
      details: {
        transactionId: transactionData.id,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
      },
      severity: 'medium',
    });
  }

  async logTransactionUpdate(
    transactionId: string,
    changes: any,
    userId?: string
  ): Promise<void> {
    await this.log({
      action: 'update_transaction',
      userId,
      details: {
        transactionId,
        changes,
      },
      severity: 'medium',
    });
  }

  async logTransactionDeletion(
    transactionId: string,
    userId?: string
  ): Promise<void> {
    await this.log({
      action: 'delete_transaction',
      userId,
      details: {
        transactionId,
      },
      severity: 'high',
    });
  }

  async logLogin(userId: string): Promise<void> {
    await this.log({
      action: 'login',
      userId,
      details: {
        timestamp: new Date().toISOString(),
      },
      severity: 'medium',
    });
  }

  async logLogout(userId: string): Promise<void> {
    await this.log({
      action: 'logout',
      userId,
      details: {
        timestamp: new Date().toISOString(),
      },
      severity: 'medium',
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
