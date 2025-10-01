const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAccountBalances() {
  console.log('🔍 Verificando campos de saldo das contas...\n');

  try {
    // Buscar todas as contas com seus campos de saldo
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        balance: true,
        type: true,
        currency: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Encontradas ${accounts.length} contas:\n`);

    accounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Tipo: ${account.type}`);
      console.log(`   Saldo: R$ ${parseFloat(account.balance || 0).toFixed(2)}`);
      console.log(`   Moeda: ${account.currency}`);
      console.log(`   Ativa: ${account.isActive ? 'Sim' : 'Não'}`);
      console.log(`   Criada em: ${account.createdAt}`);
      console.log(`   Atualizada em: ${account.updatedAt}`);
      console.log('');
    });

    // Verificar se há contas com saldos zerados
    const zeroBalanceAccounts = accounts.filter(acc => 
      parseFloat(acc.balance || 0) === 0
    );

    const nonZeroBalanceAccounts = accounts.filter(acc => 
      parseFloat(acc.balance || 0) !== 0
    );

    console.log('📈 RESUMO:');
    console.log(`✅ Contas com saldos não-zerados: ${nonZeroBalanceAccounts.length}`);
    console.log(`⚠️  Contas com saldos zerados: ${zeroBalanceAccounts.length}`);

    if (zeroBalanceAccounts.length > 0) {
      console.log('\n⚠️  Contas com saldos zerados:');
      zeroBalanceAccounts.forEach(acc => {
        console.log(`   - ${acc.name} (ID: ${acc.id})`);
      });
    }

    if (nonZeroBalanceAccounts.length > 0) {
      console.log('\n✅ Contas com saldos não-zerados:');
      nonZeroBalanceAccounts.forEach(acc => {
        console.log(`   - ${acc.name}: R$ ${parseFloat(acc.balance || 0).toFixed(2)}`);
      });
    }

    // Verificar transações relacionadas às contas com saldos zerados
    if (zeroBalanceAccounts.length > 0) {
      console.log('\n🔍 Verificando transações das contas com saldos zerados...');
      
      for (const account of zeroBalanceAccounts.slice(0, 3)) { // Verificar apenas as primeiras 3 para não sobrecarregar
        const transactions = await prisma.transaction.findMany({
          where: {
            accountId: account.id
          },
          select: {
            id: true,
            type: true,
            amount: true,
            category: true,
            description: true,
            date: true
          },
          orderBy: {
            date: 'desc'
          }
        });

        console.log(`\n   📋 ${account.name} (${transactions.length} transações):`);
        if (transactions.length > 0) {
          transactions.slice(0, 3).forEach(t => {
            console.log(`      - ${t.type}: R$ ${parseFloat(t.amount).toFixed(2)} - ${t.category} - ${t.description}`);
          });
          if (transactions.length > 3) {
            console.log(`      ... e mais ${transactions.length - 3} transações`);
          }
        } else {
          console.log('      Nenhuma transação encontrada');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar saldos das contas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a verificação
checkAccountBalances();