/**
 * BACKUP AUTOMÁTICO DO BANCO DE DADOS
 * 
 * Funcionalidades:
 * - Backup completo do SQLite
 * - Compressão do arquivo
 * - Rotação de backups (manter últimos 30 dias)
 * - Upload para cloud storage (opcional)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configurações
const CONFIG = {
  dbPath: path.join(__dirname, '../prisma/dev.db'),
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 30, // Manter últimos 30 backups
  compress: true,
};

/**
 * Criar diretório de backups se não existir
 */
function ensureBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(`📁 Diretório de backups criado: ${CONFIG.backupDir}`);
  }
}

/**
 * Gerar nome do arquivo de backup
 */
function generateBackupFilename() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `backup-${timestamp}-${time}.db`;
}

/**
 * Criar backup do banco de dados
 */
async function createBackup() {
  console.log('💾 Iniciando backup do banco de dados...\n');

  ensureBackupDir();

  const backupFilename = generateBackupFilename();
  const backupPath = path.join(CONFIG.backupDir, backupFilename);

  try {
    // Verificar se banco existe
    if (!fs.existsSync(CONFIG.dbPath)) {
      throw new Error(`Banco de dados não encontrado: ${CONFIG.dbPath}`);
    }

    // Copiar arquivo do banco
    fs.copyFileSync(CONFIG.dbPath, backupPath);
    console.log(`✅ Backup criado: ${backupFilename}`);

    // Obter estatísticas do banco
    const stats = await getDatabaseStats();
    console.log('\n📊 Estatísticas do backup:');
    console.log(`   Usuários: ${stats.users}`);
    console.log(`   Transações: ${stats.transactions}`);
    console.log(`   Contas: ${stats.accounts}`);
    console.log(`   Categorias: ${stats.categories}`);

    // Comprimir backup (opcional) - apenas em Linux/Mac
    if (CONFIG.compress && process.platform !== 'win32') {
      try {
        const compressedPath = `${backupPath}.gz`;
        execSync(`gzip -c "${backupPath}" > "${compressedPath}"`);
        fs.unlinkSync(backupPath); // Remover arquivo não comprimido
        console.log(`✅ Backup comprimido: ${backupFilename}.gz`);
      } catch (error) {
        console.log('⚠️ Compressão não disponível, mantendo backup sem compressão');
      }
    } else if (CONFIG.compress && process.platform === 'win32') {
      console.log('ℹ️ Compressão não disponível no Windows, backup salvo sem compressão');
    }

    // Limpar backups antigos
    await cleanOldBackups();

    // Salvar metadata do backup
    await saveBackupMetadata(backupFilename, stats);

    console.log('\n🎉 Backup concluído com sucesso!');
    
    return {
      filename: CONFIG.compress ? `${backupFilename}.gz` : backupFilename,
      path: CONFIG.compress ? `${backupPath}.gz` : backupPath,
      stats,
    };
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
}

/**
 * Obter estatísticas do banco de dados
 */
async function getDatabaseStats() {
  const [users, transactions, accounts, categories] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count({ where: { deletedAt: null } }),
    prisma.account.count({ where: { deletedAt: null } }),
    prisma.category.count(),
  ]);

  return { users, transactions, accounts, categories };
}

/**
 * Limpar backups antigos
 */
async function cleanOldBackups() {
  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.db') || f.endsWith('.db.gz')))
    .map(f => ({
      name: f,
      path: path.join(CONFIG.backupDir, f),
      time: fs.statSync(path.join(CONFIG.backupDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // Mais recente primeiro

  // Manter apenas os últimos N backups
  const toDelete = files.slice(CONFIG.maxBackups);

  if (toDelete.length > 0) {
    console.log(`\n🧹 Limpando ${toDelete.length} backup(s) antigo(s)...`);
    
    for (const file of toDelete) {
      fs.unlinkSync(file.path);
      console.log(`   ✅ Removido: ${file.name}`);
    }
  }
}

/**
 * Salvar metadata do backup
 */
async function saveBackupMetadata(filename, stats) {
  const metadata = {
    filename,
    timestamp: new Date().toISOString(),
    stats,
    compressed: CONFIG.compress,
  };

  const metadataPath = path.join(CONFIG.backupDir, 'backup-metadata.json');
  
  let allMetadata = [];
  if (fs.existsSync(metadataPath)) {
    allMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }

  allMetadata.push(metadata);
  
  // Manter apenas metadata dos últimos backups
  allMetadata = allMetadata.slice(-CONFIG.maxBackups);

  fs.writeFileSync(metadataPath, JSON.stringify(allMetadata, null, 2));
}

/**
 * Restaurar backup
 */
function restoreBackup(backupFilename) {
  console.log(`🔄 Restaurando backup: ${backupFilename}\n`);

  const backupPath = path.join(CONFIG.backupDir, backupFilename);

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup não encontrado: ${backupFilename}`);
  }

  // Fazer backup do banco atual antes de restaurar
  const currentBackup = path.join(CONFIG.backupDir, `pre-restore-${Date.now()}.db`);
  if (fs.existsSync(CONFIG.dbPath)) {
    fs.copyFileSync(CONFIG.dbPath, currentBackup);
    console.log(`✅ Backup do banco atual criado: ${path.basename(currentBackup)}`);
  }

  // Descomprimir se necessário
  let sourceFile = backupPath;
  if (backupFilename.endsWith('.gz')) {
    const decompressedPath = backupPath.replace('.gz', '');
    execSync(`gzip -d -c "${backupPath}" > "${decompressedPath}"`);
    sourceFile = decompressedPath;
    console.log('✅ Backup descomprimido');
  }

  // Restaurar banco
  fs.copyFileSync(sourceFile, CONFIG.dbPath);
  console.log('✅ Banco de dados restaurado');

  // Limpar arquivo descomprimido temporário
  if (sourceFile !== backupPath) {
    fs.unlinkSync(sourceFile);
  }

  console.log('\n🎉 Restauração concluída com sucesso!');
}

/**
 * Listar backups disponíveis
 */
function listBackups() {
  ensureBackupDir();

  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.db') || f.endsWith('.db.gz')))
    .map(f => {
      const stats = fs.statSync(path.join(CONFIG.backupDir, f));
      return {
        name: f,
        size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        date: stats.mtime.toLocaleString('pt-BR'),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  console.log('📋 Backups disponíveis:\n');
  
  if (files.length === 0) {
    console.log('   Nenhum backup encontrado');
  } else {
    files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.name}`);
      console.log(`   Tamanho: ${file.size}`);
      console.log(`   Data: ${file.date}\n`);
    });
  }

  return files;
}

// ============================================
// CLI
// ============================================

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'create':
        await createBackup();
        break;

      case 'restore':
        const filename = process.argv[3];
        if (!filename) {
          console.error('❌ Uso: node backup-database.js restore <filename>');
          process.exit(1);
        }
        restoreBackup(filename);
        break;

      case 'list':
        listBackups();
        break;

      default:
        console.log('📖 Uso:');
        console.log('   node backup-database.js create   - Criar novo backup');
        console.log('   node backup-database.js restore <filename> - Restaurar backup');
        console.log('   node backup-database.js list     - Listar backups');
        break;
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { createBackup, restoreBackup, listBackups };
