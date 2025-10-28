const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // RECEITAS
  { name: 'Salário', type: 'RECEITA', icon: '💰', color: '#10b981' },
  { name: 'Freelance', type: 'RECEITA', icon: '💼', color: '#3b82f6' },
  { name: 'Investimentos', type: 'RECEITA', icon: '📈', color: '#8b5cf6' },
  { name: 'Depósito', type: 'RECEITA', icon: '💵', color: '#06b6d4' },
  { name: 'Outros Ganhos', type: 'RECEITA', icon: '🎁', color: '#14b8a6' },
  
  // DESPESAS
  { name: 'Alimentação', type: 'DESPESA', icon: '🍔', color: '#ef4444' },
  { name: 'Transporte', type: 'DESPESA', icon: '🚗', color: '#f59e0b' },
  { name: 'Moradia', type: 'DESPESA', icon: '🏠', color: '#8b5cf6' },
  { name: 'Saúde', type: 'DESPESA', icon: '🏥', color: '#ec4899' },
  { name: 'Educação', type: 'DESPESA', icon: '📚', color: '#3b82f6' },
  { name: 'Lazer', type: 'DESPESA', icon: '🎮', color: '#f97316' },
  { name: 'Compras', type: 'DESPESA', icon: '🛒', color: '#a855f7' },
  { name: 'Contas', type: 'DESPESA', icon: '📄', color: '#6366f1' },
  { name: 'Saque', type: 'DESPESA', icon: '💸', color: '#dc2626' },
  { name: 'Outros Gastos', type: 'DESPESA', icon: '📦', color: '#64748b' },
];

async function createDefaultCategories() {
  try {
    console.log('📂 Criando categorias padrão...\n');
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado!');
      return;
    }
    
    console.log(`👥 Encontrados ${users.length} usuários\n`);
    
    for (const user of users) {
      console.log(`\n📝 Criando categorias para: ${user.name} (${user.email})`);
      
      // Verificar categorias existentes
      const existingCategories = await prisma.category.findMany({
        where: { userId: user.id }
      });
      
      console.log(`   Categorias existentes: ${existingCategories.length}`);
      
      let created = 0;
      let skipped = 0;
      
      for (const category of DEFAULT_CATEGORIES) {
        // Verificar se já existe
        const exists = existingCategories.find(
          c => c.name === category.name && c.type === category.type
        );
        
        if (exists) {
          skipped++;
          continue;
        }
        
        // Criar categoria
        await prisma.category.create({
          data: {
            userId: user.id,
            name: category.name,
            type: category.type,
            icon: category.icon,
            color: category.color,
            isDefault: true,
            isActive: true
          }
        });
        
        created++;
      }
      
      console.log(`   ✅ Criadas: ${created} | ⏭️  Ignoradas: ${skipped}`);
    }
    
    console.log('\n✅ Categorias padrão criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultCategories();
