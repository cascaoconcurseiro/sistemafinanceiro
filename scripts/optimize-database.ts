#!/usr/bin/env tsx

/**
 * Script para otimizar o banco de dados
 * Adiciona índices e executa VACUUM
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🚀 Iniciando otimização do banco de dados...\n');

  try {
    // Ler arquivo SQL com índices
    const sqlPath = join(process.cwd(), 'prisma', 'add-indexes.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Dividir em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    // Executar cada comando
    for (const command of commands) {
      try {
        await prisma.$executeRawUnsafe(command);
        
        // Extrair nome do índice ou tabela para log
        const match = command.match(/(?:INDEX|ANALYZE)\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
        const name = match ? match[1] : 'comando';
        
        console.log(`✅ ${name}`);
      } catch (error: any) {
        console.error(`❌ Erro ao executar comando: ${error.message}`);
      }
    }

    console.log('\n🧹 Executando VACUUM para otimizar espaço...');
    await prisma.$executeRawUnsafe('VACUUM;');
    console.log('✅ VACUUM concluído');

    console.log('\n📊 Estatísticas do banco de dados:');
    
    // Contar registros principais
    const [
      transactionCount,
      accountCount,
      budgetCount,
      goalCount,
      investmentCount,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.account.count(),
      prisma.budget.count(),
      prisma.goal.count(),
      prisma.investment.count(),
    ]);

    console.log(`  Transações: ${transactionCount}`);
    console.log(`  Contas: ${accountCount}`);
    console.log(`  Orçamentos: ${budgetCount}`);
    console.log(`  Metas: ${goalCount}`);
    console.log(`  Investimentos: ${investmentCount}`);

    console.log('\n✨ Otimização concluída com sucesso!');
    console.log('\n💡 Dicas:');
    console.log('  - Execute este script periodicamente (mensal)');
    console.log('  - Monitore o tamanho do banco de dados');
    console.log('  - Faça backup antes de otimizações grandes');

  } catch (error: any) {
    console.error('\n❌ Erro durante otimização:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
optimizeDatabase();
