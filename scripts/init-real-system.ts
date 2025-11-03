#!/usr/bin/env tsx

/**
 * 🚀 SCRIPT DE INICIALIZAÇÃO DO SISTEMA REAL
 * 
 * Remove todos os dados mock e inicializa o sistema com dados reais
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function initRealSystem() {
  console.log('🚀 Inicializando sistema financeiro real...\n');

  try {
    // 1. Limpar dados mock existentes
    console.log('🧹 Limpando dados mock...');
    
    await prisma.transaction.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'mock-' } },
          { userId: 'mock-user-1' }
        ]
      }
    });

    await prisma.account.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'mock-' } },
          { userId: 'mock-user-1' }
        ]
      }
    });

    await prisma.trip.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'mock-' } },
          { userId: 'mock-user-1' }
        ]
      }
    });

    await prisma.investment.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'mock-' } },
          { userId: 'mock-user-1' }
        ]
      }
    });

    await prisma.goal.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'mock-' } },
          { userId: 'mock-user-1' }
        ]
      }
    });

    await prisma.budget.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'mock-' } },
          { userId: 'mock-user-1' }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: 'mock-user-1' },
          { email: 'mock@example.com' }
        ]
      }
    });

    console.log('✅ Dados mock removidos\n');

    // 2. Criar ou atualizar usuário administrador real
    console.log('👤 Verificando usuário administrador...');
    
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (adminUser) {
      // Atualizar usuário existente
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          name: 'Administrador',
          password: adminPassword,
          isActive: true,
          monthlyIncome: 5000,
          emergencyReserve: 15000,
          riskProfile: 'moderate',
          financialGoals: 'Crescimento patrimonial e reserva de emergência'
        }
      });
      console.log(`✅ Usuário admin atualizado: ${adminUser.email}`);
    } else {
      // Criar novo usuário
      adminUser = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@suagrana.com',
          password: adminPassword,
          isActive: true,
          monthlyIncome: 5000,
          emergencyReserve: 15000,
          riskProfile: 'moderate',
          financialGoals: 'Crescimento patrimonial e reserva de emergência'
        }
      });
      console.log(`✅ Usuário admin criado: ${adminUser.email}`);
    }

    // 3. Criar categorias padrão
    console.log('📂 Criando categorias padrão...');
    
    const categories = [
      // Despesas
      { name: 'Alimentação', type: 'expense', color: '#FF6B6B', icon: '🍽️' },
      { name: 'Transporte', type: 'expense', color: '#4ECDC4', icon: '🚗' },
      { name: 'Moradia', type: 'expense', color: '#45B7D1', icon: '🏠' },
      { name: 'Saúde', type: 'expense', color: '#96CEB4', icon: '🏥' },
      { name: 'Educação', type: 'expense', color: '#FFEAA7', icon: '📚' },
      { name: 'Lazer', type: 'expense', color: '#DDA0DD', icon: '🎮' },
      { name: 'Roupas', type: 'expense', color: '#98D8C8', icon: '👕' },
      { name: 'Tecnologia', type: 'expense', color: '#F7DC6F', icon: '💻' },
      { name: 'Pets', type: 'expense', color: '#BB8FCE', icon: '🐕' },
      { name: 'Outros', type: 'expense', color: '#85C1E9', icon: '📦' },
      
      // Receitas
      { name: 'Salário', type: 'income', color: '#52C41A', icon: '💰' },
      { name: 'Freelance', type: 'income', color: '#1890FF', icon: '💼' },
      { name: 'Investimentos', type: 'income', color: '#722ED1', icon: '📈' },
      { name: 'Vendas', type: 'income', color: '#FA8C16', icon: '🛒' },
      { name: 'Outros', type: 'income', color: '#13C2C2', icon: '💎' }
    ];

    await prisma.category.createMany({
      data: categories.map(cat => ({
        ...cat,
        userId: adminUser.id,
        isDefault: true,
        isActive: true,
        sortOrder: 0
      }))
    });

    console.log(`✅ ${categories.length} categorias criadas`);

    // 4. Criar contas padrão para o admin
    console.log('🏦 Criando contas padrão...');
    
    const accounts = await prisma.account.createMany({
      data: [
        {
          userId: adminUser.id,
          name: 'Conta Corrente Principal',
          type: 'checking',
          currency: 'BRL',
          isActive: true
        },
        {
          userId: adminUser.id,
          name: 'Poupança',
          type: 'savings',
          currency: 'BRL',
          isActive: true
        },
        {
          userId: adminUser.id,
          name: 'Investimentos',
          type: 'investment',
          currency: 'BRL',
          isActive: true
        }
      ]
    });

    console.log(`✅ ${accounts.count} contas criadas`);

    // 5. Criar algumas metas financeiras
    console.log('🎯 Criando metas financeiras...');
    
    const goals = await prisma.goal.createMany({
      data: [
        {
          userId: adminUser.id,
          name: 'Reserva de Emergência',
          description: 'Reserva para 6 meses de gastos',
          targetAmount: 30000,
          currentAmount: 15000,
          deadline: new Date('2025-12-31'),
          priority: 'high',
          status: 'active'
        },
        {
          userId: adminUser.id,
          name: 'Viagem Internacional',
          description: 'Viagem para Europa',
          targetAmount: 15000,
          currentAmount: 3000,
          deadline: new Date('2025-07-01'),
          priority: 'medium',
          status: 'active'
        }
      ]
    });

    console.log(`✅ ${goals.count} metas criadas`);

    // 6. Configurar sistema
    console.log('⚙️ Configurando sistema...');
    
    await prisma.systemConfig.createMany({
      data: [
        {
          key: 'SYSTEM_INITIALIZED',
          value: 'true',
          type: 'boolean',
          description: 'Sistema inicializado com dados reais'
        },
        {
          key: 'DEFAULT_CURRENCY',
          value: 'BRL',
          type: 'string',
          description: 'Moeda padrão do sistema'
        },
        {
          key: 'MOCK_DATA_REMOVED',
          value: new Date().toISOString(),
          type: 'datetime',
          description: 'Data de remoção dos dados mock'
        }
      ]
    });

    console.log('✅ Sistema configurado\n');

    // 7. Verificar integridade
    console.log('🔍 Verificando integridade do sistema...');
    
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const categoryCount = await prisma.category.count();
    const goalCount = await prisma.goal.count();
    
    console.log(`📊 Estatísticas do sistema:`);
    console.log(`   - Usuários: ${userCount}`);
    console.log(`   - Contas: ${accountCount}`);
    console.log(`   - Categorias: ${categoryCount}`);
    console.log(`   - Metas: ${goalCount}`);

    console.log('\n🎉 SISTEMA INICIALIZADO COM SUCESSO!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('   Email: admin@suagrana.com');
    console.log('   Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao inicializar sistema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initRealSystem()
    .then(() => {
      console.log('\n✅ Inicialização concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na inicialização:', error);
      process.exit(1);
    });
}

export { initRealSystem };