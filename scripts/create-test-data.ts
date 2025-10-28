import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Criando dados de teste...');

  // Buscar o primeiro usuário
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.error('❌ Nenhum usuário encontrado. Faça login primeiro.');
    return;
  }

  console.log('👤 Usuário encontrado:', user.email);

  // Buscar ou criar uma conta
  let account = await prisma.account.findFirst({
    where: { userId: user.id, isActive: true },
  });

  if (!account) {
    console.log('\n💰 Criando conta...');
    account = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Conta Corrente',
        type: 'checking',
        currency: 'BRL',
        isActive: true,
        reconciledBalance: 0,
      },
    });
    console.log('✅ Conta criada:', account.name);
  } else {
    console.log('\n💰 Conta encontrada:', account.name);
  }

  // Buscar ou criar categoria
  let category = await prisma.category.findFirst({
    where: { name: 'Compras', isActive: true },
  });

  if (!category) {
    console.log('\n🏷️ Criando categoria...');
    category = await prisma.category.create({
      data: {
        name: 'Compras',
        type: 'expense',
        isActive: true,
        isDefault: false,
      },
    });
    console.log('✅ Categoria criada:', category.name);
  } else {
    console.log('\n🏷️ Categoria encontrada:', category.name);
  }

  // 1. Criar cartão de crédito
  console.log('\n💳 Criando cartão de crédito...');
  const creditCard = await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: 'Nubank',
      limit: 5000,
      currentBalance: 0,
      dueDay: 10,
      closingDay: 5,
      isActive: true,
    },
  });
  console.log('✅ Cartão criado:', creditCard.name);

  // 2. Criar transação parcelada em 6x
  console.log('\n📦 Criando compra parcelada em 6x...');
  const installmentGroupId = `installment-${Date.now()}`;
  const totalAmount = 600;
  const installments = 6;
  const installmentAmount = totalAmount / installments;
  const baseDate = new Date('2026-01-15');

  for (let i = 1; i <= installments; i++) {
    const installmentDate = new Date(baseDate);
    installmentDate.setMonth(baseDate.getMonth() + (i - 1));

    await prisma.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        account: { connect: { id: account.id } },
        creditCard: { connect: { id: creditCard.id } },
        categoryRef: { connect: { id: category.id } },
        amount: installmentAmount,
        description: `Notebook Dell (${i}/${installments})`,
        type: 'expense',
        date: installmentDate,
        status: 'cleared',
        installmentNumber: i,
        totalInstallments: installments,
        installmentGroupId,
        isInstallment: true,
      },
    });

    console.log(`✅ Parcela ${i}/${installments} criada para ${installmentDate.toLocaleDateString('pt-BR')}`);
  }

  // 3. Criar outra transação parcelada em 12x
  console.log('\n📦 Criando compra parcelada em 12x...');
  const installmentGroupId2 = `installment-${Date.now() + 1}`;
  const totalAmount2 = 1200;
  const installments2 = 12;
  const installmentAmount2 = totalAmount2 / installments2;
  const baseDate2 = new Date('2026-01-20');

  for (let i = 1; i <= installments2; i++) {
    const installmentDate = new Date(baseDate2);
    installmentDate.setMonth(baseDate2.getMonth() + (i - 1));

    await prisma.transaction.create({
      data: {
        user: { connect: { id: user.id } },
        account: { connect: { id: account.id } },
        creditCard: { connect: { id: creditCard.id } },
        categoryRef: { connect: { id: category.id } },
        amount: installmentAmount2,
        description: `Celular Samsung (${i}/${installments2})`,
        type: 'expense',
        date: installmentDate,
        status: 'cleared',
        installmentNumber: i,
        totalInstallments: installments2,
        installmentGroupId: installmentGroupId2,
        isInstallment: true,
      },
    });

    console.log(`✅ Parcela ${i}/${installments2} criada para ${installmentDate.toLocaleDateString('pt-BR')}`);
  }

  // 4. Criar algumas transações avulsas
  console.log('\n💰 Criando transações avulsas...');
  
  await prisma.transaction.create({
    data: {
      user: { connect: { id: user.id } },
      account: { connect: { id: account.id } },
      creditCard: { connect: { id: creditCard.id } },
      categoryRef: { connect: { id: category.id } },
      amount: 50,
      description: 'Uber',
      type: 'expense',
      date: new Date('2026-01-18'),
      status: 'cleared',
      isInstallment: false,
    },
  });
  console.log('✅ Transação avulsa 1 criada');

  await prisma.transaction.create({
    data: {
      user: { connect: { id: user.id } },
      account: { connect: { id: account.id } },
      creditCard: { connect: { id: creditCard.id } },
      categoryRef: { connect: { id: category.id } },
      amount: 150,
      description: 'Supermercado',
      type: 'expense',
      date: new Date('2026-01-22'),
      status: 'cleared',
      isInstallment: false,
    },
  });
  console.log('✅ Transação avulsa 2 criada');

  console.log('\n🎉 Dados de teste criados com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`- 1 cartão de crédito: ${creditCard.name}`);
  console.log(`- ${installments} parcelas de R$ ${installmentAmount.toFixed(2)} (Notebook)`);
  console.log(`- ${installments2} parcelas de R$ ${installmentAmount2.toFixed(2)} (Celular)`);
  console.log('- 2 transações avulsas');
  console.log(`\n💡 Total de transações criadas: ${installments + installments2 + 2}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
