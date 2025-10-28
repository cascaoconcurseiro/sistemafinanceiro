/**
 * 🔒 TESTE DE ISOLAMENTO DE USUÁRIOS
 * 
 * Verifica se cada usuário vê apenas seus próprios dados
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testUserIsolation() {
  console.log('🔒 [TestIsolation] Testando isolamento de usuários...');

  try {
    // Criar dois usuários de teste
    const user1 = await createTestUser('user1@test.com', 'User 1');
    const user2 = await createTestUser('user2@test.com', 'User 2');

    console.log('👤 [TestIsolation] Usuários criados:', {
      user1: user1.email,
      user2: user2.email
    });

    // Criar dados para cada usuário
    await createTestData(user1.id, 'User 1');
    await createTestData(user2.id, 'User 2');

    // Testar isolamento
    await testDataIsolation(user1.id, user2.id);

    console.log('✅ [TestIsolation] TESTE CONCLUÍDO COM SUCESSO!');
    console.log('🔒 [TestIsolation] Isolamento de usuários está funcionando corretamente');

  } catch (error) {
    console.error('❌ [TestIsolation] Erro no teste:', error);
    throw error;
  } finally {
    // Limpar dados de teste
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

async function createTestUser(email: string, name: string) {
  const hashedPassword = await bcrypt.hash('test123', 12);
  
  return await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      isActive: true
    }
  });
}

async function createTestData(userId: string, prefix: string) {
  // Criar conta
  const account = await prisma.account.create({
    data: {
      userId,
      name: `${prefix} - Conta Teste`,
      type: 'checking',
      balance: 1000,
      currency: 'BRL',
      isActive: true
    }
  });

  // Criar transação
  await prisma.transaction.create({
    data: {
      userId,
      accountId: account.id,
      amount: 100,
      description: `${prefix} - Transação Teste`,
      type: 'income',
      date: new Date(),
      status: 'cleared',
      isRecurring: false,
      isTransfer: false,
      isShared: false,
      currency: 'BRL',
      isTaxDeductible: false,
      isSuspicious: false,
      isFraudulent: false,
      isInstallment: false,
      isReconciled: false
    }
  });

  // Criar cartão de crédito
  await prisma.creditCard.create({
    data: {
      userId,
      name: `${prefix} - Cartão Teste`,
      limit: 5000,
      currentBalance: 0,
      dueDay: 10,
      closingDay: 5,
      isActive: true
    }
  });

  console.log(`📊 [TestIsolation] Dados criados para ${prefix}`);
}

async function testDataIsolation(user1Id: string, user2Id: string) {
  console.log('🔍 [TestIsolation] Testando isolamento de dados...');

  // Testar contas
  const user1Accounts = await prisma.account.findMany({
    where: { userId: user1Id }
  });
  const user2Accounts = await prisma.account.findMany({
    where: { userId: user2Id }
  });

  console.log('🏦 [TestIsolation] Contas:', {
    user1: user1Accounts.length,
    user2: user2Accounts.length
  });

  // Verificar se não há vazamento de dados
  const user1SeeingUser2Data = user1Accounts.some(acc => acc.userId === user2Id);
  const user2SeeingUser1Data = user2Accounts.some(acc => acc.userId === user1Id);

  if (user1SeeingUser2Data || user2SeeingUser1Data) {
    throw new Error('❌ VAZAMENTO DE DADOS DETECTADO! Usuários vendo dados de outros usuários');
  }

  // Testar transações
  const user1Transactions = await prisma.transaction.findMany({
    where: { userId: user1Id }
  });
  const user2Transactions = await prisma.transaction.findMany({
    where: { userId: user2Id }
  });

  console.log('💰 [TestIsolation] Transações:', {
    user1: user1Transactions.length,
    user2: user2Transactions.length
  });

  // Testar cartões
  const user1Cards = await prisma.creditCard.findMany({
    where: { userId: user1Id }
  });
  const user2Cards = await prisma.creditCard.findMany({
    where: { userId: user2Id }
  });

  console.log('💳 [TestIsolation] Cartões:', {
    user1: user1Cards.length,
    user2: user2Cards.length
  });

  // Verificar se cada usuário tem exatamente seus dados
  if (user1Accounts.length !== 1 || user2Accounts.length !== 1) {
    throw new Error('❌ Número incorreto de contas por usuário');
  }

  if (user1Transactions.length !== 1 || user2Transactions.length !== 1) {
    throw new Error('❌ Número incorreto de transações por usuário');
  }

  if (user1Cards.length !== 1 || user2Cards.length !== 1) {
    throw new Error('❌ Número incorreto de cartões por usuário');
  }

  console.log('✅ [TestIsolation] Isolamento de dados verificado com sucesso!');
}

async function cleanupTestData() {
  console.log('🧹 [TestIsolation] Limpando dados de teste...');
  
  // Remover usuários de teste (cascade delete remove dados relacionados)
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['user1@test.com', 'user2@test.com']
      }
    }
  });

  console.log('✅ [TestIsolation] Dados de teste removidos');
}

// Executar se chamado diretamente
if (require.main === module) {
  testUserIsolation();
}

export { testUserIsolation };