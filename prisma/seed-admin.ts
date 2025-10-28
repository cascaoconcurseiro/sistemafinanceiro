import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Limpando banco de dados...');
  
  // Limpar todas as tabelas (ordem importa por causa das foreign keys)
  try {
    await prisma.auditEvent.deleteMany();
  } catch (e) {}
  try {
    await prisma.notification.deleteMany();
  } catch (e) {}
  try {
    await prisma.attachment.deleteMany();
  } catch (e) {}
  try {
    await prisma.transactionTag.deleteMany();
  } catch (e) {}
  try {
    await prisma.tag.deleteMany();
  } catch (e) {}
  try {
    await prisma.sharedExpense.deleteMany();
  } catch (e) {}
  try {
    await prisma.recurringTransaction.deleteMany();
  } catch (e) {}
  try {
    await prisma.transaction.deleteMany();
  } catch (e) {}
  try {
    await prisma.budget.deleteMany();
  } catch (e) {}
  try {
    await prisma.goal.deleteMany();
  } catch (e) {}
  try {
    await prisma.creditCard.deleteMany();
  } catch (e) {}
  try {
    await prisma.account.deleteMany();
  } catch (e) {}
  try {
    await prisma.category.deleteMany();
  } catch (e) {}
  try {
    await prisma.trip.deleteMany();
  } catch (e) {}
  try {
    await prisma.contact.deleteMany();
  } catch (e) {}
  try {
    await prisma.familyMember.deleteMany();
  } catch (e) {}
  try {
    await prisma.session.deleteMany();
  } catch (e) {}
  await prisma.user.deleteMany();

  console.log('✅ Banco de dados limpo!');
  console.log('');
  console.log('👤 Criando usuário administrador...');

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@suagrana.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Usuário administrador criado!');
  console.log('');
  console.log('📧 Email: admin@suagrana.com');
  console.log('🔑 Senha: admin123');
  console.log('');
  console.log('✨ Banco de dados resetado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao resetar banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
