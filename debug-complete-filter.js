// Script para simular exatamente a lógica de filtragem da página
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteFilterLogic() {
  try {
    console.log('🔍 SIMULANDO LÓGICA COMPLETA DE FILTRAGEM...\n');
    
    // Buscar todas as transações (igual ao contexto)
    const transactions = await prisma.transaction.findMany({
      include: {
        account: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log('📊 Total de transações no banco:', transactions.length);
    
    // Valores padrão dos filtros (igual à página)
    const searchTerm = '';
    const selectedAccount = 'all';
    const selectedType = 'all';
    const selectedStatus = 'all';
    const selectedPeriod = 'current-month';
    
    console.log('\n🎛️ FILTROS APLICADOS:');
    console.log('- Termo de busca:', searchTerm || '(vazio)');
    console.log('- Conta selecionada:', selectedAccount);
    console.log('- Tipo selecionado:', selectedType);
    console.log('- Status selecionado:', selectedStatus);
    console.log('- Período selecionado:', selectedPeriod);
    
    let filtered = transactions;
    console.log('\n🔍 INICIANDO FILTRAGEM...');
    console.log('Transações iniciais:', filtered.length);
    
    // 1. Filtro por período (igual à página)
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      
      const startDate = startOfMonth.toISOString();
      const endDate = endOfMonth.toISOString();
      
      console.log('\n📅 FILTRO DE PERÍODO:');
      console.log('Data início:', startDate);
      console.log('Data fim:', endDate);
      
      const beforePeriodFilter = filtered.length;
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().slice(0, 10);
        const startDateSlice = startDate.slice(0, 10);
        const endDateSlice = endDate.slice(0, 10);
        
        const matchesPeriod = transactionDate >= startDateSlice && transactionDate <= endDateSlice;
        
        if (!matchesPeriod) {
          console.log(`❌ REMOVIDA: ${transaction.description} (${transactionDate})`);
        } else {
          console.log(`✅ MANTIDA: ${transaction.description} (${transactionDate})`);
        }
        
        return matchesPeriod;
      });
      console.log(`Após filtro período: ${filtered.length} (removidas: ${beforePeriodFilter - filtered.length})`);
    }
    
    // 2. Filtro por busca
    if (searchTerm) {
      console.log('\n🔍 FILTRO DE BUSCA:');
      const beforeSearchFilter = filtered.length;
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`Após filtro busca: ${filtered.length} (removidas: ${beforeSearchFilter - filtered.length})`);
    }
    
    // 3. Filtro por conta
    if (selectedAccount !== 'all') {
      console.log('\n🏦 FILTRO DE CONTA:');
      const beforeAccountFilter = filtered.length;
      filtered = filtered.filter(t => 
        t.accountId === selectedAccount || t.toAccountId === selectedAccount
      );
      console.log(`Após filtro conta: ${filtered.length} (removidas: ${beforeAccountFilter - filtered.length})`);
    }
    
    // 4. Filtro por tipo
    if (selectedType !== 'all') {
      console.log('\n📊 FILTRO DE TIPO:');
      const beforeTypeFilter = filtered.length;
      filtered = filtered.filter(t => t.type === selectedType);
      console.log(`Após filtro tipo: ${filtered.length} (removidas: ${beforeTypeFilter - filtered.length})`);
    }
    
    // 5. Filtro por status
    if (selectedStatus !== 'all') {
      console.log('\n✅ FILTRO DE STATUS:');
      const beforeStatusFilter = filtered.length;
      filtered = filtered.filter(t => t.status === selectedStatus);
      console.log(`Após filtro status: ${filtered.length} (removidas: ${beforeStatusFilter - filtered.length})`);
    }
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log('Transações que devem aparecer na página:', filtered.length);
    
    if (filtered.length > 0) {
      console.log('\n✅ Transações finais:');
      filtered.forEach((t, index) => {
        console.log(`${index + 1}. ${t.description}`);
        console.log(`   Data: ${new Date(t.date).toISOString().slice(0, 10)}`);
        console.log(`   Tipo: ${t.type}`);
        console.log(`   Status: ${t.status}`);
        console.log(`   Conta: ${t.account?.name || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n❌ NENHUMA transação passou em todos os filtros!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFilterLogic();