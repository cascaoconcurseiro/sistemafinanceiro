# SuaGrana - Sistema Financeiro

Sistema completo de gestão financeira pessoal.

## 📁 Estrutura do Projeto

```
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
```

## 🚀 Início Rápido

### Instalação

```bash
npm install
```

### Configuração

1. Copie o arquivo de exemplo:
```bash
cp docs/deployment/.env.hostinger.example .env
```

2. Edite o `.env` com suas credenciais

3. Configure o banco de dados:
```bash
npx prisma generate
npx prisma db push
```

4. Crie o usuário administrador:
```bash
node scripts/setup/create-admin-user.js
```

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### Produção

```bash
npm run build
npm start
```

## 📚 Documentação

- **Deploy**: `docs/deployment/`
  - [Guia Completo - Hostinger](docs/deployment/DEPLOY-HOSTINGER.md)
  - [Início Rápido](docs/deployment/INICIO-RAPIDO-HOSTINGER.md)
  - [Troubleshooting](docs/deployment/TROUBLESHOOTING.md)

- **Desenvolvimento**: `docs/development/`
  - [Como Contribuir](docs/development/CONTRIBUTING.md)

## 🔧 Scripts Disponíveis

### Setup
```bash
# Criar usuário administrador
node scripts/setup/create-admin-user.js

# Criar categorias padrão
node scripts/setup/create-complete-categories.js
```

### Manutenção
```bash
# Backup do banco de dados
node scripts/maintenance/backup-database.js

# Verificar saúde do sistema
node scripts/maintenance/health-check.js
```

## 🔐 Credenciais Padrão

Após executar `create-admin-user.js`:
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
