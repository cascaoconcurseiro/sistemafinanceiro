// =====================================================
// CONFIGURAÇÃO DO BANCO DE DADOS POSTGRESQL
// =====================================================

import { Pool, PoolConfig, Client } from 'pg';
import { SystemEvent } from '../types/database';

// =====================================================
// CONFIGURAÇÕES DO BANCO
// =====================================================

export interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | object;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Configuração padrão do banco de dados
const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'financial_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

// =====================================================
// CLASSE DE CONEXÃO COM O BANCO
// =====================================================

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Array<(event: SystemEvent) => void>> = new Map();

  private constructor(config: DatabaseConfig = defaultConfig) {
    this.pool = new Pool(config);
    this.setupEventListeners();
  }

  /**
   * Singleton pattern - retorna a instância única da conexão
   */
  public static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Configura os listeners de eventos do pool de conexões
   */
  private setupEventListeners(): void {
    this.pool.on('connect', (client) => {
      
      this.isConnected = true;
    });

    this.pool.on('error', (err, client) => {
      console.error('❌ Erro na conexão com o banco de dados:', err);
      this.isConnected = false;
    });

    this.pool.on('remove', (client) => {
      console.log('🔌 Conexão removida do pool');
    });
  }

  /**
   * Testa a conexão com o banco de dados
   */
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      
      console.log('🕐 Timestamp do servidor:', result.rows[0].now);
      
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Erro ao testar conexão com o banco:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Executa uma query no banco de dados
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log da query em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Query executada:', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration: `${duration}ms`,
          rows: result.rowCount
        });
      }
      
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao executar query:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  /**
   * Executa uma query e retorna apenas o primeiro resultado
   */
  public async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(text, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Inicia uma transação
   */
  public async beginTransaction(): Promise<Client> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Confirma uma transação
   */
  public async commitTransaction(client: Client): Promise<void> {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Desfaz uma transação
   */
  public async rollbackTransaction(client: Client): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  /**
   * Executa múltiplas queries em uma transação
   */
  public async transaction<T>(
    callback: (client: Client) => Promise<T>
  ): Promise<T> {
    const client = await this.beginTransaction();
    
    try {
      const result = await callback(client);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }

  /**
   * Executa o schema inicial do banco de dados
   */
  public async initializeSchema(): Promise<void> {
    try {
      
      
      // Aqui você pode executar o arquivo schema.sql
      // Por enquanto, vamos apenas verificar se as tabelas existem
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;
      
      const tables = await this.query(tablesQuery);
      
      if (tables.length === 0) {
        console.log('⚠️  Nenhuma tabela encontrada. Execute o schema.sql primeiro.');
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar schema:', error);
      throw error;
    }
  }

  /**
   * Adiciona um listener para eventos do sistema
   */
  public addEventListener(eventType: string, callback: (event: SystemEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove um listener de eventos
   */
  public removeEventListener(eventType: string, callback: (event: SystemEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emite um evento do sistema
   */
  public emitEvent(event: SystemEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('❌ Erro ao executar listener de evento:', error);
        }
      });
    }
  }

  /**
   * Retorna estatísticas do pool de conexões
   */
  public getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Verifica se está conectado ao banco
   */
  public isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Fecha todas as conexões do pool
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Pool de conexões fechado');
    } catch (error) {
      console.error('❌ Erro ao fechar pool de conexões:', error);
      throw error;
    }
  }

  /**
   * Executa limpeza e manutenção do banco
   */
  public async maintenance(): Promise<void> {
    try {
      console.log('🧹 Executando manutenção do banco de dados...');
      
      // Limpar logs de auditoria antigos (mais de 90 dias)
      await this.query(`
        DELETE FROM audit_logs 
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);
      
      // Atualizar estatísticas das tabelas
      await this.query('ANALYZE');
      
      
    } catch (error) {
      console.error('❌ Erro durante manutenção:', error);
      throw error;
    }
  }
}

// =====================================================
// UTILITÁRIOS PARA QUERIES
// =====================================================

/**
 * Constrói uma query de INSERT com valores dinâmicos
 */
export function buildInsertQuery(
  tableName: string, 
  data: Record<string, any>
): { query: string; values: any[] } {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
  
  const query = `
    INSERT INTO ${tableName} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;
  
  return { query, values };
}

/**
 * Constrói uma query de UPDATE com valores dinâmicos
 */
export function buildUpdateQuery(
  tableName: string,
  data: Record<string, any>,
  whereClause: string,
  whereValues: any[]
): { query: string; values: any[] } {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ');
  
  const query = `
    UPDATE ${tableName}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING *
  `;
  
  return { query, values: [...values, ...whereValues] };
}

/**
 * Constrói uma query de SELECT com filtros dinâmicos
 */
export function buildSelectQuery(
  tableName: string,
  filters: Record<string, any> = {},
  options: {
    select?: string[];
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): { query: string; values: any[] } {
  const selectClause = options.select ? options.select.join(', ') : '*';
  let query = `SELECT ${selectClause} FROM ${tableName}`;
  const values: any[] = [];
  
  // WHERE clause
  if (Object.keys(filters).length > 0) {
    const whereConditions = Object.keys(filters).map((key, index) => {
      values.push(filters[key]);
      return `${key} = $${index + 1}`;
    });
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  // ORDER BY clause
  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy}`;
  }
  
  // LIMIT clause
  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
  }
  
  // OFFSET clause
  if (options.offset) {
    query += ` OFFSET ${options.offset}`;
  }
  
  return { query, values };
}

// =====================================================
// INSTÂNCIA GLOBAL
// =====================================================

// Instância global da conexão com o banco
export const db = DatabaseConnection.getInstance();

// Função para inicializar o banco de dados
export async function initializeDatabase(): Promise<void> {
  try {
    
    
    // Testar conexão
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
    // Inicializar schema
    await db.initializeSchema();
    
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Função para finalizar conexões (útil para testes)
export async function closeDatabase(): Promise<void> {
  await db.close();
}

// =====================================================
// TIPOS PARA CONFIGURAÇÃO
// =====================================================

export interface DatabaseHealthCheck {
  isConnected: boolean;
  poolStats: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  lastCheck: string;
  version?: string;
}

/**
 * Verifica a saúde do banco de dados
 */
export async function getDatabaseHealth(): Promise<DatabaseHealthCheck> {
  try {
    const isConnected = db.isConnectionActive();
    const poolStats = db.getPoolStats();
    
    let version: string | undefined;
    if (isConnected) {
      const result = await db.queryOne<{ version: string }>('SELECT version()');
      version = result?.version;
    }
    
    return {
      isConnected,
      poolStats,
      lastCheck: new Date().toISOString(),
      version
    };
  } catch (error) {
    return {
      isConnected: false,
      poolStats: { totalCount: 0, idleCount: 0, waitingCount: 0 },
      lastCheck: new Date().toISOString()
    };
  }
}
