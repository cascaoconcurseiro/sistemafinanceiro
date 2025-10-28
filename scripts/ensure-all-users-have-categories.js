const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  // Receitas
  { name: 'Salário', type: 'RECEITA', color: '#10B981', icon: '💰' },
  { name: 'Freelance', type: 'RECEITA', color: '#059669', icon: '💼' },
  { name: 'Investimentos', type: 'RECEITA', color: '#34D399', icon: '📈' },
  { name: 'Depósito', type: 'RECEITA', color: '#6EE7B7', icon: '💵' },
  { name: 'Outros', type: 'RECEITA', color: '#A7F3D0', icon: '📥' },
  
  // Despesas
  { name: 'Alimentação', type: 'DESPESA', color: '#EF4444', icon: '🍔' },
  { name: 'Transporte', type: 'DESPESA', color: '#DC2626', icon: '🚗' },
  { name: 'Moradia', type: 'DESPESA', color: '#B91C1C', icon: '🏠' },
  { name: 'Saúde', type: 'DESPESA', color: '#991B1B', icon: '🏥' },
  { name: 'Educação', type: 'DESPESA', color: '#7F1D1D', icon: '📚' },
  { name: 'Lazer', type: 'DESPESA', color: '#F59E0B', icon: '🎮' },
  { name: 'Compras', type: 'DESPESA', color: '#D97706', icon: '🛍️' },
  { name: 'Contas', type: 'DESPESA', color: '#B45309', icon: '📄' },
  { name: 'Outros', type: 'DESPESA', color: '#6B7280', icon: '📤' },
];

async function ensureAllUsersHaveCategories() {
  try {
    console.log('🔍 Buscando todos os usuários...');
    
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, name: true }
    });

    console.log(`📊 Encontrados ${users.length} usuários ativos\n`);

    let totalCreated = 0;
    let usersUpdated = 0;

    for (const user of users) {
      console.log(`👤 Processando: ${user.name} (${user.email})`);
      
      // Verificar se o usuário já tem categorias
      const existingCategories = await prisma.category.count({
        where: { userId: user.id }
      });

      if (existingCategories > 0) {
        console.log(`   ✅ Já tem ${existingCategories} categorias\n`);
        continue;
      }

      // Criar categorias padrão
      await prisma.category.createMany({
        data: defaultCategories.map(cat => ({
          userId: user.id,
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          isActive: true,
          isDefault: true
        }))
      });

      console.log(`   ✅ ${defaultCategories.length} categorias criadas\n`);
      totalCreated += defaultCategories.length;
      usersUpdated++;
    }

    console.log('📊 Resumo Final:');
    console.log(`   👥 ${users.length} usuários processados`);
    console.log(`   ✅ ${usersUpdated} usuários receberam categorias`);
    console.log(`   📁 ${totalCreated} categorias criadas no total`);
    console.log('\n✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureAllUsersHaveCategories();
