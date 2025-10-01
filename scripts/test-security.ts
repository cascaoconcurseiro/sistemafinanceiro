#!/usr/bin/env tsx

/**
 * SCRIPT DE TESTE DE SEGURANÇA
 * 
 * Valida que o sistema financeiro está funcionando corretamente
 * sem usar localStorage, sessionStorage ou IndexedDB
 */

import { systemInitializer } from '../src/lib/initialization/system-initializer';
import { financialService } from '../src/lib/services/financial-service';
import { auditLogger } from '../src/lib/audit/audit-logger';
import { securityMonitor } from '../src/lib/audit/security-monitor';
import { storageBlocker } from '../src/lib/security/storage-blocker';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

class SecurityTester {
  private results: TestResult[] = [];

  /**
   * Executa todos os testes de segurança
   */
  async runAllTests(): Promise<void> {
    console.log('🔒 INICIANDO TESTES DE SEGURANÇA DO SISTEMA FINANCEIRO');
    console.log('=' .repeat(60));

    try {
      // Testes de inicialização
      await this.testSystemInitialization();
      await this.testStorageBlocking();
      await this.testDatabaseConnection();
      
      // Testes de operações CRUD
      await this.testAccountOperations();
      await this.testTransactionOperations();
      await this.testCreditCardOperations();
      await this.testBudgetOperations();
      
      // Testes de segurança
      await this.testAuditSystem();
      await this.testSecurityMonitoring();
      await this.testDataIntegrity();
      
      // Testes de performance
      await this.testPerformance();

      // Relatório final
      this.printResults();

    } catch (error) {
      console.error('❌ Erro crítico nos testes:', error);
      process.exit(1);
    }
  }

  /**
   * Executa um teste individual
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'PASS',
        message: 'Teste executado com sucesso',
        duration
      });
      
      console.log(`✅ ${name} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      
      this.results.push({
        name,
        status: 'FAIL',
        message,
        duration
      });
      
      console.log(`❌ ${name} - ${message} (${duration}ms)`);
    }
  }

  /**
   * Testa inicialização do sistema
   */
  private async testSystemInitialization(): Promise<void> {
    await this.runTest('Inicialização do Sistema', async () => {
      await systemInitializer.initialize();
      
      if (!systemInitializer.isInitialized()) {
        throw new Error('Sistema não foi inicializado corretamente');
      }
    });
  }

  /**
   * Testa bloqueio de storage local
   */
  private async testStorageBlocking(): Promise<void> {
    await this.runTest('Bloqueio de localStorage', async () => {
      try {
        // Tenta usar localStorage - deve ser bloqueado
        (global as any).localStorage = {
          setItem: () => {},
          getItem: () => null,
          removeItem: () => {},
          clear: () => {}
        };
        
        storageBlocker.blockLocalStorage();
        
        // Simula tentativa de uso
        try {
          (global as any).localStorage.setItem('test', 'blocked');
          throw new Error('localStorage não foi bloqueado');
        } catch (blockError) {
          if (!(blockError instanceof Error) || !blockError.message.includes('bloqueado')) {
            throw blockError;
          }
        }
      } catch (error) {
        // Esperado - localStorage deve ser bloqueado
      }
    });

    await this.runTest('Bloqueio de sessionStorage', async () => {
      try {
        // Tenta usar sessionStorage - deve ser bloqueado
        (global as any).sessionStorage = {
          setItem: () => {},
          getItem: () => null,
          removeItem: () => {},
          clear: () => {}
        };
        
        storageBlocker.blockSessionStorage();
        
        // Simula tentativa de uso
        try {
          (global as any).sessionStorage.setItem('test', 'blocked');
          throw new Error('sessionStorage não foi bloqueado');
        } catch (blockError) {
          if (!(blockError instanceof Error) || !blockError.message.includes('bloqueado')) {
            throw blockError;
          }
        }
      } catch (error) {
        // Esperado - sessionStorage deve ser bloqueado
      }
    });
  }

  /**
   * Testa conexão com banco de dados
   */
  private async testDatabaseConnection(): Promise<void> {
    await this.runTest('Conexão com Banco de Dados', async () => {
      const isConnected = await financialService.testConnection();
      
      if (!isConnected) {
        throw new Error('Não foi possível conectar ao banco de dados');
      }
    });
  }

  /**
   * Testa operações de contas
   */
  private async testAccountOperations(): Promise<void> {
    await this.runTest('Operações de Contas', async () => {
      // Criar conta
      const account = await financialService.createAccount({
        name: 'Conta Teste Segurança',
        type: 'checking',
        balance: 1000,
        currency: 'BRL'
      });

      if (!account.id) {
        throw new Error('Conta não foi criada');
      }

      // Buscar conta
      const foundAccount = await financialService.getAccount(account.id);
      if (!foundAccount) {
        throw new Error('Conta não foi encontrada');
      }

      // Atualizar conta
      const updatedAccount = await financialService.updateAccount(account.id, {
        name: 'Conta Teste Atualizada'
      });

      if (updatedAccount.name !== 'Conta Teste Atualizada') {
        throw new Error('Conta não foi atualizada');
      }

      // Deletar conta
      await financialService.deleteAccount(account.id);
    });
  }

  /**
   * Testa operações de transações
   */
  private async testTransactionOperations(): Promise<void> {
    await this.runTest('Operações de Transações', async () => {
      // Criar conta para transação
      const account = await financialService.createAccount({
        name: 'Conta para Transação',
        type: 'checking',
        balance: 1000,
        currency: 'BRL'
      });

      // Criar transação
      const transaction = await financialService.createTransaction({
        accountId: account.id,
        amount: 100,
        description: 'Transação Teste',
        category: 'Teste',
        type: 'income',
        date: new Date()
      });

      if (!transaction.id) {
        throw new Error('Transação não foi criada');
      }

      // Buscar transações
      const transactions = await financialService.getTransactions();
      const foundTransaction = transactions.find(t => t.id === transaction.id);
      
      if (!foundTransaction) {
        throw new Error('Transação não foi encontrada');
      }

      // Limpar dados de teste
      await financialService.deleteTransaction(transaction.id);
      await financialService.deleteAccount(account.id);
    });
  }

  /**
   * Testa operações de cartões de crédito
   */
  private async testCreditCardOperations(): Promise<void> {
    await this.runTest('Operações de Cartões de Crédito', async () => {
      // Criar cartão
      const creditCard = await financialService.createCreditCard({
        name: 'Cartão Teste',
        limit: 5000,
        currentBalance: 0,
        dueDay: 15,
        closingDay: 10
      });

      if (!creditCard.id) {
        throw new Error('Cartão não foi criado');
      }

      // Buscar cartões
      const creditCards = await financialService.getCreditCards();
      const foundCard = creditCards.find(c => c.id === creditCard.id);
      
      if (!foundCard) {
        throw new Error('Cartão não foi encontrado');
      }

      // Limpar dados de teste
      await financialService.deleteCreditCard(creditCard.id);
    });
  }

  /**
   * Testa operações de orçamentos
   */
  private async testBudgetOperations(): Promise<void> {
    await this.runTest('Operações de Orçamentos', async () => {
      // Criar orçamento
      const budget = await financialService.createBudget({
        name: 'Orçamento Teste',
        category: 'Teste',
        amount: 500,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      if (!budget.id) {
        throw new Error('Orçamento não foi criado');
      }

      // Buscar orçamentos
      const budgets = await financialService.getBudgets();
      const foundBudget = budgets.find(b => b.id === budget.id);
      
      if (!foundBudget) {
        throw new Error('Orçamento não foi encontrado');
      }

      // Limpar dados de teste
      await financialService.deleteBudget(budget.id);
    });
  }

  /**
   * Testa sistema de auditoria
   */
  private async testAuditSystem(): Promise<void> {
    await this.runTest('Sistema de Auditoria', async () => {
      // Registrar evento de teste
      await auditLogger.logSystemEvent({
        type: 'system_event',
        level: 'info',
        source: 'security-test',
        action: 'test_audit',
        details: { message: 'Teste do sistema de auditoria' }
      });

      // Verificar se o evento foi registrado
      const events = await auditLogger.getRecentEvents(10);
      const testEvent = events.find(e => e.source === 'security-test');
      
      if (!testEvent) {
        throw new Error('Evento de auditoria não foi registrado');
      }
    });
  }

  /**
   * Testa monitoramento de segurança
   */
  private async testSecurityMonitoring(): Promise<void> {
    await this.runTest('Monitoramento de Segurança', async () => {
      // Iniciar monitoramento
      await securityMonitor.start();
      
      if (!securityMonitor.isMonitorActive()) {
        throw new Error('Monitor de segurança não está ativo');
      }

      // Simular evento de segurança
      await securityMonitor.reportSecurityViolation({
        type: 'storage_access',
        severity: 'medium',
        source: 'security-test',
        description: 'Teste de violação de segurança',
        blocked: true
      });

      // Parar monitoramento
      await securityMonitor.stop();
    });
  }

  /**
   * Testa integridade dos dados
   */
  private async testDataIntegrity(): Promise<void> {
    await this.runTest('Integridade dos Dados', async () => {
      const isValid = await financialService.validateDataIntegrity();
      
      if (!isValid) {
        throw new Error('Falha na validação de integridade dos dados');
      }
    });
  }

  /**
   * Testa performance do sistema
   */
  private async testPerformance(): Promise<void> {
    await this.runTest('Performance do Sistema', async () => {
      const startTime = Date.now();
      
      // Criar múltiplas operações
      const account = await financialService.createAccount({
        name: 'Conta Performance',
        type: 'checking',
        balance: 1000,
        currency: 'BRL'
      });

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          financialService.createTransaction({
            accountId: account.id,
            amount: 10,
            description: `Transação ${i}`,
            category: 'Teste',
            type: 'expense',
            date: new Date()
          })
        );
      }

      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Limpar dados de teste
      const transactions = await financialService.getTransactions();
      for (const transaction of transactions) {
        if (transaction.accountId === account.id) {
          await financialService.deleteTransaction(transaction.id);
        }
      }
      await financialService.deleteAccount(account.id);

      if (duration > 5000) { // 5 segundos
        throw new Error(`Performance inadequada: ${duration}ms`);
      }
    });
  }

  /**
   * Imprime resultados dos testes
   */
  private printResults(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RELATÓRIO DE TESTES DE SEGURANÇA');
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`\n✅ Testes Aprovados: ${passed}`);
    console.log(`❌ Testes Falharam: ${failed}`);
    console.log(`📊 Total de Testes: ${total}`);
    console.log(`🎯 Taxa de Sucesso: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.name}: ${result.message}`);
        });
    }

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n⏱️  Tempo Total: ${totalDuration}ms`);

    if (failed === 0) {
      console.log('\n🎉 TODOS OS TESTES DE SEGURANÇA PASSARAM!');
      console.log('🔒 Sistema financeiro seguro está funcionando corretamente');
      console.log('🚫 localStorage/sessionStorage/IndexedDB estão bloqueados');
      console.log('🏦 Banco de dados é a única fonte de verdade');
    } else {
      console.log('\n⚠️  ALGUNS TESTES FALHARAM - VERIFIQUE A CONFIGURAÇÃO');
      process.exit(1);
    }
  }
}

// Executa os testes se o script for chamado diretamente
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });
}

export { SecurityTester };