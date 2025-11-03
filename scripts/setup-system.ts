#!/usr/bin/env tsx

/**
 * 🚀 SCRIPT DE INICIALIZAÇÃO DO SISTEMA SUAGRANA
 * 
 * Este script configura o sistema completo, incluindo:
 * - Validação de configurações
 * - Inicialização do banco de dados
 * - Criação de usuário administrador
 * - Configuração de backup automático
 * - Verificação de integridade
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validateCriticalConfig } from '../src/lib/config';
import { automatedBackup } from '../src/lib/backup/automated-backup';
import { FinancialValidator } from '../src/lib/validation/financial-validation';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuração do sistema SuaGrana...\n');

  try {
    // 1. Validar configurações críticas
    console.log('1️⃣ Validando configurações...');
    const configValidation = validateCriticalConfig();
    
    if (!configValidation.isValid) {
      console.error('❌ Configurações inválidas:');
      configValidation.errors.forEach(error => {
        console.error(`   - ${error}`);
      });
      process.exit(1);
    }
    console.log('✅ Configurações válidas\n');

    // 2. Verificar conexão com banco de dados
    console.log('2️⃣ Verificando conexão com banco de dados...');
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida\n');

    // 3. Executar migrações
    console.log('3️⃣ Verificando migrações do banco...');
    // Note: Em produção, execute: npx prisma migrate deploy
    console.log('ℹ️ Execute: npx prisma migrate deploy (se necessário)\n');

    // 4. Criar usuário administrador padrão
    console.log('4️⃣ Configurando usuário administrador...');
    await createAdminUser();
    console.log('✅ Usuário administrador configurado\n');

    // 5. Criar categorias padrão
    console.log('5️⃣ Criando categorias padrão...');
    await createDefaultCategories();
    console.log('✅ Categorias padrão criadas\n');

    // 6. Verificar integridade do sistema
    console.log('6️⃣ Verificando integridade do sistema...');
    await verifySystemIntegrity();
    console.log('✅ Integridade do sistema verificada\n');

    // 7. Configurar backup automático
    console.log('7️⃣ Configurando backup automático...');
    automatedBackup.start();
    console.log('✅ Backup automático configurado\n');

    // 8. Criar backup inicial
    console.log('8️⃣ Criando backup inicial...');
    const backupResult = await automatedBackup.createFullBackup();
    if (backupResult.success) {
      console.log(`✅ Backup inicial criado: ${backupResult.backupId}\n`);
    } else {
      console.warn(`⚠️ Falha no backup inicial: ${backupResult.error}\n`);
    }

    console.log('🎉 Sistema SuaGrana configurado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Acesse http://localhost:3000');
    console.log('   2. Faça login com: admin@suagrana.com / admin123');
    console.log('   3. Altere a senha do administrador');
    console.log('   4. Configure suas contas e categorias');
    console.log('\n🔒 Lembre-se de:');
    console.log('   - Alterar JWT_SECRET em produção');
    console.log('   - Configurar HTTPS em produção');
    console.log('   - Monitorar logs de segurança');

  } catch (error) {
    console.error('❌ Erro na configuração do sistema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdminUser() {
  try {
    // Verificar se já existe usuário admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (existingAdmin) {
      console.log('ℹ️ Usuário administrador já existe');
      return;
    }

    // Criar usuário administrador
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@suagrana.com',
        password: hashedPassword,
        preferences: JSON.stringify({
          theme: 'system',
          currency: 'BRL',
          language: 'pt-BR'
        })
      }
    });

    // Criar conta principal para o admin
    await prisma.account.create({
      data: {
        userId: admin.id,
        name: 'Conta Principal',
        type: 'checking',
        // balance: 0, // Campo removido do schema
        currency: 'BRL'
      }
    });

    console.log('✅ Usuário administrador criado: admin@suagrana.com');
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    throw error;
  }
}

async function createDefaultCategories() {
  // Buscar o usuário admin
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@suagrana.com' }
  });

  if (!admin) {
    console.warn('⚠️ Usuário admin não encontrado, pulando criação de categorias');
    return;
  }

  const defaultCategories = [
    // Categorias de Receita
    { name: 'Salário', type: 'income', color: '#10B981', icon: '💰' },
    { name: 'Freelance', type: 'income', color: '#3B82F6', icon: '💻' },
    { name: 'Investimentos', type: 'income', color: '#8B5CF6', icon: '📈' },
    { name: 'Outros Rendimentos', type: 'income', color: '#06B6D4', icon: '💎' },

    // Categorias de Despesa
    { name: 'Alimentação', type: 'expense', color: '#EF4444', icon: '🍽️' },
    { name: 'Transporte', type: 'expense', color: '#F59E0B', icon: '🚗' },
    { name: 'Moradia', type: 'expense', color: '#84CC16', icon: '🏠' },
    { name: 'Saúde', type: 'expense', color: '#EC4899', icon: '🏥' },
    { name: 'Educação', type: 'expense', color: '#6366F1', icon: '📚' },
    { name: 'Lazer', type: 'expense', color: '#F97316', icon: '🎮' },
    { name: 'Roupas', type: 'expense', color: '#A855F7', icon: '👕' },
    { name: 'Serviços', type: 'expense', color: '#14B8A6', icon: '🔧' },
    { name: 'Impostos', type: 'expense', color: '#6B7280', icon: '📋' },
    { name: 'Outros', type: 'expense', color: '#9CA3AF', icon: '📦' },

    // Categorias de Transferência
    { name: 'Transferência entre Contas', type: 'transfer', color: '#4B5563', icon: '🔄' },
    { name: 'Poupança', type: 'transfer', color: '#059669', icon: '🏦' }
  ];

  for (const category of defaultCategories) {
    try {
      const existing = await prisma.category.findFirst({
        where: { name: category.name, type: category.type, userId: admin.id }
      });
      
      if (!existing) {
        await prisma.category.create({
          data: {
            userId: admin.id,
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            isDefault: true
          }
        });
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao criar categoria ${category.name}:`, error);
    }
  }
}

async function verifySystemIntegrity() {
  try {
    const validator = new FinancialValidator(prisma);

    // Verificar todas as contas
    const accounts = await prisma.account.findMany();
    let inconsistentAccounts = 0;

    for (const account of accounts) {
      const validation = await validator.validateAccountBalance(account.id);
      if (!validation.isValid) {
        console.warn(`⚠️ Conta ${account.name} com saldo inconsistente`);
        inconsistentAccounts++;
      }
    }

    if (inconsistentAccounts === 0) {
      console.log('✅ Todos os saldos estão consistentes');
    } else {
      console.warn(`⚠️ ${inconsistentAccounts} contas com saldos inconsistentes`);
    }

    // Verificar integridade referencial
    const transactions = await prisma.transaction.findMany();
    let orphanedTransactions = 0;

    for (const transaction of transactions) {
      const validation = await validator.validateTransactionIntegrity(transaction.id);
      if (!validation.isValid) {
        orphanedTransactions++;
      }
    }

    if (orphanedTransactions === 0) {
      console.log('✅ Todas as transações têm integridade referencial');
    } else {
      console.warn(`⚠️ ${orphanedTransactions} transações com problemas de integridade`);
    }

  } catch (error) {
    console.error('❌ Erro na verificação de integridade:', error);
    throw error;
  }
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}

export { main as setupSystem };