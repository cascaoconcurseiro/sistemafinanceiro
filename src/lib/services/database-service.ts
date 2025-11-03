import { prisma } from '@/lib/prisma'
import type { Account, Transaction, Goal, Investment } from '@/types'

export interface Trip {
  id: string
  name: string
  destination?: string
  startDate?: Date
  endDate?: Date
  budget?: number
  spent?: number
  status?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface SharedDebt {
  id: string;
  creditor: string;
  debtor: string;
  originalAmount: number;
  currentAmount: number;
  description: string;
  transactionId?: string;
  status: 'active' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

class DatabaseService {
  // Usar a instância global do Prisma com middleware
  private prisma = prisma

  constructor() {
    // Não precisa mais criar uma nova instância
  }

  // Verificar se o serviço está disponível (apenas no servidor)
  get isAvailable(): boolean {
    return typeof window === 'undefined'
  }

  // ============================================================================
  // ACCOUNTS
  // ============================================================================

  async getAccounts(): Promise<Account[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getAccounts() - Operação apenas no servidor')
      return []
    }

    try {
      const accounts = await this.prisma.account.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
      return accounts.map(acc => ({
        ...acc,
        balance: Number(acc.balance)
      }))
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
      return []
    }
  }

  async saveAccount(account: Account): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveAccount() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.account.upsert({
        where: { id: account.id },
        update: {
          name: account.name,
          type: account.type,
          balance: account.balance,
          currency: account.currency || 'BRL',
          isActive: account.isActive ?? true,
          updatedAt: new Date()
        },
        create: {
          id: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
          currency: account.currency || 'BRL',
          isActive: account.isActive ?? true
        }
      })
    } catch (error) {
      console.error('Erro ao salvar conta:', error)
    }
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateAccount() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.account.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Erro ao atualizar conta:', error)
    }
  }

  async deleteAccount(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteAccount() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.account.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() }
      })
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
    }
  }

  async saveAccounts(accounts: Account[]): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveAccounts() - Operação apenas no servidor')
      return
    }

    try {
      for (const account of accounts) {
        await this.saveAccount(account)
      }
    } catch (error) {
      console.error('Erro ao salvar contas em lote:', error)
    }
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.createAccount() - Operação apenas no servidor')
      throw new Error('Operação disponível apenas no servidor')
    }

    try {
      const account = await this.prisma.account.create({
        data: {
          ...accountData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      return {
        ...account,
        balance: Number(account.balance),
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error)
      throw new Error('Falha ao criar conta no banco de dados')
    }
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  async getTransactions(): Promise<Transaction[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getTransactions() - Operação apenas no servidor')
      return []
    }

    try {
      const transactions = await this.prisma.transaction.findMany({
        orderBy: { date: 'desc' }
      })
      return transactions.map(trans => ({
        ...trans,
        amount: Number(trans.amount)
      }))
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
      return []
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveTransaction() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.upsert({
          where: { id: transaction.id },
          update: {
            accountId: transaction.account,
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category,
            type: transaction.type,
            date: transaction.date,
            updatedAt: new Date()
          },
          create: {
            id: transaction.id,
            accountId: transaction.account,
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category,
            type: transaction.type,
            date: transaction.date
          }
        });

        // Recalcular saldo da conta após upsert
        const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
        await recalculateAccountBalance(transaction.account, tx);
      });
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateTransaction() - Operação apenas no servidor')
      return
    }

    try {
      // Buscar a transação para obter o accountId
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { id }
      });

      if (!existingTransaction) {
        console.error('Transação não encontrada para atualização:', id);
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id },
          data: {
            ...updates,
            updatedAt: new Date()
          }
        });

        // Recalcular saldo da conta após atualização
        const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
        await recalculateAccountBalance(existingTransaction.accountId, tx);
      });
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteTransaction() - Operação apenas no servidor')
      return
    }

    try {
      // Buscar a transação para obter o accountId antes de deletar
      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { id }
      });

      if (!existingTransaction) {
        console.error('Transação não encontrada para exclusão:', id);
        return;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.transaction.delete({
          where: { id }
        });

        // Recalcular saldo da conta após exclusão
        const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
        await recalculateAccountBalance(existingTransaction.accountId, tx);
      });
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveTransactions() - Operação apenas no servidor')
      return
    }

    try {
      for (const transaction of transactions) {
        await this.saveTransaction(transaction)
      }
    } catch (error) {
      console.error('Erro ao salvar transações em lote:', error)
    }
  }

  // ============================================================================
  // GOALS (Placeholder - implementar quando modelo estiver no schema)
  // ============================================================================

  async getGoals(): Promise<Goal[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getGoals() - Operação apenas no servidor')
      return []
    }

    try {
      const goals = await this.prisma.goal.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return goals.map(goal => ({
        id: goal.id,
        name: goal.name,
        description: goal.description || undefined,
        currentAmount: Number(goal.currentAmount),
        targetAmount: Number(goal.targetAmount),
        targetDate: goal.targetDate || undefined,
        priority: goal.priority || undefined,
        isCompleted: goal.isCompleted,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt
      }))
    } catch (error) {
      console.error('Erro ao buscar metas:', error)
      return []
    }
  }

  async saveGoal(goal: Goal): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveGoal() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.goal.upsert({
        where: { id: goal.id },
        update: {
          name: goal.name,
          description: goal.description,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          priority: goal.priority,
          isCompleted: goal.isCompleted
        },
        create: {
          id: goal.id,
          name: goal.name,
          description: goal.description,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          targetDate: goal.targetDate,
          priority: goal.priority,
          isCompleted: goal.isCompleted || false
        }
      })
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateGoal() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.goal.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.currentAmount !== undefined && { currentAmount: updates.currentAmount }),
          ...(updates.targetAmount !== undefined && { targetAmount: updates.targetAmount }),
          ...(updates.targetDate !== undefined && { targetDate: updates.targetDate }),
          ...(updates.priority !== undefined && { priority: updates.priority }),
          ...(updates.isCompleted !== undefined && { isCompleted: updates.isCompleted })
        }
      })
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
    }
  }

  async deleteGoal(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteGoal() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.goal.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
    }
  }

  async saveGoals(goals: Goal[]): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveGoals() - Operação apenas no servidor')
      return
    }

    try {
      for (const goal of goals) {
        await this.saveGoal(goal)
      }
    } catch (error) {
      console.error('Erro ao salvar metas em lote:', error)
    }
  }

  // ============================================================================
  // TRIPS (Placeholder - implementar quando modelo estiver no schema)
  // ============================================================================

  async getTrips(): Promise<Trip[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getTrips() - Operação apenas no servidor')
      return []
    }
    // TODO: Implementar quando modelo Trip estiver no schema
    return []
  }

  async saveTrip(trip: Trip): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveTrip() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo Trip estiver no schema
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateTrip() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo Trip estiver no schema
  }

  async deleteTrip(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteTrip() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo Trip estiver no schema
  }

  // ============================================================================
  // INVESTMENTS
  // ============================================================================

  async getInvestments(filters?: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Investment[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getInvestments() - Operação apenas no servidor')
      return []
    }

    try {
      const { type, search, page = 1, limit = 20 } = filters || {}

      const where: any = {}

      if (type) {
        where.type = type
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
        ]
      }

      const investments = await this.prisma.investment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      return investments.map(inv => ({
        id: inv.id,
        name: inv.name,
        symbol: inv.symbol,
        type: inv.type,
        quantity: Number(inv.quantity),
        purchasePrice: Number(inv.purchasePrice),
        currentPrice: inv.currentPrice ? Number(inv.currentPrice) : Number(inv.purchasePrice),
        purchaseDate: inv.purchaseDate.toISOString(),
        maturityDate: inv.maturityDate?.toISOString(),
        broker: inv.broker,
        fees: Number(inv.fees),
        notes: inv.notes,
        status: inv.status,
        currentValue: inv.currentPrice ? Number(inv.currentPrice) * Number(inv.quantity) : Number(inv.purchasePrice) * Number(inv.quantity),
        totalInvested: Number(inv.purchasePrice) * Number(inv.quantity) + Number(inv.fees),
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      }))
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error)
      return []
    }
  }

  async createInvestment(data: {
    name: string;
    symbol?: string;
    type: string;
    quantity: number;
    purchasePrice: number;
    currentPrice?: number;
    purchaseDate: string;
    maturityDate?: string;
    broker?: string;
    fees?: number;
    notes?: string;
    status?: string;
  }): Promise<Investment> {
    if (!this.isAvailable) {
      throw new Error('DatabaseService.createInvestment() - Operação apenas no servidor')
    }

    try {
      const investment = await this.prisma.investment.create({
        data: {
          name: data.name,
          symbol: data.symbol,
          type: data.type,
          quantity: data.quantity,
          purchasePrice: data.purchasePrice,
          currentPrice: data.currentPrice || data.purchasePrice,
          purchaseDate: new Date(data.purchaseDate),
          maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
          broker: data.broker,
          fees: data.fees || 0,
          notes: data.notes,
          status: data.status || 'active',
        },
      })

      return {
        id: investment.id,
        name: investment.name,
        symbol: investment.symbol,
        type: investment.type,
        quantity: Number(investment.quantity),
        purchasePrice: Number(investment.purchasePrice),
        currentPrice: investment.currentPrice ? Number(investment.currentPrice) : Number(investment.purchasePrice),
        purchaseDate: investment.purchaseDate.toISOString(),
        maturityDate: investment.maturityDate?.toISOString(),
        broker: investment.broker,
        fees: Number(investment.fees),
        notes: investment.notes,
        status: investment.status,
        currentValue: investment.currentPrice ? Number(investment.currentPrice) * Number(investment.quantity) : Number(investment.purchasePrice) * Number(investment.quantity),
        totalInvested: Number(investment.purchasePrice) * Number(investment.quantity) + Number(investment.fees),
        createdAt: investment.createdAt.toISOString(),
        updatedAt: investment.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Erro ao criar investimento:', error)
      throw error
    }
  }

  async updateInvestment(id: string, updates: Partial<Investment>): Promise<Investment> {
    if (!this.isAvailable) {
      throw new Error('DatabaseService.updateInvestment() - Operação apenas no servidor')
    }

    try {
      const updateData: any = {}

      if (updates.name) updateData.name = updates.name
      if (updates.symbol) updateData.symbol = updates.symbol
      if (updates.type) updateData.type = updates.type
      if (updates.quantity) updateData.quantity = updates.quantity
      if (updates.purchasePrice) updateData.purchasePrice = updates.purchasePrice
      if (updates.currentPrice) updateData.currentPrice = updates.currentPrice
      if (updates.purchaseDate) updateData.purchaseDate = new Date(updates.purchaseDate)
      if (updates.maturityDate) updateData.maturityDate = new Date(updates.maturityDate)
      if (updates.broker) updateData.broker = updates.broker
      if (updates.fees !== undefined) updateData.fees = updates.fees
      if (updates.notes) updateData.notes = updates.notes
      if (updates.status) updateData.status = updates.status

      const investment = await this.prisma.investment.update({
        where: { id },
        data: updateData,
      })

      return {
        id: investment.id,
        name: investment.name,
        symbol: investment.symbol,
        type: investment.type,
        quantity: Number(investment.quantity),
        purchasePrice: Number(investment.purchasePrice),
        currentPrice: investment.currentPrice ? Number(investment.currentPrice) : Number(investment.purchasePrice),
        purchaseDate: investment.purchaseDate.toISOString(),
        maturityDate: investment.maturityDate?.toISOString(),
        broker: investment.broker,
        fees: Number(investment.fees),
        notes: investment.notes,
        status: investment.status,
        currentValue: investment.currentPrice ? Number(investment.currentPrice) * Number(investment.quantity) : Number(investment.purchasePrice) * Number(investment.quantity),
        totalInvested: Number(investment.purchasePrice) * Number(investment.quantity) + Number(investment.fees),
        createdAt: investment.createdAt.toISOString(),
        updatedAt: investment.updatedAt.toISOString(),
      }
    } catch (error) {
      console.error('Erro ao atualizar investimento:', error)
      throw error
    }
  }

  async deleteInvestment(id: string): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('DatabaseService.deleteInvestment() - Operação apenas no servidor')
    }

    try {
      await this.prisma.investment.delete({
        where: { id },
      })
    } catch (error) {
      console.error('Erro ao deletar investimento:', error)
      throw error
    }
  }

  // ============================================================================
  // SHARED DEBTS
  // ============================================================================

  async getSharedDebts(): Promise<SharedDebt[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getSharedDebts() - Operação apenas no servidor')
      return []
    }

    try {
      const sharedDebts = await this.prisma.sharedDebt.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return sharedDebts.map(debt => ({
        id: debt.id,
        creditor: debt.creditor,
        debtor: debt.debtor,
        originalAmount: Number(debt.originalAmount),
        currentAmount: Number(debt.currentAmount),
        description: debt.description,
        transactionId: debt.transactionId || undefined,
        status: debt.status as 'active' | 'paid' | 'cancelled',
        createdAt: debt.createdAt,
        updatedAt: debt.updatedAt
      }))
    } catch (error) {
      console.error('Erro ao buscar dívidas compartilhadas:', error)
      return []
    }
  }

  async saveSharedDebt(debt: Omit<SharedDebt, 'id' | 'createdAt' | 'updatedAt'>): Promise<SharedDebt> {
    if (!this.isAvailable) {
      throw new Error('DatabaseService.saveSharedDebt() - Operação apenas no servidor')
    }

    try {
      const savedDebt = await this.prisma.sharedDebt.create({
        data: {
          creditor: debt.creditor,
          debtor: debt.debtor,
          originalAmount: debt.originalAmount,
          currentAmount: debt.currentAmount,
          description: debt.description,
          transactionId: debt.transactionId || null,
          status: debt.status
        }
      })

      return {
        id: savedDebt.id,
        creditor: savedDebt.creditor,
        debtor: savedDebt.debtor,
        originalAmount: Number(savedDebt.originalAmount),
        currentAmount: Number(savedDebt.currentAmount),
        description: savedDebt.description,
        transactionId: savedDebt.transactionId || undefined,
        status: savedDebt.status as 'active' | 'paid' | 'cancelled',
        createdAt: savedDebt.createdAt,
        updatedAt: savedDebt.updatedAt
      }
    } catch (error) {
      console.error('Erro ao salvar dívida compartilhada:', error)
      throw error
    }
  }

  async updateSharedDebt(id: string, updates: Partial<SharedDebt>): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateSharedDebt() - Operação apenas no servidor')
      return
    }

    try {
      const updateData: any = {}

      if (updates.creditor !== undefined) updateData.creditor = updates.creditor
      if (updates.debtor !== undefined) updateData.debtor = updates.debtor
      if (updates.originalAmount !== undefined) updateData.originalAmount = updates.originalAmount
      if (updates.currentAmount !== undefined) updateData.currentAmount = updates.currentAmount
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.transactionId !== undefined) updateData.transactionId = updates.transactionId || null
      if (updates.status !== undefined) updateData.status = updates.status

      await this.prisma.sharedDebt.update({
        where: { id },
        data: updateData
      })
    } catch (error) {
      console.error('Erro ao atualizar dívida compartilhada:', error)
      throw error
    }
  }

  async deleteSharedDebt(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteSharedDebt() - Operação apenas no servidor')
      return
    }

    try {
      await this.prisma.sharedDebt.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Erro ao deletar dívida compartilhada:', error)
      throw error
    }
  }

  // Função adicional para processar pagamentos de dívidas
  async processDebtPayment(id: string, paymentAmount: number): Promise<SharedDebt> {
    if (!this.isAvailable) {
      throw new Error('DatabaseService.processDebtPayment() - Operação apenas no servidor')
    }

    try {
      const debt = await this.prisma.sharedDebt.findUnique({
        where: { id }
      })

      if (!debt) {
        throw new Error('Dívida não encontrada')
      }

      const newCurrentAmount = Math.max(0, Number(debt.currentAmount) - paymentAmount)
      const newStatus = newCurrentAmount === 0 ? 'paid' : debt.status

      const updatedDebt = await this.prisma.sharedDebt.update({
        where: { id },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus
        }
      })

      return {
        id: updatedDebt.id,
        creditor: updatedDebt.creditor,
        debtor: updatedDebt.debtor,
        originalAmount: Number(updatedDebt.originalAmount),
        currentAmount: Number(updatedDebt.currentAmount),
        description: updatedDebt.description,
        transactionId: updatedDebt.transactionId || undefined,
        status: updatedDebt.status as 'active' | 'paid' | 'cancelled',
        createdAt: updatedDebt.createdAt,
        updatedAt: updatedDebt.updatedAt
      }
    } catch (error) {
      console.error('Erro ao processar pagamento da dívida:', error)
      throw error
    }
  }

  // ============================================================================
  // CONTACTS (Placeholder - implementar quando modelo estiver no schema)
  // ============================================================================

  async getContacts(): Promise<Contact[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getContacts() - Operação apenas no servidor')
      return []
    }
    // TODO: Implementar quando modelo Contact estiver no schema
    return []
  }

  async saveContact(contact: Contact): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveContact() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo Contact estiver no schema
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateContact() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo Contact estiver no schema
  }

  async deleteContact(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteContact() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo Contact estiver no schema
  }

  // ============================================================================
  // THEME SETTINGS
  // ============================================================================

  async getThemeSettings(): Promise<any> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getThemeSettings() - Operação apenas no servidor')
      return null
    }
    // TODO: Implementar quando modelo ThemeSettings estiver no schema
    // Por enquanto retorna null para evitar erros
    return null
  }

  async saveThemeSettings(settings: any): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveThemeSettings() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo ThemeSettings estiver no schema
  }

  // ============================================================================
  // RECENT SEARCHES
  // ============================================================================

  async getRecentSearches(): Promise<string[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getRecentSearches() - Operação apenas no servidor')
      return []
    }
    // TODO: Implementar quando modelo RecentSearch estiver no schema
    // Por enquanto retorna array vazio para evitar erros
    return []
  }

  async saveRecentSearch(search: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveRecentSearch() - Operação apenas no servidor')
      return
    }
    // TODO: Implementar quando modelo RecentSearch estiver no schema
  }

  // ============================================================================
  // CATEGORIES
  // ============================================================================

  async getCategories(): Promise<any[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getCategories() - Operação apenas no servidor')
      return []
    }

    try {
      // ✅ CORREÇÃO CRÍTICA: Remover filtro por userId - categorias são globais
      const categories = await this.prisma.category.findMany({
        orderBy: { name: 'asc' }
      })

      return categories.map(category => ({
        id: category.id,
        userId: category.userId,
        name: category.name,
        type: category.type,
        color: category.color || undefined,
        icon: category.icon || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }))
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      return []
    }
  }

  async createCategory(data: {
    name: string
    type: string
    color?: string
    icon?: string
    isActive?: boolean
    userId: string
  }): Promise<any> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.createCategory() - Operação apenas no servidor')
      throw new Error('Operação disponível apenas no servidor')
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          id: crypto.randomUUID(),
          userId: data.userId,
          name: data.name,
          type: data.type,
          color: data.color || '#8884d8',
          icon: data.icon || '📁',
          isActive: data.isActive !== false
        }
      })

      return {
        id: category.id,
        userId: category.userId,
        name: category.name,
        type: category.type,
        color: category.color || undefined,
        icon: category.icon || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw error
    }
  }

  async updateCategory(id: string, updates: {
    name?: string
    type?: string
    color?: string
    icon?: string
    isActive?: boolean
  }): Promise<any> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.updateCategory() - Operação apenas no servidor')
      throw new Error('Operação disponível apenas no servidor')
    }

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          name: updates.name,
          type: updates.type,
          color: updates.color,
          icon: updates.icon,
          isActive: updates.isActive
        }
      })

      return {
        id: category.id,
        userId: category.userId,
        name: category.name,
        type: category.type,
        color: category.color || undefined,
        icon: category.icon || undefined,
        isActive: category.isActive,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw error
    }
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.deleteCategory() - Operação apenas no servidor')
      throw new Error('Operação disponível apenas no servidor')
    }

    try {
      await this.prisma.category.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Erro ao deletar categoria:', error)
      throw error
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  async saveAuditLog(log: {
    id: string
    timestamp: Date
    action: string
    details: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    userId?: string
    metadata?: any
  }): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.saveAuditLog() - Operação apenas no servidor')
      return
    }

    try {
      // TODO: Implementar salvamento de log de auditoria no banco
      // Aguardando criação da tabela audit_logs no schema Prisma
      console.warn('saveAuditLog() - Aguardando implementação da tabela audit_logs no schema')
    } catch (error) {
      console.error('Erro ao salvar log de auditoria:', error)
    }
  }

  async getLogs(filters?: {
    startDate?: Date
    endDate?: Date
    severity?: string
    action?: string
    limit?: number
  }): Promise<any[]> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.getLogs() - Operação apenas no servidor')
      return []
    }

    try {
      // TODO: Implementar busca de logs de auditoria no banco
      // Aguardando criação da tabela audit_logs no schema Prisma
      console.warn('getLogs() - Aguardando implementação da tabela audit_logs no schema')
      return []
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
      return []
    }
  }

  // ============================================================================

  async clearAllData(): Promise<void> {
    if (!this.isAvailable) {
      console.warn('DatabaseService.clearAllData() - Operação apenas no servidor')
      return
    }

    try {
      // Buscar todas as contas antes de limpar para recalcular saldos
      const accounts = await this.prisma.account.findMany({ select: { id: true } });

      await this.prisma.transaction.deleteMany();

      // Recalcular saldos de todas as contas (que devem ficar zerados)
      const { recalculateAccountBalance } = await import('@/lib/transaction-audit');
      for (const account of accounts) {
        await recalculateAccountBalance(account.id);
      }

      await this.prisma.account.deleteMany();
      console.log('Todos os dados foram limpos do banco de dados')
    } catch (error) {
      console.error('Erro ao limpar dados:', error)
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Instância singleton
export const databaseService = new DatabaseService()
export { DatabaseService }
export default databaseService
