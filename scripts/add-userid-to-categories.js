const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addUserIdToCategories() {
  try {
    console.log('🔍 Buscando categorias sem userId...');
    
    // Buscar todas as categorias
    const categories = await prisma.category.findMany();
    console.log(`📊 Encontradas ${categories.length} categorias`);

    if (categories.length === 0) {
      console.log('✅ Nenhuma categoria encontrada');
      return;
    }

    // Buscar o primeiro usuário do sistema
    const firstUser = await prisma.user.findFirst();
    
    if (!firstUser) {
      console.log('❌ Nenhum usuário encontrado no sistema');
      return;
    }

    console.log(`👤 Usando usuário: ${firstUser.email} (${firstUser.id})`);
    console.log(`🔄 Atualizando ${categories.length} categorias...`);

    // Atualizar todas as categorias para pertencerem ao primeiro usuário
    for (const category of categories) {
      await prisma.category.update({
        where: { id: category.id },
        data: { userId: firstUser.id }
      });
      console.log(`  ✅ ${category.name}`);
    }

    console.log('\n✅ Todas as categorias atualizadas!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addUserIdToCategories();
