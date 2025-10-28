/**
 * 👤 SCRIPT PARA CRIAR USUÁRIO ADMIN PADRÃO
 * 
 * Credenciais: admin@suagrana.com / admin123
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('👤 [CreateAdmin] Criando usuário admin padrão...');

  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (existingUser) {
      console.log('✅ [CreateAdmin] Usuário admin já existe:', existingUser.email);
      return existingUser;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Criar usuário admin
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@suagrana.com',
        name: 'Administrador',
        password: hashedPassword,
        isActive: true,
        monthlyIncome: 5000.00,
        emergencyReserve: 10000.00,
        riskProfile: 'moderado',
        financialGoals: 'Controle financeiro pessoal completo',
        preferences: JSON.stringify({
          theme: 'light',
          currency: 'BRL',
          notifications: true
        })
      }
    });

    console.log('✅ [CreateAdmin] Usuário admin criado com sucesso!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Senha: admin123');
    console.log('👤 ID:', adminUser.id);
    console.log('🎯 [CreateAdmin] PRIMEIRO ACESSO LIMPO - Sem dados pré-criados');

    // ❌ REMOVIDO: Não criar contas/cartões automaticamente
    // Usuário deve criar suas próprias contas no primeiro acesso

    return adminUser;
  } catch (error) {
    console.error('❌ [CreateAdmin] Erro ao criar usuário admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ❌ REMOVIDO: Função de criar contas padrão
// O usuário deve criar suas próprias contas no primeiro acesso
// Isso garante que cada usuário tenha controle total sobre seus dados

// Executar se chamado diretamente
if (require.main === module) {
  createAdminUser();
}

export { createAdminUser };