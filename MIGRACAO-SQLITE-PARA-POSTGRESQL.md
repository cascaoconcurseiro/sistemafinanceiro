# 🔄 Migração SQLite → PostgreSQL para Deploy no Netlify

## ❌ Problema

O erro "Unable to read file dev.db" acontece porque:
- Seu projeto usa **SQLite** (arquivo `dev.db`)
- O Netlify é **serverless** e não suporta bancos de dados em arquivo
- Você precisa usar **PostgreSQL** (banco remoto)

## ✅ Solução Rápida

### 1. Criar Banco PostgreSQL no Neon (Grátis)

1. Acesse: https://console.neon.tech
2. Faça login/cadastro
3. Clique em **New Project**
4. Configure:
   - **Name**: SuaGrana
   - **Region**: US East (Ohio)
   - **PostgreSQL**: 16
5. Clique em **Create Project**
6. **COPIE** a **Pooled Connection String**:
   ```
   postgresql://neondb_owner:SENHA@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Atualizar Schema do Prisma

Edite `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // ✅ Mudou de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Configurar Variáveis de Ambiente

#### Localmente (.env):
```bash
# PostgreSQL do Neon
DATABASE_URL="postgresql://neondb_owner:SENHA@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Outras variáveis (gere novas chaves)
JWT_SECRET="sua-chave-jwt-aqui"
JWT_REFRESH_SECRET="sua-chave-refresh-aqui"
CRON_SECRET="sua-chave-cron-aqui"
```

#### No Netlify:
1. Acesse: **Site settings** → **Environment variables**
2. Adicione as mesmas variáveis acima

### 4. Executar Migrations

```bash
# 1. Gerar Prisma Client para PostgreSQL
npx prisma generate

# 2. Criar tabelas no PostgreSQL
npx prisma db push

# 3. (Opcional) Migrar dados do SQLite
node scripts/migrate-sqlite-to-postgres.js
```

### 5. Testar Localmente

```bash
# Rodar aplicação
npm run dev

# Verificar se conecta no PostgreSQL
# Acesse: http://localhost:3000
```

### 6. Deploy no Netlify

```bash
# Commit e push
git add .
git commit -m "Migrar de SQLite para PostgreSQL"
git push

# Netlify vai fazer deploy automaticamente
```

## 🔐 Gerar Chaves Secretas

Execute no terminal:

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Refresh Secret  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Cron Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📋 Checklist

- [ ] Conta criada no Neon
- [ ] Connection String copiada
- [ ] `schema.prisma` atualizado (provider = "postgresql")
- [ ] `.env` configurado com DATABASE_URL
- [ ] Variáveis configuradas no Netlify
- [ ] `npx prisma generate` executado
- [ ] `npx prisma db push` executado
- [ ] Testado localmente
- [ ] Deploy feito no Netlify
- [ ] Site funcionando

## 🐛 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se a DATABASE_URL está correta
- Certifique-se de usar a **Pooled Connection** (com `-pooler`)
- Adicione `?sslmode=require` no final

### Erro: "Prisma Client not found"
- Execute: `npx prisma generate`
- Adicione ao `package.json`:
  ```json
  "scripts": {
    "postinstall": "prisma generate"
  }
  ```

### Erro: "Environment variable not found: DATABASE_URL"
- Verifique se o `.env` existe
- Verifique se as variáveis estão no Netlify
- Faça um novo deploy após adicionar variáveis

## 📝 Diferenças SQLite vs PostgreSQL

| Recurso | SQLite | PostgreSQL |
|---------|--------|------------|
| Tipo | Arquivo local | Servidor remoto |
| Serverless | ❌ Não | ✅ Sim |
| Netlify | ❌ Não funciona | ✅ Funciona |
| Escalabilidade | Limitada | Alta |
| Concorrência | Baixa | Alta |
| Custo | Grátis | Grátis (Neon) |

## 🎯 Resumo

```bash
# 1. Criar banco no Neon
# 2. Atualizar schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 3. Configurar .env
DATABASE_URL="postgresql://..."

# 4. Migrations
npx prisma generate
npx prisma db push

# 5. Deploy
git push
```

## 🆘 Precisa de Ajuda?

- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Netlify Docs**: https://docs.netlify.com
