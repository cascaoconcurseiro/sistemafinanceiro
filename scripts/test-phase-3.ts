import { prisma } from '@/lib/prisma';
import { AccountHistoryService } from '@/lib/services/account-history-service';
import { EventService } from '@/lib/services/event-service';
import { ReconciliationService } from '@/lib/services/reconciliation-service';
import { ReportService } from '@/lib/services/report-service';

/**
 * Script de teste da Fase 3
 */

async function testPhase3() {
  console.log('🧪 Testando Fase 3...\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  const user = await prisma.user.findFirst();
  const account = await prisma.account.findFirst({
    where: { userId: user?.id }
  });

  if (!user || !account) {
    console.log('⚠️  Dados insuficientes para teste');
    return;
  }

  // 1. Testar AccountHistoryService
  console.log('\n1️⃣ Testando Histórico de Saldos...');
  try {
    // Registrar mudança
    await AccountHistoryService.recordBalanceChange(
      account.id,
      new Date(),
      Number(account.balance),
      'Teste de histórico'
    );
    console.log('✅ Histórico registrado');
    passed++;

    // Buscar saldo em data
    const balance = await AccountHistoryService.getBalanceAtDate(
      account.id,
      new Date()
    );
    console.log(`✅ Saldo recuperado: R$ ${balance.toFixed(2)}`);
    passed++;

    // Evolução
    const evolution = await AccountHistoryService.getBalanceEvolution(
      account.id,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    console.log(`✅ Evolução: ${evolution.percentChange.toFixed(2)}%`);
    passed++;

  } catch (error) {
    console.log('❌ Erro no teste de histórico:', error);
    failed++;
  }

  // 2. Testar EventService
  console.log('\n2️⃣ Testando Sistema de Eventos...');
  try {
    await EventService.emit(
      'account_updated',
      'account',
      account.id,
      { balanceChanged: true, newBalance: Number(account.balance) },
      user.id
    );
    console.log('✅ Evento emitido e processado');
    passed++;

    const processed = await EventService.processPendingEvents();
    console.log(`✅ Eventos pendentes processados: ${processed}`);
    passed++;

  } catch (error) {
    console.log('❌ Erro no teste de eventos:', error);
    failed++;
  }

  // 3. Testar ReconciliationService
  console.log('\n3️⃣ Testando Conciliação Bancária...');
  try {
    const reconciliation = await ReconciliationService.startReconciliation(
      account.id,
      user.id,
      Number(account.balance) + 10 // Simular diferença
    );
    console.log(`✅ Conciliação iniciada: ${reconciliation.status}`);
    console.log(`   Diferença: R$ ${reconciliation.difference}`);
    passed++;

    const stats = await ReconciliationService.getReconciliationStats(
      account.id,
      user.id
    );
    console.log(`✅ Estatísticas: ${stats.total} conciliações`);
    passed++;

  } catch (error) {
    console.log('❌ Erro no teste de conciliação:', error);
    failed++;
  }

  // 4. Testar ReportService
  console.log('\n4️⃣ Testando Relatórios Avançados...');
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // DRE
    const dre = await ReportService.generateDRE(user.id, startDate, endDate);
    console.log(`✅ DRE gerado:`);
    console.log(`   Receitas: R$ ${dre.revenue.total.toFixed(2)}`);
    console.log(`   Despesas: R$ ${dre.expenses.total.toFixed(2)}`);
    console.log(`   Resultado: R$ ${dre.result.netIncome.toFixed(2)}`);
    passed++;

    // Balanço
    const balance = await ReportService.generateBalanceSheet(user.id);
    console.log(`✅ Balanço Patrimonial:`);
    console.log(`   Ativos: R$ ${balance.assets.total.toFixed(2)}`);
    console.log(`   Passivos: R$ ${balance.liabilities.total.toFixed(2)}`);
    console.log(`   Patrimônio: R$ ${balance.equity.total.toFixed(2)}`);
    passed++;

    // Análise de categorias
    const categories = await ReportService.analyzeCategoriesExpenses(
      user.id,
      startDate,
      endDate
    );
    console.log(`✅ Análise de Categorias:`);
    console.log(`   Total: R$ ${categories.summary.totalExpenses.toFixed(2)}`);
    console.log(`   Categorias: ${categories.summary.categoriesCount}`);
    passed++;

    // Tendências
    const trends = await ReportService.analyzeTrends(user.id, 3);
    console.log(`✅ Análise de Tendências (${trends.months} meses):`);
    console.log(`   Receita média: R$ ${trends.averages.revenue.toFixed(2)}`);
    console.log(`   Despesa média: R$ ${trends.averages.expenses.toFixed(2)}`);
    passed++;

  } catch (error) {
    console.log('❌ Erro no teste de relatórios:', error);
    failed++;
  }

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES - FASE 3');
  console.log('='.repeat(60));
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 Todos os testes da Fase 3 passaram!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Revise os erros acima.');
  }
}

// Executar
testPhase3()
  .then(() => {
    console.log('\n✅ Testes da Fase 3 concluídos!');
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar testes:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
