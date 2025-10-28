/**
 * 🔍 DIAGNÓSTICO COMPLETO DO SISTEMA ADMIN
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function diagnostico() {
  console.log('🔍 DIAGNÓSTICO DO SISTEMA ADMIN\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar usuário admin
    console.log('\n1️⃣ VERIFICANDO USUÁRIO ADMIN...');
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@suagrana.com' }
    });

    if (!admin) {
      console.log('❌ Usuário admin NÃO ENCONTRADO!');
      console.log('   Execute: npx tsx scripts/create-admin-user.ts');
      return;
    }

    console.log('✅ Usuário admin encontrado:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Ativo: ${admin.isActive}`);
    console.log(`   Último login: ${admin.lastLogin || 'Nunca'}`);

    // 2. Testar senha
    console.log('\n2️⃣ TESTANDO SENHA...');
    const senhaCorreta = await bcrypt.compare('admin123', admin.password);
    if (senhaCorreta) {
      console.log('✅ Senha "admin123" está CORRETA');
    } else {
      console.log('❌ Senha "admin123" está INCORRETA');
      console.log('   Recriando usuário...');
      await prisma.user.delete({ where: { id: admin.id } });
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@suagrana.com',
          name: 'Administrador',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Usuário recriado com senha correta');
    }

    // 3. Verificar role
    console.log('\n3️⃣ VERIFICANDO PERMISSÕES...');
    if (admin.role === 'ADMIN') {
      console.log('✅ Role ADMIN configurado corretamente');
    } else {
      console.log(`❌ Role incorreto: ${admin.role}`);
      console.log('   Corrigindo...');
      await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ADMIN' }
      });
      console.log('✅ Role corrigido para ADMIN');
    }

    // 4. Verificar status ativo
    console.log('\n4️⃣ VERIFICANDO STATUS...');
    if (admin.isActive) {
      console.log('✅ Usuário está ATIVO');
    } else {
      console.log('❌ Usuário está INATIVO');
      console.log('   Ativando...');
      await prisma.user.update({
        where: { id: admin.id },
        data: { isActive: true }
      });
      console.log('✅ Usuário ativado');
    }

    // 5. Verificar arquivos de configuração
    console.log('\n5️⃣ VERIFICANDO CONFIGURAÇÕES...');
    
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      console.log('✅ Arquivo .env encontrado');
      const envContent = fs.readFileSync(envPath, 'utf-8');
      
      if (envContent.includes('NEXTAUTH_SECRET')) {
        console.log('✅ NEXTAUTH_SECRET configurado');
      } else {
        console.log('⚠️  NEXTAUTH_SECRET não encontrado no .env');
      }
      
      if (envContent.includes('NEXTAUTH_URL')) {
        console.log('✅ NEXTAUTH_URL configurado');
      } else {
        console.log('⚠️  NEXTAUTH_URL não encontrado no .env');
      }
    } else {
      console.log('❌ Arquivo .env NÃO ENCONTRADO');
    }

    // 6. Verificar banco de dados
    console.log('\n6️⃣ VERIFICANDO BANCO DE DADOS...');
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Banco de dados: ${sizeInMB} MB`);
    } else {
      console.log('❌ Banco de dados não encontrado');
    }

    // 7. Estatísticas gerais
    console.log('\n7️⃣ ESTATÍSTICAS DO SISTEMA...');
    const [totalUsers, totalTransactions, totalAccounts] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.account.count(),
    ]);
    console.log(`   Usuários: ${totalUsers}`);
    console.log(`   Transações: ${totalTransactions}`);
    console.log(`   Contas: ${totalAccounts}`);

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNÓSTICO CONCLUÍDO!\n');
    console.log('📋 CREDENCIAIS DE ACESSO:');
    console.log('   URL: http://localhost:3000/login');
    console.log('   Email: admin@suagrana.com');
    console.log('   Senha: admin123');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. Acesse: http://localhost:3000/login');
    console.log('   3. Faça login com as credenciais acima');
    console.log('   4. Você será redirecionado para /admin');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERRO NO DIAGNÓSTICO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnostico();
