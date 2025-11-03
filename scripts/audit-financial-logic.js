const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditFinancialLogic() {
  console.log('🔍 AUDITORIA COMPLETA DA LÓGICA FINANCEIRA\n');
  console.log('='.repeat(60));
  
  const issues = [];
  const warnings = [];
  const success = [];

  try {
    // 1. VERIFICAR TRANSAÇÕES COMPARTILHADAS
    console.log('\n📊 1. TRANSAÇÕES COMPARTILHADAS\n');
    
    const sharedTransactions = await prisma.transaction.findMany({
      where: {
        isShared: true,
        deletedAt: null,
      },
      include: {
        journalEntries: true,
      },
    });

    console.log(`   Total: ${sharedTransactions.length} transações`);

    for (const tx of sharedTransactions) {
      const sharedWith = tx.sharedWith ? JSON.parse(tx.sharedWith) : [];
      const totalParticipants = sharedWith.length + 1;
      const expectedMyShare = Number(tx.amount) / totalParticipants;
      const actualMyShare = tx.myShare ? Number(tx.myShare) : null;

      console.log(`\n   📝 ${tx.description}`);
      console.log(`      Valor total: R$ ${tx.amount}`);
      console.log(`      Participantes: ${totalParticipants}`);
      console.log(`      myShare esperado: R$ ${expectedMyShare.toFixed(2)}`);
      console.log(`      myShare atual: ${actualMyShare ? `R$ ${actualMyShare.toFixed(2)}` : 'NULL ⚠️'}`);

      // Verificar lançamentos contábeis
      const debitEntry = tx.journalEntries.find(e => e.entryType === 'DEBITO' && e.accountId === tx.accountId);
      const creditEntry = tx.journalEntries.find(e => e.entryType === 'CREDITO' && e.accountId === tx.accountId);
      
      const entryAmount = tx.type === 'DESPESA' 
        ? (creditEntry ? Number(creditEntry.amount) : 0)
        : (debitEntry ? Number(debitEntry.amount) : 0);

      console.log(`      Lançamento contábil: R$ ${entryAmount.toFixed(2)}`);

      if (!actualMyShare) {
        warnings.push(`Transação ${tx.id} sem myShare definido`);
        console.log(`      ⚠️  myShare não definido`);
      } else if (Math.abs(actualMyShare - expectedMyShare) > 0.01) {
        issues.push(`Transação ${tx.id}: myShare incorreto (${actualMyShare} vs ${expectedMyShare})`);
        console.log(`      ❌ myShare incorreto`);
      } else {
        console.log(`      ✅ myShare correto`);
      }

      if (Math.abs(entryAmount - expectedMyShare) > 0.01) {
        issues.push(`Transação ${tx.id}: Lançamento contábil incorreto (${entryAmount} vs ${expectedMyShare})`);
        console.log(`      ❌ Lançamento contábil incorreto`);
      } else {
        success.push(`Transação ${tx.id}: Lançamentos corretos`);
        console.log(`      ✅ Lançamento contábil correto`);
      }
    }

    // 2. VERIFICAR SALDOS DAS CONTAS
    console.log('\n\n💰 2. SALDOS DAS CONTAS\n');

    const accounts = await prisma.account.findMany({
      where: {
        type: { in: ['checking', 'savings', 'investment'] },
      },
      include: {
        journalEntries: {
          where: {
            transaction: {
              deletedAt: null,
            },
          },
        },
      },
    });

    for (const account of accounts) {
      const calculatedBalance = account.journalEntries.reduce((sum, entry) => {
        if (entry.entryType === 'DEBITO') {
          return sum + Number(entry.amount);
        } else {
          return sum - Number(entry.amount);
        }
      }, 0);

      const storedBalance = Number(account.balance);

      console.log(`\n   🏦 ${account.name}`);
      console.log(`      Saldo armazenado: R$ ${storedBalance.toFixed(2)}`);
      console.log(`      Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
      console.log(`      Diferença: R$ ${Math.abs(storedBalance - calculatedBalance).toFixed(2)}`);

      if (Math.abs(storedBalance - calculatedBalance) > 0.01) {
        issues.push(`Conta ${account.name}: Saldo incorreto (${storedBalance} vs ${calculatedBalance})`);
        console.log(`      ❌ SALDO INCORRETO`);
      } else {
        success.push(`Conta ${account.name}: Saldo correto`);
        console.log(`      ✅ Saldo correto`);
      }
    }

    // 3. VERIFICAR DÍVIDAS
    console.log('\n\n💳 3. DÍVIDAS COMPARTILHADAS\n');

    const debts = await prisma.sharedDebt.findMany({
      where: {
        status: { in: ['active', 'paid'] },
      },
    });

    console.log(`   Total: ${debts.length} dívidas`);

    for (const debt of debts) {
      console.log(`\n   📝 ${debt.description}`);
      console.log(`      Status: ${debt.status}`);
      console.log(`      Valor: R$ ${debt.currentAmount}`);
      console.log(`      Pago em: ${debt.paidAt || 'Não pago'}`);

      if (debt.status === 'paid' && !debt.paidAt) {
        warnings.push(`Dívida ${debt.id}: Marcada como paga mas sem paidAt`);
        console.log(`      ⚠️  Paga mas sem data de pagamento`);
      } else if (debt.status === 'active' && debt.paidAt) {
        issues.push(`Dívida ${debt.id}: Ativa mas com paidAt definido`);
        console.log(`      ❌ Status inconsistente`);
      } else {
        success.push(`Dívida ${debt.id}: Status consistente`);
        console.log(`      ✅ Status consistente`);
      }
    }

    // 4. VERIFICAR TRANSAÇÕES DE PAGAMENTO
    console.log('\n\n💸 4. TRANSAÇÕES DE PAGAMENTO DE FATURA\n');

    const paymentTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: 'Recebimento -' } },
          { description: { contains: 'Pagamento -' } },
        ],
        metadata: { not: null },
        deletedAt: null,
      },
    });

    console.log(`   Total: ${paymentTransactions.length} transações de pagamento`);

    for (const tx of paymentTransactions) {
      try {
        const metadata = JSON.parse(tx.metadata);
        
        console.log(`\n   📝 ${tx.description.substring(0, 50)}...`);
        console.log(`      Valor: R$ ${tx.amount}`);
        console.log(`      Categoria: ${tx.categoryId || 'SEM CATEGORIA ⚠️'}`);
        console.log(`      billingItemId: ${metadata.billingItemId || 'Não definido'}`);

        if (!tx.categoryId) {
          warnings.push(`Transação ${tx.id}: Sem categoria`);
          console.log(`      ⚠️  Sem categoria`);
        } else {
          success.push(`Transação ${tx.id}: Com categoria`);
          console.log(`      ✅ Com categoria`);
        }

        if (metadata.type === 'shared_expense_payment') {
          const billingItemId = metadata.billingItemId;
          
          if (billingItemId?.startsWith('debt-')) {
            const debtId = billingItemId.replace('debt-', '');
            const debt = await prisma.sharedDebt.findUnique({
              where: { id: debtId },
            });

            if (debt) {
              if (debt.status === 'paid') {
                success.push(`Pagamento ${tx.id}: Dívida marcada como paga`);
                console.log(`      ✅ Dívida marcada como paga`);
              } else {
                issues.push(`Pagamento ${tx.id}: Dívida não marcada como paga`);
                console.log(`      ❌ Dívida não marcada como paga`);
              }
            } else {
              issues.push(`Pagamento ${tx.id}: Dívida não encontrada`);
              console.log(`      ❌ Dívida não encontrada`);
            }
          }
        }
      } catch (e) {
        warnings.push(`Transação ${tx.id}: Erro ao processar metadata`);
        console.log(`      ⚠️  Erro ao processar metadata`);
      }
    }

    // 5. VERIFICAR PARTIDAS DOBRADAS
    console.log('\n\n📒 5. PARTIDAS DOBRADAS\n');

    const allEntries = await prisma.journalEntry.findMany({
      where: {
        transaction: {
          deletedAt: null,
        },
      },
      include: {
        transaction: true,
      },
    });

    // Agrupar por transação
    const entriesByTransaction = {};
    allEntries.forEach(entry => {
      if (!entriesByTransaction[entry.transactionId]) {
        entriesByTransaction[entry.transactionId] = [];
      }
      entriesByTransaction[entry.transactionId].push(entry);
    });

    console.log(`   Total de transações com lançamentos: ${Object.keys(entriesByTransaction).length}`);

    let balancedCount = 0;
    let unbalancedCount = 0;

    for (const [txId, entries] of Object.entries(entriesByTransaction)) {
      const totalDebit = entries
        .filter(e => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const totalCredit = entries
        .filter(e => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const difference = Math.abs(totalDebit - totalCredit);

      if (difference > 0.01) {
        unbalancedCount++;
        const tx = entries[0].transaction;
        issues.push(`Transação ${txId}: Partidas desbalanceadas (D: ${totalDebit}, C: ${totalCredit})`);
        console.log(`   ❌ ${tx.description}: D: R$ ${totalDebit.toFixed(2)}, C: R$ ${totalCredit.toFixed(2)} (Diff: R$ ${difference.toFixed(2)})`);
      } else {
        balancedCount++;
      }
    }

    console.log(`\n   ✅ Balanceadas: ${balancedCount}`);
    console.log(`   ❌ Desbalanceadas: ${unbalancedCount}`);

    // RESUMO FINAL
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 RESUMO DA AUDITORIA\n');
    console.log(`✅ Verificações OK: ${success.length}`);
    console.log(`⚠️  Avisos: ${warnings.length}`);
    console.log(`❌ Problemas Críticos: ${issues.length}`);

    if (issues.length > 0) {
      console.log('\n❌ PROBLEMAS CRÍTICOS:\n');
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  AVISOS:\n');
      warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
    }

    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n🎉 SISTEMA 100% CORRETO! Nenhum problema encontrado!');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditFinancialLogic();
