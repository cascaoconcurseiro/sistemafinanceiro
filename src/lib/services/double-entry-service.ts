/**
 * 🏦 DOUBLE ENTRY SERVICE - Serviço de Partida Dobrada PROFISSIONAL
 * 
 * Implementa os princípios contábeis REAIS de partida dobrada:
 * - Todo débito tem um crédito correspondente
 * - Soma de débitos = Soma de créditos
 * - Natureza das contas respeitada (ATIVO, PASSIVO, RECEITA, DESPESA)
 * - Lançamentos contábeis corretos para todas as transações
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Tipos que correspondem ao schema (SQLite usa strings)
type AccountType = 'ATIVO' | 'PASSIVO' | 'RECEITA' | 'DESPESA';
type TransactionType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
type JournalEntryType = 'DEBITO' | 'CREDITO';

interface TransactionData {
  id?: string;
  userId: string;
  accountId: string;
  amount: number;
  description: string;
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';
  date: Date;
  categoryId?: string;
  creditCardId?: string;
  transferToAccountId?: string; // Para transferências
  notes?: string; // ✅ NOVO: Observações adicionais
  tripId?: string; // ✅ NOVO: ID da viagem
  goalId?: string; // ✅ NOVO: ID da meta
  isShared?: boolean; // ✅ NOVO: Se é compartilhada
  sharedWith?: string; // ✅ NOVO: Com quem compartilha
  myShare?: number; // ✅ CORREÇÃO: Minha parte em despesas compartilhadas
  totalSharedAmount?: number; // ✅ CORREÇÃO: Valor total compartilhado
  paidBy?: string; // ✅ NOVO: ID de quem pagou
  status?: string; // ✅ NOVO: Status da transação
}

interface JournalEntryData {
  transactionId: string;
  accountId: string;
  entryType: 'DEBITO' | 'CREDITO';
  amount: number;
  description: string;
}

interface AccountInfo {
  id: string;
  type: AccountType;
  name: string;
}

export class DoubleEntryService {
  
  /**
   * Cria uma transação seguindo princípios de partida dobrada
   */
  async createTransaction(data: TransactionData) {
    return await prisma.$transaction(async (tx) => {
      console.log('🏦 [DoubleEntry] Criando transação com partida dobrada:', {
        type: data.type,
        amount: data.amount,
        description: data.description
      });

      // 1. Criar a transação principal
      const transaction = await tx.transaction.create({
        data: {
          userId: data.userId,
          accountId: data.accountId,
          categoryId: data.categoryId,
          creditCardId: data.creditCardId,
          amount: new Decimal(data.amount),
          description: data.description,
          type: data.type, // 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
          date: data.date,
          status: data.status || 'cleared', // ✅ NOVO: Usar status passado
          isRecurring: false,
          isTransfer: data.type === 'TRANSFERENCIA',
          isShared: data.isShared || false, // ✅ CORREÇÃO: Usar valor passado
          sharedWith: data.sharedWith || null, // ✅ NOVO: Salvar sharedWith
          myShare: data.myShare ? new Decimal(data.myShare) : null, // ✅ CORREÇÃO: Salvar myShare
          totalSharedAmount: data.totalSharedAmount ? new Decimal(data.totalSharedAmount) : null, // ✅ CORREÇÃO: Salvar totalSharedAmount
          paidBy: data.paidBy || null, // ✅ NOVO: Salvar paidBy
          tripId: data.tripId || null, // ✅ NOVO: Salvar tripId
          goalId: data.goalId || null, // ✅ NOVO: Salvar goalId
          currency: 'BRL',
          isTaxDeductible: false,
          isSuspicious: false,
          isFraudulent: false,
          isInstallment: false,
          isReconciled: false,
          metadata: data.notes ? JSON.stringify({ notes: data.notes }) : null, // ✅ NOVO: Salvar notes no metadata
        }
      });

      // 2. Criar lançamentos contábeis (partida dobrada)
      await this.createJournalEntries(tx, transaction, data);

      // 3. Atualizar saldos das contas
      await this.updateAccountBalances(tx, transaction, data);

      // 4. Validar balanceamento contábil
      await this.validateBalance(tx, transaction.id);

      console.log('✅ [DoubleEntry] Transação criada com sucesso:', transaction.id);
      return transaction;
    });
  }

  /**
   * Cria os lançamentos contábeis seguindo partida dobrada CORRETA
   */
  private async createJournalEntries(tx: any, transaction: any, data: TransactionData) {
    const entries: JournalEntryData[] = [];
    const amount = Math.abs(data.amount);

    // Buscar informações das contas envolvidas
    const mainAccount = await this.getAccountInfo(tx, data.accountId);
    
    switch (data.type) {
      case 'RECEITA': // TransactionType.RECEITA
        // ✅ RECEITA CORRETA: Débito no ATIVO (conta bancária) + Crédito na RECEITA
        
        // 1. Débito na conta bancária (ATIVO aumenta)
        entries.push({
          transactionId: transaction.id,
          accountId: data.accountId,
          entryType: 'DEBITO', // JournalEntryType.DEBITO
          amount: amount,
          description: `Recebimento: ${data.description}`
        });
        
        // 2. Crédito na conta de receita (buscar ou criar conta de receita)
        const receitaAccount = await this.getOrCreateRevenueAccount(tx, data.userId, data.categoryId);
        entries.push({
          transactionId: transaction.id,
          accountId: receitaAccount.id,
          entryType: 'CREDITO', // JournalEntryType.CREDITO
          amount: amount,
          description: `Receita: ${data.description}`
        });
        break;

      case 'DESPESA': // TransactionType.DESPESA
        // ✅ DESPESA CORRETA: Débito na DESPESA + Crédito no ATIVO (ou PASSIVO se cartão)
        
        // 1. Débito na conta de despesa (buscar ou criar conta de despesa)
        const despesaAccount = await this.getOrCreateExpenseAccount(tx, data.userId, data.categoryId);
        entries.push({
          transactionId: transaction.id,
          accountId: despesaAccount.id,
          entryType: 'DEBITO', // JournalEntryType.DEBITO
          amount: amount,
          description: `Despesa: ${data.description}`
        });
        
        // 2. Crédito na conta de origem (ATIVO diminui ou PASSIVO aumenta)
        entries.push({
          transactionId: transaction.id,
          accountId: data.accountId,
          entryType: 'CREDITO', // JournalEntryType.CREDITO
          amount: amount,
          description: `Pagamento: ${data.description}`
        });
        break;

      case 'TRANSFERENCIA': // TransactionType.TRANSFERENCIA
        if (!data.transferToAccountId) {
          throw new Error('transferToAccountId é obrigatório para transferências');
        }
        
        // ✅ TRANSFERÊNCIA CORRETA: Débito na conta destino + Crédito na conta origem
        
        // 1. Débito na conta destino (ATIVO aumenta)
        entries.push({
          transactionId: transaction.id,
          accountId: data.transferToAccountId,
          entryType: 'DEBITO', // JournalEntryType.DEBITO
          amount: amount,
          description: `Transferência recebida: ${data.description}`
        });
        
        // 2. Crédito na conta origem (ATIVO diminui)
        entries.push({
          transactionId: transaction.id,
          accountId: data.accountId,
          entryType: 'CREDITO', // JournalEntryType.CREDITO
          amount: amount,
          description: `Transferência enviada: ${data.description}`
        });
        break;
    }

    // Criar todos os lançamentos contábeis
    for (const entry of entries) {
      await tx.journalEntry.create({
        data: {
          transactionId: entry.transactionId,
          accountId: entry.accountId,
          entryType: entry.entryType,
          amount: new Decimal(entry.amount),
          description: entry.description,
        }
      });
    }

    console.log('📊 [DoubleEntry] Criados', entries.length, 'lançamentos contábeis CORRETOS');
  }

  /**
   * Busca informações de uma conta
   */
  private async getAccountInfo(tx: any, accountId: string): Promise<AccountInfo> {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      select: { id: true, type: true, name: true }
    });
    
    if (!account) {
      throw new Error(`Conta ${accountId} não encontrada`);
    }
    
    return account as AccountInfo;
  }

  /**
   * Busca ou cria conta de receita para a categoria
   */
  private async getOrCreateRevenueAccount(tx: any, userId: string, categoryId?: string): Promise<AccountInfo> {
    const accountName = categoryId ? `Receita - ${categoryId}` : 'Receitas Diversas';
    
    let account = await tx.account.findFirst({
      where: {
        userId,
        name: accountName,
        type: 'RECEITA'
      }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name: accountName,
          type: 'RECEITA',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
      console.log('✅ [DoubleEntry] Conta de receita criada:', accountName);
    }
    
    return account as AccountInfo;
  }

  /**
   * Busca ou cria conta de despesa para a categoria
   */
  private async getOrCreateExpenseAccount(tx: any, userId: string, categoryId?: string): Promise<AccountInfo> {
    const accountName = categoryId ? `Despesa - ${categoryId}` : 'Despesas Diversas';
    
    let account = await tx.account.findFirst({
      where: {
        userId,
        name: accountName,
        type: 'DESPESA'
      }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name: accountName,
          type: 'DESPESA',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
      console.log('✅ [DoubleEntry] Conta de despesa criada:', accountName);
    }
    
    return account as AccountInfo;
  }

  /**
   * Atualiza os saldos das contas afetadas CORRETAMENTE por natureza
   */
  private async updateAccountBalances(tx: any, transaction: any, data: TransactionData) {
    // Buscar todas as contas afetadas pelos lançamentos
    const entries = await tx.journalEntry.findMany({
      where: { transactionId: transaction.id },
      include: {
        account: { select: { id: true, type: true, name: true } }
      }
    });

    // Atualizar saldo de cada conta baseado na sua natureza
    for (const entry of entries) {
      await this.updateAccountBalance(tx, entry.accountId);
    }
  }

  /**
   * Atualiza saldo de uma conta específica baseado na sua natureza
   */
  private async updateAccountBalance(tx: any, accountId: string) {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      select: { id: true, type: true, name: true }
    });

    if (!account) return;

    // Buscar todos os lançamentos da conta
    const entries = await tx.journalEntry.findMany({
      where: { accountId },
      include: {
        transaction: true
      }
    });
    
    // Filtrar apenas transações confirmadas E NÃO DELETADAS
    const validEntries = entries.filter(e => 
      e.transaction && 
      e.transaction.status === 'cleared' && 
      e.transaction.deletedAt === null
    );

    let newBalance = 0;

    // Calcular saldo baseado na natureza da conta
    switch (account.type) {
      case 'ATIVO':
        // ATIVO: Saldo = Débitos - Créditos
        const ativoDebitos = validEntries
          .filter(e => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const ativoCreditos = validEntries
          .filter(e => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = ativoDebitos - ativoCreditos;
        break;

      case 'PASSIVO':
        // PASSIVO: Saldo = Créditos - Débitos
        const passivoCreditos = validEntries
          .filter(e => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const passivoDebitos = validEntries
          .filter(e => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = passivoCreditos - passivoDebitos;
        break;

      case 'RECEITA':
        // RECEITA: Saldo = Créditos - Débitos (resultado positivo)
        const receitaCreditos = validEntries
          .filter(e => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const receitaDebitos = validEntries
          .filter(e => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = receitaCreditos - receitaDebitos;
        break;

      case 'DESPESA':
        // DESPESA: Saldo = Débitos - Créditos (resultado negativo)
        const despesaDebitos = validEntries
          .filter(e => e.entryType === 'DEBITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const despesaCreditos = validEntries
          .filter(e => e.entryType === 'CREDITO')
          .reduce((sum, e) => sum + Number(e.amount), 0);
        newBalance = despesaDebitos - despesaCreditos;
        break;
    }

    // Atualizar saldo da conta
    await tx.account.update({
      where: { id: accountId },
      data: { balance: new Decimal(newBalance) }
    });

    console.log(`💰 [DoubleEntry] Saldo atualizado - ${account.name} (${account.type}): R$ ${newBalance.toFixed(2)}`);
  }

  /**
   * Valida se os lançamentos contábeis estão balanceados CORRETAMENTE
   */
  private async validateBalance(tx: any, transactionId: string) {
    const entries = await tx.journalEntry.findMany({
      where: { transactionId }
    });

    const totalDebits = entries
      .filter(e => e.entryType === 'DEBITO')
      .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);
    
    const totalCredits = entries
      .filter(e => e.entryType === 'CREDITO')
      .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);

    const difference = Math.abs(totalDebits - totalCredits);
    
    if (difference > 0.01) { // Tolerância de 1 centavo
      console.error('❌ [DoubleEntry] Balanceamento violado:', {
        transactionId,
        totalDebits,
        totalCredits,
        difference,
        entries: entries.map(e => ({
          account: e.accountId,
          type: e.entryType,
          amount: Number(e.amount)
        }))
      });
      throw new Error(`Balanceamento contábil violado! Débitos: ${totalDebits}, Créditos: ${totalCredits}, Diferença: ${difference}`);
    }

    console.log('✅ [DoubleEntry] Balanceamento validado:', {
      transactionId,
      totalDebits,
      totalCredits,
      entries: entries.length
    });
  }

  /**
   * Valida balanceamento geral do sistema CORRETAMENTE
   */
  async validateSystemBalance(): Promise<{
    isBalanced: boolean;
    totalDebits: number;
    totalCredits: number;
    difference: number;
  }> {
    const entries = await prisma.journalEntry.findMany();

    const totalDebits = entries
      .filter(e => e.entryType === 'DEBITO')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    
    const totalCredits = entries
      .filter(e => e.entryType === 'CREDITO')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const difference = Math.abs(totalDebits - totalCredits);
    const isBalanced = difference <= 0.01;

    return {
      isBalanced,
      totalDebits,
      totalCredits,
      difference
    };
  }

  /**
   * Gera relatório de balancete
   */
  async generateTrialBalance(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId, deletedAt: null },
      include: {
        journalEntries: true
      }
    });

    const balancete = accounts.map(account => {
      const totalDebits = account.journalEntries
        .filter(e => e.entryType === 'DEBITO')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const totalCredits = account.journalEntries
        .filter(e => e.entryType === 'CREDITO')
        .reduce((sum, entry) => sum + Number(entry.amount), 0);

      return {
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        totalDebits,
        totalCredits,
        balance: totalDebits - totalCredits,
        currentBalance: Number(account.balance)
      };
    });

    return balancete;
  }

  /**
   * Reconcilia saldo calculado com saldo armazenado
   */
  async reconcileAccount(accountId: string): Promise<{
    storedBalance: number;
    calculatedBalance: number;
    difference: number;
    isReconciled: boolean;
  }> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        journalEntries: true
      }
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    const totalDebits = account.journalEntries
      .filter(e => e.entryType === 'DEBITO')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const totalCredits = account.journalEntries
      .filter(e => e.entryType === 'CREDITO')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const calculatedBalance = totalDebits - totalCredits;
    const storedBalance = Number(account.balance);
    const difference = Math.abs(calculatedBalance - storedBalance);
    const isReconciled = difference <= 0.01;

    return {
      storedBalance,
      calculatedBalance,
      difference,
      isReconciled
    };
  }

  /**
   * Deleta uma transação e reverte todos os lançamentos contábeis
   */
  async deleteTransaction(transactionId: string) {
    return await prisma.$transaction(async (tx) => {
      console.log('🗑️ [DoubleEntry] Deletando transação:', transactionId);

      // 1. Buscar a transação
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          journalEntries: true,
          goal: true
        }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // 2. Se for transação de meta, reverter o valor investido
      if (transaction.goalId && transaction.goal) {
        const currentInvested = Number(transaction.goal.currentAmount || 0);
        const transactionAmount = Math.abs(Number(transaction.amount));
        const newInvested = Math.max(0, currentInvested - transactionAmount);

        await tx.goal.update({
          where: { id: transaction.goalId },
          data: { currentAmount: new Decimal(newInvested) }
        });

        console.log('💰 [DoubleEntry] Valor revertido da meta:', {
          goalId: transaction.goalId,
          anterior: currentInvested,
          revertido: transactionAmount,
          novo: newInvested
        });
      }

      // 3. Buscar todas as contas afetadas pelos lançamentos
      const affectedAccountIds = [...new Set(transaction.journalEntries.map(e => e.accountId))];

      // 4. Deletar os lançamentos contábeis
      await tx.journalEntry.deleteMany({
        where: { transactionId }
      });

      console.log('📊 [DoubleEntry] Deletados', transaction.journalEntries.length, 'lançamentos contábeis');

      // 5. Recalcular saldos de todas as contas afetadas
      for (const accountId of affectedAccountIds) {
        await this.updateAccountBalance(tx, accountId);
      }

      // 6. Soft delete da transação
      await tx.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() }
      });

      console.log('✅ [DoubleEntry] Transação deletada e saldos recalculados');
      return transaction;
    });
  }
}

// Instância singleton
export const doubleEntryService = new DoubleEntryService();
