const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTransactionDisplay() {
  console.log('=== DEBUG: EXIBIÇÃO DE TRANSAÇÕES ===\n');

  try {
    // 1. Buscar todas as transações
    const allTransactions = await prisma.transaction.findMany({
      include: {
        account: true
      },
      orderBy: { date: 'desc' }
    });

    console.log(`📊 Total de transações no banco: ${allTransactions.length}\n`);

    // 2. Buscar conta "Carol k"
    const carolAccount = await prisma.account.findFirst({
      where: { name: 'Carol k' }
    });

    if (!carolAccount) {
      console.log('❌ Conta "Carol k" não encontrada!');
      return;
    }

    console.log(`🏦 Conta encontrada: ${carolAccount.name} (ID: ${carolAccount.id})\n`);

    // 3. Transações que aparecem na lista principal (accountId = Carol k)
    const mainListTransactions = allTransactions.filter(t => t.accountId === carolAccount.id);
    console.log('📋 TRANSAÇÕES NA LISTA PRINCIPAL (accountId = Carol k):');
    console.log(`Total: ${mainListTransactions.length}`);
    mainListTransactions.forEach(t => {
      console.log(`- ${t.description} | ${t.category || 'Sem categoria'} | ${t.status} | R$ ${t.amount} | ${t.date.toISOString().split('T')[0]}`);
    });
    console.log('');

    // 4. Transações que aparecem no extrato da conta (accountId OU toAccountId = Carol k)
    const statementTransactions = allTransactions.filter(t => 
      t.accountId === carolAccount.id
    );
    console.log('📄 TRANSAÇÕES NO EXTRATO DA CONTA (accountId = Carol k):');
    console.log(`Total: ${statementTransactions.length}`);
    statementTransactions.forEach(t => {
      console.log(`- ${t.description} | ${t.category || 'Sem categoria'} | ${t.status} | R$ ${t.amount} | ${t.date.toISOString().split('T')[0]}`);
    });
    console.log('');

    // 5. Verificar diferenças
    const onlyInMain = mainListTransactions.filter(main => 
      !statementTransactions.some(stmt => stmt.id === main.id)
    );
    const onlyInStatement = statementTransactions.filter(stmt => 
      !mainListTransactions.some(main => main.id === stmt.id)
    );

    console.log('🔍 ANÁLISE DE DIFERENÇAS:');
    console.log(`Transações APENAS na lista principal: ${onlyInMain.length}`);
    onlyInMain.forEach(t => {
      console.log(`  - ${t.description} (ID: ${t.id})`);
    });

    console.log(`Transações APENAS no extrato: ${onlyInStatement.length}`);
    onlyInStatement.forEach(t => {
      console.log(`  - ${t.description} (ID: ${t.id})`);
    });
    console.log('');

    // 6. Verificar status e categorias
    console.log('📊 ANÁLISE DE STATUS E CATEGORIAS:');
    const statusCount = {};
    const categoryCount = {};

    allTransactions.forEach(t => {
      statusCount[t.status] = (statusCount[t.status] || 0) + 1;
      const categoryName = t.category || 'Sem categoria';
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });

    console.log('Status das transações:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

    console.log('Categorias das transações:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });
    console.log('');

    // 7. Verificar transações com problemas específicos
    console.log('🚨 TRANSAÇÕES COM POSSÍVEIS PROBLEMAS:');
    
    const problemTransactions = allTransactions.filter(t => {
      return !t.status || t.status === 'unknown' || !t.category;
    });

    console.log(`Transações com status inválido ou sem categoria: ${problemTransactions.length}`);
    problemTransactions.forEach(t => {
      console.log(`  - ${t.description} | Status: ${t.status || 'NULL'} | Categoria: ${t.category || 'NULL'} | Conta: ${t.account?.name}`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTransactionDisplay();