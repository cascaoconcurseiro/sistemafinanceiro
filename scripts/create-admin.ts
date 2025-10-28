import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@suagrana.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      isActive: true
    },
    create: {
      email,
      name: 'Admin',
      password: hashedPassword,
      isActive: true
    }
  });

  console.log('✅ Usuário admin criado/atualizado:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
