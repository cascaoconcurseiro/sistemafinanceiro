/**
 * CONFIGURAÇÃO RÁPIDA PARA PRODUÇÃO
 * 
 * Aplica todas as melhorias rápidas (< 5 minutos)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 CONFIGURAÇÃO RÁPIDA PARA PRODUÇÃO\n');
console.log('='.repeat(70));

const tasks = [];
let completed = 0;
let failed = 0;

function addTask(name, fn) {
  tasks.push({ name, fn });
}

async function runTasks() {
  for (const task of tasks) {
    try {
      console.log(`\n📋 ${task.name}...`);
      await task.fn();
      console.log(`   ✅ Concluído`);
      completed++;
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
      failed++;
    }
  }
}

// ============================================
// TAREFA 1: Instalar Dependências
// ============================================
addTask('Instalando dependências de produção', () => {
  console.log('   Instalando eslint-plugin-jsx-a11y...');
  try {
    execSync('npm install --save-dev eslint-plugin-jsx-a11y', { stdio: 'inherit' });
  } catch (error) {
    console.log('   ⚠️ Já instalado ou erro na instalação');
  }
});

// ============================================
// TAREFA 2: Verificar Connection Pooling
// ============================================
addTask('Verificando connection pooling', () => {
  const envPath = path.join(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('connection_limit')) {
    console.log('   ✅ Connection pooling já configurado');
  } else {
    console.log('   ⚠️ Connection pooling não encontrado no .env');
    console.log('   Adicione: DATABASE_URL="file:./prisma/dev.db?connection_limit=10"');
  }
});

// ============================================
// TAREFA 3: Criar Diretório de Backups
// ============================================
addTask('Criando diretório de backups', () => {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('   ✅ Diretório criado: ./backups');
  } else {
    console.log('   ✅ Diretório já existe');
  }
});

// ============================================
// TAREFA 4: Criar Diretório de Logs
// ============================================
addTask('Criando diretório de logs', () => {
  const logsDir = path.join(__dirname, '../logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('   ✅ Diretório criado: ./logs');
  } else {
    console.log('   ✅ Diretório já existe');
  }
});

// ============================================
// TAREFA 5: Criar .gitignore para Backups
// ============================================
addTask('Configurando .gitignore', () => {
  const gitignorePath = path.join(__dirname, '../.gitignore');
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  const entries = [
    '# Backups',
    'backups/',
    '*.db.gz',
    '',
    '# Logs',
    'logs/',
    '*.log',
    '',
    '# Audit Reports',
    '*-audit-report.json',
    'professional-audit-report.json',
  ];
  
  let added = false;
  for (const entry of entries) {
    if (!gitignoreContent.includes(entry)) {
      gitignoreContent += '\n' + entry;
      added = true;
    }
  }
  
  if (added) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('   ✅ .gitignore atualizado');
  } else {
    console.log('   ✅ .gitignore já configurado');
  }
});

// ============================================
// TAREFA 6: Testar Backup
// ============================================
addTask('Testando sistema de backup', () => {
  console.log('   Criando backup de teste...');
  try {
    execSync('node scripts/backup-database.js create', { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Falha ao criar backup de teste');
  }
});

// ============================================
// TAREFA 7: Verificar Prisma Client
// ============================================
addTask('Verificando Prisma Client', () => {
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (error) {
    throw new Error('Falha ao gerar Prisma Client');
  }
});

// ============================================
// TAREFA 8: Criar Script de Cron (Instruções)
// ============================================
addTask('Gerando instruções de cron', () => {
  const cronInstructions = `
# ============================================
# CONFIGURAR BACKUP AUTOMÁTICO
# ============================================

## Linux/Mac:

1. Editar crontab:
   crontab -e

2. Adicionar linha (backup diário às 3h):
   0 3 * * * cd ${process.cwd()} && node scripts/backup-database.js create >> logs/backup.log 2>&1

3. Salvar e sair

## Windows:

1. Abrir PowerShell como Administrador

2. Executar:
   $action = New-ScheduledTaskAction -Execute "node" -Argument "scripts/backup-database.js create" -WorkingDirectory "${process.cwd()}"
   $trigger = New-ScheduledTaskTrigger -Daily -At 3am
   Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "SuaGrana Backup" -Description "Backup diário do banco de dados"

3. Verificar:
   Get-ScheduledTask -TaskName "SuaGrana Backup"

## Verificar Backups:

   node scripts/backup-database.js list
`;

  const instructionsPath = path.join(__dirname, '../CONFIGURAR-BACKUP-AUTOMATICO.md');
  fs.writeFileSync(instructionsPath, cronInstructions);
  console.log('   ✅ Instruções salvas em: CONFIGURAR-BACKUP-AUTOMATICO.md');
});

// ============================================
// EXECUTAR TODAS AS TAREFAS
// ============================================

async function main() {
  await runTasks();
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO');
  console.log('='.repeat(70));
  console.log(`✅ Concluídas: ${completed}`);
  console.log(`❌ Falharam: ${failed}`);
  console.log(`📋 Total: ${tasks.length}`);
  console.log('='.repeat(70));
  
  if (failed === 0) {
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('');
    console.log('1. Configurar backup automático:');
    console.log('   Consultar: CONFIGURAR-BACKUP-AUTOMATICO.md');
    console.log('');
    console.log('2. Executar auditoria:');
    console.log('   node scripts/professional-audit.js');
    console.log('');
    console.log('3. Implementar Sentry (error tracking):');
    console.log('   npm install @sentry/nextjs');
    console.log('   npx @sentry/wizard -i nextjs');
    console.log('');
    console.log('4. Implementar testes:');
    console.log('   npm install --save-dev jest @testing-library/react');
    console.log('');
  } else {
    console.log('\n⚠️ ALGUMAS TAREFAS FALHARAM');
    console.log('Verifique os erros acima e tente novamente.');
  }
}

main().catch(console.error);
