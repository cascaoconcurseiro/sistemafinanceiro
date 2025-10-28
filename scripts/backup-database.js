/**
 * Script de Backup Automático do Banco de Dados
 * Executa backup diário do SQLite
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'database');
const MAX_BACKUPS = 30; // Manter últimos 30 dias

// Criar diretório de backup se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Gerar nome do arquivo com timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.db`);

console.log('🔄 Iniciando backup do banco de dados...');
console.log(`📁 Origem: ${DB_PATH}`);
console.log(`💾 Destino: ${backupFile}`);

try {
  // Verificar se banco existe
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Banco de dados não encontrado!');
    process.exit(1);
  }

  // Fazer backup (copiar arquivo)
  fs.copyFileSync(DB_PATH, backupFile);
  
  // Verificar tamanho
  const stats = fs.statSync(backupFile);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ Backup criado com sucesso! (${sizeMB} MB)`);

  // Limpar backups antigos
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > MAX_BACKUPS) {
    console.log(`🗑️  Removendo backups antigos (mantendo ${MAX_BACKUPS})...`);
    
    files.slice(MAX_BACKUPS).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`   Removido: ${file.name}`);
    });
  }

  console.log(`📊 Total de backups: ${Math.min(files.length, MAX_BACKUPS)}`);
  console.log('✅ Processo de backup concluído!');

} catch (error) {
  console.error('❌ Erro ao fazer backup:', error.message);
  process.exit(1);
}
