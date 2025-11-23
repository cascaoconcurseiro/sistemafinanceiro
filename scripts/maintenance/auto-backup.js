#!/usr/bin/env node

/**
 * Auto Backup - Backup automático do banco de dados
 * Cria backups incrementais e mantém histórico
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    return null;
  }
}

class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.maxBackups = 10; // Manter últimos 10 backups
  }

  // Criar diretório de backups
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      log('✅ Diretório de backups criado', 'green');
    }
  }

  // Gerar nome do backup
  generateBackupName() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    
    return `backup_${timestamp}.sql`;
  }

  // Fazer backup do PostgreSQL
  async backupDatabase() {
    log('\n🔄 Iniciando backup do banco de dados...', 'cyan');

    // Ler DATABASE_URL do .env
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      log('❌ .env.local não encontrado', 'red');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);
    
    if (!dbUrlMatch) {
      log('❌ DATABASE_URL não encontrado em .env.local', 'red');
      return false;
    }

    const dbUrl = dbUrlMatch[1];
    const backupFile = path.join(this.backupDir, this.generateBackupName());

    // Executar pg_dump
    log('⏳ Exportando dados...', 'yellow');
    
    const command = `pg_dump "${dbUrl}" > "${backupFile}"`;
    const result = exec(command);

    if (result === null) {
      log('❌ Erro ao fazer backup', 'red');
      return false;
    }

    // Verificar tamanho do arquivo
    const stats = fs.statSync(backupFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    log(`✅ Backup criado: ${path.basename(backupFile)}`, 'green');
    log(`📦 Tamanho: ${sizeMB}MB`, 'cyan');

    return true;
  }

  // Fazer backup dos arquivos
  async backupFiles() {
    log('\n🔄 Fazendo backup de arquivos...', 'cyan');

    const filesToBackup = [
      '.env.local',
      'package.json',
      'package-lock.json',
      'prisma/schema.prisma',
    ];

    const filesBackupDir = path.join(this.backupDir, 'files');
    if (!fs.existsSync(filesBackupDir)) {
      fs.mkdirSync(filesBackupDir, { recursive: true });
    }

    filesToBackup.forEach(file => {
      const sourcePath = path.join(process.cwd(), file);
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(filesBackupDir, path.basename(file));
        fs.copyFileSync(sourcePath, destPath);
        log(`✅ ${file}`, 'green');
      }
    });

    return true;
  }

  // Limpar backups antigos
  cleanOldBackups() {
    log('\n🧹 Limpando backups antigos...', 'cyan');

    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > this.maxBackups) {
      const toDelete = files.slice(this.maxBackups);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        log(`🗑️  Removido: ${file.name}`, 'yellow');
      });
      log(`✅ ${toDelete.length} backup(s) antigo(s) removido(s)`, 'green');
    } else {
      log('✅ Nenhum backup antigo para remover', 'green');
    }
  }

  // Listar backups
  listBackups() {
    log('\n📋 Backups disponíveis:', 'cyan');

    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(this.backupDir, f),
        time: fs.statSync(path.join(this.backupDir, f)).mtime,
        size: fs.statSync(path.join(this.backupDir, f)).size,
      }))
      .sort((a, b) => b.time.getTime() - a.time.getTime());

    if (files.length === 0) {
      log('Nenhum backup encontrado', 'yellow');
      return;
    }

    files.forEach((file, i) => {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      const date = file.time.toLocaleString('pt-BR');
      log(`${i + 1}. ${file.name} (${sizeMB}MB) - ${date}`, 'cyan');
    });
  }

  // Restaurar backup
  async restoreBackup(backupName) {
    log(`\n🔄 Restaurando backup: ${backupName}...`, 'cyan');

    const backupPath = path.join(this.backupDir, backupName);
    if (!fs.existsSync(backupPath)) {
      log('❌ Backup não encontrado', 'red');
      return false;
    }

    // Ler DATABASE_URL
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);
    
    if (!dbUrlMatch) {
      log('❌ DATABASE_URL não encontrado', 'red');
      return false;
    }

    const dbUrl = dbUrlMatch[1];

    log('⚠️  ATENÇÃO: Isso vai sobrescrever o banco atual!', 'yellow');
    log('⏳ Restaurando...', 'yellow');

    const command = `psql "${dbUrl}" < "${backupPath}"`;
    const result = exec(command);

    if (result === null) {
      log('❌ Erro ao restaurar backup', 'red');
      return false;
    }

    log('✅ Backup restaurado com sucesso!', 'green');
    return true;
  }

  // Executar backup completo
  async run() {
    log('\n' + '='.repeat(60), 'cyan');
    log('💾 AUTO BACKUP - SuaGrana', 'cyan');
    log('='.repeat(60), 'cyan');

    this.ensureBackupDir();

    const dbSuccess = await this.backupDatabase();
    const filesSuccess = await this.backupFiles();

    if (dbSuccess && filesSuccess) {
      this.cleanOldBackups();
      this.listBackups();

      log('\n' + '='.repeat(60), 'cyan');
      log('✅ BACKUP CONCLUÍDO COM SUCESSO!', 'green');
      log('='.repeat(60) + '\n', 'cyan');
    } else {
      log('\n❌ Backup falhou parcialmente', 'red');
    }
  }
}

// Processar argumentos
const args = process.argv.slice(2);
const command = args[0];

const manager = new BackupManager();

if (command === 'list') {
  manager.ensureBackupDir();
  manager.listBackups();
} else if (command === 'restore' && args[1]) {
  manager.restoreBackup(args[1]);
} else if (command === 'clean') {
  manager.ensureBackupDir();
  manager.cleanOldBackups();
} else {
  manager.run();
}
