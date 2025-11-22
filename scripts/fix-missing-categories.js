/**
 * SCRIPT: Corrigir Transações Sem Categoria
 * 
 * Atribui categoria padrão "Sem Categoria" para todas transações
 * que não têm categoria definida.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 CORRIGINDO TRANSAÇÕES SEM CATEGORIA\n');

  // 1. Buscar primeiro usuário
  const firstUser = await prisma.user.findFirst();
  
  if (!firstUser) {
    console.log('❌ Nenhum usuário encontrado no sistema');
    return;
  }

  console.log(`✅ Usuário encontrado: ${firstUser.name} (${firstUser.id})`);

  // 2. Buscar ou criar categoria "Sem Categoria"
  let uncategorizedCategory = await prisma.category.findFirst({
    where: {
      userId: firstUser.id,
      name: 'Sem Categoria',
    },
  });

  if (!uncategorizedCategory) {
    console.log('📂 Criando categoria "Sem Categoria"...');
    uncategorizedCategory = await prisma.category.create({
      data: {
        userId: firstUser.id,
        name: 'Sem Categoria',
        description: 'Categoria padrão para transações sem classificação',
        type: 'DESPESA',
        color: '#999999',
        icon: 'help-circle',
        isActive: true,
        isDefault: true,
      },
    });
    console.log(`✅ Categoria criada: ${uncategorizedCategory.id}`);
  } else {
    console.log(`✅ Categoria já existe: ${uncategorizedCategory.id}`);
  }

  // 3. Buscar transações sem categoria (incluindo deletadas)
  const transactionsWithoutCategory = await prisma.transaction.findMany({
    where: {
      categoryId: null,
      // Incluir deletadas também para migration funcionar
    },
  });

  console.log(`\n📊 Encontradas ${transactionsWithoutCategory.length} transações sem categoria`);

  if (transactionsWithoutCategory.length === 0) {
    console.log('✅ Todas as transações já têm categoria!');
    return;
  }

  // 4. Atualizar transações
  console.log('\n🔄 Atualizando transações...');
  
  let updated = 0;
  for (const tx of transactionsWithoutCategory) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { categoryId: uncategorizedCategory.id },
    });
    updated++;
    
    if (updated % 10 === 0) {
      console.log(`   Processadas ${updated}/${transactionsWithoutCategory.length}...`);
    }
  }

  console.log(`\n✅ ${updated} transações atualizadas com sucesso!`);
  console.log('\n🎉 Agora você pode executar a migration:');
  console.log('   npx prisma migrate dev --name fix-category-required');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
