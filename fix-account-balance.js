const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccountBalance() {
  try {
    console.log('=== CORREÇÃO: Saldo da Conta Carol k ===\n');

    // Buscar a conta Carol k
    const account = await prisma.account.findFirst({
      where: { name: 'Carol k' }
    });

    if (!account) {
      console.log('Conta Carol k não encontrada!');
      return;
    }

    console.log(`Conta encontrada: ${account.name} (ID: ${account.id})`);
    console.log(`Saldo atual (incorreto): R$ ${account.balance}\n`);

    // Buscar todas as transações da conta
    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { date: 'asc' }
    });

    console.log(`Total de transações: ${transactions.length}\n`);

    // Calcular saldo correto baseado nas transações
    let creditTotal = 0;
    let debitTotal = 0;

    console.log('Transações processadas:');
    for (const transaction of transactions) {
      if (transaction.status === 'completed' || transaction.status === 'cleared') {
        if (transaction.type === 'credit') {
          creditTotal += parseFloat(transaction.amount);
          console.log(`✅ ${transaction.date.toISOString().split('T')[0]} | CRÉDITO | R$ ${transaction.amount} | ${transaction.description}`);
        } else if (transaction.type === 'debit') {
          debitTotal += parseFloat(transaction.amount);
          console.log(`✅ ${transaction.date.toISOString().split('T')[0]} | DÉBITO | R$ ${transaction.amount} | ${transaction.description}`);
        }
      } else {
        console.log(`⏸️  ${transaction.date.toISOString().split('T')[0]} | ${transaction.type.toUpperCase()} | R$ ${transaction.amount} | ${transaction.description} (${transaction.status})`);
      }
    }

    const correctBalance = creditTotal - debitTotal;

    console.log(`\n=== CÁLCULO DO SALDO CORRETO ===`);
    console.log(`Créditos totais: R$ ${creditTotal}`);
    console.log(`Débitos totais: R$ ${debitTotal}`);
    console.log(`Saldo correto: R$ ${correctBalance}`);
    console.log(`Diferença a corrigir: R$ ${parseFloat(account.balance) - correctBalance}\n`);

    // Atualizar o saldo da conta
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: { balance: correctBalance }
    });

    console.log('✅ SALDO CORRIGIDO COM SUCESSO!');
    console.log(`Saldo anterior: R$ ${account.balance}`);
    console.log(`Saldo atual: R$ ${updatedAccount.balance}`);

  } catch (error) {
    console.error('Erro ao corrigir saldo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccountBalance();