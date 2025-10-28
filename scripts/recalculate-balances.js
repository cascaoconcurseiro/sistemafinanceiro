/**
 * Script para recalcular todos os saldos das contas
 * Usa a função calculateAccountBalance que considera myShare
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateAccountBalance(accountId, transactions) {
  return transactions
    .filter(t => t.accountId === accountId)
    .reduce((sum, t) => {
      // ✅ CORREÇÃO: Para transações compartilhadas, usar myShare
      let amount = Number(t.amount);
      if ((t.isShared || t.type === 'shared') && t.myShare) {
        amount = Number(t.myShare);
        console.log(`💰 Transação compartilhada - usando myShare:`, {
          description: t.description,
          totalAmount: t.amount,
          myShare: t.myShare
        });
      }
      
      // Income/RECEITA: adiciona o valor
      if (t.type === 'income' || t.type === 'RECEITA') return sum + Math.abs(amount);
      // Expense/DESPESA: subtrai o valor
      if (t.type === 'expense' || t.type === 'DESPESA') return sum - Math.abs(amount);
      // Transfer: mantém o valor como está (pode ser positivo ou negativo)
      return sum + amount;
    }, 0);
}

async function recalculateBalances() {
  console.log('🔧 Iniciando recálculo de saldos...');
  
  try {
    // Buscar todas as contas ativas
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null }
    });
    
    console.log(`📊 Encontradas ${accounts.length} contas ativas`);
    
    // Buscar todas as transações
    const transactions = await prisma.transaction.findMany({
      where: { deletedAt: null }
    });
    
    console.log(`📊 Encontradas ${transactions.length} transações`);
    
    let updated = 0;
    
    for (const account of accounts) {
      const calculatedBalance = calculateAccountBalance(account.id, transactions);
      const currentBalance = Number(account.balance);
      
      if (Math.abs(calculatedBalance - currentBalance) > 0.01) {
        console.log(`\n🔄 Atualizando conta: ${account.name}`);
        console.log(`   Saldo atual: R$ ${currentBalance.toFixed(2)}`);
        console.log(`   Saldo calculado: R$ ${calculatedBalance.toFixed(2)}`);
        console.log(`   Diferença: R$ ${(calculatedBalance - currentBalance).toFixed(2)}`);
        
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: calculatedBalance }
        });
        
        updated++;
      } else {
        console.log(`✅ Conta ${account.name}: saldo correto (R$ ${currentBalance.toFixed(2)})`);
      }
    }
    
    console.log(`\n✅ Recálculo concluído! ${updated} contas atualizadas.`);
  } catch (error) {
    console.error('❌ Erro ao recalcular saldos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateBalances();
