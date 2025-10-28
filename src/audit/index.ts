/**
 * Sistema de Auditoria Completa - SuaGrana
 * 
 * Este módulo implementa uma auditoria rigorosa e sistemática do sistema,
 * analisando segurança, performance, qualidade de código, integridade de dados
 * e capacidade sob estresse.
 */

export { AuditController } from './core/audit-controller';
export { SecurityAuditor } from './modules/security-auditor';
export { CodeQualityAuditor } from './modules/code-quality-auditor';
export { PerformanceAuditor } from './modules/performance-auditor';
export { DataIntegrityAuditor } from './modules/data-integrity-auditor';
export { StressTestAuditor } from './modules/stress-test-auditor';
export { ReportGenerator } from './core/report-generator';

// Types
export * from './types/audit-types';
export * from './types/report-types';
export * from './types/issue-types';

// Utils
export { AuditLogger } from './utils/audit-logger';
export { TestDataGenerator } from './utils/test-data-generator';