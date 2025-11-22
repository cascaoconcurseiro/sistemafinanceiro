/**
 * Script para corrigir datas de transações antigas
 * Atualiza transações do dia 30/10/2025 para 01/11/2025
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOldTransactionDates() {
  try {
    console.log('🔧 Iniciando correção de datas antigas...\n');

    // Data de 30/10/2025 (UTC)
    const oldDate = new Date('2025-10-30T00:00:00.000Z');

    // Buscar transações do dia 30/10/2025
    const transactions = await prisma.transaction.findMany({
      where: {
        date: oldDate,
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        date: true,
        amount: true,
      },
    });

    console.log(`📊 Encontradas ${transactions.length} transações em 30/10/2025\n`);

    if (transactions.length === 0) {
      console.log('✅ Nenhuma transação para corrigir!');
      return;
    }

    // Mostrar transações que serão atualizadas
    console.log('📋 Transações que serão atualizadas:');
    transactions.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.description} - R$ ${Number(t.amount).toFixed(2)}`);
      console.log(`     Data atual: ${t.date.toISOString()}`);
      console.log(`     Data local: ${t.date.toLocaleString('pt-BR')}`);
    });

    console.log('\n⚠️  Essas transações serão atualizadas para 01/11/2025 às 12:00:00');
    console.log('Pressione Ctrl+C para cancelar ou aguarde 3 segundos...\n');

    // Aguardar 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Nova data: 01/11/2025 às 12:00:00 (meio-dia para evitar problemas de timezone)
    const newDate = new Date('2025-11-01T12:00:00.000Z');

    // Atualizar todas as transações
    const result = await prisma.transaction.updateMany({
      where: {
        date: oldDate,
        deletedAt: null,
      },
      data: {
        date: newDate,
      },
    });

    console.log(`✅ ${result.count} transações atualizadas com sucesso!`);
    console.log(`📅 Nova data: ${newDate.toISOString()}`);
    console.log(`📅 Data local: ${newDate.toLocaleString('pt-BR')}\n`);

    // Verificar resultado
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        date: newDate,
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        date: true,
      },
    });

    console.log('✅ Verificação:');
    console.log(`   ${updatedTransactions.length} transações agora estão em 01/11/2025\n`);

  } catch (error) {
    console.error('❌ Erro ao corrigir datas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixOldTransactionDates()
  .then(() => {
    console.log('🎉 Correção concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
