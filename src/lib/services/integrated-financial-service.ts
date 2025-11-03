/**
 * Serviço Integrado de Operações Financeiras
 * Centraliza todos os novos serviços para uso no frontend
 */

import { IdempotencyService } from './idempotency-service';
import { TransferService } from './transfer-service';
import { InvoiceService } from './invoice-service';
import { CashFlowService } from './cash-flow-service';
import { AccountHistoryService } from './account-history-service';
import { ReconciliationService } from './reconciliation-service';
import { ReportService } from './report-service';
import { EventService } from './event-service';
import { TemporalValidationService } from './temporal-validation-service';
import { FinancialOperationsService } from './financial-operations-service';
import { v4 as uuidv4 } from 'uuid';

export class IntegratedFinancialService {
  /**
   * Criar transação com idempotência e validações
   */
  static async createTransaction(data: any, userId: string, userEmail: string) {
    // Gerar UUID único para idempotência
    const operationUuid = uuidv4();

    // Validar temporalmente
    await TemporalValidationService.validateTransaction({
      ...data,
      userId
    });

    // Criar transação com idempotência
    const result = await FinancialOperationsService.createTransaction({
      transaction: data,
      operationUuid,
      createdBy: userEmail
    });

    // Emitir evento
    await EventService.emit(
      'transaction_created',
      'transaction',
      result.transaction.id,
      { amount: data.amount, type: data.type },
      userId
    );

    return result;
  }

  /**
   * Atualizar transação com validações
   */
  static async updateTransaction(
    transactionId: string,
    data: any,
    userId: string,
    userEmail: string
  ) {
    // Validar temporalmente
    await TemporalValidationService.validateTransaction({
      ...data,
      userId
    });

    // Atualizar transação
    const result = await FinancialOperationsService.updateTransaction(
      transactionId,
      data,
      userEmail
    );

    // Emitir evento
    await EventService.emit(
      'transaction_updated',
      'transaction',
      transactionId,
      { changes: data },
      userId
    );

    return result;
  }

  /**
   * Deletar transação
   */
  static async deleteTransaction(
    transactionId: string,
    userId: string,
    userEmail: string
  ) {
    const result = await FinancialOperationsService.deleteTransaction(
      transactionId,
      userEmail
    );

    // Emitir evento
    await EventService.emit(
      'transaction_deleted',
      'transaction',
      transactionId,
      {},
      userId
    );

    return result;
  }

  /**
   * Criar transferência atômica
   */
  static async createTransfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    date: Date;
    userId: string;
    userEmail: string;
  }) {
    const { userEmail, ...transferData } = data;

    const result = await TransferService.createTransfer(transferData);

    // Emitir evento
    await EventService.emit(
      'transfer_created',
      'transfer',
      result.transfer.id,
      { amount: data.amount },
      data.userId
    );

    return result;
  }

  /**
   * Cancelar transferência
   */
  static async cancelTransfer(
    transferId: string,
    userId: string,
    userEmail: string
  ) {
    const result = await TransferService.cancelTransfer(transferId, userEmail);

    // Emitir evento
    await EventService.emit(
      'transfer_cancelled',
      'transfer',
      transferId,
      {},
      userId
    );

    return result;
  }

  /**
   * Pagar fatura (cria próxima automaticamente)
   */
  static async payInvoice(
    invoiceId: string,
    accountId: string,
    userId: string,
    userEmail: string
  ) {
    const result = await InvoiceService.payInvoice(
      invoiceId,
      accountId,
      userId
    );

    // Emitir evento
    await EventService.emit(
      'invoice_paid',
      'invoice',
      invoiceId,
      { accountId, nextInvoiceId: result.nextInvoice?.id },
      userId
    );

    return result;
  }

  /**
   * Pagar fatura parcialmente (rotativo)
   */
  static async payInvoicePartial(
    invoiceId: string,
    accountId: string,
    amount: number,
    userId: string,
    userEmail: string
  ) {
    const result = await InvoiceService.payInvoicePartial(
      invoiceId,
      accountId,
      amount,
      userId
    );

    // Emitir evento
    await EventService.emit(
      'invoice_partial_payment',
      'invoice',
      invoiceId,
      { accountId, amount },
      userId
    );

    return result;
  }

  /**
   * Calcular saldo projetado
   */
  static async getProjectedBalance(
    userId: string,
    accountId: string,
    targetDate: Date
  ) {
    return await CashFlowService.calculateProjectedBalance(
      userId,
      accountId,
      targetDate
    );
  }

  /**
   * Obter fluxo de caixa mensal
   */
  static async getMonthlyCashFlow(
    userId: string,
    accountId: string,
    month: number,
    year: number
  ) {
    return await CashFlowService.getMonthlyCashFlow(
      userId,
      accountId,
      month,
      year
    );
  }

  /**
   * Obter saldo em data específica
   */
  static async getBalanceAtDate(accountId: string, date: Date) {
    return await AccountHistoryService.getBalanceAtDate(accountId, date);
  }

  /**
   * Obter evolução de saldo
   */
  static async getBalanceEvolution(
    accountId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await AccountHistoryService.getBalanceEvolution(
      accountId,
      startDate,
      endDate
    );
  }

  /**
   * Iniciar conciliação bancária
   */
  static async startReconciliation(
    accountId: string,
    userId: string,
    bankBalance: number
  ) {
    return await ReconciliationService.startReconciliation(
      accountId,
      userId,
      bankBalance
    );
  }

  /**
   * Completar conciliação
   */
  static async completeReconciliation(
    reconciliationId: string,
    userId: string,
    userEmail: string,
    notes?: string
  ) {
    return await ReconciliationService.completeReconciliation(
      reconciliationId,
      userEmail,
      notes
    );
  }

  /**
   * Gerar DRE
   */
  static async generateDRE(userId: string, startDate: Date, endDate: Date) {
    return await ReportService.generateDRE(userId, startDate, endDate);
  }

  /**
   * Gerar Balanço Patrimonial
   */
  static async generateBalanceSheet(userId: string) {
    return await ReportService.generateBalanceSheet(userId);
  }

  /**
   * Analisar categorias
   */
  static async analyzeCategories(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await ReportService.analyzeCategories(userId, startDate, endDate);
  }

  /**
   * Analisar tendências
   */
  static async analyzeTrends(userId: string, months: number = 3) {
    return await ReportService.analyzeTrends(userId, months);
  }

  /**
   * Processar eventos pendentes
   */
  static async processEvents() {
    return await EventService.processPendingEvents();
  }

  /**
   * Verificar duplicatas
   */
  static async checkDuplicate(
    userId: string,
    amount: number,
    description: string,
    date: Date
  ) {
    return await IdempotencyService.checkDuplicate(
      userId,
      amount,
      description,
      date
    );
  }
}
