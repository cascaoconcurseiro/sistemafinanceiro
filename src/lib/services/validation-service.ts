/**
 * SERVIÇO DE VALIDAÇÃO DE CONSISTÊNCIA DE DADOS
 * Garante integridade e consistência em todas as operações financeiras
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ============================================
// CONFIGURAÇÕES DE VALIDAÇÃO
// ============================================

export const VALIDATION_RULES = {
  dates: {
    allowFutureDates: true,
    maxFutureDays: 365, // 1 ano
    allowPastDates: true,
    maxPastDays: 1825, // 5 anos
  },
  amounts: {
    minAmount: 0.01,
    maxAmount: 10000000, // R$ 10 milhões
    decimalPlaces: 2,
  },
  limits: {
    maxInstallments: 48,
    maxSharedParticipants: 20,
    maxBudgetMonths: 120, // 10 anos
    maxDescriptionLength: 500,
  },
};

// ============================================
// MÁQUINAS DE ESTADO
// ============================================

const STATE_MACHINES = {
  installment: {
    pending: ['paid', 'cancelled', 'overdue', 'paid_early'],
    paid: [],
    cancelled: [],
    overdue: ['paid', 'cancelled'],
    paid_early: [],
  },
  invoice: {
    open: ['partial', 'paid', 'overdue'],
    partial: ['paid', 'overdue'],
    paid: [],
    overdue: ['partial', 'paid'],
  },
  goal: {
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['active'],
  },
};

// ============================================
// SERVIÇO DE VALIDAÇÃO
// ============================================

export class ValidationService {
  /**
   * 1. VALIDAÇÃO DE DATAS
   */
  static validateDate(date: Date, context: string = 'Data'): void {
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Validar futuro
    if (diffDays > 0) {
      if (!VALIDATION_RULES.dates.allowFutureDates) {
        throw new Error(`${context}: Datas futuras não são permitidas`);
      }
      
      if (diffDays > VALIDATION_RULES.dates.maxFutureDays) {
        throw new Error(
          `${context}: Data não pode ser mais de ${VALIDATION_RULES.dates.maxFutureDays} dias no futuro`
        );
      }
    }

    // Validar passado
    if (diffDays < 0) {
      if (!VALIDATION_RULES.dates.allowPastDates) {
        throw new Error(`${context}: Datas passadas não são permitidas`);
      }
      
      if (Math.abs(diffDays) > VALIDATION_RULES.dates.maxPastDays) {
        throw new Error(
          `${context}: Data não pode ser mais de ${VALIDATION_RULES.dates.maxPastDays} dias no passado`
        );
      }
    }
  }

  static validateDateOrder(
    startDate: Date,
    endDate: Date,
    context: string = 'Período'
  ): void {
    if (endDate < startDate) {
      throw new Error(
        `${context}: Data de término não pode ser anterior à data de início`
      );
    }
  }

  static validateInvoiceDates(closingDay: number, dueDay: number): void {
    if (dueDay <= closingDay) {
      throw new Error(
        `Dia de vencimento (${dueDay}) deve ser após o dia de fechamento (${closingDay})`
      );
    }
  }

  /**
   * 2. VALIDAÇÃO DE VALORES
   */
  static validateAmount(amount: number, context: string = 'Valor'): void {
    const absAmount = Math.abs(amount);

    // Validar casas decimais
    const decimals = (absAmount.toString().split('.')[1] || '').length;
    if (decimals > VALIDATION_RULES.amounts.decimalPlaces) {
      throw new Error(
        `${context}: Não pode ter mais de ${VALIDATION_RULES.amounts.decimalPlaces} casas decimais`
      );
    }

    // Validar range
    if (absAmount < VALIDATION_RULES.amounts.minAmount) {
      throw new Error(
        `${context}: Valor mínimo é R$ ${VALIDATION_RULES.amounts.minAmount.toFixed(2)}`
      );
    }
    
    if (absAmount > VALIDATION_RULES.amounts.maxAmount) {
      throw new Error(
        `${context}: Valor máximo é R$ ${VALIDATION_RULES.amounts.maxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      );
    }
  }

  static async validateAccountBalance(account: any): Promise<void> {
    if (account.type === 'ATIVO' && Number(account.balance) < 0) {
      if (!account.allowNegativeBalance) {
        throw new Error(
          `Conta ATIVO "${account.name}" não pode ter saldo negativo sem cheque especial configurado`
        );
      }
    }
  }

  static async validateCreditCardBalance(card: any): Promise<void> {
    const currentBalance = Number(card.currentBalance);
    const limit = Number(card.limit);

    if (currentBalance > limit) {
      if (!card.allowOverLimit) {
        throw new Error(
          `Saldo do cartão "${card.name}" (R$ ${currentBalance.toFixed(2)}) não pode exceder o limite (R$ ${limit.toFixed(2)})`
        );
      }
    }
  }

  /**
   * 3. VALIDAÇÃO DE ESTADOS
   */
  static validateStateTransition(
    entity: string,
    currentState: string,
    newState: string
  ): void {
    const machine = STATE_MACHINES[entity as keyof typeof STATE_MACHINES];
    
    if (!machine) {
      console.warn(`Máquina de estados não definida para: ${entity}`);
      return;
    }

    const allowedTransitions = machine[currentState as keyof typeof machine];
    
    if (!allowedTransitions) {
      throw new Error(`Estado inválido: ${currentState} para ${entity}`);
    }

    if (!allowedTransitions.includes(newState)) {
      throw new Error(
        `Transição inválida: ${entity} não pode ir de "${currentState}" para "${newState}"`
      );
    }
  }

  static validateInstallmentOperation(
    installment: any,
    operation: 'pay' | 'cancel' | 'edit'
  ): void {
    if (operation === 'pay' && installment.status === 'paid') {
      throw new Error('Parcela já está paga');
    }
    
    if (operation === 'cancel' && installment.status === 'paid') {
      throw new Error('Não é possível cancelar parcela já paga');
    }
    
    if (operation === 'edit' && installment.status === 'paid') {
      throw new Error('Não é possível editar parcela já paga');
    }
  }

  /**
   * 4. VALIDAÇÃO DE RELACIONAMENTOS
   */
  static async validateTransactionRelationships(transaction: any): Promise<void> {
    // Deve ter conta OU cartão
    if (!transaction.accountId && !transaction.creditCardId) {
      throw new Error('Transação deve ter accountId ou creditCardId');
    }

    // Se tem conta, validar que existe
    if (transaction.accountId) {
      const account = await prisma.account.findUnique({
        where: { id: transaction.accountId },
      });
      if (!account || account.deletedAt) {
        throw new Error('Conta não encontrada ou foi deletada');
      }
    }

    // Se tem cartão, validar que existe
    if (transaction.creditCardId) {
      const card = await prisma.creditCard.findUnique({
        where: { id: transaction.creditCardId },
      });
      if (!card) {
        throw new Error('Cartão não encontrado');
      }
    }

    // Se tem viagem, validar que existe
    if (transaction.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: transaction.tripId },
      });
      if (!trip) {
        throw new Error('Viagem não encontrada');
      }
    }

    // Se tem meta, validar que existe
    if (transaction.goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: transaction.goalId },
      });
      if (!goal) {
        throw new Error('Meta não encontrada');
      }
    }

    // Se tem orçamento, validar que existe
    if (transaction.budgetId) {
      const budget = await prisma.budget.findUnique({
        where: { id: transaction.budgetId },
      });
      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }
    }
  }

  /**
   * 5. VALIDAÇÃO DE SOMAS E TOTAIS
   */
  static async validateInvoiceTotal(invoiceId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        transactions: {
          where: { deletedAt: null },
        },
      },
    });

    if (!invoice) return;

    const calculatedTotal = invoice.transactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount)),
      0
    );

    const storedTotal = Number(invoice.totalAmount);

    if (Math.abs(calculatedTotal - storedTotal) > 0.01) {
      throw new Error(
        `Total da fatura inconsistente. ` +
        `Armazenado: R$ ${storedTotal.toFixed(2)}, ` +
        `Calculado: R$ ${calculatedTotal.toFixed(2)}`
      );
    }
  }

  static validateSharedExpenseSplit(
    totalAmount: number,
    splits: Record<string, number>
  ): void {
    const totalSplit = Object.values(splits).reduce((sum, val) => sum + val, 0);

    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      throw new Error(
        `Divisão inconsistente. ` +
        `Total: R$ ${totalAmount.toFixed(2)}, ` +
        `Soma das divisões: R$ ${totalSplit.toFixed(2)}`
      );
    }
  }

  /**
   * 6. VALIDAÇÃO DE MOEDAS
   */
  static async validateCurrency(transaction: any): Promise<void> {
    if (transaction.accountId) {
      const account = await prisma.account.findUnique({
        where: { id: transaction.accountId },
      });

      if (account && transaction.currency !== account.currency) {
        if (!transaction.exchangeRate) {
          throw new Error(
            `Transação em ${transaction.currency} mas conta em ${account.currency}. ` +
            `Taxa de câmbio obrigatória.`
          );
        }
      }
    }
  }

  /**
   * 7. VALIDAÇÃO DE PERÍODOS
   */
  static validatePeriod(
    startDate: Date,
    endDate: Date,
    entityName: string
  ): void {
    this.validateDateOrder(startDate, endDate, entityName);

    const diffDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Validar período mínimo (1 dia)
    if (diffDays < 1) {
      throw new Error(`${entityName}: Período mínimo é de 1 dia`);
    }

    // Validar período máximo (10 anos)
    if (diffDays > 3650) {
      throw new Error(`${entityName}: Período máximo é de 10 anos`);
    }
  }

  /**
   * 8. VALIDAÇÃO DE LIMITES OPERACIONAIS
   */
  static validateOperationalLimits(entity: any, type: string): void {
    switch (type) {
      case 'installment':
        if (entity.totalInstallments > VALIDATION_RULES.limits.maxInstallments) {
          throw new Error(
            `Máximo de ${VALIDATION_RULES.limits.maxInstallments} parcelas permitido`
          );
        }
        break;

      case 'sharedExpense':
        const participants = Array.isArray(entity.sharedWith) 
          ? entity.sharedWith 
          : JSON.parse(entity.sharedWith || '[]');
        
        if (participants.length > VALIDATION_RULES.limits.maxSharedParticipants) {
          throw new Error(
            `Máximo de ${VALIDATION_RULES.limits.maxSharedParticipants} participantes permitido`
          );
        }
        break;

      case 'description':
        if (entity.description && entity.description.length > VALIDATION_RULES.limits.maxDescriptionLength) {
          throw new Error(
            `Descrição não pode ter mais de ${VALIDATION_RULES.limits.maxDescriptionLength} caracteres`
          );
        }
        break;
    }
  }

  /**
   * 9. VALIDAÇÃO COMPLETA DE TRANSAÇÃO
   */
  static async validateTransaction(transaction: any): Promise<void> {
    // Validar data
    this.validateDate(new Date(transaction.date), 'Data da transação');

    // Validar valor
    this.validateAmount(transaction.amount, 'Valor da transação');

    // Validar relacionamentos
    await this.validateTransactionRelationships(transaction);

    // Validar moeda
    await this.validateCurrency(transaction);

    // Validar descrição
    this.validateOperationalLimits(transaction, 'description');
  }

  /**
   * 10. VALIDAÇÃO COMPLETA DE PARCELAMENTO
   */
  static async validateInstallment(installment: any): Promise<void> {
    // Validar data de vencimento
    this.validateDate(new Date(installment.dueDate), 'Data de vencimento');

    // Validar valor
    this.validateAmount(installment.amount, 'Valor da parcela');

    // Validar limites
    this.validateOperationalLimits(installment, 'installment');
  }

  /**
   * 11. VALIDAÇÃO COMPLETA DE ORÇAMENTO
   */
  static async validateBudget(budget: any): Promise<void> {
    // Validar período
    this.validatePeriod(
      new Date(budget.startDate),
      new Date(budget.endDate),
      'Orçamento'
    );

    // Validar valor
    this.validateAmount(budget.amount, 'Valor do orçamento');

    // Validar que gasto não é maior que orçamento
    if (Number(budget.spent) > Number(budget.amount)) {
      console.warn(
        `⚠️ Orçamento "${budget.name}": Gasto (R$ ${budget.spent}) maior que orçamento (R$ ${budget.amount})`
      );
    }
  }

  /**
   * 12. VALIDAÇÃO COMPLETA DE VIAGEM
   */
  static async validateTrip(trip: any): Promise<void> {
    // Validar período
    this.validatePeriod(
      new Date(trip.startDate),
      new Date(trip.endDate),
      'Viagem'
    );

    // Validar orçamento
    if (trip.budget) {
      this.validateAmount(trip.budget, 'Orçamento da viagem');
    }
  }

  /**
   * 13. VALIDAÇÃO COMPLETA DE META
   */
  static async validateGoal(goal: any): Promise<void> {
    // Validar valor alvo
    this.validateAmount(goal.targetAmount, 'Valor alvo da meta');

    // Validar prazo (se definido)
    if (goal.deadline) {
      this.validateDate(new Date(goal.deadline), 'Prazo da meta');
    }

    // Validar que valor atual não é maior que alvo
    if (Number(goal.currentAmount) > Number(goal.targetAmount)) {
      console.warn(
        `⚠️ Meta "${goal.name}": Valor atual (R$ ${goal.currentAmount}) maior que alvo (R$ ${goal.targetAmount})`
      );
    }
  }
}
