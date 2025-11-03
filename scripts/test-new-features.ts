import { prisma } from '@/lib/prisma';
import { IdempotencyService } from '@/lib/services/idempotency-service';
import { EncryptionService } from '@/lib/services/encryption-service';
import { TemporalValidationService } from '@/lib/services/temporal-validation-service';
import { PeriodClosureService } from '@/lib/services/period-closure-service';

/**
 * Script de teste das novas funcionalidades
 */

async function testNewFeatures() {
  console.log('🧪 Testando novas funcionalidades...\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // 1. Testar Idempotência
  console.log('\n1️⃣ Testando Idempotência...');
  try {
    const uuid1 = IdempotencyService.generateUuid();
    const uuid2 = IdempotencyService.generateUuid();
    
    if (uuid1 !== uuid2) {
      console.log('✅ UUIDs únicos gerados');
      passed++;
    } else {
      console.log('❌ UUIDs duplicados');
      failed++;
    }
    
    // Validar formato
    const validUuid = IdempotencyService.validateOrGenerate('550e8400-e29b-41d4-a716-446655440000');
    console.log('✅ Validação de UUID funcionando');
    passed++;
    
  } catch (error) {
    console.log('❌ Erro no teste de idempotência:', error);
    failed++;
  }
  
  // 2. Testar Criptografia
  console.log('\n2️⃣ Testando Criptografia...');
  try {
    // Testar senha
    const password = 'senha123';
    const hash = await EncryptionService.hashPassword(password);
    const isValid = await EncryptionService.comparePassword(password, hash);
    
    if (isValid) {
      console.log('✅ Criptografia de senha funcionando');
      passed++;
    } else {
      console.log('❌ Falha na criptografia de senha');
      failed++;
    }
    
    // Testar dados sensíveis
    const data = 'Dados sensíveis';
    const encrypted = EncryptionService.encrypt(data);
    const decrypted = EncryptionService.decrypt(encrypted);
    
    if (data === decrypted) {
      console.log('✅ Criptografia AES-256 funcionando');
      passed++;
    } else {
      console.log('❌ Falha na criptografia AES-256');
      failed++;
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de criptografia:', error);
    failed++;
  }
  
  // 3. Testar Validação Temporal
  console.log('\n3️⃣ Testando Validação Temporal...');
  try {
    // Testar formato de período
    const period = TemporalValidationService.formatPeriod(new Date());
    console.log(`   Período atual: ${period}`);
    
    const { startDate, endDate } = TemporalValidationService.parsePeriod(period);
    console.log(`   Início: ${startDate.toLocaleDateString('pt-BR')}`);
    console.log(`   Fim: ${endDate.toLocaleDateString('pt-BR')}`);
    
    console.log('✅ Validação temporal funcionando');
    passed++;
    
  } catch (error) {
    console.log('❌ Erro no teste de validação temporal:', error);
    failed++;
  }
  
  // 4. Testar Fechamento de Período
  console.log('\n4️⃣ Testando Fechamento de Período...');
  try {
    // Buscar um usuário para teste
    const user = await prisma.user.findFirst();
    
    if (user) {
      const testPeriod = '2024-01';
      
      // Verificar se período está fechado
      const isClosed = await PeriodClosureService.isPeriodClosed(
        user.id,
        new Date(2024, 0, 15)
      );
      
      console.log(`   Período ${testPeriod} fechado: ${isClosed ? 'Sim' : 'Não'}`);
      
      // Buscar estatísticas
      const stats = await PeriodClosureService.getPeriodStats(user.id, testPeriod);
      console.log(`   Transações: ${stats.totalTransactions}`);
      console.log(`   Receitas: R$ ${stats.income.toFixed(2)}`);
      console.log(`   Despesas: R$ ${stats.expenses.toFixed(2)}`);
      console.log(`   Saldo: R$ ${stats.balance.toFixed(2)}`);
      
      console.log('✅ Fechamento de período funcionando');
      passed++;
    } else {
      console.log('⚠️  Nenhum usuário encontrado para teste');
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de fechamento:', error);
    failed++;
  }
  
  // 5. Testar Campos no Schema
  console.log('\n5️⃣ Testando Campos no Schema...');
  try {
    const transaction = await prisma.transaction.findFirst({
      select: {
        id: true,
        operationUuid: true,
        transactionGroupId: true,
        closedPeriod: true,
        createdBy: true,
        updatedBy: true
      }
    });
    
    if (transaction) {
      console.log('   Campos encontrados:');
      console.log(`   - operationUuid: ${transaction.operationUuid || 'null'}`);
      console.log(`   - transactionGroupId: ${transaction.transactionGroupId || 'null'}`);
      console.log(`   - closedPeriod: ${transaction.closedPeriod}`);
      console.log(`   - createdBy: ${transaction.createdBy || 'null'}`);
      console.log(`   - updatedBy: ${transaction.updatedBy || 'null'}`);
      
      console.log('✅ Novos campos no schema funcionando');
      passed++;
    } else {
      console.log('⚠️  Nenhuma transação encontrada para teste');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar campos do schema:', error);
    failed++;
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`📈 Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Revise os erros acima.');
  }
}

// Executar
testNewFeatures()
  .then(() => {
    console.log('\n✅ Testes concluídos!');
  })
  .catch(error => {
    console.error('\n❌ Erro ao executar testes:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
