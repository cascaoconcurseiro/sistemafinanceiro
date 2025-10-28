#!/usr/bin/env tsx
/**
 * Script de Teste do Sistema de Notificações
 * 
 * Testa todas as funcionalidades de notificações:
 * 1. Notificações de Faturamento (contas a vencer, vencidas, faturas)
 * 2. Notificações de Metas (progresso, atingidas, prazos)
 * 3. Notificações de Investimentos (desempenho, alertas)
 * 4. Notificações Gerais (lembretes, dicas)
 */

import { PrismaClient } from '@prisma/client';
import { 
  generateAllNotifications,
  checkBillingNotifications,
  checkGoalNotifications,
  checkBudgetNotifications,
  checkInvestmentNotifications,
  checkReminderNotifications
} from '../src/lib/notification-engine';

const prisma = new PrismaClient();

interface TestResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(result: TestResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} [${result.category}] ${result.test}: ${result.message}`);
  if (result.details) {
    console.log('   Detalhes:', JSON.stringify(result.details, null, 2));
  }
}

async function testBillingNotifications(userId: string) {
  console.log('\n📋 === TESTANDO NOTIFICAÇÕES DE FATURAMENTO ===\n');

  try {
    // 1. Criar conta a vencer hoje
    const today = new Date();
    const billToday = await prisma.transaction.create({
      data: {
        userId,
        description: 'Conta de Luz - Teste',
        amount: -150.50,
        type: 'expense',
        status: 'pending',
        date: today,
      },
    });

    logTest({
      category: 'Faturamento',
      test: 'Criar conta a vencer hoje',
      status: 'PASS',
      message: 'Conta criada com sucesso',
      details: { id: billToday.id, amount: billToday.amount },
    });

    // 2. Criar conta vencida
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const overdueBill = await prisma.transaction.create({
      data: {
        userId,
        description: 'Conta de Água - Teste Vencida',
        amount: -89.90,
        type: 'expense',
        status: 'pending',
        date: yesterday,
      },
    });

    logTest({
      category: 'Faturamento',
      test: 'Criar conta vencida',
      status: 'PASS',
      message: 'Conta vencida criada',
      details: { id: overdueBill.id, daysOverdue: 1 },
    });

    // 3. Criar cartão de crédito com vencimento próximo
    const card = await prisma.creditCard.create({
      data: {
        userId,
        name: 'Cartão Teste',
        limit: 5000,
        currentBalance: 1250.75,
        dueDay: today.getDate() + 2, // Vence em 2 dias
        closingDay: today.getDate() - 5,
        isActive: true,
      },
    });

    logTest({
      category: 'Faturamento',
      test: 'Criar cartão com vencimento próximo',
      status: 'PASS',
      message: 'Cartão criado',
      details: { id: card.id, dueDay: card.dueDay, balance: card.currentBalance },
    });

    // 4. Gerar notificações de faturamento
    await checkBillingNotifications(userId);

    const billingNotifications = await prisma.notification.findMany({
      where: {
        userId,
        type: { in: ['alert', 'warning'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    logTest({
      category: 'Faturamento',
      test: 'Gerar notificações de faturamento',
      status: billingNotifications.length > 0 ? 'PASS' : 'FAIL',
      message: `${billingNotifications.length} notificações geradas`,
      details: billingNotifications.map(n => ({ title: n.title, type: n.type })),
    });

  } catch (error) {
    logTest({
      category: 'Faturamento',
      test: 'Sistema de notificações de faturamento',
      status: 'FAIL',
      message: `Erro: ${error.message}`,
    });
  }
}

async function testGoalNotifications(userId: string) {
  console.log('\n🎯 === TESTANDO NOTIFICAÇÕES DE METAS ===\n');

  try {
    // 1. Criar meta próxima do prazo (50% completa)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    
    const goalNearDeadline = await prisma.goal.create({
      data: {
        userId,
        name: 'Viagem para Europa',
        description: 'Economizar para viagem',
        targetAmount: 10000,
        currentAmount: 5000, // 50%
        targetDate: nextWeek,
        status: 'active',
      },
    });

    logTest({
      category: 'Metas',
      test: 'Criar meta próxima do prazo',
      status: 'PASS',
      message: 'Meta criada (50% completa)',
      details: { id: goalNearDeadline.id, progress: '50%' },
    });

    // 2. Criar meta atingida
    const achievedGoal = await prisma.goal.create({
      data: {
        userId,
        name: 'Fundo de Emergência',
        description: 'Reserva de emergência',
        targetAmount: 5000,
        currentAmount: 5500, // 110% - atingida!
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    logTest({
      category: 'Metas',
      test: 'Criar meta atingida',
      status: 'PASS',
      message: 'Meta atingida criada (110%)',
      details: { id: achievedGoal.id, progress: '110%' },
    });

    // 3. Criar meta em progresso (25%)
    const goalInProgress = await prisma.goal.create({
      data: {
        userId,
        name: 'Carro Novo',
        description: 'Economizar para carro',
        targetAmount: 40000,
        currentAmount: 10000, // 25%
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    logTest({
      category: 'Metas',
      test: 'Criar meta em progresso',
      status: 'PASS',
      message: 'Meta criada (25% completa)',
      details: { id: goalInProgress.id, progress: '25%' },
    });

    // 4. Gerar notificações de metas
    await checkGoalNotifications(userId);

    const goalNotifications = await prisma.notification.findMany({
      where: {
        userId,
        type: { in: ['success', 'warning', 'info'] },
        title: { contains: 'Meta' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    logTest({
      category: 'Metas',
      test: 'Gerar notificações de metas',
      status: goalNotifications.length > 0 ? 'PASS' : 'FAIL',
      message: `${goalNotifications.length} notificações geradas`,
      details: goalNotifications.map(n => ({ title: n.title, type: n.type })),
    });

  } catch (error) {
    logTest({
      category: 'Metas',
      test: 'Sistema de notificações de metas',
      status: 'FAIL',
      message: `Erro: ${error.message}`,
    });
  }
}

async function testBudgetNotifications(userId: string) {
  console.log('\n💰 === TESTANDO NOTIFICAÇÕES DE ORÇAMENTO ===\n');

  try {
    // 1. Criar categoria
    const category = await prisma.category.create({
      data: {
        name: 'Alimentação - Teste',
        type: 'expense',
        isActive: true,
      },
    });

    // 2. Criar orçamento
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId: category.id,
        name: 'Orçamento Alimentação',
        amount: 1000,
        spent: 0,
        period: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        isActive: true,
        alertThreshold: 80,
      },
    });

    logTest({
      category: 'Orçamento',
      test: 'Criar orçamento',
      status: 'PASS',
      message: 'Orçamento criado',
      details: { id: budget.id, amount: budget.amount },
    });

    // 3. Criar transações que estouram o orçamento (95%)
    await prisma.transaction.create({
      data: {
        userId,
        categoryId: category.id,
        description: 'Supermercado - Teste',
        amount: -950, // 95% do orçamento
        type: 'expense',
        status: 'cleared',
        date: now,
      },
    });

    logTest({
      category: 'Orçamento',
      test: 'Criar transação que estoura orçamento',
      status: 'PASS',
      message: 'Transação criada (95% do orçamento)',
    });

    // 4. Gerar notificações de orçamento
    await checkBudgetNotifications(userId);

    const budgetNotifications = await prisma.notification.findMany({
      where: {
        userId,
        title: { contains: 'Orçamento' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    logTest({
      category: 'Orçamento',
      test: 'Gerar notificações de orçamento',
      status: budgetNotifications.length > 0 ? 'PASS' : 'FAIL',
      message: `${budgetNotifications.length} notificações geradas`,
      details: budgetNotifications.map(n => ({ title: n.title, type: n.type })),
    });

  } catch (error) {
    logTest({
      category: 'Orçamento',
      test: 'Sistema de notificações de orçamento',
      status: 'FAIL',
      message: `Erro: ${error.message}`,
    });
  }
}

async function testInvestmentNotifications(userId: string) {
  console.log('\n📈 === TESTANDO NOTIFICAÇÕES DE INVESTIMENTOS ===\n');

  try {
    // 1. Criar investimento com ganho significativo (15%)
    const investmentGain = await prisma.investment.create({
      data: {
        userId,
        name: 'Ações PETR4',
        symbol: 'PETR4',
        type: 'stocks',
        quantity: 100,
        purchasePrice: 30,
        currentPrice: 34.50, // +15%
        purchaseDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    logTest({
      category: 'Investimentos',
      test: 'Criar investimento com ganho',
      status: 'PASS',
      message: 'Investimento criado (+15%)',
      details: { id: investmentGain.id, return: '+15%' },
    });

    // 2. Criar investimento com perda (-7%)
    const investmentLoss = await prisma.investment.create({
      data: {
        userId,
        name: 'Ações VALE3',
        symbol: 'VALE3',
        type: 'stocks',
        quantity: 50,
        purchasePrice: 70,
        currentPrice: 65.10, // -7%
        purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    });

    logTest({
      category: 'Investimentos',
      test: 'Criar investimento com perda',
      status: 'PASS',
      message: 'Investimento criado (-7%)',
      details: { id: investmentLoss.id, return: '-7%' },
    });

    // 3. Gerar notificações de investimentos
    await checkInvestmentNotifications(userId);

    const investmentNotifications = await prisma.notification.findMany({
      where: {
        userId,
        title: { contains: 'Investimento' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    logTest({
      category: 'Investimentos',
      test: 'Gerar notificações de investimentos',
      status: investmentNotifications.length > 0 ? 'PASS' : 'FAIL',
      message: `${investmentNotifications.length} notificações geradas`,
      details: investmentNotifications.map(n => ({ title: n.title, type: n.type })),
    });

  } catch (error) {
    logTest({
      category: 'Investimentos',
      test: 'Sistema de notificações de investimentos',
      status: 'FAIL',
      message: `Erro: ${error.message}`,
    });
  }
}

async function testReminderNotifications(userId: string) {
  console.log('\n📌 === TESTANDO NOTIFICAÇÕES DE LEMBRETES ===\n');

  try {
    // 1. Criar lembrete para hoje
    const today = new Date();
    const reminderToday = await prisma.reminder.create({
      data: {
        userId,
        title: 'Pagar IPTU',
        description: 'Não esquecer de pagar o IPTU',
        dueDate: today,
        category: 'bill',
        priority: 'high',
        status: 'pending',
      },
    });

    logTest({
      category: 'Lembretes',
      test: 'Criar lembrete para hoje',
      status: 'PASS',
      message: 'Lembrete criado',
      details: { id: reminderToday.id, priority: 'high' },
    });

    // 2. Criar lembrete vencido
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const overdueReminder = await prisma.reminder.create({
      data: {
        userId,
        title: 'Renovar CNH',
        description: 'Renovar carteira de motorista',
        dueDate: yesterday,
        category: 'general',
        priority: 'medium',
        status: 'pending',
      },
    });

    logTest({
      category: 'Lembretes',
      test: 'Criar lembrete vencido',
      status: 'PASS',
      message: 'Lembrete vencido criado',
      details: { id: overdueReminder.id, daysOverdue: 2 },
    });

    // 3. Criar lembrete futuro
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const futureReminder = await prisma.reminder.create({
      data: {
        userId,
        title: 'Consulta médica',
        description: 'Consulta com cardiologista',
        dueDate: nextWeek,
        category: 'general',
        priority: 'low',
        status: 'pending',
      },
    });

    logTest({
      category: 'Lembretes',
      test: 'Criar lembrete futuro',
      status: 'PASS',
      message: 'Lembrete futuro criado',
      details: { id: futureReminder.id, daysUntil: 7 },
    });

    // 4. Gerar notificações de lembretes
    await checkReminderNotifications(userId);

    const reminderNotifications = await prisma.notification.findMany({
      where: {
        userId,
        title: { contains: 'Lembrete' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    logTest({
      category: 'Lembretes',
      test: 'Gerar notificações de lembretes',
      status: reminderNotifications.length > 0 ? 'PASS' : 'FAIL',
      message: `${reminderNotifications.length} notificações geradas`,
      details: reminderNotifications.map(n => ({ title: n.title, type: n.type })),
    });

  } catch (error) {
    logTest({
      category: 'Lembretes',
      test: 'Sistema de notificações de lembretes',
      status: 'FAIL',
      message: `Erro: ${error.message}`,
    });
  }
}

async function testNotificationBell(userId: string) {
  console.log('\n🔔 === TESTANDO SININHO DE NOTIFICAÇÕES ===\n');

  try {
    // Buscar todas as notificações não lidas
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    logTest({
      category: 'Sininho',
      test: 'Contar notificações não lidas',
      status: 'PASS',
      message: `${unreadNotifications.length} notificações não lidas`,
      details: {
        total: unreadNotifications.length,
        byType: {
          alert: unreadNotifications.filter(n => n.type === 'alert').length,
          warning: unreadNotifications.filter(n => n.type === 'warning').length,
          info: unreadNotifications.filter(n => n.type === 'info').length,
          success: unreadNotifications.filter(n => n.type === 'success').length,
        },
      },
    });

    // Testar API de notificações
    const apiResponse = await fetch('http://localhost:3000/api/notifications', {
      headers: {
        'Cookie': `userId=${userId}`, // Simulação
      },
    });

    logTest({
      category: 'Sininho',
      test: 'API de notificações',
      status: apiResponse.ok ? 'PASS' : 'FAIL',
      message: apiResponse.ok ? 'API respondendo corretamente' : 'Erro na API',
    });

  } catch (error) {
    logTest({
      category: 'Sininho',
      test: 'Sistema do sininho',
      status: 'FAIL',
      message: `Erro: ${error.message}`,
    });
  }
}

async function cleanupTestData(userId: string) {
  console.log('\n🧹 === LIMPANDO DADOS DE TESTE ===\n');

  try {
    // Deletar notificações de teste
    await prisma.notification.deleteMany({
      where: { userId },
    });

    // Deletar lembretes de teste
    await prisma.reminder.deleteMany({
      where: { userId },
    });

    // Deletar investimentos de teste
    await prisma.investment.deleteMany({
      where: { userId },
    });

    // Deletar metas de teste
    await prisma.goal.deleteMany({
      where: { userId },
    });

    // Deletar transações de teste
    await prisma.transaction.deleteMany({
      where: { userId },
    });

    // Deletar orçamentos de teste
    await prisma.budget.deleteMany({
      where: { userId },
    });

    // Deletar cartões de teste
    await prisma.creditCard.deleteMany({
      where: { userId },
    });

    // Deletar categorias de teste
    await prisma.category.deleteMany({
      where: { name: { contains: 'Teste' } },
    });

    console.log('✅ Dados de teste limpos com sucesso');
  } catch (error) {
    console.error('❌ Erro ao limpar dados de teste:', error);
  }
}

async function main() {
  console.log('🚀 === INICIANDO TESTES DO SISTEMA DE NOTIFICAÇÕES ===\n');

  try {
    // Buscar ou criar usuário de teste
    let testUser = await prisma.user.findFirst({
      where: { email: 'teste@notificacoes.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'teste@notificacoes.com',
          name: 'Usuário Teste Notificações',
          password: 'teste123',
          isActive: true,
        },
      });
      console.log('✅ Usuário de teste criado\n');
    } else {
      console.log('✅ Usando usuário de teste existente\n');
    }

    const userId = testUser.id;

    // Executar todos os testes
    await testBillingNotifications(userId);
    await testGoalNotifications(userId);
    await testBudgetNotifications(userId);
    await testInvestmentNotifications(userId);
    await testReminderNotifications(userId);
    await testNotificationBell(userId);

    // Resumo dos testes
    console.log('\n📊 === RESUMO DOS TESTES ===\n');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;

    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`⏭️  Pulou: ${skipped}`);
    console.log(`📝 Total: ${results.length}\n`);

    if (failed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema de notificações funcionando perfeitamente.\n');
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique os detalhes acima.\n');
    }

    // Limpar dados de teste
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('Deseja limpar os dados de teste? (s/n): ', async (answer: string) => {
      if (answer.toLowerCase() === 's') {
        await cleanupTestData(userId);
      }
      readline.close();
      await prisma.$disconnect();
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
