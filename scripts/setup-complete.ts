#!/usr/bin/env ts-node

/**
 * 🚀 SETUP COMPLETO DO SISTEMA FINANCEIRO
 * Script para configurar todo o sistema do zero
 */

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
// import * as fs from 'fs'; // Não usado
// import * as path from 'path'; // Não usado

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🗄️ Configurando banco de dados...');
  
  try {
    // Aplicar schema
    await execAsync('npx prisma db push --force-reset');
    console.log('✅ Schema aplicado com sucesso');
    
    // Gerar cliente Prisma
    await execAsync('npx prisma generate');
    console.log('✅ Cliente Prisma gerado');
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
    throw error;
  }
}

async function createDefaultCategories() {
  console.log('📂 Criando categorias padrão...');
  
  const categories = [
    // Despesas
    { name: 'Alimentação', type: 'expense', color: '#FF6B6B', icon: '🍽️' },
    { name: 'Transporte', type: 'expense', color: '#4ECDC4', icon: '🚗' },
    { name: 'Moradia', type: 'expense', color: '#45B7D1', icon: '🏠' },
    { name: 'Saúde', type: 'expense', color: '#96CEB4', icon: '🏥' },
    { name: 'Educação', type: 'expense', color: '#FFEAA7', icon: '📚' },
    { name: 'Lazer', type: 'expense', color: '#DDA0DD', icon: '🎮' },
    { name: 'Compras', type: 'expense', color: '#98D8C8', icon: '🛍️' },
    { name: 'Serviços', type: 'expense', color: '#F7DC6F', icon: '🔧' },
    
    // Receitas
    { name: 'Salário', type: 'income', color: '#2ECC71', icon: '💼' },
    { name: 'Freelance', type: 'income', color: '#3498DB', icon: '💻' },
    { name: 'Investimentos', type: 'income', color: '#9B59B6', icon: '📈' },
    { name: 'Vendas', type: 'income', color: '#E67E22', icon: '💰' },
    
    // Geral
    { name: 'Outros', type: 'expense', color: '#95A5A6', icon: '📦' }
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type }
    });
    
    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          isDefault: true,
          isActive: true
        }
      });
    }
  }
  
  console.log(`✅ ${categories.length} categorias criadas`);
}

async function createAdminUser() {
  console.log('👤 Criando usuário administrador...');
  
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@suagrana.com' },
    update: {},
    create: {
      email: 'admin@suagrana.com',
      name: 'Administrador',
      password: hashedPassword,
      isActive: true,
      monthlyIncome: 5000,
      emergencyReserve: 10000,
      riskProfile: 'moderate',
      financialGoals: 'Organizar finanças pessoais'
    }
  });
  
  console.log(`✅ Usuário admin criado: ${admin.email}`);
  return admin;
}

async function createDefaultAccounts(userId: string) {
  console.log('🏦 Criando contas padrão...');
  
  const accounts = [
    { name: 'Conta Corrente', type: 'checking', balance: 1000 },
    { name: 'Poupança', type: 'savings', balance: 5000 },
    { name: 'Carteira', type: 'cash', balance: 200 },
    { name: 'Investimentos', type: 'investment', balance: 10000 }
  ];
  
  for (const acc of accounts) {
    await prisma.account.create({
      data: {
        userId,
        name: acc.name,
        type: acc.type,
        // balance: acc.balance, // Campo removido do schema
        currency: 'BRL',
        isActive: true
      }
    });
  }
  
  console.log(`✅ ${accounts.length} contas criadas`);
}

async function createSampleTransactions(userId: string) {
  console.log('💳 Criando transações de exemplo...');
  
  const accounts = await prisma.account.findMany({ where: { userId } });
  const categories = await prisma.category.findMany();
  
  const checkingAccount = accounts.find(a => a.type === 'checking');
  const salaryCategory = categories.find(c => c.name === 'Salário');
  const foodCategory = categories.find(c => c.name === 'Alimentação');
  
  if (!checkingAccount || !salaryCategory || !foodCategory) {
    console.log('⚠️ Contas ou categorias não encontradas, pulando transações');
    return;
  }
  
  const transactions = [
    {
      description: 'Salário Janeiro',
      amount: 5000,
      type: 'income',
      categoryId: salaryCategory.id,
      accountId: checkingAccount.id,
      date: new Date('2025-01-01')
    },
    {
      description: 'Supermercado',
      amount: 150,
      type: 'expense',
      categoryId: foodCategory.id,
      accountId: checkingAccount.id,
      date: new Date('2025-01-02')
    },
    {
      description: 'Restaurante',
      amount: 80,
      type: 'expense',
      categoryId: foodCategory.id,
      accountId: checkingAccount.id,
      date: new Date('2025-01-03')
    }
  ];
  
  for (const trans of transactions) {
    await prisma.transaction.create({
      data: {
        userId,
        ...trans,
        status: 'cleared'
      }
    });
  }
  
  console.log(`✅ ${transactions.length} transações criadas`);
}

async function createSampleGoals(userId: string) {
  console.log('🎯 Criando metas de exemplo...');
  
  const goals = [
    {
      name: 'Reserva de Emergência',
      description: 'Guardar 6 meses de gastos',
      targetAmount: 15000,
      currentAmount: 5000,
      priority: 'high',
      deadline: new Date('2025-12-31')
    },
    {
      name: 'Viagem de Férias',
      description: 'Economizar para viagem em família',
      targetAmount: 8000,
      currentAmount: 1200,
      priority: 'medium',
      deadline: new Date('2025-07-01')
    }
  ];
  
  for (const goal of goals) {
    await prisma.goal.create({
      data: {
        userId,
        ...goal,
        status: 'active' // Substituir isCompleted por status
      }
    });
  }
  
  console.log(`✅ ${goals.length} metas criadas`);
}

async function validateSetup() {
  console.log('🔍 Validando configuração...');
  
  const users = await prisma.user.count();
  const accounts = await prisma.account.count();
  const categories = await prisma.category.count();
  const transactions = await prisma.transaction.count();
  const goals = await prisma.goal.count();
  
  console.log(`📊 Resumo da configuração:`);
  console.log(`   - Usuários: ${users}`);
  console.log(`   - Contas: ${accounts}`);
  console.log(`   - Categorias: ${categories}`);
  console.log(`   - Transações: ${transactions}`);
  console.log(`   - Metas: ${goals}`);
  
  if (users === 0 || accounts === 0 || categories === 0) {
    throw new Error('Configuração incompleta');
  }
  
  console.log('✅ Configuração validada com sucesso');
}

async function main() {
  console.log('🚀 Iniciando setup completo do sistema...\n');
  
  try {
    // 1. Configurar banco
    await setupDatabase();
    
    // 2. Criar categorias padrão
    await createDefaultCategories();
    
    // 3. Criar usuário admin
    const admin = await createAdminUser();
    
    // 4. Criar contas padrão
    await createDefaultAccounts(admin.id);
    
    // 5. Criar transações de exemplo
    await createSampleTransactions(admin.id);
    
    // 6. Criar metas de exemplo
    await createSampleGoals(admin.id);
    
    // 7. Validar configuração
    await validateSetup();
    
    console.log('\n🎉 SETUP CONCLUÍDO COM SUCESSO!');
    console.log('\n📋 Informações de acesso:');
    console.log('   URL: http://localhost:3000');
    console.log('   Email: admin@suagrana.com');
    console.log('   Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    
  } catch (error) {
    console.error('\n💥 Erro no setup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { main as setupComplete };