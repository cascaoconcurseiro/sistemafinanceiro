const fs = require('fs');
const path = require('path');

console.log('📁 Organizando estrutura do projeto...\n');

// Criar estrutura de pastas organizada
const folders = {
  // Scripts organizados por função
  'scripts/setup': [],
  'scripts/database': [],
  'scripts/maintenance': [],
  
  // Documentação organizada
  'docs/deployment': [],
  'docs/development': [],
  'docs/user-guide': [],
};

// Criar pastas se não existirem
Object.keys(folders).forEach(folder => {
  const folderPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Criado: ${folder}`);
  }
});

// Mover scripts para pastas organizadas
const scriptMoves = {
  // Setup
  'scripts/create-admin-user.js': 'scripts/setup/create-admin-user.js',
  'scripts/create-first-user.js': 'scripts/setup/create-first-user.js',
  'scripts/create-complete-categories.js': 'scripts/setup/create-complete-categories.js',
  
  // Database
  'scripts/make-category-required.ts': 'scripts/database/make-category-required.ts',
  
  // Maintenance
  'scripts/backup-database.js': 'scripts/maintenance/backup-database.js',
  'scripts/auto-backup.js': 'scripts/maintenance/auto-backup.js',
  'scripts/health-check.js': 'scripts/maintenance/health-check.js',
  'scripts/install-all-dependencies.js': 'scripts/maintenance/install-all-dependencies.js',
};

console.log('\n📦 Movendo scripts...');
Object.entries(scriptMoves).forEach(([from, to]) => {
  const sourcePath = path.join(process.cwd(), from);
  const destPath = path.join(process.cwd(), to);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`  ✅ ${from} → ${to}`);
    } catch (error) {
      console.log(`  ⚠️  Erro ao mover ${from}: ${error.message}`);
    }
  }
});

// Mover documentação
const docMoves = {
  'DEPLOY-HOSTINGER.md': 'docs/deployment/DEPLOY-HOSTINGER.md',
  'INICIO-RAPIDO-HOSTINGER.md': 'docs/deployment/INICIO-RAPIDO-HOSTINGER.md',
  'TROUBLESHOOTING-NETLIFY.md': 'docs/deployment/TROUBLESHOOTING.md',
  '.env.hostinger.example': 'docs/deployment/.env.hostinger.example',
  '.env.production.example': 'docs/deployment/.env.production.example',
  'CONTRIBUTING.md': 'docs/development/CONTRIBUTING.md',
};

console.log('\n📚 Movendo documentação...');
Object.entries(docMoves).forEach(([from, to]) => {
  const sourcePath = path.join(process.cwd(), from);
  const destPath = path.join(process.cwd(), to);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`  ✅ ${from} → ${to}`);
    } catch (error) {
      console.log(`  ⚠️  Erro ao mover ${from}: ${error.message}`);
    }
  }
});

// Criar README atualizado com nova estrutura
const newReadme = `# SuaGrana - Sistema Financeiro

Sistema completo de gestão financeira pessoal.

## 📁 Estrutura do Projeto

\`\`\`
SuaGrana-Clean/
├── src/
│   ├── app/              # Páginas e rotas (Next.js App Router)
│   ├── components/       # Componentes React
│   ├── contexts/         # Context API
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # Bibliotecas e utilitários
│   └── middleware/       # Middlewares
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
├── scripts/
│   ├── setup/            # Scripts de configuração inicial
│   ├── database/         # Scripts de banco de dados
│   └── maintenance/      # Scripts de manutenção
├── docs/
│   ├── deployment/       # Guias de deploy
│   ├── development/      # Documentação de desenvolvimento
│   └── user-guide/       # Guia do usuário
├── public/               # Arquivos estáticos
├── server.js             # Servidor Node.js para produção
└── package.json
\`\`\`

## 🚀 Início Rápido

### Instalação

\`\`\`bash
npm install
\`\`\`

### Configuração

1. Copie o arquivo de exemplo:
\`\`\`bash
cp docs/deployment/.env.hostinger.example .env
\`\`\`

2. Edite o \`.env\` com suas credenciais

3. Configure o banco de dados:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

4. Crie o usuário administrador:
\`\`\`bash
node scripts/setup/create-admin-user.js
\`\`\`

### Desenvolvimento

\`\`\`bash
npm run dev
\`\`\`

Acesse: http://localhost:3000

### Produção

\`\`\`bash
npm run build
npm start
\`\`\`

## 📚 Documentação

- **Deploy**: \`docs/deployment/\`
  - [Guia Completo - Hostinger](docs/deployment/DEPLOY-HOSTINGER.md)
  - [Início Rápido](docs/deployment/INICIO-RAPIDO-HOSTINGER.md)
  - [Troubleshooting](docs/deployment/TROUBLESHOOTING.md)

- **Desenvolvimento**: \`docs/development/\`
  - [Como Contribuir](docs/development/CONTRIBUTING.md)

## 🔧 Scripts Disponíveis

### Setup
\`\`\`bash
# Criar usuário administrador
node scripts/setup/create-admin-user.js

# Criar categorias padrão
node scripts/setup/create-complete-categories.js
\`\`\`

### Manutenção
\`\`\`bash
# Backup do banco de dados
node scripts/maintenance/backup-database.js

# Verificar saúde do sistema
node scripts/maintenance/health-check.js
\`\`\`

## 🔐 Credenciais Padrão

Após executar \`create-admin-user.js\`:
- **Email**: adm@suagrana.com.br
- **Senha**: 834702

⚠️ **Altere a senha após o primeiro login!**

## 🛠️ Tecnologias

- **Framework**: Next.js 14
- **Banco de Dados**: PostgreSQL / MySQL (via Prisma)
- **Autenticação**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI
- **Estado**: Zustand

## 📞 Suporte

Para problemas, consulte: [docs/deployment/TROUBLESHOOTING.md](docs/deployment/TROUBLESHOOTING.md)

## 📄 Licença

Privado - Todos os direitos reservados
`;

fs.writeFileSync(path.join(process.cwd(), 'README.md'), newReadme);
console.log('\n✅ README.md atualizado com nova estrutura');

// Criar arquivo de índice de scripts
const scriptsIndex = `# Scripts Disponíveis

## 🔧 Setup (Configuração Inicial)

### create-admin-user.js
Cria ou atualiza o usuário administrador.
\`\`\`bash
node scripts/setup/create-admin-user.js
\`\`\`

### create-first-user.js
Cria o primeiro usuário do sistema.
\`\`\`bash
node scripts/setup/create-first-user.js
\`\`\`

### create-complete-categories.js
Cria as categorias padrão do sistema.
\`\`\`bash
node scripts/setup/create-complete-categories.js
\`\`\`

## 🗄️ Database (Banco de Dados)

### make-category-required.ts
Torna o campo categoria obrigatório nas transações.
\`\`\`bash
npx tsx scripts/database/make-category-required.ts
\`\`\`

## 🔧 Maintenance (Manutenção)

### backup-database.js
Faz backup do banco de dados.
\`\`\`bash
node scripts/maintenance/backup-database.js
\`\`\`

### auto-backup.js
Sistema de backup automático.
\`\`\`bash
node scripts/maintenance/auto-backup.js
\`\`\`

### health-check.js
Verifica a saúde do sistema.
\`\`\`bash
node scripts/maintenance/health-check.js
\`\`\`

## 📝 Outros

### prepare-for-production.js
Prepara o projeto para deploy em produção.
\`\`\`bash
node scripts/prepare-for-production.js
\`\`\`

### organize-project.js
Organiza a estrutura de pastas do projeto.
\`\`\`bash
node scripts/organize-project.js
\`\`\`
`;

fs.writeFileSync(path.join(process.cwd(), 'scripts', 'README.md'), scriptsIndex);
console.log('✅ scripts/README.md criado');

console.log('\n🎉 Organização concluída!');
console.log('\n📋 Estrutura final:');
console.log('   scripts/');
console.log('   ├── setup/          (configuração inicial)');
console.log('   ├── database/       (banco de dados)');
console.log('   ├── maintenance/    (manutenção)');
console.log('   └── README.md       (índice de scripts)');
console.log('   docs/');
console.log('   ├── deployment/     (guias de deploy)');
console.log('   ├── development/    (docs de desenvolvimento)');
console.log('   └── user-guide/     (guia do usuário)');
console.log('\n💡 Próximos passos:');
console.log('   1. Revise as mudanças: git status');
console.log('   2. Commit: git add . && git commit -m "Organizar estrutura do projeto"');
console.log('   3. Push: git push\n');
