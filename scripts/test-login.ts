/**
 * Script para testar login do admin
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testando login do admin...\n');

    // Buscar usuário admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (!admin) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Nome:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Ativo:', admin.isActive);
    console.log('   Último login:', admin.lastLogin);
    console.log('');

    // Testar senha
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, admin.password);

    if (isPasswordValid) {
      console.log('✅ Senha "admin123" está CORRETA!');
    } else {
      console.log('❌ Senha "admin123" está INCORRETA!');
      console.log('   Hash armazenado:', admin.password.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
