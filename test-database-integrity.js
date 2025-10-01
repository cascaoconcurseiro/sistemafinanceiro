// =====================================================
// VERIFICAÇÃO DE INTEGRIDADE DO BANCO DE DADOS
// =====================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseIntegrity() {
  console.log('🔍 VERIFICANDO INTEGRIDADE DO BANCO DE DADOS...\n');

  try {
    // 1. Verificar conexão com o banco
    console.log('📡 1. TESTANDO CONEXÃO...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso\n');

    // 2. Contar registros em cada tabela
    console.log('📊 2. CONTANDO REGISTROS POR TABELA...');
    
    const accounts = await prisma.account.count();
    console.log(`- Contas: ${accounts}`);
    
    const transactions = await prisma.transaction.count();
    console.log(`- Transações: ${transactions}`);
    
    const budgets = await prisma.budget.count();
    console.log(`- Orçamentos: ${budgets}`);
    
    const goals = await prisma.goal.count();
    console.log(`- Metas: ${goals}`);
    
    const creditCards = await prisma.creditCard.count();
    console.log(`- Cartões de Crédito: ${creditCards}`);
    
    const trips = await prisma.trip.count();
    console.log(`- Viagens: ${trips}`);
    
    const auditLogs = await prisma.auditLog.count();
    console.log(`- Logs de Auditoria: ${auditLogs}`);
    
    const systemEvents = await prisma.systemEvent.count();
    console.log(`- Eventos do Sistema: ${systemEvents}`);
    
    console.log('\n');

    // 3. Verificar integridade referencial
    console.log('🔗 3. VERIFICANDO INTEGRIDADE REFERENCIAL...');
    
    // Verificar se todas as transações têm contas válidas
    const allTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        accountId: true,
        account: true
      }
    });
    
    const transactionsWithInvalidAccounts = allTransactions.filter(t => !t.account).length;
    
    if (transactionsWithInvalidAccounts > 0) {
      console.log(`❌ Encontradas ${transactionsWithInvalidAccounts} transações com contas inválidas`);
    } else {
      console.log('✅ Todas as transações têm contas válidas');
    }

    // 4. Verificar consistência de dados
    console.log('\n💰 4. VERIFICANDO CONSISTÊNCIA DE SALDOS...');
    
    const accountsWithBalances = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        transactions: {
          select: {
            amount: true,
            type: true
          }
        }
      }
    });

    let inconsistentAccounts = 0;
    
    for (const account of accountsWithBalances) {
      const calculatedBalance = account.transactions.reduce((sum, transaction) => {
        return transaction.type === 'income' 
          ? sum + Number(transaction.amount)
          : sum - Math.abs(Number(transaction.amount));
      }, 0);
      
      const storedBalance = Number(account.balance);
      const difference = Math.abs(calculatedBalance - storedBalance);
      
      if (difference > 0.01) { // Tolerância para diferenças de centavos
        console.log(`⚠️  Conta "${account.name}": Saldo armazenado R$ ${storedBalance.toFixed(2)}, Calculado R$ ${calculatedBalance.toFixed(2)}`);
        inconsistentAccounts++;
      }
    }
    
    if (inconsistentAccounts === 0) {
      console.log('✅ Todos os saldos das contas estão consistentes');
    } else {
      console.log(`❌ Encontradas ${inconsistentAccounts} contas com saldos inconsistentes`);
    }

    // 5. Verificar dados órfãos
    console.log('\n🔍 5. VERIFICANDO DADOS ÓRFÃOS...');
    
    // Verificar se há transações sem conta válida
    const orphanTransactions = allTransactions.filter(t => !t.account).length;
    
    if (orphanTransactions > 0) {
      console.log(`❌ Encontradas ${orphanTransactions} transações órfãs`);
    } else {
      console.log('✅ Nenhuma transação órfã encontrada');
    }

    // 6. Resumo final
    console.log('\n📋 RESUMO DA VERIFICAÇÃO:');
    console.log('==========================');
    console.log(`Total de Contas: ${accounts}`);
    console.log(`Total de Transações: ${transactions}`);
    console.log(`Total de Orçamentos: ${budgets}`);
    console.log(`Total de Metas: ${goals}`);
    console.log(`Contas Inconsistentes: ${inconsistentAccounts}`);
    console.log(`Transações Órfãs: ${orphanTransactions}`);
    
    if (inconsistentAccounts === 0 && orphanTransactions === 0) {
      console.log('\n✅ BANCO DE DADOS ÍNTEGRO - Nenhum problema encontrado!');
    } else {
      console.log('\n⚠️  PROBLEMAS ENCONTRADOS - Recomenda-se investigação adicional');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
investigateBalanceDifference().catch(console.error);

// Função principal
async function investigateBalanceDifference() {
  await checkDatabaseIntegrity();
}