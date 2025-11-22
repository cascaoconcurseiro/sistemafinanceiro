#!/usr/bin/env node

/**
 * Script para migrar dados do SQLite para PostgreSQL
 * 
 * USO:
 * 1. Configure DATABASE_URL no .env com a URL do PostgreSQL
 * 2. Execute: node scripts/migrate-sqlite-to-postgres.js
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Cliente SQLite (fonte)
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, '..', 'prisma', 'dev.db')}`
    }
  }
});

// Cliente PostgreSQL (destino)
const postgresClient = new PrismaClient();

async function migrate() {
  console.log('🔄 Iniciando migração SQLite → PostgreSQL\n');

  try {
    // Verificar se dev.db existe
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  Arquivo dev.db não encontrado');
      console.log('   Se você não tem dados para migrar, pode pular este script\n');
      process.exit(0);
    }

    // Conectar aos bancos
    console.log('📡 Conectando aos bancos de dados...');
    await sqliteClient.$connect();
    await postgresClient.$connect();
    console.log('✅ Conectado!\n');

    // Migrar Users
    console.log('👤 Migrando usuários...');
    const users = await sqliteClient.user.findMany();
    for (const user of users) {
      await postgresClient.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`✅ ${users.length} usuários migrados\n`);

    // Migrar Accounts
    console.log('🏦 Migrando contas...');
    const accounts = await sqliteClient.account.findMany();
    for (const account of accounts) {
      await postgresClient.account.upsert({
        where: { id: account.id },
        update: account,
        create: account
      });
    }
    console.log(`✅ ${accounts.length} contas migradas\n`);

    // Migrar Categories
    console.log('📁 Migrando categorias...');
    const categories = await sqliteClient.category.findMany();
    for (const category of categories) {
      await postgresClient.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      });
    }
    console.log(`✅ ${categories.length} categorias migradas\n`);

    // Migrar Transactions
    console.log('💰 Migrando transações...');
    const transactions = await sqliteClient.transaction.findMany();
    for (const transaction of transactions) {
      await postgresClient.transaction.upsert({
        where: { id: transaction.id },
        update: transaction,
        create: transaction
      });
    }
    console.log(`✅ ${transactions.length} transações migradas\n`);

    // Migrar Credit Cards
    console.log('💳 Migrando cartões de crédito...');
    const creditCards = await sqliteClient.creditCard.findMany();
    for (const card of creditCards) {
      await postgresClient.creditCard.upsert({
        where: { id: card.id },
        update: card,
        create: card
      });
    }
    console.log(`✅ ${creditCards.length} cartões migrados\n`);

    // Migrar Invoices
    console.log('🧾 Migrando faturas...');
    const invoices = await sqliteClient.invoice.findMany();
    for (const invoice of invoices) {
      await postgresClient.invoice.upsert({
        where: { id: invoice.id },
        update: invoice,
        create: invoice
      });
    }
    console.log(`✅ ${invoices.length} faturas migradas\n`);

    // Migrar Goals
    console.log('🎯 Migrando metas...');
    const goals = await sqliteClient.goal.findMany();
    for (const goal of goals) {
      await postgresClient.goal.upsert({
        where: { id: goal.id },
        update: goal,
        create: goal
      });
    }
    console.log(`✅ ${goals.length} metas migradas\n`);

    // Migrar Investments
    console.log('📈 Migrando investimentos...');
    const investments = await sqliteClient.investment.findMany();
    for (const investment of investments) {
      await postgresClient.investment.upsert({
        where: { id: investment.id },
        update: investment,
        create: investment
      });
    }
    console.log(`✅ ${investments.length} investimentos migrados\n`);

    // Migrar Budgets
    console.log('💵 Migrando orçamentos...');
    const budgets = await sqliteClient.budget.findMany();
    for (const budget of budgets) {
      await postgresClient.budget.upsert({
        where: { id: budget.id },
        update: budget,
        create: budget
      });
    }
    console.log(`✅ ${budgets.length} orçamentos migrados\n`);

    console.log('🎉 Migração concluída com sucesso!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Verifique os dados no PostgreSQL');
    console.log('   2. Teste a aplicação localmente');
    console.log('   3. Faça backup do dev.db (caso precise reverter)');
    console.log('   4. Faça deploy no Netlify\n');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    console.error('\n💡 Dicas:');
    console.error('   - Verifique se DATABASE_URL está configurada corretamente');
    console.error('   - Certifique-se de que executou: npx prisma db push');
    console.error('   - Verifique se o PostgreSQL está acessível\n');
    process.exit(1);
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

// Executar migração
migrate();
