'use client';

import { PrismaClient } from '@prisma/client';
import { auditLogger } from '@/lib/audit-logger';

// Interfaces para o sistema de partidas dobradas
export interface AccountingEntry {
  id: string;
  transactionId: string;
  batchId: string; // Para agrupar lançamentos da mesma operação
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  complement?: string;
  date: string;
  documentNumber?: string;
  documentType?: string;
  costCenter?: string;
  createdAt: string;
  createdBy: string;
  status: 'PROVISORIO' | 'DEFINITIVO' | 'CANCELADO';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TrialBalance {
  period: { start: string; end: string };
  accounts: Record<string, {
    code: string;
    name: string;
    type: string;
    previousBalance: number;
    debitMovements: number;
    creditMovements: number;
    currentBalance: number;
    nature: 'DEVEDORA' | 'CREDORA';
  }>;
  totals: {
    previousBalance: number;
    debitMovements: number;
    creditMovements: number;
    currentBalance: number;
  };
  isBalanced: boolean;
  generatedAt: string;
}

// Plano de Contas Estruturado
export interface ChartOfAccounts {
  code: string;
  name: string;
  type: 'ATIVO' | 'PASSIVO' | 'PATRIMONIO_LIQUIDO' | 'RECEITA' | 'DESPESA';
  subtype: string;
  level: number;
  parent?: string;
  isActive: boolean;
  acceptsLaunches: boolean;
  nature: 'DEVEDORA' | 'CREDORA';
}

class DoubleEntrySystem {
  private prisma: PrismaClient;
  private chartOfAccounts: ChartOfAccounts[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeChartOfAccounts();
  }

  // Inicializar Plano de Contas padrão
  private initializeChartOfAccounts() {
    this.chartOfAccounts = [
      // ATIVO
      {
        code: '1.1.1.001',
        name: 'CAIXA',
        type: 'ATIVO',
        subtype: 'DISPONIBILIDADES',
        level: 4,
        parent: '1.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'DEVEDORA',
      },
      {
        code: '1.1.1.002',
        name: 'BANCOS CONTA CORRENTE',
        type: 'ATIVO',
        subtype: 'DISPONIBILIDADES',
        level: 4,
        parent: '1.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'DEVEDORA',
      },
      {
        code: '1.1.1.003',
        name: 'BANCOS CONTA POUPANÇA',
        type: 'ATIVO',
        subtype: 'DISPONIBILIDADES',
        level: 4,
        parent: '1.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'DEVEDORA',
      },
      {
        code: '1.1.1.004',
        name: 'APLICAÇÕES FINANCEIRAS',
        type: 'ATIVO',
        subtype: 'DISPONIBILIDADES',
        level: 4,
        parent: '1.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'DEVEDORA',
      },

      // PASSIVO
      {
        code: '2.1.1.001',
        name: 'CARTÃO DE CRÉDITO',
        type: 'PASSIVO',
        subtype: 'OBRIGAÇÕES',
        level: 4,
        parent: '2.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'CREDORA',
      },
      {
        code: '2.1.1.002',
        name: 'EMPRÉSTIMOS',
        type: 'PASSIVO',
        subtype: 'OBRIGAÇÕES',
        level: 4,
        parent: '2.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'CREDORA',
      },

      // RECEITAS
      {
        code: '4.1.1.001',
        name: 'RECEITAS OPERACIONAIS',
        type: 'RECEITA',
        subtype: 'RECEITAS',
        level: 4,
        parent: '4.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'CREDORA',
      },

      // DESPESAS
      {
        code: '5.1.1.001',
        name: 'DESPESAS OPERACIONAIS',
        type: 'DESPESA',
        subtype: 'DESPESAS',
        level: 4,
        parent: '5.1.1',
        isActive: true,
        acceptsLaunches: true,
        nature: 'DEVEDORA',
      },
    ];
  }

  // Criar lançamento contábil por partidas dobradas
  async createDoubleEntry(
    transactionId: string,
    amount: number,
    description: string,
    accountType: string,
    transactionType: 'income' | 'expense' | 'transfer',
    userId: string,
    contraAccount?: string
  ): Promise<{ success: boolean; entries?: AccountingEntry[]; error?: string }> {
    try {
      const batchId = this.generateId();
      const entries: AccountingEntry[] = [];

      // Determinar contas contábeis baseadas no tipo de conta e transação
      const accountMapping = this.getAccountMapping(accountType, transactionType);
      
      if (!accountMapping) {
        return {
          success: false,
          error: `Mapeamento contábil não encontrado para tipo: ${accountType}, transação: ${transactionType}`,
        };
      }

      // Criar entrada principal
      const mainEntry: AccountingEntry = {
        id: this.generateId(),
        transactionId,
        batchId,
        accountCode: accountMapping.main.code,
        accountName: accountMapping.main.name,
        debit: accountMapping.main.debit ? amount : 0,
        credit: accountMapping.main.credit ? amount : 0,
        description,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: userId,
        status: 'DEFINITIVO',
      };
      entries.push(mainEntry);

      // Criar entrada de contrapartida
      const contraEntry: AccountingEntry = {
        id: this.generateId(),
        transactionId,
        batchId,
        accountCode: accountMapping.contra.code,
        accountName: accountMapping.contra.name,
        debit: accountMapping.contra.debit ? amount : 0,
        credit: accountMapping.contra.credit ? amount : 0,
        description,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: userId,
        status: 'DEFINITIVO',
      };
      entries.push(contraEntry);

      // Validar partidas dobradas
      const validation = this.validateDoubleEntry(entries);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validação falhou: ${validation.errors.join(', ')}`,
        };
      }

      // Salvar no banco de dados (seria necessário criar tabela AccountingEntry)
      // await this.saveAccountingEntries(entries);

      await auditLogger.log({
        action: 'DOUBLE_ENTRY_CREATED',
        userId,
        details: {
          transactionId,
          batchId,
          entriesCount: entries.length,
          totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
          totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
        },
        severity: 'medium',
      });

      return { success: true, entries };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar lançamento contábil',
      };
    }
  }

  // Mapear tipos de conta para contas contábeis
  private getAccountMapping(accountType: string, transactionType: string) {
    const mappings: Record<string, Record<string, any>> = {
      checking: {
        income: {
          main: { code: '1.1.1.002', name: 'BANCOS CONTA CORRENTE', debit: true, credit: false },
          contra: { code: '4.1.1.001', name: 'RECEITAS OPERACIONAIS', debit: false, credit: true },
        },
        expense: {
          main: { code: '5.1.1.001', name: 'DESPESAS OPERACIONAIS', debit: true, credit: false },
          contra: { code: '1.1.1.002', name: 'BANCOS CONTA CORRENTE', debit: false, credit: true },
        },
      },
      savings: {
        income: {
          main: { code: '1.1.1.003', name: 'BANCOS CONTA POUPANÇA', debit: true, credit: false },
          contra: { code: '4.1.1.001', name: 'RECEITAS OPERACIONAIS', debit: false, credit: true },
        },
        expense: {
          main: { code: '5.1.1.001', name: 'DESPESAS OPERACIONAIS', debit: true, credit: false },
          contra: { code: '1.1.1.003', name: 'BANCOS CONTA POUPANÇA', debit: false, credit: true },
        },
      },
      credit: {
        expense: {
          main: { code: '5.1.1.001', name: 'DESPESAS OPERACIONAIS', debit: true, credit: false },
          contra: { code: '2.1.1.001', name: 'CARTÃO DE CRÉDITO', debit: false, credit: true },
        },
        income: {
          main: { code: '2.1.1.001', name: 'CARTÃO DE CRÉDITO', debit: true, credit: false },
          contra: { code: '4.1.1.001', name: 'RECEITAS OPERACIONAIS', debit: false, credit: true },
        },
      },
    };

    return mappings[accountType]?.[transactionType];
  }

  // Validar lançamento por partidas dobradas
  validateDoubleEntry(entries: AccountingEntry[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Deve ter pelo menos 2 lançamentos
    if (entries.length < 2) {
      errors.push('Lançamento deve ter pelo menos 2 entradas');
    }

    // Calcular totais
    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);

    // Débitos devem ser iguais aos créditos
    const tolerance = 0.01;
    if (Math.abs(totalDebits - totalCredits) > tolerance) {
      errors.push(
        `Total de débitos (${totalDebits.toFixed(2)}) deve ser igual ao total de créditos (${totalCredits.toFixed(2)})`
      );
    }

    // Cada entrada deve ter apenas débito OU crédito
    entries.forEach((entry, index) => {
      if (entry.debit > 0 && entry.credit > 0) {
        errors.push(`Entrada ${index + 1} não pode ter débito e crédito simultaneamente`);
      }
      if (entry.debit === 0 && entry.credit === 0) {
        errors.push(`Entrada ${index + 1} deve ter débito ou crédito`);
      }
      if (entry.debit < 0 || entry.credit < 0) {
        errors.push(`Entrada ${index + 1} não pode ter valores negativos`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Gerar balancete
  async generateTrialBalance(startDate: string, endDate: string): Promise<TrialBalance> {
    // Implementação do balancete seria feita aqui
    // Por enquanto, retorna estrutura básica
    return {
      period: { start: startDate, end: endDate },
      accounts: {},
      totals: {
        previousBalance: 0,
        debitMovements: 0,
        creditMovements: 0,
        currentBalance: 0,
      },
      isBalanced: true,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Salvar entradas contábeis (seria necessário implementar tabela no Prisma)
  private async saveAccountingEntries(entries: AccountingEntry[]): Promise<void> {
    // Implementação seria feita aqui quando a tabela AccountingEntry for criada
    console.log('Salvando entradas contábeis:', entries);
  }
}

export { DoubleEntrySystem };