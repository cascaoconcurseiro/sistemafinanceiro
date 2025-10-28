'use client';

// =====================================================
// SISTEMA DE SEGURANÇA BANCÁRIA AVANÇADO
// =====================================================

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: SecurityRuleType;
  isActive: boolean;
  severity: SecuritySeverity;
  conditions: SecurityCondition[];
  actions: SecurityAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityCondition {
  field: string;
  operator: SecurityOperator;
  value: any;
  threshold?: number;
}

export interface SecurityAction {
  type: SecurityActionType;
  config: Record<string, any>;
  isEnabled: boolean;
  requiresApproval?: boolean;
}

export interface SecurityIncident {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  type: SecurityRuleType;
  severity: SecuritySeverity;
  status: IncidentStatus;
  data: Record<string, any>;
  detectedAt: Date;
  resolvedAt?: Date;
  investigatedBy?: string;
  resolution?: string;
  falsePositive?: boolean;
}

export interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number;
  reasons: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface TransactionRiskProfile {
  transactionId: string;
  riskScore: number;
  riskFactors: RiskFactor[];
  geolocationRisk: number;
  behaviorRisk: number;
  amountRisk: number;
  timeRisk: number;
  merchantRisk: number;
}

export interface RiskFactor {
  type: string;
  description: string;
  weight: number;
  value: any;
}

export interface UserBehaviorProfile {
  userId: string;
  averageTransactionAmount: number;
  commonTransactionTimes: number[];
  frequentMerchants: string[];
  commonLocations: string[];
  spendingPatterns: Record<string, number>;
  lastUpdated: Date;
}

export interface SecurityMetrics {
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  falsePositives: number;
  averageResolutionTime: number;
  riskScoreDistribution: Record<string, number>;
  incidentsByType: Record<SecurityRuleType, number>;
  monthlyTrends: SecurityTrendData[];
}

export interface SecurityTrendData {
  date: string;
  incidents: number;
  riskScore: number;
  type: SecurityRuleType;
}

export enum SecurityRuleType {
  FRAUD_DETECTION = 'fraud_detection',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  VELOCITY_CHECK = 'velocity_check',
  GEOLOCATION_ANOMALY = 'geolocation_anomaly',
  DEVICE_FINGERPRINT = 'device_fingerprint',
  BEHAVIORAL_ANALYSIS = 'behavioral_analysis',
  AMOUNT_THRESHOLD = 'amount_threshold',
  TIME_RESTRICTION = 'time_restriction',
  MERCHANT_BLACKLIST = 'merchant_blacklist',
  ACCOUNT_TAKEOVER = 'account_takeover',
  MONEY_LAUNDERING = 'money_laundering',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SecurityOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  PATTERN_MATCH = 'pattern_match',
  ANOMALY_DETECTION = 'anomaly_detection',
  VELOCITY_EXCEEDED = 'velocity_exceeded',
}

export enum SecurityActionType {
  BLOCK_TRANSACTION = 'block_transaction',
  FLAG_FOR_REVIEW = 'flag_for_review',
  REQUIRE_2FA = 'require_2fa',
  FREEZE_ACCOUNT = 'freeze_account',
  NOTIFY_USER = 'notify_user',
  NOTIFY_ADMIN = 'notify_admin',
  LOG_INCIDENT = 'log_incident',
  INCREASE_MONITORING = 'increase_monitoring',
  REQUEST_VERIFICATION = 'request_verification',
  LIMIT_TRANSACTIONS = 'limit_transactions',
}

export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  ESCALATED = 'escalated',
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  description: string;
  date: Date;
  location?: string;
  merchant?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  isFrozen?: boolean;
}

export class AdvancedBankingSecurity {
  private securityRules: SecurityRule[] = [];
  private incidents: SecurityIncident[] = [];
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private blacklistedMerchants: Set<string> = new Set();
  private suspiciousIPs: Set<string> = new Set();

  constructor() {
    this.initializeDefaultRules();
    this.initializeBlacklists();
  }

  // =====================================================
  // INICIALIZAÇÃO E CONFIGURAÇÃO
  // =====================================================

  private initializeDefaultRules(): void {
    this.securityRules = [
      // Detecção de fraude por valor
      {
        id: 'fraud-amount-1',
        name: 'Transação de Alto Valor',
        description: 'Detecta transações acima de R$ 10.000',
        type: SecurityRuleType.AMOUNT_THRESHOLD,
        isActive: true,
        severity: SecuritySeverity.HIGH,
        conditions: [{
          field: 'transaction.amount',
          operator: SecurityOperator.GREATER_THAN,
          value: 10000,
        }],
        actions: [{
          type: SecurityActionType.FLAG_FOR_REVIEW,
          config: { requiresManagerApproval: true },
          isEnabled: true,
          requiresApproval: true,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Detecção de velocidade de transações
      {
        id: 'velocity-check-1',
        name: 'Múltiplas Transações Rápidas',
        description: 'Detecta mais de 5 transações em 10 minutos',
        type: SecurityRuleType.VELOCITY_CHECK,
        isActive: true,
        severity: SecuritySeverity.MEDIUM,
        conditions: [{
          field: 'transaction.velocity',
          operator: SecurityOperator.VELOCITY_EXCEEDED,
          value: { count: 5, timeWindow: 600 }, // 10 minutos
        }],
        actions: [{
          type: SecurityActionType.REQUIRE_2FA,
          config: { method: 'sms' },
          isEnabled: true,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Detecção de atividade incomum
      {
        id: 'unusual-activity-1',
        name: 'Padrão de Gasto Incomum',
        description: 'Detecta gastos 500% acima do padrão normal',
        type: SecurityRuleType.UNUSUAL_ACTIVITY,
        isActive: true,
        severity: SecuritySeverity.MEDIUM,
        conditions: [{
          field: 'transaction.behaviorDeviation',
          operator: SecurityOperator.ANOMALY_DETECTION,
          threshold: 5.0, // 500% acima do normal
        }],
        actions: [{
          type: SecurityActionType.NOTIFY_USER,
          config: { message: 'Atividade incomum detectada' },
          isEnabled: true,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Detecção de geolocalização suspeita
      {
        id: 'geolocation-1',
        name: 'Localização Suspeita',
        description: 'Detecta transações de locais incomuns',
        type: SecurityRuleType.GEOLOCATION_ANOMALY,
        isActive: true,
        severity: SecuritySeverity.HIGH,
        conditions: [{
          field: 'transaction.location',
          operator: SecurityOperator.ANOMALY_DETECTION,
          value: 'unusual_location',
        }],
        actions: [{
          type: SecurityActionType.BLOCK_TRANSACTION,
          config: { reason: 'Localização suspeita' },
          isEnabled: true,
          requiresApproval: true,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Detecção de horário suspeito
      {
        id: 'time-restriction-1',
        name: 'Transação Fora do Horário',
        description: 'Detecta transações entre 2h e 6h da manhã',
        type: SecurityRuleType.TIME_RESTRICTION,
        isActive: true,
        severity: SecuritySeverity.LOW,
        conditions: [{
          field: 'transaction.hour',
          operator: SecurityOperator.PATTERN_MATCH,
          value: { start: 2, end: 6 },
        }],
        actions: [{
          type: SecurityActionType.INCREASE_MONITORING,
          config: { duration: 24 }, // 24 horas
          isEnabled: true,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Detecção de merchant suspeito
      {
        id: 'merchant-blacklist-1',
        name: 'Merchant na Lista Negra',
        description: 'Detecta transações com merchants suspeitos',
        type: SecurityRuleType.MERCHANT_BLACKLIST,
        isActive: true,
        severity: SecuritySeverity.CRITICAL,
        conditions: [{
          field: 'transaction.merchant',
          operator: SecurityOperator.CONTAINS,
          value: 'blacklisted_merchant',
        }],
        actions: [{
          type: SecurityActionType.BLOCK_TRANSACTION,
          config: { reason: 'Merchant suspeito' },
          isEnabled: true,
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  private initializeBlacklists(): void {
    // Merchants suspeitos (exemplo)
    this.blacklistedMerchants.add('SUSPICIOUS_MERCHANT_1');
    this.blacklistedMerchants.add('FRAUD_COMPANY_XYZ');
    
    // IPs suspeitos (exemplo)
    this.suspiciousIPs.add('192.168.1.100');
    this.suspiciousIPs.add('10.0.0.50');
  }

  // =====================================================
  // ANÁLISE DE SEGURANÇA PRINCIPAL
  // =====================================================

  analyzeTransaction(transaction: Transaction, account: Account): FraudDetectionResult {
    const riskProfile = this.calculateTransactionRisk(transaction, account);
    const incidents: SecurityIncident[] = [];

    // Avaliar cada regra de segurança
    for (const rule of this.securityRules.filter(r => r.isActive)) {
      const violation = this.evaluateSecurityRule(rule, transaction, account, riskProfile);
      if (violation) {
        const incident = this.createSecurityIncident(rule, transaction, violation);
        incidents.push(incident);
        this.incidents.push(incident);
      }
    }

    // Calcular resultado final
    const isFraudulent = riskProfile.riskScore > 80 || 
                        incidents.some(i => i.severity === SecuritySeverity.CRITICAL);
    
    const reasons = incidents.map(i => i.description);
    const recommendedActions = this.generateRecommendedActions(incidents, riskProfile);
    
    return {
      isFraudulent,
      riskScore: riskProfile.riskScore,
      reasons,
      recommendedActions,
      confidence: this.calculateConfidence(riskProfile, incidents),
    };
  }

  private calculateTransactionRisk(transaction: Transaction, account: Account): TransactionRiskProfile {
    const userProfile = this.getUserBehaviorProfile(transaction.userId);
    
    // Calcular riscos individuais
    const amountRisk = this.calculateAmountRisk(transaction, userProfile);
    const behaviorRisk = this.calculateBehaviorRisk(transaction, userProfile);
    const geolocationRisk = this.calculateGeolocationRisk(transaction, userProfile);
    const timeRisk = this.calculateTimeRisk(transaction, userProfile);
    const merchantRisk = this.calculateMerchantRisk(transaction);

    // Fatores de risco identificados
    const riskFactors: RiskFactor[] = [];
    
    if (amountRisk > 50) {
      riskFactors.push({
        type: 'amount',
        description: 'Valor da transação acima do padrão',
        weight: 0.3,
        value: amountRisk,
      });
    }

    if (behaviorRisk > 50) {
      riskFactors.push({
        type: 'behavior',
        description: 'Padrão de comportamento incomum',
        weight: 0.25,
        value: behaviorRisk,
      });
    }

    if (geolocationRisk > 50) {
      riskFactors.push({
        type: 'geolocation',
        description: 'Localização incomum',
        weight: 0.2,
        value: geolocationRisk,
      });
    }

    if (timeRisk > 50) {
      riskFactors.push({
        type: 'time',
        description: 'Horário incomum',
        weight: 0.15,
        value: timeRisk,
      });
    }

    if (merchantRisk > 50) {
      riskFactors.push({
        type: 'merchant',
        description: 'Merchant suspeito',
        weight: 0.1,
        value: merchantRisk,
      });
    }

    // Calcular score de risco ponderado
    const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedScore = riskFactors.reduce((sum, factor) => 
      sum + (factor.value * factor.weight), 0
    );
    
    const riskScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      transactionId: transaction.id,
      riskScore: Math.min(100, Math.max(0, riskScore)),
      riskFactors,
      geolocationRisk,
      behaviorRisk,
      amountRisk,
      timeRisk,
      merchantRisk,
    };
  }

  private calculateAmountRisk(transaction: Transaction, profile?: UserBehaviorProfile): number {
    if (!profile) return 0;

    const ratio = Math.abs(transaction.amount) / profile.averageTransactionAmount;
    
    if (ratio > 10) return 100; // 1000% acima da média
    if (ratio > 5) return 80;   // 500% acima da média
    if (ratio > 3) return 60;   // 300% acima da média
    if (ratio > 2) return 40;   // 200% acima da média
    
    return 0;
  }

  private calculateBehaviorRisk(transaction: Transaction, profile?: UserBehaviorProfile): number {
    if (!profile) return 0;

    let risk = 0;

    // Verificar categoria incomum
    const categorySpending = profile.spendingPatterns[transaction.category] || 0;
    if (categorySpending === 0) {
      risk += 30; // Nova categoria
    }

    // Verificar merchant incomum
    if (transaction.merchant && !profile.frequentMerchants.includes(transaction.merchant)) {
      risk += 20;
    }

    // Verificar horário incomum
    const transactionHour = new Date(transaction.date).getHours();
    if (!profile.commonTransactionTimes.includes(transactionHour)) {
      risk += 25;
    }

    return Math.min(100, risk);
  }

  private calculateGeolocationRisk(transaction: Transaction, profile?: UserBehaviorProfile): number {
    if (!transaction.location || !profile) return 0;

    // Verificar se a localização é comum para o usuário
    if (!profile.commonLocations.includes(transaction.location)) {
      return 70; // Localização incomum
    }

    return 0;
  }

  private calculateTimeRisk(transaction: Transaction, profile?: UserBehaviorProfile): number {
    const hour = new Date(transaction.date).getHours();
    
    // Horários de alto risco (madrugada)
    if (hour >= 2 && hour <= 6) {
      return 60;
    }

    // Verificar se é horário comum para o usuário
    if (profile && !profile.commonTransactionTimes.includes(hour)) {
      return 40;
    }

    return 0;
  }

  private calculateMerchantRisk(transaction: Transaction): number {
    if (!transaction.merchant) return 0;

    // Verificar lista negra
    if (this.blacklistedMerchants.has(transaction.merchant)) {
      return 100;
    }

    // Verificar padrões suspeitos no nome
    const suspiciousPatterns = ['TEMP', 'TEST', 'UNKNOWN', 'CASH'];
    for (const pattern of suspiciousPatterns) {
      if (transaction.merchant.toUpperCase().includes(pattern)) {
        return 50;
      }
    }

    return 0;
  }

  // =====================================================
  // AVALIAÇÃO DE REGRAS DE SEGURANÇA
  // =====================================================

  private evaluateSecurityRule(
    rule: SecurityRule,
    transaction: Transaction,
    account: Account,
    riskProfile: TransactionRiskProfile
  ): any {
    for (const condition of rule.conditions) {
      const violation = this.evaluateSecurityCondition(condition, transaction, account, riskProfile);
      if (violation) {
        return violation;
      }
    }
    return null;
  }

  private evaluateSecurityCondition(
    condition: SecurityCondition,
    transaction: Transaction,
    account: Account,
    riskProfile: TransactionRiskProfile
  ): any {
    let value: any;

    // Extrair valor baseado no campo
    switch (condition.field) {
      case 'transaction.amount':
        value = Math.abs(transaction.amount);
        break;
      case 'transaction.velocity':
        value = this.calculateTransactionVelocity(transaction.userId);
        break;
      case 'transaction.behaviorDeviation':
        value = riskProfile.behaviorRisk / 20; // Converter para múltiplo
        break;
      case 'transaction.location':
        value = transaction.location;
        break;
      case 'transaction.hour':
        value = new Date(transaction.date).getHours();
        break;
      case 'transaction.merchant':
        value = transaction.merchant;
        break;
      default:
        return null;
    }

    // Avaliar condição
    return this.evaluateConditionOperator(condition.operator, value, condition.value, condition.threshold);
  }

  private evaluateConditionOperator(
    operator: SecurityOperator,
    value: any,
    conditionValue: any,
    threshold?: number
  ): boolean {
    switch (operator) {
      case SecurityOperator.EQUALS:
        return value === conditionValue;
      case SecurityOperator.NOT_EQUALS:
        return value !== conditionValue;
      case SecurityOperator.GREATER_THAN:
        return value > conditionValue;
      case SecurityOperator.LESS_THAN:
        return value < conditionValue;
      case SecurityOperator.CONTAINS:
        return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
      case SecurityOperator.PATTERN_MATCH:
        return this.matchPattern(value, conditionValue);
      case SecurityOperator.ANOMALY_DETECTION:
        return threshold ? value > threshold : false;
      case SecurityOperator.VELOCITY_EXCEEDED:
        return this.checkVelocityExceeded(value, conditionValue);
      default:
        return false;
    }
  }

  private matchPattern(value: any, pattern: any): boolean {
    if (typeof pattern === 'object' && pattern.start !== undefined && pattern.end !== undefined) {
      // Padrão de horário
      return value >= pattern.start && value <= pattern.end;
    }
    return false;
  }

  private checkVelocityExceeded(velocity: any, condition: any): boolean {
    if (typeof velocity === 'object' && velocity.count !== undefined) {
      return velocity.count >= condition.count;
    }
    return false;
  }

  // =====================================================
  // PERFIL DE COMPORTAMENTO DO USUÁRIO
  // =====================================================

  private getUserBehaviorProfile(userId: string): UserBehaviorProfile | undefined {
    return this.userProfiles.get(userId);
  }

  updateUserBehaviorProfile(userId: string, transactions: Transaction[]): void {
    const userTransactions = transactions.filter(t => t.userId === userId);
    
    if (userTransactions.length === 0) return;

    // Calcular métricas do perfil
    const averageTransactionAmount = userTransactions.reduce((sum, t) => 
      sum + Math.abs(t.amount), 0
    ) / userTransactions.length;

    const commonTransactionTimes = this.extractCommonTimes(userTransactions);
    const frequentMerchants = this.extractFrequentMerchants(userTransactions);
    const commonLocations = this.extractCommonLocations(userTransactions);
    const spendingPatterns = this.extractSpendingPatterns(userTransactions);

    const profile: UserBehaviorProfile = {
      userId,
      averageTransactionAmount,
      commonTransactionTimes,
      frequentMerchants,
      commonLocations,
      spendingPatterns,
      lastUpdated: new Date(),
    };

    this.userProfiles.set(userId, profile);
  }

  private extractCommonTimes(transactions: Transaction[]): number[] {
    const hourCounts: Record<number, number> = {};
    
    transactions.forEach(t => {
      const hour = new Date(t.date).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Retornar horários com mais de 10% das transações
    const threshold = transactions.length * 0.1;
    return Object.entries(hourCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([hour, _]) => parseInt(hour));
  }

  private extractFrequentMerchants(transactions: Transaction[]): string[] {
    const merchantCounts: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.merchant) {
        merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1;
      }
    });

    // Retornar merchants com mais de 3 transações
    return Object.entries(merchantCounts)
      .filter(([_, count]) => count >= 3)
      .map(([merchant, _]) => merchant);
  }

  private extractCommonLocations(transactions: Transaction[]): string[] {
    const locationCounts: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.location) {
        locationCounts[t.location] = (locationCounts[t.location] || 0) + 1;
      }
    });

    // Retornar localizações com mais de 5% das transações
    const threshold = transactions.length * 0.05;
    return Object.entries(locationCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([location, _]) => location);
  }

  private extractSpendingPatterns(transactions: Transaction[]): Record<string, number> {
    const categorySpending: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
      }
    });

    return categorySpending;
  }

  // =====================================================
  // CÁLCULOS AUXILIARES
  // =====================================================

  private calculateTransactionVelocity(userId: string): { count: number; timeWindow: number } {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    // Simular contagem de transações nos últimos 10 minutos
    // Em implementação real, isso viria do banco de dados
    const recentTransactions = 0; // Placeholder
    
    return {
      count: recentTransactions,
      timeWindow: 600, // 10 minutos em segundos
    };
  }

  private createSecurityIncident(
    rule: SecurityRule,
    transaction: Transaction,
    violation: any
  ): SecurityIncident {
    return {
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      title: `${rule.name} - Transação ${transaction.id}`,
      description: `${rule.description} - Valor: R$ ${Math.abs(transaction.amount).toFixed(2)}`,
      type: rule.type,
      severity: rule.severity,
      status: IncidentStatus.DETECTED,
      data: {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        violation,
      },
      detectedAt: new Date(),
    };
  }

  private generateRecommendedActions(
    incidents: SecurityIncident[],
    riskProfile: TransactionRiskProfile
  ): string[] {
    const actions: string[] = [];

    if (riskProfile.riskScore > 90) {
      actions.push('Bloquear transação imediatamente');
      actions.push('Congelar conta temporariamente');
    } else if (riskProfile.riskScore > 70) {
      actions.push('Solicitar autenticação adicional');
      actions.push('Notificar usuário por SMS');
    } else if (riskProfile.riskScore > 50) {
      actions.push('Aumentar monitoramento da conta');
      actions.push('Solicitar confirmação por email');
    }

    // Ações específicas por tipo de incidente
    incidents.forEach(incident => {
      switch (incident.type) {
        case SecurityRuleType.GEOLOCATION_ANOMALY:
          actions.push('Verificar localização do dispositivo');
          break;
        case SecurityRuleType.MERCHANT_BLACKLIST:
          actions.push('Investigar merchant suspeito');
          break;
        case SecurityRuleType.VELOCITY_CHECK:
          actions.push('Implementar delay entre transações');
          break;
      }
    });

    return [...new Set(actions)]; // Remover duplicatas
  }

  private calculateConfidence(
    riskProfile: TransactionRiskProfile,
    incidents: SecurityIncident[]
  ): number {
    let confidence = 50; // Base

    // Aumentar confiança baseado no número de fatores de risco
    confidence += riskProfile.riskFactors.length * 10;

    // Aumentar confiança baseado na severidade dos incidentes
    incidents.forEach(incident => {
      switch (incident.severity) {
        case SecuritySeverity.CRITICAL:
          confidence += 20;
          break;
        case SecuritySeverity.HIGH:
          confidence += 15;
          break;
        case SecuritySeverity.MEDIUM:
          confidence += 10;
          break;
        case SecuritySeverity.LOW:
          confidence += 5;
          break;
      }
    });

    return Math.min(100, Math.max(0, confidence));
  }

  // =====================================================
  // GERENCIAMENTO DE INCIDENTES
  // =====================================================

  getActiveIncidents(): SecurityIncident[] {
    return this.incidents.filter(i => 
      i.status === IncidentStatus.DETECTED || i.status === IncidentStatus.INVESTIGATING
    );
  }

  investigateIncident(incidentId: string, investigator: string): boolean {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return false;

    incident.status = IncidentStatus.INVESTIGATING;
    incident.investigatedBy = investigator;
    
    return true;
  }

  resolveIncident(incidentId: string, resolution: string, isFalsePositive: boolean = false): boolean {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return false;

    incident.status = isFalsePositive ? IncidentStatus.FALSE_POSITIVE : IncidentStatus.RESOLVED;
    incident.resolution = resolution;
    incident.resolvedAt = new Date();
    incident.falsePositive = isFalsePositive;
    
    return true;
  }

  getSecurityMetrics(): SecurityMetrics {
    const totalIncidents = this.incidents.length;
    const activeIncidents = this.incidents.filter(i => 
      i.status === IncidentStatus.DETECTED || i.status === IncidentStatus.INVESTIGATING
    ).length;
    const resolvedIncidents = this.incidents.filter(i => 
      i.status === IncidentStatus.RESOLVED
    ).length;
    const falsePositives = this.incidents.filter(i => 
      i.status === IncidentStatus.FALSE_POSITIVE
    ).length;

    const incidentsByType = Object.values(SecurityRuleType).reduce((acc, type) => {
      acc[type] = this.incidents.filter(i => i.type === type).length;
      return acc;
    }, {} as Record<SecurityRuleType, number>);

    return {
      totalIncidents,
      activeIncidents,
      resolvedIncidents,
      falsePositives,
      averageResolutionTime: 0, // Implementar cálculo
      riskScoreDistribution: {}, // Implementar análise
      incidentsByType,
      monthlyTrends: [], // Implementar análise de tendências
    };
  }

  // =====================================================
  // CONFIGURAÇÃO E MANUTENÇÃO
  // =====================================================

  addSecurityRule(rule: Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newRule: SecurityRule = {
      ...rule,
      id: `security-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.securityRules.push(newRule);
    return newRule.id;
  }

  updateSecurityRule(ruleId: string, updates: Partial<SecurityRule>): boolean {
    const ruleIndex = this.securityRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    this.securityRules[ruleIndex] = {
      ...this.securityRules[ruleIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return true;
  }

  addToBlacklist(type: 'merchant' | 'ip', value: string): void {
    if (type === 'merchant') {
      this.blacklistedMerchants.add(value);
    } else if (type === 'ip') {
      this.suspiciousIPs.add(value);
    }
  }

  removeFromBlacklist(type: 'merchant' | 'ip', value: string): void {
    if (type === 'merchant') {
      this.blacklistedMerchants.delete(value);
    } else if (type === 'ip') {
      this.suspiciousIPs.delete(value);
    }
  }

  getSecurityRules(): SecurityRule[] {
    return [...this.securityRules];
  }
}

// =====================================================
// FACTORY E UTILITÁRIOS
// =====================================================

export class SecurityFactory {
  static createSecurityEngine(): AdvancedBankingSecurity {
    return new AdvancedBankingSecurity();
  }

  static createCustomSecurityRule(
    name: string,
    type: SecurityRuleType,
    conditions: SecurityCondition[],
    actions: SecurityAction[]
  ): Omit<SecurityRule, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name,
      description: `Regra personalizada: ${name}`,
      type,
      isActive: true,
      severity: SecuritySeverity.MEDIUM,
      conditions,
      actions,
    };
  }
}