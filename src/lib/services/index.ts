/**
 * ÍNDICE DE SERVIÇOS
 * 
 * Exporta todos os serviços do sistema financeiro
 * Garante acesso centralizado e organizado aos serviços
 */

// Serviço principal
export { financialService } from './financial-service';

// Adaptador de banco de dados
export { clientDatabaseAdapter } from '../database/client-database-adapter';

// Sistema de eventos
export { eventBus } from '../events/event-bus';

// Hook para React
export { useFinancialData } from '../hooks/useFinancialData';

// Sistema de auditoria e monitoramento
export { auditLogger } from '../audit/audit-logger';
export { securityMonitor } from '../audit/security-monitor';

// Inicializador do sistema
export { systemInitializer } from '../initialization/system-initializer';

// Tipos e interfaces
export type {
  Account,
  Transaction,
  CreditCard,
  Budget
} from './financial-service';

export type {
  EventType,
  SystemEvent,
  DataState
} from '../events/event-bus';

export type {
  UseFinancialDataReturn
} from '../hooks/useFinancialData';
