/**
 * SERVIÇO DE PARTIDAS DOBRADAS
 * Implementa sistema contábil de lançamentos duplos
 * Garante que Débitos = Créditos em todas as transações
 */

import { Prisma } from '@prisma/client';

export class DoubleEntryService {
  /**
   * Criar lançamentos contábeis para uma transação
   * Implementa partidas dobradas: todo débito tem um crédito correspondente
   */
  static async createJournalEntries(
    tx: Prisma.TransactionClient,
    transaction: any
  ) {
    const amount = Math.abs(Number(transaction.amount));
    
    // ✅ REGRA: Não criar lançamentos para cartões de crédito
    // Cartões têm sistema de faturamento próprio
    if (transaction.creditCardId) {
      console.log('ℹ️ [DoubleEntry] Pulando lançamentos para cartão de crédito');
      return;
    }
    
    if (!transaction.accountId) {
      console.warn('⚠️ [DoubleEntry] Transação sem accountId, pulando lançamentos');
      return;
    }
    
    // ✅ REGRA: Se é compartilhada, usar myShare
    const amountToUse = transaction.isShared && transaction.myShare
      ? Math.abs(Number(transaction.myShare))
      : amount;
    
    console.log(`📊 [DoubleEntry] Criando lançamentos para transação ${transaction.id}:`, {
      type: transaction.type,
      amount: amountToUse,
      isShared: transaction.isShared
    });
    
    if (transaction.type === 'RECEITA') {
      // DÉBITO: Conta (aumenta ativo)
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          entryType: 'DEBITO',
          amount: amountToUse,
          description: `${transaction.description} (Entrada)`
        }
      });
      
      // CRÉDITO: Receita (aumenta receita)
      const revenueAccountId = await this.getOrCreateRevenueAccount(
        tx,
        transaction.userId,
        transaction.categoryId
      );
      
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: revenueAccountId,
          entryType: 'CREDITO',
          amount: amountToUse,
          description: `${transaction.description} (Receita)`
        }
      });
    }
    
    if (transaction.type === 'DESPESA') {
      // DÉBITO: Despesa (aumenta despesa)
      const expenseAccountId = await this.getOrCreateExpenseAccount(
        tx,
        transaction.userId,
        transaction.categoryId
      );
      
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: expenseAccountId,
          entryType: 'DEBITO',
          amount: amountToUse,
          description: `${transaction.description} (Despesa)`
        }
      });
      
      // CRÉDITO: Conta (diminui ativo)
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: transaction.accountId,
          entryType: 'CREDITO',
          amount: amountToUse,
          description: `${transaction.description} (Saída)`
        }
      });
      
      // ✅ Se é compartilhada, criar lançamento de "Valores a Receber"
      if (transaction.isShared && transaction.myShare) {
        const totalPaid = Math.abs(Number(transaction.amount));
        const toReceive = totalPaid - amountToUse;
        
        if (toReceive > 0.01) {
          const receivableAccountId = await this.getOrCreateReceivableAccount(
            tx,
            transaction.userId
          );
          
          // DÉBITO: Valores a Receber (aumenta ativo)
          await tx.journalEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: receivableAccountId,
              entryType: 'DEBITO',
              amount: toReceive,
              description: `${transaction.description} (A receber)`
            }
          });
          
          console.log(`💰 [DoubleEntry] Criado lançamento de valores a receber: R$ ${toReceive.toFixed(2)}`);
        }
      }
    }
    
    // ✅ VALIDAR BALANCEAMENTO
    await this.validateBalance(tx, transaction.id);
    
    console.log(`✅ [DoubleEntry] Lançamentos criados e validados para transação ${transaction.id}`);
  }
  
  /**
   * Validar se débitos = créditos
   */
  static async validateBalance(
    tx: Prisma.TransactionClient,
    transactionId: string
  ) {
    const entries = await tx.journalEntry.findMany({
      where: { transactionId }
    });
    
    const debits = entries
      .filter(e => e.entryType === 'DEBITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);
      
    const credits = entries
      .filter(e => e.entryType === 'CREDITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    if (Math.abs(debits - credits) > 0.01) {
      throw new Error(
        `❌ Partidas não balanceadas!\n` +
        `Débitos: R$ ${debits.toFixed(2)}\n` +
        `Créditos: R$ ${credits.toFixed(2)}\n` +
        `Diferença: R$ ${Math.abs(debits - credits).toFixed(2)}`
      );
    }
  }
  
  /**
   * Buscar ou criar conta de receita
   */
  private static async getOrCreateRevenueAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId?: string
  ): Promise<string> {
    const name = categoryId ? `Receita - ${categoryId}` : 'Receitas Gerais';
    
    let account = await tx.account.findFirst({
      where: { userId, type: 'RECEITA', name }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name,
          type: 'RECEITA',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
      
      console.log(`📝 [DoubleEntry] Conta de receita criada: ${name}`);
    }
    
    return account.id;
  }
  
  /**
   * Buscar ou criar conta de despesa
   */
  private static async getOrCreateExpenseAccount(
    tx: Prisma.TransactionClient,
    userId: string,
    categoryId?: string
  ): Promise<string> {
    const name = categoryId ? `Despesa - ${categoryId}` : 'Despesas Gerais';
    
    let account = await tx.account.findFirst({
      where: { userId, type: 'DESPESA', name }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name,
          type: 'DESPESA',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
      
      console.log(`📝 [DoubleEntry] Conta de despesa criada: ${name}`);
    }
    
    return account.id;
  }
  
  /**
   * Buscar ou criar conta de valores a receber
   */
  private static async getOrCreateReceivableAccount(
    tx: Prisma.TransactionClient,
    userId: string
  ): Promise<string> {
    let account = await tx.account.findFirst({
      where: { userId, type: 'ATIVO', name: 'Valores a Receber - Compartilhado' }
    });
    
    if (!account) {
      account = await tx.account.create({
        data: {
          userId,
          name: 'Valores a Receber - Compartilhado',
          type: 'ATIVO',
          balance: 0,
          currency: 'BRL',
          isActive: true
        }
      });
      
      console.log(`📝 [DoubleEntry] Conta de valores a receber criada`);
    }
    
    return account.id;
  }
}
