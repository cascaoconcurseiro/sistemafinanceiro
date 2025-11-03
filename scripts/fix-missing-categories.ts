import { prisma } from '@/lib/prisma';

async function fixMissingCategories() {
  console.log('🔧 Corrigindo transações sem categoria...\n');
  console.log('='.repeat(60));
  
  // Buscar transações sem categoria
  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      OR: [
        { categoryId: null },
        { categoryId: '' }
      ]
    }
  });
  
  console.log(`\n📊 Encontradas ${transactions.length} transações sem categoria\n`);
  
  if (transactions.length === 0) {
    console.log('✅ Todas as transações já têm categoria!');
    return { fixed: 0 };
  }
  
  // Agrupar por usuário
  const userIds = [...new Set(transactions.map(t => t.userId))];
  console.log(`👥 ${userIds.length} usuários afetados\n`);
  
  let fixed = 0;
  
  for (const userId of userIds) {
    // Buscar ou criar categoria "Sem Categoria"
    let category = await prisma.category.findFirst({
      where: {
        userId,
        name: 'Sem Categoria'
      }
    });
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          userId,
          name: 'Sem Categoria',
          type: 'DESPESA',
          description: 'Transações sem categoria definida',
          isDefault: true,
          isActive: true,
          sortOrder: 999
        }
      });
    }
    
    // Atualizar transações do usuário
    const result = await prisma.transaction.updateMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          { categoryId: null },
          { categoryId: '' }
        ]
      },
      data: {
        categoryId: category.id
      }
    });
    
    fixed += result.count;
    console.log(`✅ Usuário ${userId}: ${result.count} transações atualizadas`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Total de transações corrigidas: ${fixed}`);
  
  return { fixed };
}

// Executar
fixMissingCategories()
  .then(result => {
    console.log('\n🎉 Correção concluída!');
  })
  .catch(error => {
    console.error('❌ Erro ao corrigir categorias:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
