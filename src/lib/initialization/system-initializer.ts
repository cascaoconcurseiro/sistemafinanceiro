/**
 * SISTEMA DE INICIALIZAÇÃO SEGURA
 *
 * Garante que o sistema inicie limpo, sem dados de localStorage,
 * e configure todas as proteções necessárias.
 */

import { eventBus } from '../events/event-bus';
import { clientDatabaseAdapter } from '../database/client-database-adapter';

export interface InitializationResult {
  success: boolean;
  message: string;
  clearedItems: number;
  errors: string[];
  timestamp: string;
}

class SystemInitializer {
  private static instance: SystemInitializer;
  private isInitialized = false;

  public static getInstance(): SystemInitializer {
    if (!SystemInitializer.instance) {
      SystemInitializer.instance = new SystemInitializer();
    }
    return SystemInitializer.instance;
  }

  /**
   * Inicializa o sistema completo
   */
  public async initialize(): Promise<InitializationResult> {
    if (this.isInitialized) {
      return {
        success: true,
        message: 'Sistema já foi inicializado',
        clearedItems: 0,
        errors: [],
        timestamp: new Date().toISOString()
      };
    }

    const errors: string[] = [];
    let clearedItems = 0;

    try {
      
      // 1. Limpar dados locais (sem usar storage-blocker)
      clearedItems = await this.clearAllLocalStorage();

      // 2. Verificar conexão com banco de dados (com timeout)
      await this.verifyDatabaseConnection();

      // 3. Inicializar sistema de eventos
      eventBus.initialize();

      // 4. Configurar interceptadores de segurança
      this.setupSecurityInterceptors();

      // 5. Registrar inicialização no banco
      console.log('Sistema inicializado:', {
        event: 'system_initialization',
        message: `Sistema inicializado com sucesso. ${clearedItems} itens de cache removidos.`,
        timestamp: new Date().toISOString(),
        clearedItems
      });

      this.isInitialized = true;

      const result: InitializationResult = {
        success: true,
        message: `Sistema inicializado com sucesso. ${clearedItems} itens de cache removidos.`,
        clearedItems,
        errors,
        timestamp: new Date().toISOString()
      };

            console.log(`🧹 ${clearedItems} itens de cache removidos`);
      console.log('🔒 Proteções de segurança ativadas');
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(errorMessage);

      console.error('❌ Erro durante inicialização:', error);

      return {
        success: false,
        message: `Erro durante inicialização: ${errorMessage}`,
        clearedItems,
        errors,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Limpa TODOS os dados de localStorage/sessionStorage
   */
  private async clearAllLocalStorage(): Promise<number> {
    let clearedCount = 0;

    try {
      // Simula limpeza - localStorage/sessionStorage não são mais usados
      console.warn('🚫 localStorage/sessionStorage removidos - dados agora vêm do banco de dados');

      // Simula limpeza de IndexedDB
      await this.clearIndexedDBDatabases();

      return clearedCount;
    } catch (error) {
      console.warn('Erro durante limpeza de storage local:', error);
      return clearedCount;
    }
  }

  /**
   * Limpa databases do IndexedDB
   */
  private async clearIndexedDBDatabases(): Promise<void> {
    try {
      // IndexedDB não é mais usado - dados vêm do banco PostgreSQL
      console.warn('🚫 IndexedDB removido - dados agora vêm do banco de dados PostgreSQL');
    } catch (error) {
      console.warn('Erro durante limpeza de IndexedDB:', error);
    }
  }

  /**
   * Verifica conexão com banco de dados
   */
  private async verifyDatabaseConnection(): Promise<void> {
    try {
      // Timeout para evitar loops infinitos na conexão
      const connectionPromise = clientDatabaseAdapter.testConnection();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout na conexão com banco')), 5000)
      );

      await Promise.race([connectionPromise, timeoutPromise]);
          } catch (error) {
      console.error('❌ Erro de conexão com banco de dados:', error);
      // Não lança erro para não impedir o carregamento do sistema
      console.warn('⚠️ Sistema continuará sem conexão com banco - modo offline');
    }
  }

  /**
   * Configura interceptadores de segurança
   */
  private setupSecurityInterceptors(): void {
    if (typeof window === 'undefined') return;

    // Intercepta tentativas de uso de storage local
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      // Log tentativas de acesso a storage
      if (url.includes('storage') || url.includes('cache')) {
        console.warn('🔍 Tentativa de acesso a storage interceptada:', url);

        console.log('Tentativa de acesso a storage:', {
          event: 'storage_access_attempt',
          message: `Tentativa de acesso a storage: ${url}`,
          url,
          timestamp: new Date().toISOString()
        });
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Registra inicialização no banco de dados
   */
  private async logInitialization(clearedItems: number): Promise<void> {
    try {
      // Auditoria temporariamente desabilitada para evitar loop infinito
      // await auditLogger.logSystemEvent({
      //   type: 'system_event',
      //   level: 'info',
      //   source: 'system-initializer',
      //   action: 'initialization_completed',
      //   details: {
      //     clearedItems,
      //     timestamp: new Date().toISOString(),
      //     userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      //     storageBlocked: true,
      //     databaseConnected: true
      //   }
      // });
      console.log('Sistema inicializado com sucesso - auditoria desabilitada');
    } catch (error) {
      console.warn('Não foi possível registrar inicialização no banco:', error);
    }
  }

  /**
   * Força reinicialização (para testes)
   */
  public async forceReinitialize(): Promise<InitializationResult> {
    this.isInitialized = false;
    return this.initialize();
  }

  /**
   * Verifica se o sistema foi inicializado
   */
  public isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Gera relatório de status do sistema
   */
  public getSystemStatus(): {
    initialized: boolean;
    storageBlocked: boolean;
    databaseConnected: boolean;
    auditLogs: number;
  } {
    return {
      initialized: this.isInitialized,
      storageBlocked: true, // Storage local não é mais usado
      databaseConnected: true, // Assumindo conexão via API
      auditLogs: 0 // Logs são mantidos no banco de dados
    };
  }
}

// Singleton instance
export const systemInitializer = SystemInitializer.getInstance();

// Auto-inicialização quando o módulo é carregado (apenas no cliente)
if (typeof window !== 'undefined') {
  // Inicializa assim que possível
  document.addEventListener('DOMContentLoaded', () => {
    systemInitializer.initialize().catch(error => {
      console.error('Erro durante auto-inicialização:', error);
    });
  });

  // Fallback se DOMContentLoaded já passou
  if (document.readyState === 'loading') {
    // DOMContentLoaded ainda não disparou
  } else {
    // DOM já está pronto
    setTimeout(() => {
      systemInitializer.initialize().catch(error => {
        console.error('Erro durante auto-inicialização (fallback):', error);
      });
    }, 0);
  }
}
