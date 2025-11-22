/**
 * SCRIPT: Corrigir Transações Desbalanceadas
 * Adiciona os lançamentos faltantes para balancear o sistema
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo transações desbalanceadas...\n');

  // IDs das transações problemáticas
  const problematicTransactions = [
    'cmhcgtrjn000614bjk4kmgg3c', // Almoço - R$ 100
    'cmhd8bcws0003lzjcb8zcxzfw', // ooo - R$ 10
  ];

  for (const txId of problematicTransactions) {
    try {
      await fixTransaction(txId);
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${txId}:`, error.message);
    }
  }

  // Validar balanceamento final
  console.log('\n🔍 Validando balanceamento final...');
  const validation = await validateSystemBalance();
  
  if (validation.isBalanced) {
    console.log('✅ Sistema balanceado!');
    console.log(`   Débitos:  R$ ${validation.totalDebits.toFixed(2)}`);
    console.log(`   Créditos: R$ ${validation.totalCredits.toFixed(2)}`);
    console.log(`   Diferença: R$ ${validation.difference.toFixed(2)}`);
  } else {
    console.log('⚠️  Sistema ainda desbalanceado!');
    console.log(`   Débitos:  R$ ${validation.totalDebits.toFixed(2)}`);
    console.log(`   Créditos: R$ ${validation.totalCredits.toFixed(2)}`);
    console.log(`   Diferença: R$ ${validation.difference.toFixed(2)}`);
  }

  await prisma.$disconnect();
}

async function fixTransaction(transactionId) {
  return await prisma.$transaction(async (tx) => {
    // Buscar transação
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: {
        journalEntries: true,
        account: true,
        categoryRef: true,
      },
    });

    if (!transaction) {
      throw new Error('Transação não encontrada');
    }

    console.log(`📝 Corrigindo: ${transaction.description}`);
    console.log(`   Tipo: ${transaction.type}`);
    console.log(`   Valor: R$ ${Number(transaction.amount).toFixed(2)}`);

    // Verificar lançamentos existentes
    const existingDebits = transaction.journalEntries
      .filter((e) => e.entryType === 'DEBITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const existingCredits = transaction.journalEntries
      .filter((e) => e.entryType === 'CREDITO')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    console.log(`   Débitos existentes:  R$ ${existingDebits.toFixed(2)}`);
    console.log(`   Créditos existentes: R$ ${existingCredits.toFixed(2)}`);

    const amount = Math.abs(Number(transaction.amount));

    // Para DESPESA: precisa de DÉBITO na conta de despesa
    if (transaction.type === 'DESPESA') {
      // Já tem CRÉDITO na conta bancária, falta DÉBITO na despesa
      
      // Buscar ou criar conta de despesa
      const categoryName = transaction.categoryRef?.name || 'Sem Categoria';
      const accountName = `Despesa - ${categoryName}`;

      let expenseAccount = await tx.account.findFirst({
        where: {
          userId: transaction.userId,
          name: accountName,
          type: 'DESPESA',
        },
      });

      if (!expenseAccount) {
        expenseAccount = await tx.account.create({
          data: {
            userId: transaction.userId,
            name: accountName,
            type: 'DESPESA',
            balance: 0,
            currency: 'BRL',
            isActive: true,
          },
        });
        console.log(`   ✅ Conta de despesa criada: ${accountName}`);
      }

      // Criar lançamento de DÉBITO faltante
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: expenseAccount.id,
          entryType: 'DEBITO',
          amount: amount,
          description: `Despesa: ${transaction.description}`,
        },
      });

      console.log(`   ✅ Lançamento de DÉBITO criado: R$ ${amount.toFixed(2)}`);

      // Recalcular saldo da conta de despesa
      await recalculateAccountBalance(tx, expenseAccount.id);
    }

    console.log(`   ✅ Transação corrigida!\n`);
  });
}

async function recalculateAccountBalance(tx, accountId) {
  const account = await tx.account.findUnique({
    where: { id: accountId },
    include: {
      journalEntries: {
        include: {
          transaction: true,
        },
      },
    },
  });

  if (!account) return;

  const validEntries = account.journalEntries.filter(
    (e) => e.transaction && e.transaction.deletedAt === null
  );

  let newBalance = 0;

  switch (account.type) {
    case 'ATIVO':
      const ativoDebits = validEntries
        .filter((e) => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const ativoCredits = validEntries
        .filter((e) => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      newBalance = ativoDebits - ativoCredits;
      break;

    case 'PASSIVO':
      const passivoCredits = validEntries
        .filter((e) => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const passivoDebits = validEntries
        .filter((e) => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      newBalance = passivoCredits - passivoDebits;
      break;

    case 'RECEITA':
      const receitaCredits = validEntries
        .filter((e) => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const receitaDebits = validEntries
        .filter((e) => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      newBalance = receitaCredits - receitaDebits;
      break;

    case 'DESPESA':
      const despesaDebits = validEntries
        .filter((e) => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const despesaCredits = validEntries
        .filter((e) => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      newBalance = despesaDebits - despesaCredits;
      break;
  }

  await tx.account.update({
    where: { id: accountId },
    data: { balance: newBalance },
  });
}

async function validateSystemBalance() {
  const entries = await prisma.journalEntry.findMany();

  const totalDebits = entries
    .filter((e) => e.entryType === 'DEBITO')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const totalCredits = entries
    .filter((e) => e.entryType === 'CREDITO')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference <= 0.01;

  return {
    isBalanced,
    totalDebits,
    totalCredits,
    difference,
  };
}

main()
  .then(() => {
    console.log('\n✅ Correção concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });
