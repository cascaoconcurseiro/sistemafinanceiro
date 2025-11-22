/**
 * Script para corrigir horário de transações
 * Atualiza transações de 00:00:00 para 12:00:00 para evitar problemas de timezone
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMidnightDates() {
  try {
    console.log('🔧 Corrigindo horários de meia-noite...\n');

    // Data de 01/11/2025 à meia-noite
    const midnightDate = new Date('2025-11-01T00:00:00.000Z');

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where: {
        date: midnightDate,
        deletedAt: null,
      },
      select: {
        id: true,
        description: true,
        date: true,
        amount: true,
      },
    });

    console.log(`📊 Encontradas ${transactions.length} transações em 01/11/2025 00:00:00\n`);

    if (transactions.length === 0) {
      console.log('✅ Nenhuma transação para corrigir!');
      return;
    }

    // Mostrar transações
    console.log('📋 Transações que serão atualizadas:');
    transactions.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.description} - R$ ${Number(t.amount).toFixed(2)}`);
    });

    console.log('\n⚠️  Horário será atualizado para 12:00:00');
    console.log('Aguarde 2 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Nova data: 01/11/2025 às 12:00:00
    const noonDate = new Date('2025-11-01T12:00:00.000Z');

    // Atualizar
    const result = await prisma.transaction.updateMany({
      where: {
        date: midnightDate,
        deletedAt: null,
      },
      data: {
        date: noonDate,
      },
    });

    console.log(`✅ ${result.count} transações atualizadas!`);
    console.log(`📅 Nova data: ${noonDate.toISOString()}`);
    console.log(`📅 Data local: ${noonDate.toLocaleString('pt-BR')}\n`);

  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixMidnightDates()
  .then(() => {
    console.log('🎉 Concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
