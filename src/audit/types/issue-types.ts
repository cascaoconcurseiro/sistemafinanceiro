/**
 * Tipos para issues e recomendações do sistema de auditoria
 */

import { IssueSeverity, IssueCategory, Priority, CodeLocation } from './audit-types';

export interface Issue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  location: CodeLocation;
  impact: string;
  solution: string;
  codeExample?: string;
  estimatedEffort: number; // hours
  tags: string[];
  detectedAt: Date;
  confidence: number; // 0-100, confidence in the detection
}

export interface Recommendation {
  id: string;
  priority: Priority;
  category: string;
  title: string;
  description: string;
  benefits: string[];
  implementation: string;
  estimatedTime: string;
  prerequisites: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  businessValue: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SecurityIssue extends Issue {
  vulnerabilityType: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_EXPOSURE' | 'INJECTION' | 'CONFIGURATION';
  cvssScore?: number;
  exploitability: 'LOW' | 'MEDIUM' | 'HIGH';
  dataAtRisk: string[];
}

export interface PerformanceIssue extends Issue {
  performanceImpact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'SEVERE';
  measurementData: PerformanceMeasurement;
  optimizationPotential: number; // percentage improvement possible
}

export interface QualityIssue extends Issue {
  qualityMetric: 'MAINTAINABILITY' | 'READABILITY' | 'COMPLEXITY' | 'DUPLICATION' | 'CONSISTENCY';
  technicalDebt: number; // hours
  maintenanceImpact: string;
}

export interface IntegrityIssue extends Issue {
  dataIntegrityType: 'CONSISTENCY' | 'ACCURACY' | 'COMPLETENESS' | 'VALIDITY';
  affectedData: string[];
  businessImpact: string;
  dataLossRisk: boolean;
}

export interface StressTestIssue extends Issue {
  loadCondition: LoadCondition;
  failureMode: 'TIMEOUT' | 'MEMORY_LEAK' | 'CRASH' | 'DEGRADATION' | 'DATA_CORRUPTION';
  recoveryTime: number; // seconds
  userImpact: string;
}

// Supporting interfaces
export interface PerformanceMeasurement {
  metric: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  measurementMethod: string;
  sampleSize: number;
}

export interface LoadCondition {
  concurrentUsers: number;
  transactionVolume: number;
  duration: number; // seconds
  resourceUtilization: ResourceUtilization;
}

export interface ResourceUtilization {
  cpu: number; // percentage
  memory: number; // MB
  disk: number; // MB
  network: number; // MB/s
}

// Factory functions for creating specific issue types
export class IssueFactory {
  static createSecurityIssue(
    title: string,
    description: string,
    location: CodeLocation,
    vulnerabilityType: SecurityIssue['vulnerabilityType'],
    severity: IssueSeverity = IssueSeverity.HIGH
  ): SecurityIssue {
    return {
      id: this.generateId(),
      category: IssueCategory.SECURITY,
      severity,
      title,
      description,
      location,
      impact: this.getSecurityImpact(vulnerabilityType, severity),
      solution: '',
      estimatedEffort: this.estimateSecurityEffort(vulnerabilityType, severity),
      tags: ['security', vulnerabilityType.toLowerCase()],
      detectedAt: new Date(),
      confidence: 95,
      vulnerabilityType,
      exploitability: this.getExploitability(vulnerabilityType),
      dataAtRisk: []
    };
  }

  static createPerformanceIssue(
    title: string,
    description: string,
    location: CodeLocation,
    measurement: PerformanceMeasurement,
    severity: IssueSeverity = IssueSeverity.MEDIUM
  ): PerformanceIssue {
    return {
      id: this.generateId(),
      category: IssueCategory.PERFORMANCE,
      severity,
      title,
      description,
      location,
      impact: this.getPerformanceImpact(measurement),
      solution: '',
      estimatedEffort: this.estimatePerformanceEffort(severity),
      tags: ['performance', measurement.metric.toLowerCase()],
      detectedAt: new Date(),
      confidence: 90,
      performanceImpact: this.getPerformanceImpactLevel(measurement),
      measurementData: measurement,
      optimizationPotential: this.calculateOptimizationPotential(measurement)
    };
  }

  static createQualityIssue(
    title: string,
    description: string,
    location: CodeLocation,
    qualityMetric: QualityIssue['qualityMetric'],
    severity: IssueSeverity = IssueSeverity.MEDIUM
  ): QualityIssue {
    return {
      id: this.generateId(),
      category: IssueCategory.QUALITY,
      severity,
      title,
      description,
      location,
      impact: this.getQualityImpact(qualityMetric),
      solution: '',
      estimatedEffort: this.estimateQualityEffort(qualityMetric, severity),
      tags: ['quality', qualityMetric.toLowerCase()],
      detectedAt: new Date(),
      confidence: 85,
      qualityMetric,
      technicalDebt: this.calculateTechnicalDebt(qualityMetric, severity),
      maintenanceImpact: this.getMaintenanceImpact(qualityMetric)
    };
  }

  private static generateId(): string {
    return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getSecurityImpact(type: SecurityIssue['vulnerabilityType'], severity: IssueSeverity): string {
    const impacts = {
      AUTHENTICATION: 'Compromisso de autenticação do sistema',
      AUTHORIZATION: 'Acesso não autorizado a dados',
      DATA_EXPOSURE: 'Exposição de dados sensíveis',
      INJECTION: 'Execução de código malicioso',
      CONFIGURATION: 'Configuração insegura do sistema'
    };
    return impacts[type] || 'Impacto de segurança não especificado';
  }

  private static getExploitability(type: SecurityIssue['vulnerabilityType']): SecurityIssue['exploitability'] {
    const exploitability = {
      AUTHENTICATION: 'HIGH' as const,
      AUTHORIZATION: 'HIGH' as const,
      DATA_EXPOSURE: 'MEDIUM' as const,
      INJECTION: 'HIGH' as const,
      CONFIGURATION: 'MEDIUM' as const
    };
    return exploitability[type] || 'MEDIUM';
  }

  private static estimateSecurityEffort(type: SecurityIssue['vulnerabilityType'], severity: IssueSeverity): number {
    const baseEffort = {
      AUTHENTICATION: 4,
      AUTHORIZATION: 6,
      DATA_EXPOSURE: 2,
      INJECTION: 8,
      CONFIGURATION: 1
    };
    
    const severityMultiplier = {
      [IssueSeverity.LOW]: 0.5,
      [IssueSeverity.MEDIUM]: 1,
      [IssueSeverity.HIGH]: 1.5,
      [IssueSeverity.CRITICAL]: 2
    };

    return (baseEffort[type] || 4) * severityMultiplier[severity];
  }

  private static getPerformanceImpact(measurement: PerformanceMeasurement): string {
    const ratio = measurement.currentValue / measurement.targetValue;
    if (ratio > 2) return 'Impacto severo na experiência do usuário';
    if (ratio > 1.5) return 'Impacto significativo na performance';
    if (ratio > 1.2) return 'Impacto moderado na responsividade';
    return 'Impacto menor na performance';
  }

  private static getPerformanceImpactLevel(measurement: PerformanceMeasurement): PerformanceIssue['performanceImpact'] {
    const ratio = measurement.currentValue / measurement.targetValue;
    if (ratio > 2) return 'SEVERE';
    if (ratio > 1.5) return 'SIGNIFICANT';
    if (ratio > 1.2) return 'MODERATE';
    return 'MINOR';
  }

  private static calculateOptimizationPotential(measurement: PerformanceMeasurement): number {
    const ratio = measurement.currentValue / measurement.targetValue;
    return Math.min(Math.max((ratio - 1) * 100, 0), 90);
  }

  private static estimatePerformanceEffort(severity: IssueSeverity): number {
    const effortMap = {
      [IssueSeverity.LOW]: 2,
      [IssueSeverity.MEDIUM]: 4,
      [IssueSeverity.HIGH]: 8,
      [IssueSeverity.CRITICAL]: 16
    };
    return effortMap[severity];
  }

  private static getQualityImpact(metric: QualityIssue['qualityMetric']): string {
    const impacts = {
      MAINTAINABILITY: 'Dificuldade de manutenção e evolução do código',
      READABILITY: 'Redução da produtividade da equipe',
      COMPLEXITY: 'Aumento do risco de bugs e dificuldade de testes',
      DUPLICATION: 'Inconsistências e dificuldade de manutenção',
      CONSISTENCY: 'Confusão e erros de desenvolvimento'
    };
    return impacts[metric] || 'Impacto na qualidade do código';
  }

  private static estimateQualityEffort(metric: QualityIssue['qualityMetric'], severity: IssueSeverity): number {
    const baseEffort = {
      MAINTAINABILITY: 8,
      READABILITY: 4,
      COMPLEXITY: 12,
      DUPLICATION: 6,
      CONSISTENCY: 2
    };

    const severityMultiplier = {
      [IssueSeverity.LOW]: 0.5,
      [IssueSeverity.MEDIUM]: 1,
      [IssueSeverity.HIGH]: 1.5,
      [IssueSeverity.CRITICAL]: 2
    };

    return (baseEffort[metric] || 6) * severityMultiplier[severity];
  }

  private static calculateTechnicalDebt(metric: QualityIssue['qualityMetric'], severity: IssueSeverity): number {
    const baseDebt = {
      MAINTAINABILITY: 20,
      READABILITY: 10,
      COMPLEXITY: 30,
      DUPLICATION: 15,
      CONSISTENCY: 5
    };

    const severityMultiplier = {
      [IssueSeverity.LOW]: 0.5,
      [IssueSeverity.MEDIUM]: 1,
      [IssueSeverity.HIGH]: 2,
      [IssueSeverity.CRITICAL]: 4
    };

    return (baseDebt[metric] || 15) * severityMultiplier[severity];
  }

  private static getMaintenanceImpact(metric: QualityIssue['qualityMetric']): string {
    const impacts = {
      MAINTAINABILITY: 'Alto impacto na velocidade de desenvolvimento',
      READABILITY: 'Dificuldade de onboarding e code review',
      COMPLEXITY: 'Aumento significativo do tempo de debugging',
      DUPLICATION: 'Risco de inconsistências em mudanças',
      CONSISTENCY: 'Confusão e erros frequentes'
    };
    return impacts[metric] || 'Impacto na manutenção do código';
  }
}