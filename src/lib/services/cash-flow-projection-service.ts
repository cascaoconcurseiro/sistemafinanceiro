/**
 * SERVIÇO DE PROJEÇÃO DE FLUXO DE CAIXA
 * Consolida todas as obrigações futuras do sistema
 */

import { prisma } from '@/lib/prisma';
import { addDays, addMonths, startOfDay, endOfDay } from 'date-fns';

// ============================================
// TIPOS
// ============================================

export interface CashFlowProjectionItem {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'RECEITA' | 'DESPESA';
  category?: string;
  accountId?: string;
  accountName?: string;
  source: 'installment' | 'scheduled' | 'invoice' | 'recurring';
  status: 'pending' | 'confirmed';
  metadata?: Record<string, any>;
}

export interface CashFlowProjectionSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  items: CashFlowProjectionItem[];
  periodStart: Date;
  periodEnd: Date;
}

// ============================================
// SERVIÇO
// ============================================

export class CashFlowProjectionService {
  /**
   * GERAR PROJEÇÃO DE FLUXO DE CAIXA
   * @param userId - ID do usuário
   * @param days - Número de dias para projetar (30, 90, 180, 365)
   */
  static async generateProjection(
    userId: string,
    days: number = 30
  ): Promise<CashFlowProjectionSummary> {
    const startDate = startOfDay(new Date());
    const endDate = endOfDay(addDays(startDate, days));

    // Buscar todas as fontes de obrigações futuras
    const [installments, scheduledTransactions, invoices, recurringTemplates] =
      await Promise.all([
        this.getInstallmentsProjection(userId, startDate, endDate),
        this.getScheduledTransactionsProjection(userId, startDate, endDate),
        this.getInvoicesProjection(userId, startDate, endDate),
        this.getRecurringProjection(userId, startDate, endDate),
      ]);

    // Consolidar todos os itens
    const allItems = [
      ...installments,
      ...scheduledTransactions,
      ...invoices,
      ...recurringTemplates,
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcular totais
    const totalIncome = allItems
      .filter((item) => item.type === 'RECEITA')
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = allItems
      .filter((item) => item.type === 'DESPESA')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      items: allItems,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * PARCELAS FUTURAS PENDENTES
   */
  private static async getInstallmentsProjection(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowProjectionItem[]> {
    const installments = await prisma.installment.findMany({
      where: {
        userId,
        status: 'pending',
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        transaction: {
          include: {
            account: true,
            categoryRef: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return installments.map((installment) => ({
      id: installment.id,
      date: installment.dueDate,
      description: `${installment.description || 'Parcela'} (${installment.installmentNumber}/${installment.totalInstallments})`,
      amount: Number(installment.amount),
      type: 'DESPESA',
      category: installment.transaction?.categoryRef?.name,
      accountId: installment.transaction?.accountId || undefined,
      accountName: installment.transaction?.account?.name,
      source: 'installment',
      status: 'pending',
      metadata: {
        installmentNumber: installment.installmentNumber,
        totalInstallments: installment.totalInstallments,
        transactionId: installment.transactionId,
      },
    }));
  }

  /**
   * TRANSAÇÕES AGENDADAS
   */
  private static async getScheduledTransactionsProjection(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowProjectionItem[]> {
    const scheduled = await prisma.scheduledTransaction.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
        account: {
          userId,
        },
      },
      include: {
        account: true,
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return scheduled.map((item) => ({
      id: item.id,
      date: item.scheduledDate,
      description: item.description,
      amount: Number(item.amount),
      type: item.type as 'RECEITA' | 'DESPESA',
      category: item.category,
      accountId: item.accountId,
      accountName: item.account.name,
      source: 'scheduled',
      status: 'pending',
      metadata: {
        isRecurring: item.isRecurring,
        recurringFrequency: item.recurringFrequency,
      },
    }));
  }

  /**
   * FATURAS FUTURAS DE CARTÃO DE CRÉDITO
   */
  private static async getInvoicesProjection(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowProjectionItem[]> {
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: {
          in: ['open', 'partial'],
        },
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        creditCard: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return invoices.map((invoice) => {
      const remainingAmount = Number(invoice.totalAmount) - Number(invoice.paidAmount);
      
      return {
        id: invoice.id,
        date: invoice.dueDate,
        description: `Fatura ${invoice.creditCard.name} - ${invoice.month}/${invoice.year}`,
        amount: remainingAmount,
        type: 'DESPESA',
        category: 'Cartão de Crédito',
        accountId: undefined,
        accountName: invoice.creditCard.name,
        source: 'invoice',
        status: invoice.status === 'partial' ? 'confirmed' : 'pending',
        metadata: {
          creditCardId: invoice.creditCardId,
          totalAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount),
          minimumPayment: Number(invoice.minimumPayment),
        },
      };
    });
  }

  /**
   * TRANSAÇÕES RECORRENTES FUTURAS
   */
  private static async getRecurringProjection(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowProjectionItem[]> {
    const templates = await prisma.recurringTransactionTemplate.findMany({
      where: {
        userId,
        isActive: true,
        nextGeneration: {
          lte: endDate,
        },
      },
    });

    const projectedItems: CashFlowProjectionItem[] = [];

    for (const template of templates) {
      let currentDate = new Date(template.nextGeneration);
      const templateData = JSON.parse(template.templateData);

      while (currentDate <= endDate) {
        if (currentDate >= startDate) {
          projectedItems.push({
            id: `${template.id}-${currentDate.getTime()}`,
            date: currentDate,
            description: templateData.description || 'Transação Recorrente',
            amount: Number(templateData.amount),
            type: templateData.type as 'RECEITA' | 'DESPESA',
            category: templateData.category,
            accountId: templateData.accountId,
            accountName: undefined,
            source: 'recurring',
            status: 'pending',
            metadata: {
              templateId: template.id,
              frequency: template.frequency,
            },
          });
        }

        // Calcular próxima ocorrência
        currentDate = this.getNextOccurrence(currentDate, template.frequency);

        // Verificar se atingiu o limite de ocorrências
        if (template.endDate && currentDate > template.endDate) {
          break;
        }
      }
    }

    return projectedItems.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * CALCULAR PRÓXIMA OCORRÊNCIA DE RECORRÊNCIA
   */
  private static getNextOccurrence(currentDate: Date, frequency: string): Date {
    switch (frequency) {
      case 'DAILY':
        return addDays(currentDate, 1);
      case 'WEEKLY':
        return addDays(currentDate, 7);
      case 'MONTHLY':
        return addMonths(currentDate, 1);
      case 'YEARLY':
        return addMonths(currentDate, 12);
      default:
        return addMonths(currentDate, 1);
    }
  }

  /**
   * OBTER PROJEÇÃO POR PERÍODO
   */
  static async getProjectionByPeriod(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<CashFlowProjectionSummary> {
    const daysMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };

    return this.generateProjection(userId, daysMap[period]);
  }

  /**
   * OBTER PROJEÇÃO AGRUPADA POR MÊS
   */
  static async getProjectionGroupedByMonth(
    userId: string,
    months: number = 3
  ): Promise<Record<string, CashFlowProjectionSummary>> {
    const projection = await this.generateProjection(userId, months * 30);
    const grouped: Record<string, CashFlowProjectionItem[]> = {};

    // Agrupar por mês
    projection.items.forEach((item) => {
      const monthKey = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(item);
    });

    // Calcular totais por mês
    const result: Record<string, CashFlowProjectionSummary> = {};

    Object.entries(grouped).forEach(([monthKey, items]) => {
      const totalIncome = items
        .filter((item) => item.type === 'RECEITA')
        .reduce((sum, item) => sum + item.amount, 0);

      const totalExpenses = items
        .filter((item) => item.type === 'DESPESA')
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);

      result[monthKey] = {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        items,
        periodStart: items[0].date,
        periodEnd: items[items.length - 1].date,
      };
    });

    return result;
  }
}
