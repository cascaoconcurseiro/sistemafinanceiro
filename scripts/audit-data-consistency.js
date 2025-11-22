/**
 * Script de Auditoria de Consistência de Dados
 * Verifica integridade e consistência de todas as entidades financeiras
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadData() {
  const dataPath = path.join(__dirname, '../data/financial-data.json');
  
  if (!fs.existsSync(dataPath)) {
    log('❌ Arquivo de dados não encontrado!', 'red');
    return null;
  }
  
  const rawData = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(rawData);
}

class DataAuditor {
  constructor(data) {
    this.data = data;
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  addError(category, message, details = {}) {
    this.errors.push({ category, message, details });
  }

  addWarning(category, message, details = {}) {
    this.warnings.push({ category, message, details });
  }

  addInfo(category, message, details = {}) {
    this.info.push({ category, message, details });
  }

  // 1. AUDITORIA DE CONTAS
  auditAccounts() {
    log('\n📊 Auditando Contas...', 'cyan');
    const accounts = this.data.accounts || [];
    
    if (accounts.length === 0) {
      this.addWarning('ACCOUNTS', 'Nenhuma conta cadastrada');
      return;
    }

    accounts.forEach(account => {
      // Validar campos obrigatórios
      if (!account.id) {
        this.addError('ACCOUNTS', 'Conta sem ID', { account });
      }
      if (!account.name) {
        this.addError('ACCOUNTS', 'Conta sem nome', { id: account.id });
      }
      if (account.balance === undefined || account.balance === null) {
        this.addError('ACCOUNTS', 'Conta sem saldo definido', { id: account.id, name: account.name });
      }
      if (!account.type) {
        this.addError('ACCOUNTS', 'Conta sem tipo', { id: account.id, name: account.name });
      }

      // Validar tipos válidos
      const validTypes = ['checking', 'savings', 'investment', 'wallet'];
      if (account.type && !validTypes.includes(account.type)) {
        this.addError('ACCOUNTS', `Tipo de conta inválido: ${account.type}`, { id: account.id });
      }
    });

    this.addInfo('ACCOUNTS', `Total de contas: ${accounts.length}`);
  }

  // 2. AUDITORIA DE CARTÕES DE CRÉDITO
  auditCreditCards() {
    log('\n💳 Auditando Cartões de Crédito...', 'cyan');
    const cards = this.data.creditCards || [];
    
    if (cards.length === 0) {
      this.addWarning('CREDIT_CARDS', 'Nenhum cartão cadastrado');
      return;
    }

    cards.forEach(card => {
      // Validar campos obrigatórios
      if (!card.id) {
        this.addError('CREDIT_CARDS', 'Cartão sem ID', { card });
      }
      if (!card.name) {
        this.addError('CREDIT_CARDS', 'Cartão sem nome', { id: card.id });
      }
      if (card.limit === undefined || card.limit === null) {
        this.addError('CREDIT_CARDS', 'Cartão sem limite definido', { id: card.id, name: card.name });
      }
      if (!card.closingDay) {
        this.addWarning('CREDIT_CARDS', 'Cartão sem dia de fechamento', { id: card.id, name: card.name });
      }
      if (!card.dueDay) {
        this.addWarning('CREDIT_CARDS', 'Cartão sem dia de vencimento', { id: card.id, name: card.name });
      }

      // Validar dias válidos
      if (card.closingDay && (card.closingDay < 1 || card.closingDay > 31)) {
        this.addError('CREDIT_CARDS', `Dia de fechamento inválido: ${card.closingDay}`, { id: card.id });
      }
      if (card.dueDay && (card.dueDay < 1 || card.dueDay > 31)) {
        this.addError('CREDIT_CARDS', `Dia de vencimento inválido: ${card.dueDay}`, { id: card.id });
      }
    });

    this.addInfo('CREDIT_CARDS', `Total de cartões: ${cards.length}`);
  }


  // 3. AUDITORIA DE TRANSAÇÕES
  auditTransactions() {
    log('\n💰 Auditando Transações...', 'cyan');
    const transactions = this.data.transactions || [];
    const accounts = this.data.accounts || [];
    const cards = this.data.creditCards || [];
    const categories = this.data.categories || [];
    
    if (transactions.length === 0) {
      this.addWarning('TRANSACTIONS', 'Nenhuma transação cadastrada');
      return;
    }

    const accountIds = new Set(accounts.map(a => a.id));
    const cardIds = new Set(cards.map(c => c.id));
    const categoryIds = new Set(categories.map(c => c.id));

    transactions.forEach(transaction => {
      // Validar campos obrigatórios
      if (!transaction.id) {
        this.addError('TRANSACTIONS', 'Transação sem ID', { transaction });
      }
      if (!transaction.description) {
        this.addWarning('TRANSACTIONS', 'Transação sem descrição', { id: transaction.id });
      }
      if (transaction.amount === undefined || transaction.amount === null) {
        this.addError('TRANSACTIONS', 'Transação sem valor', { id: transaction.id });
      }
      if (!transaction.type) {
        this.addError('TRANSACTIONS', 'Transação sem tipo', { id: transaction.id });
      }
      if (!transaction.date) {
        this.addError('TRANSACTIONS', 'Transação sem data', { id: transaction.id });
      }

      // Validar tipos válidos
      const validTypes = ['income', 'expense', 'transfer'];
      if (transaction.type && !validTypes.includes(transaction.type)) {
        this.addError('TRANSACTIONS', `Tipo de transação inválido: ${transaction.type}`, { id: transaction.id });
      }

      // Validar referências
      if (transaction.accountId && !accountIds.has(transaction.accountId)) {
        this.addError('TRANSACTIONS', 'Transação referencia conta inexistente', { 
          id: transaction.id, 
          accountId: transaction.accountId 
        });
      }

      if (transaction.creditCardId && !cardIds.has(transaction.creditCardId)) {
        this.addError('TRANSACTIONS', 'Transação referencia cartão inexistente', { 
          id: transaction.id, 
          creditCardId: transaction.creditCardId 
        });
      }

      if (transaction.categoryId && !categoryIds.has(transaction.categoryId)) {
        this.addWarning('TRANSACTIONS', 'Transação referencia categoria inexistente', { 
          id: transaction.id, 
          categoryId: transaction.categoryId 
        });
      }

      // Validar transferências
      if (transaction.type === 'transfer') {
        if (!transaction.fromAccountId) {
          this.addError('TRANSACTIONS', 'Transferência sem conta de origem', { id: transaction.id });
        }
        if (!transaction.toAccountId) {
          this.addError('TRANSACTIONS', 'Transferência sem conta de destino', { id: transaction.id });
        }
        if (transaction.fromAccountId === transaction.toAccountId) {
          this.addError('TRANSACTIONS', 'Transferência com mesma conta origem/destino', { id: transaction.id });
        }
      }

      // Validar valores
      if (transaction.amount && transaction.amount < 0) {
        this.addWarning('TRANSACTIONS', 'Transação com valor negativo', { 
          id: transaction.id, 
          amount: transaction.amount 
        });
      }

      // Validar parcelamentos
      if (transaction.installments) {
        if (transaction.installments < 1) {
          this.addError('TRANSACTIONS', 'Número de parcelas inválido', { 
            id: transaction.id, 
            installments: transaction.installments 
          });
        }
        if (transaction.currentInstallment && transaction.currentInstallment > transaction.installments) {
          this.addError('TRANSACTIONS', 'Parcela atual maior que total', { 
            id: transaction.id, 
            current: transaction.currentInstallment,
            total: transaction.installments
          });
        }
      }
    });

    this.addInfo('TRANSACTIONS', `Total de transações: ${transactions.length}`);
  }

  // 4. AUDITORIA DE SALDOS
  auditBalances() {
    log('\n💵 Auditando Saldos...', 'cyan');
    const transactions = this.data.transactions || [];
    const accounts = this.data.accounts || [];

    accounts.forEach(account => {
      // Calcular saldo baseado em transações
      const accountTransactions = transactions.filter(t => 
        (t.accountId === account.id && t.type !== 'transfer') ||
        (t.type === 'transfer' && (t.fromAccountId === account.id || t.toAccountId === account.id))
      );

      let calculatedBalance = 0;
      accountTransactions.forEach(t => {
        if (t.type === 'income') {
          calculatedBalance += t.amount;
        } else if (t.type === 'expense') {
          calculatedBalance -= t.amount;
        } else if (t.type === 'transfer') {
          if (t.fromAccountId === account.id) {
            calculatedBalance -= t.amount;
          }
          if (t.toAccountId === account.id) {
            calculatedBalance += t.amount;
          }
        }
      });

      const difference = Math.abs(account.balance - calculatedBalance);
      if (difference > 0.01) { // Tolerância de 1 centavo para arredondamentos
        this.addError('BALANCES', 'Saldo da conta não bate com transações', {
          accountId: account.id,
          accountName: account.name,
          registeredBalance: account.balance,
          calculatedBalance: calculatedBalance,
          difference: difference
        });
      }
    });
  }

  // 5. AUDITORIA DE FATURAS
  auditInvoices() {
    log('\n📄 Auditando Faturas...', 'cyan');
    const invoices = this.data.invoices || [];
    const cards = this.data.creditCards || [];
    const transactions = this.data.transactions || [];

    if (invoices.length === 0) {
      this.addWarning('INVOICES', 'Nenhuma fatura cadastrada');
      return;
    }

    const cardIds = new Set(cards.map(c => c.id));

    invoices.forEach(invoice => {
      // Validar campos obrigatórios
      if (!invoice.id) {
        this.addError('INVOICES', 'Fatura sem ID', { invoice });
      }
      if (!invoice.creditCardId) {
        this.addError('INVOICES', 'Fatura sem cartão associado', { id: invoice.id });
      }
      if (invoice.amount === undefined || invoice.amount === null) {
        this.addError('INVOICES', 'Fatura sem valor', { id: invoice.id });
      }
      if (!invoice.dueDate) {
        this.addError('INVOICES', 'Fatura sem data de vencimento', { id: invoice.id });
      }

      // Validar referências
      if (invoice.creditCardId && !cardIds.has(invoice.creditCardId)) {
        this.addError('INVOICES', 'Fatura referencia cartão inexistente', { 
          id: invoice.id, 
          creditCardId: invoice.creditCardId 
        });
      }

      // Validar status
      const validStatuses = ['open', 'closed', 'paid', 'overdue'];
      if (invoice.status && !validStatuses.includes(invoice.status)) {
        this.addError('INVOICES', `Status de fatura inválido: ${invoice.status}`, { id: invoice.id });
      }

      // Calcular total de transações da fatura
      const invoiceTransactions = transactions.filter(t => 
        t.creditCardId === invoice.creditCardId &&
        t.invoiceId === invoice.id
      );

      const calculatedAmount = invoiceTransactions.reduce((sum, t) => sum + t.amount, 0);
      const difference = Math.abs(invoice.amount - calculatedAmount);
      
      if (difference > 0.01) {
        this.addError('INVOICES', 'Valor da fatura não bate com transações', {
          invoiceId: invoice.id,
          registeredAmount: invoice.amount,
          calculatedAmount: calculatedAmount,
          difference: difference
        });
      }
    });

    this.addInfo('INVOICES', `Total de faturas: ${invoices.length}`);
  }


  // 6. AUDITORIA DE DESPESAS COMPARTILHADAS
  auditSharedExpenses() {
    log('\n👥 Auditando Despesas Compartilhadas...', 'cyan');
    const trips = this.data.trips || [];
    const sharedExpenses = this.data.sharedExpenses || [];
    const debts = this.data.debts || [];

    if (trips.length === 0 && sharedExpenses.length === 0) {
      this.addInfo('SHARED_EXPENSES', 'Nenhuma despesa compartilhada cadastrada');
      return;
    }

    const tripIds = new Set(trips.map(t => t.id));

    // Auditar viagens
    trips.forEach(trip => {
      if (!trip.id) {
        this.addError('SHARED_EXPENSES', 'Viagem sem ID', { trip });
      }
      if (!trip.name) {
        this.addError('SHARED_EXPENSES', 'Viagem sem nome', { id: trip.id });
      }
      if (!trip.participants || trip.participants.length === 0) {
        this.addError('SHARED_EXPENSES', 'Viagem sem participantes', { id: trip.id, name: trip.name });
      }
    });

    // Auditar despesas compartilhadas
    sharedExpenses.forEach(expense => {
      if (!expense.id) {
        this.addError('SHARED_EXPENSES', 'Despesa compartilhada sem ID', { expense });
      }
      if (!expense.description) {
        this.addWarning('SHARED_EXPENSES', 'Despesa compartilhada sem descrição', { id: expense.id });
      }
      if (expense.amount === undefined || expense.amount === null) {
        this.addError('SHARED_EXPENSES', 'Despesa compartilhada sem valor', { id: expense.id });
      }
      if (!expense.paidBy) {
        this.addError('SHARED_EXPENSES', 'Despesa compartilhada sem pagador', { id: expense.id });
      }
      if (!expense.splitBetween || expense.splitBetween.length === 0) {
        this.addError('SHARED_EXPENSES', 'Despesa compartilhada sem divisão', { id: expense.id });
      }

      // Validar referência à viagem
      if (expense.tripId && !tripIds.has(expense.tripId)) {
        this.addError('SHARED_EXPENSES', 'Despesa referencia viagem inexistente', { 
          id: expense.id, 
          tripId: expense.tripId 
        });
      }

      // Validar divisão
      if (expense.splitBetween && expense.amount) {
        const totalSplit = expense.splitBetween.reduce((sum, split) => sum + (split.amount || 0), 0);
        const difference = Math.abs(expense.amount - totalSplit);
        
        if (difference > 0.01) {
          this.addError('SHARED_EXPENSES', 'Divisão não soma o valor total', {
            expenseId: expense.id,
            totalAmount: expense.amount,
            splitTotal: totalSplit,
            difference: difference
          });
        }
      }
    });

    // Auditar dívidas
    debts.forEach(debt => {
      if (!debt.id) {
        this.addError('SHARED_EXPENSES', 'Dívida sem ID', { debt });
      }
      if (!debt.from) {
        this.addError('SHARED_EXPENSES', 'Dívida sem devedor', { id: debt.id });
      }
      if (!debt.to) {
        this.addError('SHARED_EXPENSES', 'Dívida sem credor', { id: debt.id });
      }
      if (debt.amount === undefined || debt.amount === null) {
        this.addError('SHARED_EXPENSES', 'Dívida sem valor', { id: debt.id });
      }

      // Validar status
      const validStatuses = ['pending', 'paid', 'cancelled'];
      if (debt.status && !validStatuses.includes(debt.status)) {
        this.addError('SHARED_EXPENSES', `Status de dívida inválido: ${debt.status}`, { id: debt.id });
      }
    });

    this.addInfo('SHARED_EXPENSES', `Total de viagens: ${trips.length}`);
    this.addInfo('SHARED_EXPENSES', `Total de despesas compartilhadas: ${sharedExpenses.length}`);
    this.addInfo('SHARED_EXPENSES', `Total de dívidas: ${debts.length}`);
  }

  // 7. AUDITORIA DE DUPLICAÇÕES
  auditDuplicates() {
    log('\n🔍 Auditando Duplicações...', 'cyan');
    
    // Verificar IDs duplicados em cada entidade
    const entities = [
      { name: 'accounts', data: this.data.accounts || [] },
      { name: 'creditCards', data: this.data.creditCards || [] },
      { name: 'transactions', data: this.data.transactions || [] },
      { name: 'categories', data: this.data.categories || [] },
      { name: 'invoices', data: this.data.invoices || [] },
      { name: 'trips', data: this.data.trips || [] },
      { name: 'sharedExpenses', data: this.data.sharedExpenses || [] },
      { name: 'debts', data: this.data.debts || [] },
    ];

    entities.forEach(entity => {
      const ids = entity.data.map(item => item.id).filter(id => id);
      const uniqueIds = new Set(ids);
      
      if (ids.length !== uniqueIds.size) {
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        this.addError('DUPLICATES', `IDs duplicados em ${entity.name}`, { 
          entity: entity.name,
          duplicates: [...new Set(duplicates)]
        });
      }
    });

    // Verificar transações duplicadas (mesma descrição, valor, data)
    const transactions = this.data.transactions || [];
    const transactionKeys = new Map();
    
    transactions.forEach(t => {
      const key = `${t.description}_${t.amount}_${t.date}_${t.type}`;
      if (transactionKeys.has(key)) {
        this.addWarning('DUPLICATES', 'Possível transação duplicada', {
          transaction1: transactionKeys.get(key),
          transaction2: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date
        });
      } else {
        transactionKeys.set(key, t.id);
      }
    });
  }

  // 8. AUDITORIA DE INTEGRIDADE REFERENCIAL
  auditReferentialIntegrity() {
    log('\n🔗 Auditando Integridade Referencial...', 'cyan');
    
    const accounts = this.data.accounts || [];
    const cards = this.data.creditCards || [];
    const transactions = this.data.transactions || [];
    const invoices = this.data.invoices || [];

    // Verificar transações órfãs (sem conta ou cartão)
    transactions.forEach(t => {
      if (t.type !== 'transfer' && !t.accountId && !t.creditCardId) {
        this.addError('REFERENTIAL_INTEGRITY', 'Transação sem conta ou cartão associado', {
          id: t.id,
          description: t.description
        });
      }
    });

    // Verificar faturas órfãs
    invoices.forEach(invoice => {
      const hasTransactions = transactions.some(t => t.invoiceId === invoice.id);
      if (!hasTransactions && invoice.amount > 0) {
        this.addWarning('REFERENTIAL_INTEGRITY', 'Fatura sem transações associadas', {
          id: invoice.id,
          amount: invoice.amount
        });
      }
    });

    // Verificar contas/cartões sem uso
    accounts.forEach(account => {
      const hasTransactions = transactions.some(t => 
        t.accountId === account.id || 
        t.fromAccountId === account.id || 
        t.toAccountId === account.id
      );
      if (!hasTransactions) {
        this.addInfo('REFERENTIAL_INTEGRITY', 'Conta sem transações', {
          id: account.id,
          name: account.name
        });
      }
    });

    cards.forEach(card => {
      const hasTransactions = transactions.some(t => t.creditCardId === card.id);
      if (!hasTransactions) {
        this.addInfo('REFERENTIAL_INTEGRITY', 'Cartão sem transações', {
          id: card.id,
          name: card.name
        });
      }
    });
  }

  // 9. AUDITORIA DE CATEGORIAS
  auditCategories() {
    log('\n📁 Auditando Categorias...', 'cyan');
    const categories = this.data.categories || [];
    const transactions = this.data.transactions || [];

    if (categories.length === 0) {
      this.addWarning('CATEGORIES', 'Nenhuma categoria cadastrada');
      return;
    }

    categories.forEach(category => {
      if (!category.id) {
        this.addError('CATEGORIES', 'Categoria sem ID', { category });
      }
      if (!category.name) {
        this.addError('CATEGORIES', 'Categoria sem nome', { id: category.id });
      }
      if (!category.type) {
        this.addWarning('CATEGORIES', 'Categoria sem tipo', { id: category.id, name: category.name });
      }

      // Validar tipos válidos
      const validTypes = ['income', 'expense'];
      if (category.type && !validTypes.includes(category.type)) {
        this.addError('CATEGORIES', `Tipo de categoria inválido: ${category.type}`, { id: category.id });
      }
    });

    // Verificar categorias sem uso
    categories.forEach(category => {
      const usageCount = transactions.filter(t => t.categoryId === category.id).length;
      if (usageCount === 0) {
        this.addInfo('CATEGORIES', 'Categoria sem uso', {
          id: category.id,
          name: category.name
        });
      }
    });

    this.addInfo('CATEGORIES', `Total de categorias: ${categories.length}`);
  }

  // Executar todas as auditorias
  runFullAudit() {
    log('\n' + '='.repeat(60), 'blue');
    log('🔍 INICIANDO AUDITORIA COMPLETA DE DADOS', 'blue');
    log('='.repeat(60), 'blue');

    this.auditAccounts();
    this.auditCreditCards();
    this.auditTransactions();
    this.auditBalances();
    this.auditInvoices();
    this.auditSharedExpenses();
    this.auditDuplicates();
    this.auditReferentialIntegrity();
    this.auditCategories();

    this.printReport();
  }

  // Imprimir relatório
  printReport() {
    log('\n' + '='.repeat(60), 'blue');
    log('📊 RELATÓRIO DE AUDITORIA', 'blue');
    log('='.repeat(60), 'blue');

    // Resumo
    log(`\n✅ Total de Erros: ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'green');
    log(`⚠️  Total de Avisos: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'green');
    log(`ℹ️  Total de Informações: ${this.info.length}`, 'cyan');

    // Erros
    if (this.errors.length > 0) {
      log('\n' + '─'.repeat(60), 'red');
      log('❌ ERROS CRÍTICOS', 'red');
      log('─'.repeat(60), 'red');
      this.errors.forEach((error, index) => {
        log(`\n${index + 1}. [${error.category}] ${error.message}`, 'red');
        if (Object.keys(error.details).length > 0) {
          log(`   Detalhes: ${JSON.stringify(error.details, null, 2)}`, 'red');
        }
      });
    }

    // Avisos
    if (this.warnings.length > 0) {
      log('\n' + '─'.repeat(60), 'yellow');
      log('⚠️  AVISOS', 'yellow');
      log('─'.repeat(60), 'yellow');
      this.warnings.forEach((warning, index) => {
        log(`\n${index + 1}. [${warning.category}] ${warning.message}`, 'yellow');
        if (Object.keys(warning.details).length > 0) {
          log(`   Detalhes: ${JSON.stringify(warning.details, null, 2)}`, 'yellow');
        }
      });
    }

    // Informações
    if (this.info.length > 0) {
      log('\n' + '─'.repeat(60), 'cyan');
      log('ℹ️  INFORMAÇÕES', 'cyan');
      log('─'.repeat(60), 'cyan');
      this.info.forEach((info, index) => {
        log(`${index + 1}. [${info.category}] ${info.message}`, 'cyan');
      });
    }

    // Conclusão
    log('\n' + '='.repeat(60), 'blue');
    if (this.errors.length === 0 && this.warnings.length === 0) {
      log('✅ AUDITORIA CONCLUÍDA: DADOS CONSISTENTES!', 'green');
    } else if (this.errors.length === 0) {
      log('✅ AUDITORIA CONCLUÍDA: Apenas avisos encontrados', 'yellow');
    } else {
      log('❌ AUDITORIA CONCLUÍDA: Erros críticos encontrados!', 'red');
    }
    log('='.repeat(60) + '\n', 'blue');
  }
}

// Executar auditoria
const data = loadData();
if (data) {
  const auditor = new DataAuditor(data);
  auditor.runFullAudit();
} else {
  log('❌ Não foi possível carregar os dados para auditoria', 'red');
  process.exit(1);
}
