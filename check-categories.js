const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactionCategories() {
  try {
    console.log('Verificando transações e suas categorias...');
    
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 20
    });
    
    console.log(`Total de transações encontradas: ${transactions.length}`);
    console.log('\nDetalhes das transações:');
    
    transactions.forEach((t, index) => {
      console.log(`${index + 1}. ID: ${t.id}`);
      console.log(`   Tipo: ${t.type}`);
      console.log(`   Valor: R$ ${t.amount}`);
      console.log(`   Categoria: ${t.category || 'SEM CATEGORIA'}`);
      console.log(`   Data: ${t.date}`);
      console.log(`   Descrição: ${t.description}`);
      console.log('   ---');
    });
    
    // Verificar especificamente transações de despesa
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    console.log(`\nTransações de despesa: ${expenseTransactions.length}`);
    
    expenseTransactions.forEach((t, index) => {
      console.log(`${index + 1}. Despesa - Categoria: ${t.category || 'SEM CATEGORIA'} - Valor: R$ ${t.amount}`);
    });
    
    // Verificar se há categorias definidas
    const categoriesUsed = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    console.log(`\nCategorias únicas encontradas: ${categoriesUsed.length}`);
    console.log('Categorias:', categoriesUsed);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionCategories();