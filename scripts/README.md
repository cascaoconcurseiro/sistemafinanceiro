# Scripts Disponíveis

## 🔧 Setup (Configuração Inicial)

### create-admin-user.js
Cria ou atualiza o usuário administrador.
```bash
node scripts/setup/create-admin-user.js
```

### create-first-user.js
Cria o primeiro usuário do sistema.
```bash
node scripts/setup/create-first-user.js
```

### create-complete-categories.js
Cria as categorias padrão do sistema.
```bash
node scripts/setup/create-complete-categories.js
```

## 🗄️ Database (Banco de Dados)

### make-category-required.ts
Torna o campo categoria obrigatório nas transações.
```bash
npx tsx scripts/database/make-category-required.ts
```

## 🔧 Maintenance (Manutenção)

### backup-database.js
Faz backup do banco de dados.
```bash
node scripts/maintenance/backup-database.js
```

### auto-backup.js
Sistema de backup automático.
```bash
node scripts/maintenance/auto-backup.js
```

### health-check.js
Verifica a saúde do sistema.
```bash
node scripts/maintenance/health-check.js
```

## 📝 Outros

### prepare-for-production.js
Prepara o projeto para deploy em produção.
```bash
node scripts/prepare-for-production.js
```

### organize-project.js
Organiza a estrutura de pastas do projeto.
```bash
node scripts/organize-project.js
```
