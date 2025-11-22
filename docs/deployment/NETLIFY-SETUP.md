# 🚀 Guia de Configuração do Netlify

## 📋 Pré-requisitos

1. Conta no Netlify
2. Banco de dados PostgreSQL (recomendado: Neon, Supabase ou Railway)
3. Repositório GitHub conectado ao Netlify

---

## 🗄️ 1. Configurar Banco de Dados

### Opção A: Neon (Recomendado - Grátis)

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta e um novo projeto
3. Copie a **Connection String** (formato: `postgresql://user:password@host/database`)
4. Guarde essa URL para usar no Netlify

### Opção B: Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a **Connection String** (modo "Session")

### Opção C: Railway

1. Acesse [railway.app](https://railway.app)
2. Crie um novo projeto PostgreSQL
3. Copie a **DATABASE_URL** fornecida

---

## 🔐 2. Gerar Chaves Secretas

Execute estes comandos no terminal para gerar chaves seguras:

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Cron Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarde essas 3 chaves geradas!

---

## ⚙️ 3. Configurar Variáveis de Ambiente no Netlify

### Passo a Passo:

1. Acesse seu site no Netlify Dashboard
2. Vá em **Site settings** → **Environment variables**
3. Clique em **Add a variable** e adicione cada uma abaixo:

### Variáveis Obrigatórias:

```bash
# Banco de Dados
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT (use as chaves que você gerou)
JWT_SECRET=sua-chave-jwt-gerada-aqui
JWT_REFRESH_SECRET=sua-chave-refresh-gerada-aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Cron Jobs
CRON_SECRET=sua-chave-cron-gerada-aqui

# Ambiente
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-site.netlify.app

# CORS (ajuste com sua URL do Netlify)
ALLOWED_ORIGINS=https://seu-site.netlify.app

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Backup
BACKUP_ENABLED=true
BACKUP_RETENTION_DAYS=30

# Logs
LOG_LEVEL=info
LOG_RETENTION_DAYS=7
```

### Variáveis Opcionais (para depois):

```bash
# Sentry (Monitoramento de erros)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Email (quando configurar)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# 2FA
TWO_FACTOR_ENABLED=false
```

---

## 🔄 4. Executar Migrations do Prisma

Após configurar as variáveis de ambiente, você precisa criar as tabelas no banco:

### Opção A: Via Netlify CLI (Recomendado)

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link ao seu site
netlify link

# Executar migration
netlify env:import .env.production
npx prisma migrate deploy
```

### Opção B: Localmente (com DATABASE_URL de produção)

```bash
# Criar arquivo .env.production com a DATABASE_URL de produção
echo "DATABASE_URL=sua-url-do-banco-aqui" > .env.production

# Executar migration
npx dotenv -e .env.production -- npx prisma migrate deploy

# Gerar Prisma Client
npx dotenv -e .env.production -- npx prisma generate
```

### Opção C: Via Script de Deploy

Adicione ao `package.json`:

```json
{
  "scripts": {
    "postbuild": "prisma generate",
    "deploy:db": "prisma migrate deploy"
  }
}
```

---

## 🎯 5. Configurar Build no Netlify

O `netlify.toml` já está configurado, mas verifique:

```toml
[build]
  command = "cp next.config.netlify.js next.config.js && npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## 🧪 6. Testar o Deploy

1. Faça um push para o GitHub
2. O Netlify vai fazer o deploy automaticamente
3. Verifique os logs de build
4. Acesse seu site

### Verificar se está funcionando:

- Acesse: `https://seu-site.netlify.app/api/health`
- Deve retornar: `{"status":"ok"}`

---

## 🐛 7. Troubleshooting

### Erro: "Prisma Client not found"

```bash
# Adicione ao package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Erro: "Database connection failed"

- Verifique se a `DATABASE_URL` está correta
- Certifique-se de adicionar `?sslmode=require` no final da URL
- Teste a conexão localmente primeiro

### Erro: "JWT_SECRET is not defined"

- Verifique se todas as variáveis de ambiente foram adicionadas no Netlify
- Faça um novo deploy após adicionar as variáveis

### Erro 404 em todas as páginas

- Certifique-se de que o plugin `@netlify/plugin-nextjs` está instalado
- Verifique o `netlify.toml`

---

## 📝 8. Checklist Final

- [ ] Banco de dados PostgreSQL criado
- [ ] DATABASE_URL configurada no Netlify
- [ ] JWT_SECRET e JWT_REFRESH_SECRET gerados e configurados
- [ ] CRON_SECRET gerado e configurado
- [ ] NEXT_PUBLIC_APP_URL configurado com a URL do Netlify
- [ ] Migrations do Prisma executadas
- [ ] Build do Netlify passou sem erros
- [ ] Site acessível e funcionando
- [ ] API `/api/health` retornando OK
- [ ] Login funcionando

---

## 🔗 Links Úteis

- [Netlify Docs](https://docs.netlify.com)
- [Next.js on Netlify](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Neon Database](https://neon.tech/docs)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de build no Netlify
2. Verifique os logs de função no Netlify
3. Teste as APIs localmente primeiro
4. Verifique se todas as variáveis de ambiente estão configuradas

---

## 🎉 Próximos Passos

Após o deploy funcionar:

1. Configure um domínio customizado
2. Configure SSL (automático no Netlify)
3. Configure Sentry para monitoramento
4. Configure backups automáticos
5. Configure email (SMTP)
6. Ative 2FA se necessário
