/**
 * State Migration System
 * 
 * Sistema para migrar estado entre versões da aplicação,
 * limpeza automática de estados expirados e backup de dados críticos.
 */

interface MigrationConfig {
  version: number;
  description: string;
  migrate: (oldState: any) => any;
  rollback?: (newState: any) => any;
}

interface StateBackup {
  version: number;
  timestamp: number;
  data: any;
  checksum: string;
}

export class StateMigrationManager {
  private static instance: StateMigrationManager;
  private readonly BACKUP_KEY = 'state_backups';
  private readonly MAX_BACKUPS = 5;
  private readonly BACKUP_RETENTION_DAYS = 30;

  private migrations: MigrationConfig[] = [
    {
      version: 1,
      description: 'Adicionar preferências de usuário',
      migrate: (oldState) => ({
        ...oldState,
        preferences: {
          currency: 'BRL',
          dateFormat: 'dd/MM/yyyy',
          theme: 'system',
          notifications: true,
          autoSync: true,
          ...oldState.preferences,
        },
      }),
    },
    {
      version: 2,
      description: 'Adicionar filtros avançados',
      migrate: (oldState) => ({
        ...oldState,
        filters: {
          dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
          },
          selectedAccounts: [],
          selectedCategories: [],
          transactionTypes: ['income', 'expense', 'transfer'],
          ...oldState.filters,
        },
      }),
    },
    {
      version: 3,
      description: 'Adicionar sistema de cache e sincronização',
      migrate: (oldState) => ({
        ...oldState,
        lastSync: {
          accounts: null,
          transactions: null,
          categories: null,
          creditCards: null,
          budgets: null,
          ...oldState.lastSync,
        },
        pendingOperations: new Map(oldState.pendingOperations || []),
      }),
    },
  ];

  private constructor() {}

  static getInstance(): StateMigrationManager {
    if (!StateMigrationManager.instance) {
      StateMigrationManager.instance = new StateMigrationManager();
    }
    return StateMigrationManager.instance;
  }

  /**
   * Migra estado para a versão mais recente
   */
  migrateState(currentState: any, fromVersion: number, toVersion: number): any {
    if (fromVersion >= toVersion) {
      return currentState;
    }

    console.log(`🔄 [StateMigration] Migrando estado da versão ${fromVersion} para ${toVersion}`);

    // Criar backup antes da migração
    this.createBackup(currentState, fromVersion);

    let migratedState = { ...currentState };

    // Aplicar migrações sequencialmente
    for (let version = fromVersion + 1; version <= toVersion; version++) {
      const migration = this.migrations.find(m => m.version === version);
      
      if (migration) {
        console.log(`🔄 [StateMigration] Aplicando migração v${version}: ${migration.description}`);
        
        try {
          migratedState = migration.migrate(migratedState);
          migratedState.version = version;
        } catch (error) {
          console.error(`❌ [StateMigration] Erro na migração v${version}:`, error);
          
          // Tentar restaurar backup
          const backup = this.getLatestBackup();
          if (backup) {
            console.log('🔄 [StateMigration] Restaurando backup...');
            return backup.data;
          }
          
          throw new Error(`Falha na migração para versão ${version}: ${error}`);
        }
      }
    }

    console.log(`✅ [StateMigration] Migração concluída para versão ${toVersion}`);
    return migratedState;
  }

  /**
   * Cria backup do estado atual
   */
  createBackup(state: any, version: number): void {
    try {
      const backup: StateBackup = {
        version,
        timestamp: Date.now(),
        data: state,
        checksum: this.generateChecksum(state),
      };

      const backups = this.getBackups();
      backups.push(backup);

      // Manter apenas os últimos backups
      const sortedBackups = backups
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_BACKUPS);

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(sortedBackups));
      
      console.log(`💾 [StateMigration] Backup criado para versão ${version}`);
    } catch (error) {
      console.error('❌ [StateMigration] Erro ao criar backup:', error);
    }
  }

  /**
   * Obtém todos os backups
   */
  getBackups(): StateBackup[] {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      if (!stored) return [];

      const backups = JSON.parse(stored);
      
      // Filtrar backups expirados
      const cutoffDate = Date.now() - (this.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      return backups.filter((backup: StateBackup) => backup.timestamp > cutoffDate);
    } catch (error) {
      console.error('❌ [StateMigration] Erro ao carregar backups:', error);
      return [];
    }
  }

  /**
   * Obtém o backup mais recente
   */
  getLatestBackup(): StateBackup | null {
    const backups = this.getBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Restaura estado de um backup específico
   */
  restoreFromBackup(backupTimestamp: number): any | null {
    const backups = this.getBackups();
    const backup = backups.find(b => b.timestamp === backupTimestamp);
    
    if (!backup) {
      console.error('❌ [StateMigration] Backup não encontrado');
      return null;
    }

    // Verificar integridade
    const currentChecksum = this.generateChecksum(backup.data);
    if (currentChecksum !== backup.checksum) {
      console.error('❌ [StateMigration] Backup corrompido - checksum inválido');
      return null;
    }

    console.log(`🔄 [StateMigration] Restaurando backup de ${new Date(backup.timestamp).toLocaleString()}`);
    return backup.data;
  }

  /**
   * Limpa estados expirados do localStorage
   */
  clearExpiredStates(): void {
    const keysToCheck = [
      'financial-store',
      'auth_cache',
      'data_cache',
      'user_preferences',
    ];

    keysToCheck.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;

        const data = JSON.parse(stored);
        
        // Verificar se tem timestamp de expiração
        if (data.expiresAt && Date.now() > data.expiresAt) {
          localStorage.removeItem(key);
          console.log(`🧹 [StateMigration] Estado expirado removido: ${key}`);
        }
      } catch (error) {
        // Se não conseguir parsear, pode estar corrompido
        console.warn(`⚠️ [StateMigration] Estado corrompido removido: ${key}`);
        localStorage.removeItem(key);
      }
    });

    // Limpar backups antigos
    const backups = this.getBackups();
    if (backups.length !== this.getBackups().length) {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
      console.log('🧹 [StateMigration] Backups antigos removidos');
    }
  }

  /**
   * Gera checksum para verificar integridade
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  /**
   * Valida estrutura do estado
   */
  validateState(state: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Verificações básicas de estrutura
    const requiredFields = ['accounts', 'transactions', 'categories', 'preferences'];
    
    requiredFields.forEach(field => {
      if (!state.hasOwnProperty(field)) {
        errors.push(`Campo obrigatório ausente: ${field}`);
      }
    });

    // Verificar tipos
    if (state.accounts && !Array.isArray(state.accounts)) {
      errors.push('Campo "accounts" deve ser um array');
    }

    if (state.transactions && !Array.isArray(state.transactions)) {
      errors.push('Campo "transactions" deve ser um array');
    }

    if (state.categories && !Array.isArray(state.categories)) {
      errors.push('Campo "categories" deve ser um array');
    }

    if (state.preferences && typeof state.preferences !== 'object') {
      errors.push('Campo "preferences" deve ser um objeto');
    }

    // Verificar integridade referencial
    if (state.transactions && state.accounts) {
      const accountIds = new Set(state.accounts.map((a: any) => a.id));
      
      state.transactions.forEach((transaction: any, index: number) => {
        if (transaction.accountId && !accountIds.has(transaction.accountId)) {
          errors.push(`Transação ${index} referencia conta inexistente: ${transaction.accountId}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Repara estado corrompido
   */
  repairState(state: any): any {
    console.log('🔧 [StateMigration] Reparando estado corrompido...');

    const repairedState = { ...state };

    // Garantir arrays básicos
    if (!Array.isArray(repairedState.accounts)) {
      repairedState.accounts = [];
    }

    if (!Array.isArray(repairedState.transactions)) {
      repairedState.transactions = [];
    }

    if (!Array.isArray(repairedState.categories)) {
      repairedState.categories = [];
    }

    // Garantir preferências básicas
    if (!repairedState.preferences || typeof repairedState.preferences !== 'object') {
      repairedState.preferences = {
        currency: 'BRL',
        dateFormat: 'dd/MM/yyyy',
        theme: 'system',
        notifications: true,
        autoSync: true,
      };
    }

    // Remover transações órfãs (sem conta válida)
    if (repairedState.transactions.length > 0 && repairedState.accounts.length > 0) {
      const validAccountIds = new Set(repairedState.accounts.map((a: any) => a.id));
      
      repairedState.transactions = repairedState.transactions.filter((transaction: any) => {
        return !transaction.accountId || validAccountIds.has(transaction.accountId);
      });
    }

    // Garantir IDs únicos
    const seenIds = new Set();
    
    ['accounts', 'transactions', 'categories'].forEach(entityType => {
      if (repairedState[entityType]) {
        repairedState[entityType] = repairedState[entityType].filter((item: any) => {
          if (!item.id || seenIds.has(item.id)) {
            return false;
          }
          seenIds.add(item.id);
          return true;
        });
      }
    });

    console.log('✅ [StateMigration] Estado reparado');
    return repairedState;
  }

  /**
   * Obtém estatísticas de migração
   */
  getMigrationStats(): {
    currentVersion: number;
    availableVersions: number[];
    backupCount: number;
    lastBackup: number | null;
    storageUsage: number;
  } {
    const backups = this.getBackups();
    
    return {
      currentVersion: this.migrations.length,
      availableVersions: this.migrations.map(m => m.version),
      backupCount: backups.length,
      lastBackup: backups.length > 0 ? backups[0].timestamp : null,
      storageUsage: this.calculateStorageUsage(),
    };
  }

  /**
   * Calcula uso de armazenamento
   */
  private calculateStorageUsage(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
    
    return totalSize; // bytes
  }
}

// Instância singleton
export const stateMigration = StateMigrationManager.getInstance();

// Inicializar limpeza automática
if (typeof window !== 'undefined') {
  // Limpar estados expirados na inicialização
  stateMigration.clearExpiredStates();
  
  // Configurar limpeza periódica (a cada hora)
  setInterval(() => {
    stateMigration.clearExpiredStates();
  }, 60 * 60 * 1000);
}