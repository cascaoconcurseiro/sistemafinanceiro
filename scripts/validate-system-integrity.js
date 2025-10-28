const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateSystemIntegrity() {
  console.log('🔍 VALIDAÇÃO DE INTEGRIDADE DO SISTEMA\n');
  console.log('═'.repeat(80));
  
  const errors = [];
  const warnings = [];
  
  try {
    // 1. VALIDAR PARTIDA DOBRADA
    console.log('\n📊 1. Validando Partida Dobrada...');
    const transactions = await prisma.transaction.findMany({
      where: { deletedAt: null },
      include: {
        journalEntries: true
      }
    });
    
    for (const t of transactions) {
      // Verificar se tem lançamentos
      if (t.journalEntries.length === 0) {
        errors.push(`Transação ${t.id} (${t.description}) não tem lançamentos contábeis`);
        continue;
      }
      
      // Verificar balanceamento
      const debits = t.journalEntries
        .filter(e => e.entryType === 'DEBITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const credits = t.journalEntries
        .filter(e => e.entryType === 'CREDITO')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const diff = Math.abs(debits - credits);
      if (diff > 0.01) {
        errors.push(`Transação ${t.id} desbalanceada: Débitos=${debits}, Créditos=${credits}, Diff=${diff}`);
      }
    }
    
    console.log(`   ✅ ${transactions.length} transações verificadas`);
    
    // 2. VALIDAR SALDOS DAS CONTAS
    console.log('\n💰 2. Validando Saldos das Contas...');
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null },
      include: {
        journalEntries: {
          include: {
            transaction: true
          }
        }
      }
    });
    
    for (const account of accounts) {
      // Pular contas contábeis internas
      if (account.type === 'RECEITA' || account.type === 'DESPESA') {
        continue;
      }
      
      // Calcular saldo baseado nos lançamentos
      const validEntries = account.journalEntries.filter(
        e => e.transaction && e.transaction.status === 'cleared' && !e.transaction.deletedAt
      );
      
      let calculatedBalance = 0;
      if (account.type === 'ATIVO') {
        const debits = validEntries.filter(e => e.entryType === 'DEBITO').reduce((s, e) => s + Number(e.amount), 0);
        const credits = validEntries.filter(e => e.entryType === 'CREDITO').reduce((s, e) => s + Number(e.amount), 0);
        calculatedBalance = debits - credits;
      } else if (account.type === 'PASSIVO') {
        const credits = validEntries.filter(e => e.entryType === 'CREDITO').reduce((s, e) => s + Number(e.amount), 0);
        const debits = validEntries.filter(e => e.entryType === 'DEBITO').reduce((s, e) => s + Number(e.amount), 0);
        calculatedBalance = credits - debits;
      }
      
      const storedBalance = Number(account.balance);
      const diff = Math.abs(calculatedBalance - storedBalance);
      
      if (diff > 0.01) {
        errors.push(`Conta "${account.name}" com saldo incorreto: Armazenado=${storedBalance}, Calculado=${calculatedBalance}, Diff=${diff}`);
      }
    }
    
    console.log(`   ✅ ${accounts.length} contas verificadas`);
    
    // 3. VALIDAR LANÇAMENTOS ÓRFÃOS
    console.log('\n🔍 3. Verificando Lançamentos Órfãos...');
    const allEntries = await prisma.journalEntry.findMany();
    
    for (const entry of allEntries) {
      const account = await prisma.account.findUnique({ where: { id: entry.accountId } });
      if (!account) {
        warnings.push(`Lançamento ${entry.id} referencia conta inexistente ${entry.accountId}`);
      }
      
      const transaction = await prisma.transaction.findUnique({ where: { id: entry.transactionId } });
      if (!transaction) {
        warnings.push(`Lançamento ${entry.id} referencia transação inexistente ${entry.transactionId}`);
      }
    }
    
    console.log(`   ✅ ${allEntries.length} lançamentos verificados`);
    
    // 4. VALIDAR TIPOS DE TRANSAÇÃO
    console.log('\n🏷️  4. Validando Tipos de Transação...');
    const invalidTypes = await prisma.transaction.findMany({
      where: {
        type: {
          notIn: ['RECEITA', 'DESPESA', 'TRANSFERENCIA']
        }
      }
    });
    
    if (invalidTypes.length > 0) {
      invalidTypes.forEach(t => {
        warnings.push(`Transação ${t.id} com tipo inválido: "${t.type}"`);
      });
    }
    
    console.log(`   ✅ Tipos validados`);
    
    // RELATÓRIO FINAL
    console.log('\n' + '═'.repeat(80));
    console.log('📋 RELATÓRIO FINAL');
    console.log('═'.repeat(80));
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✅ SISTEMA 100% ÍNTEGRO!');
      console.log('   Nenhum erro ou aviso encontrado.');
    } else {
      if (errors.length > 0) {
        console.log('\n❌ ERROS CRÍTICOS:', errors.length);
        errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
      }
      
      if (warnings.length > 0) {
        console.log('\n⚠️  AVISOS:', warnings.length);
        warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`));
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    
    return {
      success: errors.length === 0,
      errors,
      warnings
    };
    
  } catch (error) {
    console.error('\n❌ ERRO NA VALIDAÇÃO:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      errors: [error.message],
      warnings: []
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Executar validação
validateSystemIntegrity().then(result => {
  process.exit(result.success ? 0 : 1);
});
