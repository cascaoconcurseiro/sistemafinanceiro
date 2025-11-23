/**
 * Script para tornar categoria obrigatória
 * 1. Cria categoria padrão "Sem Categoria"
 * 2. Atribui a todas as transações sem categoria
 * 3. Prepara para migração do schema
 */

import { prisma } from '../src/lib/prisma';

async function makeCategoryRequired() {
  console.log('🔧 Tornando categoria obrigatória...\n');

  try {
    // 1. Buscar ou criar categoria padrão
    console.log('1️⃣ Verificando categoria padrão...');
    
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      let defaultCategory = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: 'Sem Categoria'
        }
      });

      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            userId: user.id,
            name: 'Sem Categoria',
            type: 'expense',
            color: '#999999',
            icon: 'help-circle'
          }
        });
        console.log(`   ✅ Categoria padrão criada para ${user.email}`);
      } else {
        console.log(`   ✅ Categoria padrão já existe para ${user.email}`);
      }

      // 2. Buscar transações sem categoria
      const transactionsWithoutCategory = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          categoryId: null,
          deletedAt: null
        }
      });

      console.log(`\n2️⃣ Encontradas ${transactionsWithoutCategory.length} transações sem categoria`);

      if (transactionsWithoutCategory.length === 0) {
        console.log('   ✅ Todas as transações já têm categoria!');
        continue;
      }

      // 3. Atualizar transações
      console.log('3️⃣ Atualizando transações...');
      
      const result = await prisma.transaction.updateMany({
        where: {
          userId: user.id,
          categoryId: null,
          deletedAt: null
        },
        data: {
          categoryId: defaultCategory.id
        }
      });

      console.log(`   ✅ ${result.count} transações atualizadas!`);
    }

    // 4. Verificar se ainda existem transações sem categoria
    const remaining = await prisma.transaction.count({
      where: {
        categoryId: null,
        deletedAt: null
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`✅ Transações sem categoria: ${remaining}`);

    if (remaining === 0) {
      console.log('\n🎉 Todas as transações agora têm categoria!');
      console.log('\n📝 PRÓXIMO PASSO:');
      console.log('   Atualize o schema.prisma:');
      console.log('   categoryId String  // Remover "?"');
      console.log('\n   Execute: npx prisma migrate dev --name make-category-required');
    } else {
      console.log('\n⚠️  Ainda existem transações sem categoria!');
      console.log('   Verifique transações deletadas ou de outros usuários.');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
makeCategoryRequired();
