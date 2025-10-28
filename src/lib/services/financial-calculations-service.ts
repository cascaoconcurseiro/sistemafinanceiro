/**
 * 📊 FINANCIAL CALCULATIONS SERVICE - Cálculos Financeiros PROFISSIONAIS
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

type AccountType = 'ATIVO' | 'PASSIVO' | 'RECEITA' | 'DESPESA';

interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  totalDebits: number;
  totalCredits: number;
  calculatedBalance: number;
  storedBalance: number;
  difference: number;
  isReconciled: boolean;
}

interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalRevenue: number;
  totalExpenses: number;
  netWorth: number;
  netIncome: number;
  balanceSheetBalance: number;
}

export class FinancialCalculationsService {

  /**
   * Calcula saldo de uma conta baseado na sua natureza contábil
   */
  async calculateAccountBalance(accountId: string): Promise<AccountBalance> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        journalEntries: {
          include: {
            transaction: {
              where: { status: 'cleared' }
            }
          }
        }
      }
    });

    if (!account) {
      throw new Error(`Conta ${accountId} não encontrada`);
    }

    const validEntries = account.journalEntries.filter(entry => entry.transaction);

    const totalDebits = validEntries
      .filter(e => e.entryType === 'DEBITO')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const totalCredits = validEntries
      .filter(e => e.entryType === 'CREDITO')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    // Calcular saldo baseado na natureza da conta
    let calculatedBalance = 0;
    switch (account.type as AccountType) {
      case 'ATIVO':
        calculatedBalance = totalDebits - totalCredits;
        break;
      case 'PASSIVO':
        calculatedBalance = totalCredits - totalDebits;
        break;
      case 'RECEITA':
        calculatedBalance = totalCredits - totalDebits;
        break;
      case 'DESPESA':
        calculatedBalance = totalDebits - totalCredits;
        break;
    }

    const storedBalance = Number(account.balance);
    const difference = Math.abs(calculatedBalance - storedBalance);
    const isReconciled = difference <= 0.01;

    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type as AccountType,
      totalDebits,
      totalCredits,
      calculatedBalance,
      storedBalance,
      difference,
      isReconciled
    };
  }

  /**
   * Gera resumo financeiro completo
   */
  async generateFinancialSummary(userId: string): Promise<FinancialSummary> {
    const accounts = await prisma.account.findMany({
      where: { 
        userId, 
        deletedAt: null,
        isActive: true 
      },
      select: { id: true }
    });

    const balances = await Promise.all(
      accounts.map(account => this.calculateAccountBalance(account.id))
    );

    const assets = balances.filter(b => b.accountType === 'ATIVO');
    const liabilities = balances.filter(b => b.accountType === 'PASSIVO');
    const revenues = balances.filter(b => b.accountType === 'RECEITA');
    const expenses = balances.filter(b => b.accountType === 'DESPESA');

    const totalAssets = assets.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
    const totalRevenue = revenues.reduce((sum, acc) => sum + acc.calculatedBalance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.calculatedBalance, 0);

    const netWorth = totalAssets - totalLiabilities;
    const netIncome = totalRevenue - totalExpenses;
    const balanceSheetBalance = totalAssets - (totalLiabilities + netWorth);

    return {
      totalAssets,
      totalLiabilities,
      totalRevenue,
      totalExpenses,
      netWorth,
      netIncome,
      balanceSheetBalance
    };
  }
}

export const financialCalculationsService = new FinancialCalculationsService();