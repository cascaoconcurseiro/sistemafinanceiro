const fs = require('fs');
const path = require('path');

console.log('🧹 Preparando projeto para produção...\n');

// Arquivos e pastas para remover (não essenciais)
const toRemove = [
  // Documentação de desenvolvimento
  'docs/CODIGO-FONTE-*.tsx',
  'docs/CODIGO-FONTE-*.md',
  'docs/CODIGOS-*.md',
  'PROMPT-*.md',
  'ANALISE-*.md',
  'AUDITORIA-*.md',
  'IMPLEMENTACAO-*.md',
  'RELATORIO-*.md',
  'RESUMO-*.md',
  'TRABALHO-*.md',
  'MISSAO-*.md',
  'CERTIFICADO-*.md',
  'MANIFESTO-*.md',
  'EXECUCAO-*.md',
  'CORRECOES-*.md',
  'PROBLEMAS-*.md',
  'PLANO-*.md',
  'STATUS-*.md',
  'TESTE-*.md',
  'PROJETO-*.md',
  
  // Guias de deploy antigos (manter apenas Hostinger)
  'NETLIFY-SETUP.md',
  'GUIA-NEON-DATABASE.md',
  'PASSO-A-PASSO-DEPLOY-NETLIFY.md',
  'CONFIGURAR-NETLIFY-AGORA.md',
  'VARIAVEIS-NETLIFY.txt',
  'MIGRACAO-SQLITE-PARA-POSTGRESQL.md',
  '.env.netlify',
  
  // Scripts de desenvolvimento/debug
  'scripts/test-*.js',
  'scripts/test-*.ts',
  'scripts/analyze-*.js',
  'scripts/audit-*.js',
  'scripts/detect-*.js',
  'scripts/generate-*.js',
  'scripts/professional-audit.js',
  'scripts/remove-*.js',
  'scripts/refactor-*.js',
  'scripts/apply-*.js',
  'scripts/check-*.js',
  'scripts/fix-*.js',
  'scripts/clean-*.js',
  'scripts/organize-*.js',
  'scripts/validate-*.js',
  'scripts/migrate-*.js',
  'scripts/setup-*.js',
  'scripts/quick-*.js',
  'test-db-connection.js',
  'gerar-chaves.bat',
  
  // Arquivos de relatório
  '*.json',
  'CLEANUP-REPORT.json',
  'audit-report.json',
  'professional-audit-report.json',
  'DEAD-CODE-REPORT.json',
  
  // Componentes de exemplo/debug
  'src/components/examples/',
  'src/components/debug/',
  'src/app/debug/',
  'src/app/audit/',
  
  // Testes (se não for usar)
  'src/__tests__/',
  'src/lib/__tests__/',
  
  // Arquivos temporários
  '.env.production.local',
  '.env.development.local',
  '.env.test.local',
];

// Pastas para organizar
const docsToKeep = [
  'DEPLOY-HOSTINGER.md',
  'INICIO-RAPIDO-HOSTINGER.md',
  'RESUMO-FINAL.md',
  'TROUBLESHOOTING-NETLIFY.md',
  'README.md',
  'CONTRIBUTING.md',
];

let removedCount = 0;
let keptCount = 0;

function removePattern(pattern) {
  const glob = require('glob');
  const files = glob.sync(pattern, { cwd: process.cwd() });
  
  files.forEach(file => {
    try {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`  ❌ Removido diretório: ${file}`);
        } else {
          fs.unlinkSync(fullPath);
          console.log(`  ❌ Removido arquivo: ${file}`);
        }
        removedCount++;
      }
    } catch (error) {
      console.log(`  ⚠️  Erro ao remover ${file}: ${error.message}`);
    }
  });
}

console.log('📁 Removendo arquivos não essenciais...\n');

toRemove.forEach(pattern => {
  removePattern(pattern);
});

console.log(`\n✅ Limpeza concluída!`);
console.log(`   Arquivos removidos: ${removedCount}`);

// Criar pasta docs-archive para documentação
console.log('\n📦 Organizando documentação...');

const docsArchive = path.join(process.cwd(), 'docs-archive');
if (!fs.existsSync(docsArchive)) {
  fs.mkdirSync(docsArchive, { recursive: true });
}

// Mover documentação não essencial para docs-archive
const docsPath = path.join(process.cwd(), 'docs');
if (fs.existsSync(docsPath)) {
  const docFiles = fs.readdirSync(docsPath);
  docFiles.forEach(file => {
    const sourcePath = path.join(docsPath, file);
    const destPath = path.join(docsArchive, file);
    
    try {
      if (fs.statSync(sourcePath).isFile()) {
        fs.renameSync(sourcePath, destPath);
        console.log(`  📦 Arquivado: docs/${file}`);
      }
    } catch (error) {
      // Ignorar erros
    }
  });
}

console.log('\n📝 Criando README de produção...');

const productionReadme = `# SuaGrana - Sistema Financeiro

Sistema completo de gestão financeira pessoal.

## 🚀 Deploy no Hostinger

Siga o guia: \`DEPLOY-HOSTINGER.md\`

Ou o guia rápido: \`INICIO-RAPIDO-HOSTINGER.md\`

## 📦 Instalação

\`\`\`bash
npm install
npx prisma generate
npx prisma db push
node scripts/create-first-user.js
npm run build
npm start
\`\`\`

## 🔧 Configuração

Crie o arquivo \`.env\` com:

\`\`\`bash
DATABASE_URL="mysql://usuario:senha@localhost:3306/banco"
JWT_SECRET="sua-chave-jwt"
JWT_REFRESH_SECRET="sua-chave-refresh"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
\`\`\`

## 📚 Documentação

- \`DEPLOY-HOSTINGER.md\` - Guia completo de deploy
- \`INICIO-RAPIDO-HOSTINGER.md\` - Guia rápido (17 min)
- \`RESUMO-FINAL.md\` - Visão geral do projeto

## 🔐 Primeiro Acesso

Após criar o primeiro usuário:
- Email: admin@suagrana.com
- Senha: admin123

⚠️ Altere a senha após o primeiro login!

## 📞 Suporte

Para problemas, consulte: \`TROUBLESHOOTING-NETLIFY.md\`
`;

fs.writeFileSync(path.join(process.cwd(), 'README.md'), productionReadme);
console.log('  ✅ README.md atualizado');

console.log('\n🎉 Projeto pronto para produção!');
console.log('\n📋 Próximos passos:');
console.log('   1. Revise as mudanças: git status');
console.log('   2. Commit: git add . && git commit -m "Preparar para produção"');
console.log('   3. Push: git push');
console.log('   4. Siga o guia: DEPLOY-HOSTINGER.md\n');
