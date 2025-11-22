/**
 * SCRIPT: Corrigir Lançamentos de Despesas Compartilhadas
 * 
 * Despesas compartilhadas devem ser lançadas assim:
 * - Se EU paguei R$ 10 mas minha parte é R$ 5:
 *   - DÉBITO: Despesa R$ 5 (minha parte)
 *   - DÉBITO: Valores a Receber R$ 5 (parte do outro)
 *   - CRÉDITO: Conta Bancária R$ 10 (total pago)
 * 
 * - Quando a pessoa paga a fatura:
 *   - DÉBITO: Conta Bancária R$ 5
 *   - CRÉDITO: Valores a Receber R$ 5
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo lançamentos de despesas compartilhadas...\n');

  // Buscar transações compartilhadas
  const sharedTransactions = await prisma.transaction.findMany({
    where: {
      isShared: true,
      deletedAt: null,
    },
    include: {
      journalEntries: true,
      account: true,
      categoryRef: true,
    },
  });

  console.log(`📊 Encontradas ${sharedTransactions.length} despesas compartilhadas\n`);

  for (const transaction of sharedTransactions) {
    try {
      await fixSharedExpenseJournal(transaction);
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${transaction.id}:`, error.message);
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
    console.log('⚠️  Sistema desbalanceado!');
    console.log(`   Débitos:  R$ ${validation.totalDebits.toFixed(2)}`);
    console.log(`   Créditos: R$ ${validation.totalCredits.toFixed(2)}`);
    console.log(`   Diferença: R$ ${validation.difference.toFixed(2)}`);
  }

  await prisma.$disconnect();
}

async function fixSharedExpenseJournal(transaction) {
  return await prisma.$transaction(async (tx) => {
    console.log(`📝 Analisando: ${transaction.description}`);
    console.log(`   Valor total: R$ ${Number(transaction.amount).toFixed(2)}`);
    console.log(`   Minha parte: R$ ${Number(transaction.myShare || 0).toFixed(2)}`);

    const totalAmount = Math.abs(Number(transaction.amount));
    const myShare = Math.abs(Number(transaction.myShare || totalAmount));
    const othersShare = totalAmount - myShare;

    console.log(`   Parte dos outros: R$ ${othersShare.toFixed(2)}`);

    // Se não há parte dos outros, não é realmente compartilhada
    if (othersShare <= 0.01) {
      console.log('   ⏭️  Não é compartilhada (minha parte = total)\n');
      return;
    }

    // Deletar lançamentos existentes
    await tx.journalEntry.deleteMany({
      where: { transactionId: transaction.id },
    });

    console.log('   🗑️  Lançamentos antigos removidos');

    // Criar lançamentos corretos
    const entries = [];

    // 1. DÉBITO: Despesa (minha parte)
    const categoryName = transaction.categoryRef?.name || 'Sem Categoria';
    const expenseAccountName = `Despesa - ${categoryName}`;

    let expenseAccount = await tx.account.findFirst({
      where: {
        userId: transaction.userId,
        name: expenseAccountName,
        type: 'DESPESA',
      },
    });

    if (!expenseAccount) {
      expenseAccount = await tx.account.create({
        data: {
          userId: transaction.userId,
          name: expenseAccountName,
          type: 'DESPESA',
          balance: 0,
          currency: 'BRL',
          isActive: true,
        },
      });
    }

    entries.push({
      accountId: expenseAccount.id,
      entryType: 'DEBITO',
      amount: myShare,
      description: `Despesa compartilhada (minha parte): ${transaction.description}`,
    });

    // 2. DÉBITO: Valores a Receber (parte dos outros)
    let receivableAccount = await tx.account.findFirst({
      where: {
        userId: transaction.userId,
        name: 'Valores a Receber - Compartilhado',
        type: 'ATIVO',
      },
    });

    if (!receivableAccount) {
      receivableAccount = await tx.account.create({
        data: {
          userId: transaction.userId,
          name: 'Valores a Receber - Compartilhado',
          type: 'ATIVO',
          balance: 0,
          currency: 'BRL',
          isActive: true,
        },
      });
      console.log('   ✅ Conta "Valores a Receber" criada');
    }

    entries.push({
      accountId: receivableAccount.id,
      entryType: 'DEBITO',
      amount: othersShare,
      description: `A receber (compartilhado): ${transaction.description}`,
    });

    // 3. CRÉDITO: Conta Bancária (total pago)
    entries.push({
      accountId: transaction.accountId,
      entryType: 'CREDITO',
      amount: totalAmount,
      description: `Pagamento compartilhado: ${transaction.description}`,
    });

    // Criar todos os lançamentos
    for (const entry of entries) {
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: entry.accountId,
          entryType: entry.entryType,
          amount: entry.amount,
          description: entry.description,
        },
      });
    }

    console.log('   ✅ Lançamentos corretos criados:');
    console.log(`      DÉBITO: Despesa R$ ${myShare.toFixed(2)}`);
    console.log(`      DÉBITO: A Receber R$ ${othersShare.toFixed(2)}`);
    console.log(`      CRÉDITO: Conta R$ ${totalAmount.toFixed(2)}`);

    // Validar balanceamento
    const totalDebits = myShare + othersShare;
    const totalCredits = totalAmount;
    const diff = Math.abs(totalDebits - totalCredits);

    if (diff > 0.01) {
      throw new Error(`Desbalanceado! Débitos: ${totalDebits}, Créditos: ${totalCredits}`);
    }

    console.log('   ✅ Balanceamento OK\n');

    // Recalcular saldos
    await recalculateAccountBalance(tx, expenseAccount.id);
    await recalculateAccountBalance(tx, receivableAccount.id);
    await recalculateAccountBalance(tx, transaction.accountId);
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
      const receitaDebitos = validEntries
        .filter((e) => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      newBalance = receitaCredits - receitaDebitos;
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
