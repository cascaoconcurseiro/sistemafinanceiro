/**
 * Script para criar a categoria "Reembolso" no banco de dados
 * Necessária para o sistema de despesas compartilhadas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createReembolsoCategory() {
  try {
    console.log('🔍 Verificando se categoria Reembolso já existe...');

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });

    console.log(`📋 Encontrados ${users.length} usuários`);

    for (const user of users) {
      console.log(`\n👤 Processando usuário: ${user.name} (${user.email})`);

      // Verificar se já existe categoria Reembolso para este usuário
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: 'Reembolso',
        }
      });

      if (existingCategory) {
        console.log(`  ✅ Categoria Reembolso já existe (ID: ${existingCategory.id})`);
        continue;
      }

      // Criar categoria Reembolso
      const category = await prisma.category.create({
        data: {
          name: 'Reembolso',
          type: 'RECEITA',
          userId: user.id,
          icon: '💰',
          color: '#10b981', // Verde
        }
      });

      console.log(`  ✅ Categoria Reembolso criada (ID: ${category.id})`);
    }

    console.log('\n✅ Script concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
createReembolsoCategory()
  .then(() => {
    console.log('\n🎉 Todas as categorias foram criadas!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
