import { prisma } from '@/lib/prisma';
import { DoubleEntryService } from '@/lib/services/double-entry-service';

/**
 * Script para corrigir problemas restantes:
 * 1. Lançamentos desbalanceados (2 casos)
 * 2. Saldos incorretos (2 contas)
 */

async function fixRemainingIssues() {
  console.log('🔧 Corrigindo problemas restantes...\n');
  console.log('='.repeat(60));
  
  let fixed = 0;
  
  // 1. Corrigir lançamentos desbalanceados
  console.log('\n1️⃣ Corrigindo lançamentos desbalanceados...');
  
  const unbalancedIds = ['cmhf1roqd00095varpif907p5', 'cmhf1rpg800e5varlno29vi3'];
  
  for (const transactionId of unbalancedIds) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      });
      
      if (!transaction) {
        console.log(`⚠️  Transação ${transactionId} não encontrada`);
        continue;
      }
      
      // Verificar lançamentos atuais
      const entries = await prisma.journalEntry.findMany({
        where: { transactionId }
      });
      
      const debits = entries.filter(e => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const credits = entries.filter(e => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      console.log(`\n📊 Transação ${transactionId}:`);
      console.log(`   Débitos: R$ ${debits}`);
      console.log(`   Créditos: R$ ${credits}`);
      console.log(`   Diferença: R$ ${Math.abs(debits - credits)}`);
      
      if (Math.abs(debits - credits) > 0.01) {
        console.log('   ❌ Desbalanceado! Corrigindo...');
        
        // Deletar lançamentos antigos
        await prisma.journalEntry.deleteMany({
          where: { transactionId }
        });
        
        // Recriar com DoubleEntryService
        await prisma.$transaction(async (tx) => {
          await DoubleEntryService.createJournalEntries(tx, transaction);
        });
        
        console.log('   ✅ Lançamentos recriados e balanceados');
        fixed++;
      } else {
        console.log('   ✅ Já está balanceado');
      }
    } catch (error) {
      console.error(`   ❌ Erro ao corrigir ${transactionId}:`, error);
    }
  }
  
  // 2. Recalcular saldos
  console.log('\n2️⃣ Recalculando saldos...');
  
  const accountsToFix = ['Conta Corrente', 'caixa'];
  
  for (const accountName of accountsToFix) {
    try {
      const account = await prisma.account.findFirst({
        where: { 
          name: accountName,
          deletedAt: null 
        }
      });
      
      if (!account) {
        console.log(`⚠️  Conta "${accountName}" não encontrada`);
        continue;
      }
      
      console.log(`\n💰 Conta: ${account.name}`);
      console.log(`   Saldo atual: R$ ${account.balance}`);
      
      // Calcular saldo correto
      const transactions = await prisma.transaction.findMany({
        where: { 
          accountId: account.id,
          deletedAt: null 
        }
      });
      
      const calculatedBalance = transactions.reduce((sum, t) => {
        return sum + Number(t.amount);
      }, 0);
      
      console.log(`   Saldo calculado: R$ ${calculatedBalance}`);
      console.log(`   Diferença: R$ ${Math.abs(Number(account.balance) - calculatedBalance)}`);
      
      if (Math.abs(Number(account.balance) - calculatedBalance) > 0.01) {
        console.log('   ❌ Saldo incorreto! Corrigindo...');
        
        await prisma.account.update({
          where: { id: account.id },
          data: { balance: calculatedBalance }
        });
        
        console.log('   ✅ Saldo atualizado');
        fixed++;
      } else {
        console.log('   ✅ Saldo correto');
      }
    } catch (error) {
      console.error(`   ❌ Erro ao corrigir conta "${accountName}":`, error);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Total de correções: ${fixed}`);
  
  return { fixed };
}

// Executar
fixRemainingIssues()
  .then(result => {
    console.log('\n🎉 Correções concluídas!');
    if (result.fixed === 0) {
      console.log('ℹ️  Nenhum problema encontrado (sistema já está correto)');
    }
  })
  .catch(error => {
    console.error('❌ Erro ao corrigir problemas:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
