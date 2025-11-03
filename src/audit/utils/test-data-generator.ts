/**
 * Gerador de dados de teste para auditoria
 * Cria dados sintéticos para testes de isolamento e integridade
 */

import { AuditLogger } from '@/lib/logging/audit-logger';

export interface TestUser {
  id: string;
  email: string;
  name: string;
  password: string;
  isTestUser: boolean;
}

export interface TestTransaction {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

export interface TestAccount {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
}

export class TestDataGenerator {
  private logger: AuditLogger;
  private testUserIds: string[] = [];
  private testAccountIds: string[] = [];
  private testTransactionIds: string[] = [];

  constructor(logger: AuditLogger) {
    this.logger = logger;
  }

  async createTestUsers(count: number = 2): Promise<TestUser[]> {
    this.logger.info('TestDataGenerator', `🧪 Criando ${count} usuários de teste`);

    const users: TestUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const user: TestUser = {
        id: this.generateId('user'),
        email: `test_user_${i}_${Date.now()}@audit.test`,
        name: `Test User ${i + 1}`,
        password: process.env.TEST_USER_PASSWORD || 'default_test_password', // ✅ CORREÇÃO: Usar variável de ambiente
        isTestUser: true
      };

      users.push(user);
      this.testUserIds.push(user.id);
    }

    return users;
  }

  async createTestAccounts(userId: string, count: number = 2): Promise<TestAccount[]> {
    this.logger.info('TestDataGenerator', `🏦 Criando ${count} contas de teste para usuário ${userId}`);

    const accounts: TestAccount[] = [];
    
    for (let i = 0; i < count; i++) {
      const account: TestAccount = {
        id: this.generateId('account'),
        userId,
        name: `Test Account ${i + 1}`,
        type: i === 0 ? 'checking' : 'savings',
        balance: Math.random() * 10000
      };

      accounts.push(account);
      this.testAccountIds.push(account.id);
    }

    return accounts;
  }

  async createTestTransactions(userId: string, accountId: string, count: number = 10): Promise<TestTransaction[]> {
    this.logger.info('TestDataGenerator', `💰 Criando ${count} transações de teste`);

    const transactions: TestTransaction[] = [];
    const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping'];
    
    for (let i = 0; i < count; i++) {
      const transaction: TestTransaction = {
        id: this.generateId('transaction'),
        userId,
        accountId,
        amount: Math.random() * 1000,
        description: `Test Transaction ${i + 1}`,
        type: Math.random() > 0.5 ? 'expense' : 'income',
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: categories[Math.floor(Math.random() * categories.length)]
      };

      transactions.push(transaction);
      this.testTransactionIds.push(transaction.id);
    }

    return transactions;
  }

  async insertTestData(users: TestUser[], accounts: TestAccount[], transactions: TestTransaction[]): Promise<void> {
    this.logger.info('TestDataGenerator', '📝 Inserindo dados de teste no banco');

    try {
      // Importar Prisma dinamicamente para evitar erros se não estiver disponível
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Inserir usuários
      for (const user of users) {
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email,
              name: user.name,
              password: user.password, // Em produção, seria hasheado
              isActive: true
            }
          });
        } catch (error) {
          this.logger.warn('TestDataGenerator', `Erro ao criar usuário ${user.email}: ${error}`);
        }
      }

      // Inserir contas
      for (const account of accounts) {
        try {
          await prisma.account.create({
            data: {
              id: account.id,
              userId: account.userId,
              name: account.name,
              type: account.type,
              isActive: true
            }
          });
        } catch (error) {
          this.logger.warn('TestDataGenerator', `Erro ao criar conta ${account.name}: ${error}`);
        }
      }

      // Inserir transações
      for (const transaction of transactions) {
        try {
          await prisma.transaction.create({
            data: {
              id: transaction.id,
              userId: transaction.userId,
              accountId: transaction.accountId,
              amount: transaction.amount,
              description: transaction.description,
              type: transaction.type,
              date: new Date(transaction.date),
              category: transaction.category,
              status: 'cleared'
            }
          });
        } catch (error) {
          this.logger.warn('TestDataGenerator', `Erro ao criar transação ${transaction.description}: ${error}`);
        }
      }

      await prisma.$disconnect();
      this.logger.info('TestDataGenerator', '✅ Dados de teste inseridos com sucesso');

    } catch (error) {
      this.logger.error('TestDataGenerator', 'Erro ao inserir dados de teste', error as Error);
      throw error;
    }
  }

  async cleanupTestData(): Promise<void> {
    this.logger.info('TestDataGenerator', '🧹 Limpando dados de teste');

    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Deletar em ordem reversa devido às foreign keys
      
      // Deletar transações
      if (this.testTransactionIds.length > 0) {
        await prisma.transaction.deleteMany({
          where: {
            id: {
              in: this.testTransactionIds
            }
          }
        });
        this.logger.info('TestDataGenerator', `🗑️ ${this.testTransactionIds.length} transações de teste removidas`);
      }

      // Deletar contas
      if (this.testAccountIds.length > 0) {
        await prisma.account.deleteMany({
          where: {
            id: {
              in: this.testAccountIds
            }
          }
        });
        this.logger.info('TestDataGenerator', `🗑️ ${this.testAccountIds.length} contas de teste removidas`);
      }

      // Deletar usuários
      if (this.testUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: {
              in: this.testUserIds
            }
          }
        });
        this.logger.info('TestDataGenerator', `🗑️ ${this.testUserIds.length} usuários de teste removidos`);
      }

      await prisma.$disconnect();

      // Limpar arrays
      this.testUserIds = [];
      this.testAccountIds = [];
      this.testTransactionIds = [];

      this.logger.info('TestDataGenerator', '✅ Limpeza de dados de teste concluída');

    } catch (error) {
      this.logger.error('TestDataGenerator', 'Erro ao limpar dados de teste', error as Error);
      throw error;
    }
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `${prefix}_test_${timestamp}_${random}`;
  }

  // Métodos para testes específicos
  async createSharedExpenseTestData(): Promise<{
    users: TestUser[];
    accounts: TestAccount[];
    sharedTransaction: TestTransaction;
  }> {
    this.logger.info('TestDataGenerator', '🤝 Criando dados de teste para despesas compartilhadas');

    const users = await this.createTestUsers(3); // 3 usuários para teste de compartilhamento
    const accounts: TestAccount[] = [];

    // Criar uma conta para cada usuário
    for (const user of users) {
      const userAccounts = await this.createTestAccounts(user.id, 1);
      accounts.push(...userAccounts);
    }

    // Criar uma transação compartilhada
    const sharedTransaction: TestTransaction = {
      id: this.generateId('shared_transaction'),
      userId: users[0].id, // Usuário que pagou
      accountId: accounts[0].id,
      amount: 300, // R$ 300 para dividir entre 3 pessoas
      description: 'Test Shared Expense - Restaurant',
      type: 'expense',
      date: new Date().toISOString(),
      category: 'Food'
    };

    this.testTransactionIds.push(sharedTransaction.id);

    return {
      users,
      accounts,
      sharedTransaction
    };
  }

  async createFinancialEngineTestData(): Promise<{
    user: TestUser;
    checkingAccount: TestAccount;
    savingsAccount: TestAccount;
    transactions: TestTransaction[];
  }> {
    this.logger.info('TestDataGenerator', '🧮 Criando dados de teste para engines financeiros');

    const users = await this.createTestUsers(1);
    const user = users[0];

    const checkingAccount: TestAccount = {
      id: this.generateId('checking'),
      userId: user.id,
      name: 'Test Checking Account',
      type: 'checking',
      balance: 1000
    };

    const savingsAccount: TestAccount = {
      id: this.generateId('savings'),
      userId: user.id,
      name: 'Test Savings Account',
      type: 'savings',
      balance: 5000
    };

    this.testAccountIds.push(checkingAccount.id, savingsAccount.id);

    // Criar transações para testar double-entry
    const transactions: TestTransaction[] = [
      {
        id: this.generateId('income'),
        userId: user.id,
        accountId: checkingAccount.id,
        amount: 2000,
        description: 'Test Income',
        type: 'income',
        date: new Date().toISOString(),
        category: 'Salary'
      },
      {
        id: this.generateId('expense'),
        userId: user.id,
        accountId: checkingAccount.id,
        amount: -500,
        description: 'Test Expense',
        type: 'expense',
        date: new Date().toISOString(),
        category: 'Food'
      },
      {
        id: this.generateId('transfer'),
        userId: user.id,
        accountId: checkingAccount.id,
        amount: -1000,
        description: 'Transfer to Savings',
        type: 'expense',
        date: new Date().toISOString(),
        category: 'Transfer'
      }
    ];

    this.testTransactionIds.push(...transactions.map(t => t.id));

    return {
      user,
      checkingAccount,
      savingsAccount,
      transactions
    };
  }

  getTestDataIds(): {
    userIds: string[];
    accountIds: string[];
    transactionIds: string[];
  } {
    return {
      userIds: [...this.testUserIds],
      accountIds: [...this.testAccountIds],
      transactionIds: [...this.testTransactionIds]
    };
  }
}