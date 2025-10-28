const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDatabase() {
  try {
    console.log('🔍 ANÁLISE COMPLETA DO BANCO DE DADOS\n');
    console.log('='.repeat(60));
    
    // 1. USUÁRIOS
    console.log('\n👥 USUÁRIOS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            transactions: true,
            categories: true,
            goals: true,
            budgets: true,
            trips: true,
            creditCards: true,
            reminders: true,
            notifications: true
          }
        }
      }
    });
    
    users.forEach((user, i) => {
      console.log(`\n  ${i + 1}. ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role} | Ativo: ${user.isActive}`);
      console.log(`     Contas: ${user._count.accounts}`);
      console.log(`     Transações: ${user._count.transactions}`);
      console.log(`     Categorias: ${user._count.categories}`);
      console.log(`     Metas: ${user._count.goals}`);
      console.log(`     Orçamentos: ${user._count.budgets}`);
      console.log(`     Viagens: ${user._count.trips}`);
      console.log(`     Cartões: ${user._count.creditCards}`);
      console.log(`     Lembretes: ${user._count.reminders}`);
      console.log(`     Notificações: ${user._count.notifications}`);
    });
    
    // 2. CONTAS
    console.log('\n\n💰 CONTAS:');
    const accounts = await prisma.account.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { transactions: true } }
      }
    });
    
    accounts.forEach((acc, i) => {
      console.log(`\n  ${i + 1}. ${acc.name}`);
      console.log(`     Usuário: ${acc.user.name}`);
      console.log(`     Tipo: ${acc.type}`);
      console.log(`     Saldo: R$ ${Number(acc.balance).toFixed(2)}`);
      console.log(`     Transações: ${acc._count.transactions}`);
      console.log(`     Ativo: ${acc.isActive}`);
    });
    
    // 3. CATEGORIAS
    console.log('\n\n📂 CATEGORIAS:');
    const categories = await prisma.category.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { transactions: true } }
      },
      orderBy: [{ userId: 'asc' }, { type: 'asc' }, { name: 'asc' }]
    });
    
    const categoriesByUser = {};
    categories.forEach(cat => {
      if (!categoriesByUser[cat.userId]) {
        categoriesByUser[cat.userId] = { RECEITA: [], DESPESA: [] };
      }
      categoriesByUser[cat.userId][cat.type].push(cat);
    });
    
    Object.entries(categoriesByUser).forEach(([userId, cats]) => {
      const userName = categories.find(c => c.userId === userId)?.user.name;
      console.log(`\n  Usuário: ${userName}`);
      console.log(`    RECEITAS (${cats.RECEITA.length}):`);
      cats.RECEITA.forEach(c => {
        console.log(`      ${c.icon || '📌'} ${c.name} (${c._count.transactions} transações)`);
      });
      console.log(`    DESPESAS (${cats.DESPESA.length}):`);
      cats.DESPESA.forEach(c => {
        console.log(`      ${c.icon || '📌'} ${c.name} (${c._count.transactions} transações)`);
      });
    });
    
    // 4. TRANSAÇÕES
    console.log('\n\n💸 TRANSAÇÕES:');
    const transactions = await prisma.transaction.findMany({
      include: {
        user: { select: { name: true } },
        account: { select: { name: true } },
        categoryRef: { select: { name: true } }
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`  Total: ${transactions.length} (últimas 10)`);
    transactions.forEach((t, i) => {
      console.log(`\n  ${i + 1}. ${t.description}`);
      console.log(`     Usuário: ${t.user.name}`);
      console.log(`     Conta: ${t.account?.name || 'N/A'}`);
      console.log(`     Categoria: ${t.categoryRef?.name || 'N/A'}`);
      console.log(`     Tipo: ${t.type}`);
      console.log(`     Valor: R$ ${Number(t.amount).toFixed(2)}`);
      console.log(`     Data: ${new Date(t.date).toLocaleDateString('pt-BR')}`);
    });
    
    // 5. METAS
    console.log('\n\n🎯 METAS:');
    const goals = await prisma.goal.findMany({
      include: { user: { select: { name: true } } }
    });
    
    if (goals.length === 0) {
      console.log('  ❌ Nenhuma meta cadastrada');
    } else {
      goals.forEach((g, i) => {
        const progress = (Number(g.currentAmount) / Number(g.targetAmount)) * 100;
        console.log(`\n  ${i + 1}. ${g.name}`);
        console.log(`     Usuário: ${g.user.name}`);
        console.log(`     Atual: R$ ${Number(g.currentAmount).toFixed(2)}`);
        console.log(`     Meta: R$ ${Number(g.targetAmount).toFixed(2)}`);
        console.log(`     Progresso: ${progress.toFixed(1)}%`);
        console.log(`     Status: ${g.status}`);
      });
    }
    
    // 6. ORÇAMENTOS
    console.log('\n\n📊 ORÇAMENTOS:');
    const budgets = await prisma.budget.findMany({
      include: {
        user: { select: { name: true } },
        categoryRef: { select: { name: true } }
      }
    });
    
    if (budgets.length === 0) {
      console.log('  ❌ Nenhum orçamento cadastrado');
    } else {
      budgets.forEach((b, i) => {
        const usage = (Number(b.spent) / Number(b.amount)) * 100;
        console.log(`\n  ${i + 1}. ${b.name}`);
        console.log(`     Usuário: ${b.user.name}`);
        console.log(`     Categoria: ${b.categoryRef.name}`);
        console.log(`     Orçado: R$ ${Number(b.amount).toFixed(2)}`);
        console.log(`     Gasto: R$ ${Number(b.spent).toFixed(2)}`);
        console.log(`     Uso: ${usage.toFixed(1)}%`);
        console.log(`     Período: ${b.period}`);
      });
    }
    
    // 7. CARTÕES DE CRÉDITO
    console.log('\n\n💳 CARTÕES DE CRÉDITO:');
    const creditCards = await prisma.creditCard.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { transactions: true, invoices: true } }
      }
    });
    
    if (creditCards.length === 0) {
      console.log('  ❌ Nenhum cartão cadastrado');
    } else {
      creditCards.forEach((c, i) => {
        const usage = (Number(c.currentBalance) / Number(c.limit)) * 100;
        console.log(`\n  ${i + 1}. ${c.name}`);
        console.log(`     Usuário: ${c.user.name}`);
        console.log(`     Limite: R$ ${Number(c.limit).toFixed(2)}`);
        console.log(`     Usado: R$ ${Number(c.currentBalance).toFixed(2)}`);
        console.log(`     Uso: ${usage.toFixed(1)}%`);
        console.log(`     Vencimento: dia ${c.dueDay}`);
        console.log(`     Fechamento: dia ${c.closingDay}`);
        console.log(`     Transações: ${c._count.transactions}`);
        console.log(`     Faturas: ${c._count.invoices}`);
      });
    }
    
    // 8. VIAGENS
    console.log('\n\n✈️ VIAGENS:');
    const trips = await prisma.trip.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { transactions: true, itinerary: true } }
      }
    });
    
    if (trips.length === 0) {
      console.log('  ❌ Nenhuma viagem cadastrada');
    } else {
      trips.forEach((t, i) => {
        const usage = (Number(t.spent) / Number(t.budget)) * 100;
        console.log(`\n  ${i + 1}. ${t.name} - ${t.destination}`);
        console.log(`     Usuário: ${t.user.name}`);
        console.log(`     Período: ${new Date(t.startDate).toLocaleDateString('pt-BR')} a ${new Date(t.endDate).toLocaleDateString('pt-BR')}`);
        console.log(`     Orçamento: R$ ${Number(t.budget).toFixed(2)}`);
        console.log(`     Gasto: R$ ${Number(t.spent).toFixed(2)}`);
        console.log(`     Uso: ${usage.toFixed(1)}%`);
        console.log(`     Status: ${t.status}`);
        console.log(`     Transações: ${t._count.transactions}`);
        console.log(`     Itinerário: ${t._count.itinerary} itens`);
      });
    }
    
    // 9. LEMBRETES
    console.log('\n\n🔔 LEMBRETES:');
    const reminders = await prisma.reminder.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 5
    });
    
    if (reminders.length === 0) {
      console.log('  ❌ Nenhum lembrete cadastrado');
    } else {
      console.log(`  Total: ${reminders.length} (próximos 5)`);
      reminders.forEach((r, i) => {
        console.log(`\n  ${i + 1}. ${r.title}`);
        console.log(`     Usuário: ${r.user.name}`);
        console.log(`     Vencimento: ${new Date(r.dueDate).toLocaleDateString('pt-BR')}`);
        console.log(`     Categoria: ${r.category}`);
        console.log(`     Prioridade: ${r.priority}`);
        console.log(`     Status: ${r.status}`);
      });
    }
    
    // 10. RESUMO
    console.log('\n\n' + '='.repeat(60));
    console.log('📈 RESUMO GERAL:');
    console.log('='.repeat(60));
    
    const totalAccounts = await prisma.account.count();
    const totalTransactions = await prisma.transaction.count();
    const totalCategories = await prisma.category.count();
    const totalGoals = await prisma.goal.count();
    const totalBudgets = await prisma.budget.count();
    const totalCreditCards = await prisma.creditCard.count();
    const totalTrips = await prisma.trip.count();
    const totalReminders = await prisma.reminder.count();
    const totalNotifications = await prisma.notification.count();
    
    console.log(`\n  👥 Usuários: ${users.length}`);
    console.log(`  💰 Contas: ${totalAccounts}`);
    console.log(`  💸 Transações: ${totalTransactions}`);
    console.log(`  📂 Categorias: ${totalCategories}`);
    console.log(`  🎯 Metas: ${totalGoals}`);
    console.log(`  📊 Orçamentos: ${totalBudgets}`);
    console.log(`  💳 Cartões: ${totalCreditCards}`);
    console.log(`  ✈️ Viagens: ${totalTrips}`);
    console.log(`  🔔 Lembretes: ${totalReminders}`);
    console.log(`  📬 Notificações: ${totalNotifications}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Análise concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDatabase();
