/**
 * 🏦 SISTEMA DE CONCILIAÇÃO BANCÁRIA
 * 
 * Implementa funcionalidades para importação e conciliação de extratos bancários,
 * permitindo comparação automática entre registros internos e dados bancários.
 */

import type { Account, Transaction } from '@/types';
import { PrismaClient } from '@prisma/client';
import { auditLogger } from '@/lib/audit-logger';

// ===== INTERFACES =====

export interface BankStatement {
  id: string;
  accountId: string;
  bankCode: string;
  agencyCode: string;
  accountNumber: string;
  statementDate: string;
  initialBalance: number;
  finalBalance: number;
  transactions: BankTransaction[];
  importedAt: string;
  importedBy: string;
  status: 'PENDING' | 'RECONCILED' | 'DISCREPANCY';
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category?: string;
  documentNumber?: string;
  balance: number;
  bankReference: string;
}

export interface ReconciliationResult {
  id: string;
  statementId: string;
  accountId: string;
  reconciliationDate: string;
  status: 'MATCHED' | 'UNMATCHED' | 'DISCREPANCY';
  matchedTransactions: TransactionMatch[];
  unmatchedBankTransactions: BankTransaction[];
  unmatchedSystemTransactions: Transaction[];
  balanceDiscrepancy: number;
  summary: ReconciliationSummary;
}

export interface TransactionMatch {
  systemTransactionId: string;
  bankTransactionId: string;
  matchType: 'EXACT' | 'FUZZY' | 'MANUAL';
  matchScore: number;
  differences: string[];
}

export interface ReconciliationSummary {
  totalBankTransactions: number;
  totalSystemTransactions: number;
  matchedCount: number;
  unmatchedBankCount: number;
  unmatchedSystemCount: number;
  balanceDifference: number;
  reconciliationPercentage: number;
}

export interface ImportConfig {
  fileFormat: 'OFX' | 'CSV' | 'TXT' | 'PDF';
  bankCode: string;
  fieldMapping: Record<string, string>;
  dateFormat: string;
  decimalSeparator: '.' | ',';
  thousandsSeparator: '.' | ',' | '';
  encoding: 'UTF-8' | 'ISO-8859-1' | 'WINDOWS-1252';
}

// ===== CONFIGURAÇÕES DE BANCOS =====

export const BANK_CONFIGS: Record<string, ImportConfig> = {
  '001': { // Banco do Brasil
    fileFormat: 'OFX',
    bankCode: '001',
    fieldMapping: {
      date: 'DTPOSTED',
      amount: 'TRNAMT',
      description: 'MEMO',
      type: 'TRNTYPE',
      reference: 'FITID',
    },
    dateFormat: 'YYYYMMDD',
    decimalSeparator: '.',
    thousandsSeparator: '',
    encoding: 'UTF-8',
  },
  '104': { // Caixa Econômica Federal
    fileFormat: 'CSV',
    bankCode: '104',
    fieldMapping: {
      date: 'Data',
      amount: 'Valor',
      description: 'Descrição',
      type: 'Tipo',
      balance: 'Saldo',
    },
    dateFormat: 'DD/MM/YYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    encoding: 'ISO-8859-1',
  },
  '237': { // Bradesco
    fileFormat: 'TXT',
    bankCode: '237',
    fieldMapping: {
      date: 'data_movimento',
      amount: 'valor',
      description: 'historico',
      type: 'debito_credito',
      document: 'numero_documento',
    },
    dateFormat: 'DDMMYYYY',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    encoding: 'WINDOWS-1252',
  },
  '341': { // Itaú
    fileFormat: 'OFX',
    bankCode: '341',
    fieldMapping: {
      date: 'DTPOSTED',
      amount: 'TRNAMT',
      description: 'MEMO',
      type: 'TRNTYPE',
      reference: 'FITID',
    },
    dateFormat: 'YYYYMMDD',
    decimalSeparator: '.',
    thousandsSeparator: '',
    encoding: 'UTF-8',
  },
};

// ===== SISTEMA DE CONCILIAÇÃO =====

export class BankReconciliationSystem {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Importar extrato bancário
   */
  async importBankStatement(
    file: File | Buffer,
    accountId: string,
    bankCode: string,
    userId: string
  ): Promise<{ success: boolean; statement?: BankStatement; error?: string }> {
    try {
      const config = BANK_CONFIGS[bankCode];
      if (!config) {
        return { success: false, error: `Configuração não encontrada para banco: ${bankCode}` };
      }

      // Processar arquivo baseado no formato
      let transactions: BankTransaction[];
      let initialBalance: number;
      let finalBalance: number;

      switch (config.fileFormat) {
        case 'OFX':
          ({ transactions, initialBalance, finalBalance } = await this.parseOFXFile(file, config));
          break;
        case 'CSV':
          ({ transactions, initialBalance, finalBalance } = await this.parseCSVFile(file, config));
          break;
        case 'TXT':
          ({ transactions, initialBalance, finalBalance } = await this.parseTXTFile(file, config));
          break;
        default:
          return { success: false, error: `Formato de arquivo não suportado: ${config.fileFormat}` };
      }

      // Criar registro do extrato
      const statement: BankStatement = {
        id: this.generateId(),
        accountId,
        bankCode,
        agencyCode: '', // Seria extraído do arquivo
        accountNumber: '', // Seria extraído do arquivo
        statementDate: new Date().toISOString(),
        initialBalance,
        finalBalance,
        transactions,
        importedAt: new Date().toISOString(),
        importedBy: userId,
        status: 'PENDING',
      };

      // Salvar no banco de dados (seria necessário criar tabela BankStatement)
      // await this.saveBankStatement(statement);

      await auditLogger.log({
        action: 'BANK_STATEMENT_IMPORTED',
        userId,
        details: {
          accountId,
          bankCode,
          transactionsCount: transactions.length,
          initialBalance,
          finalBalance,
        },
        severity: 'medium',
      });

      return { success: true, statement };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao importar extrato bancário',
      };
    }
  }

  /**
   * Executar conciliação bancária
   */
  async performReconciliation(
    statementId: string,
    accountId: string,
    userId: string
  ): Promise<{ success: boolean; result?: ReconciliationResult; error?: string }> {
    try {
      // Buscar extrato bancário
      const statement = await this.getBankStatement(statementId);
      if (!statement) {
        return { success: false, error: 'Extrato bancário não encontrado' };
      }

      // Buscar transações do sistema para o período
      const systemTransactions = await this.getSystemTransactions(
        accountId,
        statement.transactions[0]?.date,
        statement.transactions[statement.transactions.length - 1]?.date
      );

      // Executar algoritmo de conciliação
      const matches = await this.matchTransactions(statement.transactions, systemTransactions);
      
      // Identificar transações não conciliadas
      const matchedBankIds = matches.map(m => m.bankTransactionId);
      const matchedSystemIds = matches.map(m => m.systemTransactionId);
      
      const unmatchedBankTransactions = statement.transactions.filter(
        t => !matchedBankIds.includes(t.id)
      );
      
      const unmatchedSystemTransactions = systemTransactions.filter(
        t => !matchedSystemIds.includes(t.id)
      );

      // Calcular discrepância de saldo
      const systemBalance = await this.calculateSystemBalance(accountId, statement.statementDate);
      const balanceDiscrepancy = statement.finalBalance - systemBalance;

      // Criar resultado da conciliação
      const result: ReconciliationResult = {
        id: this.generateId(),
        statementId,
        accountId,
        reconciliationDate: new Date().toISOString(),
        status: this.determineReconciliationStatus(matches, unmatchedBankTransactions, unmatchedSystemTransactions, balanceDiscrepancy),
        matchedTransactions: matches,
        unmatchedBankTransactions,
        unmatchedSystemTransactions,
        balanceDiscrepancy,
        summary: {
          totalBankTransactions: statement.transactions.length,
          totalSystemTransactions: systemTransactions.length,
          matchedCount: matches.length,
          unmatchedBankCount: unmatchedBankTransactions.length,
          unmatchedSystemCount: unmatchedSystemTransactions.length,
          balanceDifference: balanceDiscrepancy,
          reconciliationPercentage: (matches.length / Math.max(statement.transactions.length, systemTransactions.length)) * 100,
        },
      };

      // Salvar resultado da conciliação
      // await this.saveReconciliationResult(result);

      await auditLogger.log({
        action: 'BANK_RECONCILIATION_PERFORMED',
        userId,
        details: {
          statementId,
          accountId,
          matchedCount: matches.length,
          unmatchedBankCount: unmatchedBankTransactions.length,
          unmatchedSystemCount: unmatchedSystemTransactions.length,
          balanceDiscrepancy,
          reconciliationPercentage: result.summary.reconciliationPercentage,
        },
        severity: 'high',
      });

      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao executar conciliação bancária',
      };
    }
  }

  /**
   * Algoritmo de matching de transações
   */
  private async matchTransactions(
    bankTransactions: BankTransaction[],
    systemTransactions: Transaction[]
  ): Promise<TransactionMatch[]> {
    const matches: TransactionMatch[] = [];
    const usedSystemTransactions = new Set<string>();

    for (const bankTx of bankTransactions) {
      let bestMatch: { transaction: Transaction; score: number; differences: string[] } | null = null;

      for (const systemTx of systemTransactions) {
        if (usedSystemTransactions.has(systemTx.id)) continue;

        const matchResult = this.calculateMatchScore(bankTx, systemTx);
        
        if (matchResult.score > 0.8 && (!bestMatch || matchResult.score > bestMatch.score)) {
          bestMatch = {
            transaction: systemTx,
            score: matchResult.score,
            differences: matchResult.differences,
          };
        }
      }

      if (bestMatch && bestMatch.score > 0.8) {
        matches.push({
          systemTransactionId: bestMatch.transaction.id,
          bankTransactionId: bankTx.id,
          matchType: bestMatch.score === 1.0 ? 'EXACT' : 'FUZZY',
          matchScore: bestMatch.score,
          differences: bestMatch.differences,
        });
        usedSystemTransactions.add(bestMatch.transaction.id);
      }
    }

    return matches;
  }

  /**
   * Calcular score de compatibilidade entre transações
   */
  private calculateMatchScore(
    bankTx: BankTransaction,
    systemTx: Transaction
  ): { score: number; differences: string[] } {
    let score = 0;
    const differences: string[] = [];
    const weights = {
      amount: 0.4,
      date: 0.3,
      description: 0.2,
      type: 0.1,
    };

    // Comparar valor
    if (Math.abs(bankTx.amount - Math.abs(systemTx.amount)) < 0.01) {
      score += weights.amount;
    } else {
      differences.push(`Valor: Banco R$ ${bankTx.amount.toFixed(2)} vs Sistema R$ ${systemTx.amount.toFixed(2)}`);
    }

    // Comparar data (tolerância de 3 dias)
    const bankDate = new Date(bankTx.date);
    const systemDate = new Date(systemTx.date);
    const daysDiff = Math.abs((bankDate.getTime() - systemDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 3) {
      score += weights.date * (1 - daysDiff / 3);
    } else {
      differences.push(`Data: Banco ${bankTx.date} vs Sistema ${systemTx.date}`);
    }

    // Comparar descrição (similaridade de texto)
    const descriptionSimilarity = this.calculateStringSimilarity(
      bankTx.description.toLowerCase(),
      systemTx.description.toLowerCase()
    );
    score += weights.description * descriptionSimilarity;
    
    if (descriptionSimilarity < 0.5) {
      differences.push(`Descrição: Banco "${bankTx.description}" vs Sistema "${systemTx.description}"`);
    }

    // Comparar tipo
    const bankType = bankTx.type === 'CREDIT' ? 'income' : 'expense';
    if (bankType === systemTx.type) {
      score += weights.type;
    } else {
      differences.push(`Tipo: Banco ${bankTx.type} vs Sistema ${systemTx.type}`);
    }

    return { score: Math.min(score, 1.0), differences };
  }

  /**
   * Calcular similaridade entre strings
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calcular distância de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Parsers para diferentes formatos de arquivo
   */
  private async parseOFXFile(file: File | Buffer, config: ImportConfig): Promise<{
    transactions: BankTransaction[];
    initialBalance: number;
    finalBalance: number;
  }> {
    // Implementação do parser OFX seria feita aqui
    // Por enquanto, retorna dados mock
    return {
      transactions: [],
      initialBalance: 0,
      finalBalance: 0,
    };
  }

  private async parseCSVFile(file: File | Buffer, config: ImportConfig): Promise<{
    transactions: BankTransaction[];
    initialBalance: number;
    finalBalance: number;
  }> {
    // Implementação do parser CSV seria feita aqui
    return {
      transactions: [],
      initialBalance: 0,
      finalBalance: 0,
    };
  }

  private async parseTXTFile(file: File | Buffer, config: ImportConfig): Promise<{
    transactions: BankTransaction[];
    initialBalance: number;
    finalBalance: number;
  }> {
    // Implementação do parser TXT seria feita aqui
    return {
      transactions: [],
      initialBalance: 0,
      finalBalance: 0,
    };
  }

  // Métodos auxiliares
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async getBankStatement(statementId: string): Promise<BankStatement | null> {
    // Implementação seria feita aqui
    return null;
  }

  private async getSystemTransactions(accountId: string, startDate: string, endDate: string): Promise<Transaction[]> {
    // Implementação seria feita aqui
    return [];
  }

  private async calculateSystemBalance(accountId: string, date: string): Promise<number> {
    // Implementação seria feita aqui
    return 0;
  }

  private determineReconciliationStatus(
    matches: TransactionMatch[],
    unmatchedBank: BankTransaction[],
    unmatchedSystem: Transaction[],
    balanceDiscrepancy: number
  ): 'MATCHED' | 'UNMATCHED' | 'DISCREPANCY' {
    if (Math.abs(balanceDiscrepancy) > 0.01) {
      return 'DISCREPANCY';
    }
    
    if (unmatchedBank.length === 0 && unmatchedSystem.length === 0) {
      return 'MATCHED';
    }
    
    return 'UNMATCHED';
  }
}

export default BankReconciliationSystem;