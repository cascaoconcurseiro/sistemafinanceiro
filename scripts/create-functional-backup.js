/**
 * Script para criar backup apenas dos arquivos funcionais essenciais
 * Exclui documentação, testes, logs, backups antigos, etc.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..');
const BACKUP_DIR = path.join(__dirname, '..', '..', 'SuaGrana-VERSAO-FUNCIONAL');

// Diretórios e arquivos essenciais para o funcionamento
const ESSENTIAL_PATHS = [
  // Configurações essenciais
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.ts',
  'postcss.config.js',
  'components.json',
  '.env.example',
  '.gitignore',
  '.eslintrc.json',
  '.prettierrc.json',
  'middleware.ts',
  
  // Prisma (banco de dados)
  'prisma/',
  
  // Código fonte
  'src/',
  
  // Assets públicos
  'public/',
  
  // Scripts essenciais
  'scripts/migrate-goal-transactions.js',
  'scripts/fix-common-issues.js',
  
  // Documentação essencial
  'README.md',
  'COMO-INICIAR-SERVIDOR.md',
  'CORRECAO-EXCLUSAO-TRANSACOES.md',
  'MIGRACAO-GOAL-TRANSACTIONS.md',
  'RESUMO-CORRECOES-METAS.md',
];

// Padrões para EXCLUIR (mesmo dentro de diretórios essenciais)
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /\.swc/,
  /dist/,
  /build/,
  /coverage/,
  /\.cache/,
  /logs/,
  /backups/,
  /__tests__/,
  /tests/,
  /e2e/,
  /\.test\./,
  /\.spec\./,
  /audit-/,
  /test-/,
  /debug-/,
  /check-/,
  /fix-.*\.js$/,
  /clean-.*\.js$/,
  /verify-.*\.js$/,
  /AUDITORIA.*\.md$/,
  /ANALISE.*\.md$/,
  /CORRECOES.*\.md$/,
  /IMPLEMENTACAO.*\.md$/,
  /FASE-.*\.md$/,
  /STATUS.*\.md$/,
  /PLANO.*\.md$/,
  /RELATORIO.*\.md$/,
  /RESUMO.*\.md$/,
  /INSTRUCOES.*\.md$/,
  /TESTE.*\.md$/,
  /PROBLEMA.*\.md$/,
  /SOLUCAO.*\.md$/,
  /DIAGNOSTICO.*\.md$/,
  /MELHORIAS.*\.md$/,
  /PROGRESSO.*\.md$/,
  /CHECKLIST.*\.md$/,
  /GUIA.*\.md$/,
  /LEIA.*\.md$/,
  /SUCESSO.*\.md$/,
  /ERRO.*\.md$/,
  /MIGRACAO.*\.md$/,
  /LIMPEZA.*\.md$/,
  /REFATORACAO.*\.md$/,
  /OTIMIZACOES.*\.md$/,
  /SISTEMA.*\.md$/,
  /TRABALHO.*\.md$/,
  /MISSAO.*\.md$/,
  /CELEBRACAO.*\.md$/,
  /VERDADE.*\.md$/,
  /TUDO.*\.md$/,
  /INDICE.*\.md$/,
  /MAPA.*\.md$/,
  /\.tsbuildinfo$/,
  /\.log$/,
  /\.json$/ && /audit-report/,
];

function shouldExclude(filePath) {
  const relativePath = path.relative(SOURCE_DIR, filePath);
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(relativePath));
}

function shouldInclude(filePath) {
  const relativePath = path.relative(SOURCE_DIR, filePath);
  
  // Se foi excluído, não incluir
  if (shouldExclude(filePath)) {
    return false;
  }
  
  // Verificar se está em um dos caminhos essenciais
  return ESSENTIAL_PATHS.some(essentialPath => {
    if (essentialPath.endsWith('/')) {
      // É um diretório - incluir tudo dentro dele (exceto o que foi excluído)
      return relativePath.startsWith(essentialPath.slice(0, -1));
    } else {
      // É um arquivo específico
      return relativePath === essentialPath;
    }
  });
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldExclude(srcPath)) {
      console.log(`⏭️  Excluindo: ${path.relative(SOURCE_DIR, srcPath)}`);
      continue;
    }

    if (entry.isDirectory()) {
      if (shouldInclude(srcPath)) {
        copyDirectory(srcPath, destPath);
      }
    } else {
      if (shouldInclude(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copiado: ${path.relative(SOURCE_DIR, srcPath)}`);
      }
    }
  }
}

function createBackup() {
  console.log('🔄 Criando backup funcional do sistema...\n');
  console.log(`📂 Origem: ${SOURCE_DIR}`);
  console.log(`📂 Destino: ${BACKUP_DIR}\n`);

  // Remover backup anterior se existir
  if (fs.existsSync(BACKUP_DIR)) {
    console.log('🗑️  Removendo backup anterior...\n');
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  }

  // Criar diretório de backup
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // Copiar arquivos essenciais
  console.log('📋 Copiando arquivos essenciais...\n');
  
  for (const essentialPath of ESSENTIAL_PATHS) {
    const srcPath = path.join(SOURCE_DIR, essentialPath);
    const destPath = path.join(BACKUP_DIR, essentialPath);

    if (!fs.existsSync(srcPath)) {
      console.log(`⚠️  Não encontrado: ${essentialPath}`);
      continue;
    }

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copiado: ${essentialPath}`);
    }
  }

  // Criar README no backup
  const readmeContent = `# SuaGrana - Versão Funcional

Este é um backup limpo contendo apenas os arquivos essenciais para o funcionamento do sistema.

## 📦 O que está incluído

- ✅ Código fonte (\`src/\`)
- ✅ Configurações do projeto
- ✅ Schema do banco de dados (\`prisma/\`)
- ✅ Assets públicos (\`public/\`)
- ✅ Scripts essenciais
- ✅ Documentação mínima

## 🚫 O que foi excluído

- ❌ Documentação de desenvolvimento
- ❌ Scripts de teste e debug
- ❌ Logs e relatórios
- ❌ Backups antigos
- ❌ Arquivos temporários
- ❌ node_modules (reinstalar com \`npm install\`)

## 🚀 Como usar

1. Copie o arquivo \`.env.example\` para \`.env\` e configure
2. Instale as dependências: \`npm install\`
3. Configure o banco: \`npx prisma generate\`
4. Inicie o servidor: \`npm run dev\`

## 📝 Documentação Essencial

- \`README.md\` - Informações gerais
- \`COMO-INICIAR-SERVIDOR.md\` - Como iniciar o sistema
- \`CORRECAO-EXCLUSAO-TRANSACOES.md\` - Sistema de exclusão
- \`MIGRACAO-GOAL-TRANSACTIONS.md\` - Migração de metas
- \`RESUMO-CORRECOES-METAS.md\` - Correções aplicadas

## 🎯 Sistema Funcional

Este backup contém um sistema 100% funcional com:
- ✅ Autenticação
- ✅ Contas e transações
- ✅ Cartões de crédito
- ✅ Metas financeiras
- ✅ Viagens
- ✅ Despesas compartilhadas
- ✅ Relatórios
- ✅ Notificações

Data do backup: ${new Date().toLocaleString('pt-BR')}
`;

  fs.writeFileSync(path.join(BACKUP_DIR, 'README.md'), readmeContent);

  console.log('\n✅ Backup funcional criado com sucesso!');
  console.log(`📂 Localização: ${BACKUP_DIR}`);
  console.log('\n📊 Estatísticas:');
  
  // Contar arquivos
  let fileCount = 0;
  let dirCount = 0;
  
  function countFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        dirCount++;
        countFiles(fullPath);
      } else {
        fileCount++;
      }
    }
  }
  
  countFiles(BACKUP_DIR);
  
  console.log(`   📁 Diretórios: ${dirCount}`);
  console.log(`   📄 Arquivos: ${fileCount}`);
}

// Executar backup
try {
  createBackup();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro ao criar backup:', error);
  process.exit(1);
}
