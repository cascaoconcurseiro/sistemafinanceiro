/**
 * API de Auditoria de Consistência de Dados
 * Endpoint para verificar integridade dos dados financeiros
 */

import { NextRequest, NextResponse } from 'next/server';

interface AuditIssue {
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    totalInfo: number;
  };
  issues: AuditIssue[];
  statistics: {
    accounts: number;
    creditCards: number;
    transactions: number;
    categories: number;
    invoices: number;
    sharedExpenses: number;
  };
}

// Helper para fetch com timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const issues: AuditIssue[] = [];
    
    // Obter base URL do request
    const baseUrl = request.url.split('/api/')[0];
    
    // Headers comuns
    const commonHeaders = { 
      'Cookie': request.headers.get('cookie') || '',
      'Authorization': request.headers.get('authorization') || ''
    };
    
    // Buscar todos os dados com timeout de 10 segundos
    const [
      accountsRes,
      cardsRes,
      transactionsRes,
      categoriesRes,
      invoicesRes,
      tripsRes
    ] = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}/api/accounts`, { headers: commonHeaders }),
      fetchWithTimeout(`${baseUrl}/api/credit-cards`, { headers: commonHeaders }),
      fetchWithTimeout(`${baseUrl}/api/transactions`, { headers: commonHeaders }),
      fetchWithTimeout(`${baseUrl}/api/categories`, { headers: commonHeaders }),
      fetchWithTimeout(`${baseUrl}/api/invoices`, { headers: commonHeaders }),
      fetchWithTimeout(`${baseUrl}/api/trips`, { headers: commonHeaders }),
    ]);

    // Extrair dados
    const accounts = accountsRes.status === 'fulfilled' ? await accountsRes.value.json() : { accounts: [] };
    const cards = cardsRes.status === 'fulfilled' ? await cardsRes.value.json() : { creditCards: [] };
    const transactions = transactionsRes.status === 'fulfilled' ? await transactionsRes.value.json() : { transactions: [] };
    const categories = categoriesRes.status === 'fulfilled' ? await categoriesRes.value.json() : { categories: [] };
    const invoices = invoicesRes.status === 'fulfilled' ? await invoicesRes.value.json() : { invoices: [] };
    const trips = tripsRes.status === 'fulfilled' ? await tripsRes.value.json() : { trips: [] };

    const accountsList = accounts.accounts || [];
    const cardsList = cards.creditCards || [];
    const transactionsList = transactions.transactions || [];
    const categoriesList = categories.categories || [];
    const invoicesList = invoices.invoices || [];
    const tripsList = trips.trips || [];

    // 1. AUDITORIA DE CONTAS
    auditAccounts(accountsList, issues);

    // 2. AUDITORIA DE CARTÕES
    auditCreditCards(cardsList, issues);

    // 3. AUDITORIA DE TRANSAÇÕES
    auditTransactions(transactionsList, accountsList, cardsList, categoriesList, issues);

    // 4. AUDITORIA DE SALDOS
    auditBalances(accountsList, transactionsList, issues);

    // 5. AUDITORIA DE FATURAS
    auditInvoices(invoicesList, cardsList, transactionsList, issues);

    // 6. AUDITORIA DE DUPLICAÇÕES
    auditDuplicates(accountsList, cardsList, transactionsList, issues);

    // 7. AUDITORIA DE INTEGRIDADE REFERENCIAL
    auditReferentialIntegrity(accountsList, cardsList, transactionsList, invoicesList, issues);

    // Gerar relatório
    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: issues.filter(i => i.severity === 'error').length,
        totalWarnings: issues.filter(i => i.severity === 'warning').length,
        totalInfo: issues.filter(i => i.severity === 'info').length,
      },
      issues,
      statistics: {
        accounts: accountsList.length,
        creditCards: cardsList.length,
        transactions: transactionsList.length,
        categories: categoriesList.length,
        invoices: invoicesList.length,
        sharedExpenses: tripsList.length,
      },
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error('Erro na auditoria:', error);
    return NextResponse.json(
      { error: 'Erro ao executar auditoria' },
      { status: 500 }
    );
  }
}

function auditAccounts(accounts: any[], issues: AuditIssue[]) {
  if (accounts.length === 0) {
    issues.push({
      category: 'ACCOUNTS',
      severity: 'warning',
      message: 'Nenhuma conta cadastrada',
    });
    return;
  }

  accounts.forEach(account => {
    if (!account.id) {
      issues.push({
        category: 'ACCOUNTS',
        severity: 'error',
        message: 'Conta sem ID',
        details: { account },
      });
    }
    if (!account.name) {
      issues.push({
        category: 'ACCOUNTS',
        severity: 'error',
        message: 'Conta sem nome',
        details: { id: account.id },
      });
    }
    if (account.balance === undefined || account.balance === null) {
      issues.push({
        category: 'ACCOUNTS',
        severity: 'error',
        message: 'Conta sem saldo definido',
        details: { id: account.id, name: account.name },
      });
    }
  });

  issues.push({
    category: 'ACCOUNTS',
    severity: 'info',
    message: `Total de contas: ${accounts.length}`,
  });
}

function auditCreditCards(cards: any[], issues: AuditIssue[]) {
  if (cards.length === 0) {
    issues.push({
      category: 'CREDIT_CARDS',
      severity: 'warning',
      message: 'Nenhum cartão cadastrado',
    });
    return;
  }

  cards.forEach(card => {
    if (!card.id) {
      issues.push({
        category: 'CREDIT_CARDS',
        severity: 'error',
        message: 'Cartão sem ID',
        details: { card },
      });
    }
    if (!card.name) {
      issues.push({
        category: 'CREDIT_CARDS',
        severity: 'error',
        message: 'Cartão sem nome',
        details: { id: card.id },
      });
    }
    if (card.limit === undefined || card.limit === null) {
      issues.push({
        category: 'CREDIT_CARDS',
        severity: 'error',
        message: 'Cartão sem limite definido',
        details: { id: card.id, name: card.name },
      });
    }
  });

  issues.push({
    category: 'CREDIT_CARDS',
    severity: 'info',
    message: `Total de cartões: ${cards.length}`,
  });
}

function auditTransactions(
  transactions: any[],
  accounts: any[],
  cards: any[],
  categories: any[],
  issues: AuditIssue[]
) {
  if (transactions.length === 0) {
    issues.push({
      category: 'TRANSACTIONS',
      severity: 'warning',
      message: 'Nenhuma transação cadastrada',
    });
    return;
  }

  const accountIds = new Set(accounts.map(a => a.id));
  const cardIds = new Set(cards.map(c => c.id));
  const categoryIds = new Set(categories.map(c => c.id));

  transactions.forEach(transaction => {
    if (!transaction.id) {
      issues.push({
        category: 'TRANSACTIONS',
        severity: 'error',
        message: 'Transação sem ID',
      });
    }

    if (transaction.amount === undefined || transaction.amount === null) {
      issues.push({
        category: 'TRANSACTIONS',
        severity: 'error',
        message: 'Transação sem valor',
        details: { id: transaction.id },
      });
    }

    if (!transaction.type) {
      issues.push({
        category: 'TRANSACTIONS',
        severity: 'error',
        message: 'Transação sem tipo',
        details: { id: transaction.id },
      });
    }

    // Validar referências
    if (transaction.accountId && !accountIds.has(transaction.accountId)) {
      issues.push({
        category: 'TRANSACTIONS',
        severity: 'error',
        message: 'Transação referencia conta inexistente',
        details: { id: transaction.id, accountId: transaction.accountId },
      });
    }

    if (transaction.creditCardId && !cardIds.has(transaction.creditCardId)) {
      issues.push({
        category: 'TRANSACTIONS',
        severity: 'error',
        message: 'Transação referencia cartão inexistente',
        details: { id: transaction.id, creditCardId: transaction.creditCardId },
      });
    }

    if (transaction.categoryId && !categoryIds.has(transaction.categoryId)) {
      issues.push({
        category: 'TRANSACTIONS',
        severity: 'warning',
        message: 'Transação referencia categoria inexistente',
        details: { id: transaction.id, categoryId: transaction.categoryId },
      });
    }
  });

  issues.push({
    category: 'TRANSACTIONS',
    severity: 'info',
    message: `Total de transações: ${transactions.length}`,
  });
}

function auditBalances(accounts: any[], transactions: any[], issues: AuditIssue[]) {
  accounts.forEach(account => {
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
    if (difference > 0.01) {
      issues.push({
        category: 'BALANCES',
        severity: 'error',
        message: 'Saldo da conta não bate com transações',
        details: {
          accountId: account.id,
          accountName: account.name,
          registeredBalance: account.balance,
          calculatedBalance: calculatedBalance,
          difference: difference,
        },
      });
    }
  });
}

function auditInvoices(
  invoices: any[],
  cards: any[],
  transactions: any[],
  issues: AuditIssue[]
) {
  if (invoices.length === 0) {
    issues.push({
      category: 'INVOICES',
      severity: 'warning',
      message: 'Nenhuma fatura cadastrada',
    });
    return;
  }

  const cardIds = new Set(cards.map(c => c.id));

  invoices.forEach(invoice => {
    if (!invoice.id) {
      issues.push({
        category: 'INVOICES',
        severity: 'error',
        message: 'Fatura sem ID',
      });
    }

    if (invoice.creditCardId && !cardIds.has(invoice.creditCardId)) {
      issues.push({
        category: 'INVOICES',
        severity: 'error',
        message: 'Fatura referencia cartão inexistente',
        details: { id: invoice.id, creditCardId: invoice.creditCardId },
      });
    }
  });

  issues.push({
    category: 'INVOICES',
    severity: 'info',
    message: `Total de faturas: ${invoices.length}`,
  });
}

function auditDuplicates(
  accounts: any[],
  cards: any[],
  transactions: any[],
  issues: AuditIssue[]
) {
  // Verificar IDs duplicados
  const entities = [
    { name: 'accounts', data: accounts },
    { name: 'creditCards', data: cards },
    { name: 'transactions', data: transactions },
  ];

  entities.forEach(entity => {
    const ids = entity.data.map(item => item.id).filter(id => id);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      issues.push({
        category: 'DUPLICATES',
        severity: 'error',
        message: `IDs duplicados em ${entity.name}`,
        details: { entity: entity.name, duplicates: [...new Set(duplicates)] },
      });
    }
  });
}

function auditReferentialIntegrity(
  accounts: any[],
  cards: any[],
  transactions: any[],
  invoices: any[],
  issues: AuditIssue[]
) {
  // Verificar transações órfãs
  transactions.forEach(t => {
    if (t.type !== 'transfer' && !t.accountId && !t.creditCardId) {
      issues.push({
        category: 'REFERENTIAL_INTEGRITY',
        severity: 'error',
        message: 'Transação sem conta ou cartão associado',
        details: { id: t.id, description: t.description },
      });
    }
  });

  // Verificar contas sem uso
  accounts.forEach(account => {
    const hasTransactions = transactions.some(t =>
      t.accountId === account.id ||
      t.fromAccountId === account.id ||
      t.toAccountId === account.id
    );
    if (!hasTransactions) {
      issues.push({
        category: 'REFERENTIAL_INTEGRITY',
        severity: 'info',
        message: 'Conta sem transações',
        details: { id: account.id, name: account.name },
      });
    }
  });
}
