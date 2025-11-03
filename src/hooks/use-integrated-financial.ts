/**
 * Hook para usar o IntegratedFinancialService com o contexto do usuário
 * Wrapper que facilita o uso dos novos serviços no frontend
 */

import { useSession } from 'next-auth/react';
import { IntegratedFinancialService } from '@/lib/services/integrated-financial-service';
import { useUnifiedFinancial } from '@/contexts/unified-financial-context';

export function useIntegratedFinancial() {
  const { data: session } = useSession();
  const { actions } = useUnifiedFinancial();

  const userId = session?.user?.id || '';
  const userEmail = session?.user?.email || '';

  return {
    // ✅ Transações com idempotência e validações
    createTransaction: async (data: any) => {
      const result = await IntegratedFinancialService.createTransaction(
        data,
        userId,
        userEmail
      );
      // Refresh do contexto
      await actions.forceRefresh();
      return result;
    },

    updateTransaction: async (transactionId: string, data: any) => {
      const result = await IntegratedFinancialService.updateTransaction(
        transactionId,
        data,
        userId,
        userEmail
      );
      await actions.forceRefresh();
      return result;
    },

    deleteTransaction: async (transactionId: string) => {
      const result = await IntegratedFinancialService.deleteTransaction(
        transactionId,
        userId,
        userEmail
      );
      await actions.forceRefresh();
      return result;
    },

    // ✅ Transferências atômicas
    createTransfer: async (data: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      description: string;
      date: Date;
    }) => {
      const result = await IntegratedFinancialService.createTransfer({
        ...data,
        userId,
        userEmail
      });
      await actions.forceRefresh();
      return result;
    },

    cancelTransfer: async (transferId: string) => {
      const result = await IntegratedFinancialService.cancelTransfer(
        transferId,
        userId,
        userEmail
      );
      await actions.forceRefresh();
      return result;
    },

    // ✅ Faturas automáticas
    payInvoice: async (invoiceId: string, accountId: string) => {
      const result = await IntegratedFinancialService.payInvoice(
        invoiceId,
        accountId,
        userId,
        userEmail
      );
      await actions.forceRefresh();
      return result;
    },

    payInvoicePartial: async (
      invoiceId: string,
      accountId: string,
      amount: number
    ) => {
      const result = await IntegratedFinancialService.payInvoicePartial(
        invoiceId,
        accountId,
        amount,
        userId,
        userEmail
      );
      await actions.forceRefresh();
      return result;
    },

    // ✅ Fluxo de caixa e projeções
    getProjectedBalance: async (accountId: string, targetDate: Date) => {
      return await IntegratedFinancialService.getProjectedBalance(
        userId,
        accountId,
        targetDate
      );
    },

    getMonthlyCashFlow: async (
      accountId: string,
      month: number,
      year: number
    ) => {
      return await IntegratedFinancialService.getMonthlyCashFlow(
        userId,
        accountId,
        month,
        year
      );
    },

    // ✅ Histórico de saldos
    getBalanceAtDate: async (accountId: string, date: Date) => {
      return await IntegratedFinancialService.getBalanceAtDate(accountId, date);
    },

    getBalanceEvolution: async (
      accountId: string,
      startDate: Date,
      endDate: Date
    ) => {
      return await IntegratedFinancialService.getBalanceEvolution(
        accountId,
        startDate,
        endDate
      );
    },

    // ✅ Conciliação bancária
    startReconciliation: async (accountId: string, bankBalance: number) => {
      return await IntegratedFinancialService.startReconciliation(
        accountId,
        userId,
        bankBalance
      );
    },

    completeReconciliation: async (
      reconciliationId: string,
      notes?: string
    ) => {
      const result = await IntegratedFinancialService.completeReconciliation(
        reconciliationId,
        userId,
        userEmail,
        notes
      );
      await actions.forceRefresh();
      return result;
    },

    // ✅ Relatórios profissionais
    generateDRE: async (startDate: Date, endDate: Date) => {
      return await IntegratedFinancialService.generateDRE(
        userId,
        startDate,
        endDate
      );
    },

    generateBalanceSheet: async () => {
      return await IntegratedFinancialService.generateBalanceSheet(userId);
    },

    analyzeCategories: async (startDate: Date, endDate: Date) => {
      return await IntegratedFinancialService.analyzeCategories(
        userId,
        startDate,
        endDate
      );
    },

    analyzeTrends: async (months: number = 3) => {
      return await IntegratedFinancialService.analyzeTrends(userId, months);
    },

    // ✅ Sistema de eventos
    processEvents: async () => {
      return await IntegratedFinancialService.processEvents();
    },

    // ✅ Verificar duplicatas
    checkDuplicate: async (
      amount: number,
      description: string,
      date: Date
    ) => {
      return await IntegratedFinancialService.checkDuplicate(
        userId,
        amount,
        description,
        date
      );
    },

    // Informações do usuário
    user: {
      id: userId,
      email: userEmail
    }
  };
}
