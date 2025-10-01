const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabaseIntegrity() {
  console.log('🔧 Corrigindo integridade do banco de dados...\n');

  try {
    // 1. Primeiro, vamos ver todas as transações detalhadamente
    const allTransactions = await prisma.transaction.findMany({
      include: {
        account: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 Todas as transações encontradas:');
    allTransactions.forEach((t, index) => {
      console.log(`${index + 1}. ID: ${t.id}`);
      console.log(`   Descrição: ${t.description}`);
      console.log(`   Valor: ${t.amount}`);
      console.log(`   Tipo: ${t.type}`);
      console.log(`   Conta: ${t.account?.name || 'SEM CONTA'} (${t.accountId})`);
      console.log(`   Data: ${t.date}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Categoria: ${t.category}`);
      console.log('   ---');
    });

    // 2. Vamos resetar todos os saldos das contas para 0
    console.log('\n🔄 Resetando saldos das contas...');
    await prisma.account.updateMany({
      data: {
        balance: 0
      }
    });

    // 3. Recalcular saldos baseado nas transações
    console.log('\n💰 Recalculando saldos baseado nas transações...');
    
    const accounts = await prisma.account.findMany();
    
    for (const account of accounts) {
      const accountTransactions = allTransactions.filter(t => t.accountId === account.id);
      
      let newBalance = 0;
      console.log(`\n📊 Processando conta: ${account.name}`);
      console.log(`   Transações encontradas: ${accountTransactions.length}`);
      
      accountTransactions.forEach(t => {
        const amount = parseFloat(t.amount);
        console.log(`   - ${t.description}: ${amount} (${t.type})`);
        
        if (t.type === 'income' || t.type === 'credit') {
          newBalance += amount;
          console.log(`     Adicionando: ${amount}, Novo saldo: ${newBalance}`);
        } else if (t.type === 'expense' || t.type === 'debit') {
          newBalance -= amount;
          console.log(`     Subtraindo: ${amount}, Novo saldo: ${newBalance}`);
        }
      });
      
      // Atualizar o saldo da conta
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: newBalance }
      });
      
      console.log(`   ✅ Saldo final da conta ${account.name}: R$ ${newBalance.toFixed(2)}`);
    }

    // 4. Verificar se há transações com problemas de encoding
    console.log('\n🔍 Verificando problemas de encoding...');
    const problematicTransactions = allTransactions.filter(t => 
      t.description.includes('�') || 
      t.category?.includes('�')
    );
    
    if (problematicTransactions.length > 0) {
      console.log(`🚨 Encontradas ${problematicTransactions.length} transações com problemas de encoding:`);
      
      for (const t of problematicTransactions) {
        console.log(`   - ID: ${t.id}, Descrição: "${t.description}", Categoria: "${t.category}"`);
        
        // Corrigir encoding comum
        let newDescription = t.description.replace(/Sal�rio/g, 'Salário');
        let newCategory = t.category?.replace(/Sal�rio/g, 'Salário');
        
        if (newDescription !== t.description || newCategory !== t.category) {
          await prisma.transaction.update({
            where: { id: t.id },
            data: {
              description: newDescription,
              category: newCategory
            }
          });
          console.log(`     ✅ Corrigido para: "${newDescription}", Categoria: "${newCategory}"`);
        }
      }
    }

    // 5. Verificar resultado final
    console.log('\n📊 Resultado final:');
    const updatedAccounts = await prisma.account.findMany();
    
    updatedAccounts.forEach(account => {
      console.log(`   - ${account.name}: R$ ${parseFloat(account.balance).toFixed(2)}`);
    });

    console.log('\n✅ Correção de integridade concluída!');

  } catch (error) {
    console.error('❌ Erro ao corrigir integridade:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseIntegrity();