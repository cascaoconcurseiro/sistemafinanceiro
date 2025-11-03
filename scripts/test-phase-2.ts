import { prisma } from '@/lib/prisma';
import { TransferService } from '@/lib/services/transfer-service';
import { InvoiceService } from '@/lib/services/invoice-service';
import { CashFlowService } from '@/lib/services/cash-flow-service';

/**
 * Script de teste da Fase 2
 */

async function testPhase2() {
  console.log('🧪 Testando Fase 2...\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Buscar dados para teste
  const user = await prisma.user.findFirst();
  const accounts = await prisma.account.findMany({
    where: { userId: user?.id },
    take: 2
  });

  if (!user || accounts.length < 2) {
    console.log('⚠️  Dados insuficientes para teste');
    console.log('   Necessário: 1 usuário e 2 contas');
    return;
  }

  // 1. Testar TransferService
  console.log('\n1️⃣ Testando TransferService...');
  try {
    const transfer = await TransferService.createTransfer({
      fromAccountId: accounts[0].id,
      toAccountId: accounts[1].id,
      amount: 100,
      description: 'Teste de transferência',
      date: new Date(),
      userId: user.id,
      createdBy: 'test-script'
    });

    if (transfer.debit && transfer.credit && transfer.transactionGroupId) {
      console.log(`✅ Transferência criada: ${transfer.transactionGroupId}`);
      console.log(`   Débito: ${transfer.debit.id} (-R$ ${transfer.amount})`);
      console.log(`   Crédito: ${transfer.credit.id} (+R$ ${transfer.amount})`);
      passed++;

      // Testar busca por grupo
      const grouped = await TransferService.getTransfersByGroup(
        transfer.transactionGroupId,
        user.id
      );

      if (grouped.length === 2) {
        console.log(`✅ Busca por grupo funcionando (${grouped.length} transações)`);
        passed++;
      } else {
        console.log(`❌ Busca por grupo falhou`);
        failed++;
      }

      // Testar cancelamento
      const canceled = await TransferService.cancelTransfer(
        transfer.debit.id,
        user.id,
        'test-script'
      );

      if (canceled.canceled.length === 2) {
        console.log(`✅ Cancelamento funcionando (${canceled.canceled.length} transações)`);
        passed++;
      } else {
        console.log(`❌ Cancelamento falhou`);
        failed++;
      }
    } else {
      console.log('❌ Transferência incompleta');
      failed++;
    }
  } catch (error) {
    console.log('❌ Erro no teste de transferência:', error);
    failed++;
  }

  // 2. Testar InvoiceService
  console.log('\n2️⃣ Testando InvoiceService...');
  try {
    const card = await prisma.creditCard.findFirst({
      where: { userId: user.id }
    });

    if (card) {
      // Buscar ou criar fatura
      const invoice = await InvoiceService.getCurrentInvoice(card.id, user.id);

      if (invoice) {
        console.log(`✅ Fatura obtida/criada: ${invoice.id}`);
        console.log(`   Status: ${invoice.status}`);
        console.log(`   Total: R$ ${invoice.totalAmount}`);
        passed++;
      } else {
        console.log('❌ Falha ao obter fatura');
        failed++;
      }
    } else {
      console.log('⚠️  Nenhum cartão encontrado para teste');
    }
  } catch (error) {
    console.log('❌ Erro no teste de fatura:', error);
    failed++;
  }

  // 3. Testar CashFlowService
  console.log('\n3️⃣ Testando CashFlowService...');
  try {
    // Testar fluxo mensal
    const now = new Date();
    const flow = await CashFlowService.getMonthlyFlow(
      user.id,
      now.getFullYear(),
      now.getMonth() + 1
    );

    console.log(`✅ Fluxo mensal calculado:`);
    console.log(`   Período: ${flow.period}`);
    console.log(`   Receitas: R$ ${flow.income.toFixed(2)}`);
    console.log(`   Despesas: R$ ${flow.expenses.toFixed(2)}`);
    console.log(`   Saldo: R$ ${flow.balance.toFixed(2)}`);
    console.log(`   Transações: ${flow.transactions}`);
    passed++;

    // Testar saldo projetado
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3); // 3 meses no futuro

    const projected = await CashFlowService.calculateProjectedBalance(
      user.id,
      accounts[0].id,
      futureDate
    );

    console.log(`✅ Saldo projetado calculado:`);
    console.log(`   Atual: R$ ${projected.currentBalance.toFixed(2)}`);
    console.log(`   Projetado: R$ ${projected.projectedBalance.toFixed(2)}`);
    console.log(`   Parcelas futuras: R$ ${projected.futureInstallments.toFixed(2)}`);
    console.log(`   Faturas abertas: R$ ${projected.openInvoices.toFixed(2)}`);
    passed++;

    // Testar saldo disponível
    const available = await CashFlowService.getAvailableBalance(accounts[0].id);
    console.log(`✅ Saldo disponível: R$ ${available.toFixed(2)}`);
    passed++;

    // Testar fluxo multi-mês
    const multiFlow = await CashFlowService.getMultiMonthFlow(
      user.id,
      now.getFullYear(),
      now.getMonth() + 1,
      3 // 3 meses
    );

    console.log(`✅ Fluxo multi-mês (${multiFlow.length} meses):`);
    multiFlow.forEach(f => {
      console.log(`   ${f.period}: R$ ${f.balance.toFixed(2)} (${f.transactions} transações)`);
    });
    passed++;

  } catch (error) {
    console.log('❌ Erro no teste de fluxo de caixa:', error);
    failed++;
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES - FASE 2');
  console.log('='.repeat(60));
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 Todos os testes da Fase 2 passaram!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Revise os erros acima.');
  }
}

// Executar
testPhase2()
  .then(() => {
    console.log('\n✅ Testes da Fase 2 concluídos!');
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar testes:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
