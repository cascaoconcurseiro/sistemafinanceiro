# ⚡ Configuração Rápida - Netlify + Neon

## 🚨 IMPORTANTE: Segurança

**NUNCA** coloque credenciais no código ou no Git!
- ❌ Não commite arquivos `.env`
- ❌ Não exponha DATABASE_URL
- ✅ Use apenas variáveis de ambiente do Netlify

---

## 📋 Checklist de 5 Minutos

### 1️⃣ Gerar Chaves Secretas (30 segundos)

```bash
node scripts/generate-secrets.js
```

Copie as 3 chaves geradas!

---

### 2️⃣ Configurar Netlify (2 minutos)

Acesse: **Netlify Dashboard** → **Site settings** → **Environment variables**

Adicione estas variáveis:

```bash
# Banco de Dados (use a NOVA senha do Neon)
DATABASE_URL=postgresql://neondb_owner:NOVA_SENHA@ep-icy-union-aejhcedr-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT (cole as chaves geradas)
JWT_SECRET=sua-chave-jwt-aqui
JWT_REFRESH_SECRET=sua-chave-refresh-aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Cron
CRON_SECRET=sua-chave-cron-aqui

# Ambiente
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-site.netlify.app

# CORS
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

---

### 3️⃣ Configurar Banco de Dados (2 minutos)

**Opção A: Via Netlify (Recomendado)**

Após adicionar as variáveis, o Netlify executará as migrations automaticamente no próximo deploy.

**Opção B: Localmente**

```bash
# Use a NOVA senha do Neon
DATABASE_URL="postgresql://neondb_owner:NOVA_SENHA@ep-icy-union-aejhcedr-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require" node scripts/setup-production-db.js
```

---

### 4️⃣ Deploy (30 segundos)

```bash
git add .
git commit -m "chore: add production setup scripts"
git push
```

O Netlify fará o deploy automaticamente!

---

### 5️⃣ Verificar (30 segundos)

1. Aguarde o deploy terminar
2. Acesse: `https://seu-site.netlify.app/api/health`
3. Deve retornar: `{"status":"ok"}`

---

## 🎯 Resumo das URLs

- **Site**: https://seu-site.netlify.app
- **Health Check**: https://seu-site.netlify.app/api/health
- **Login**: https://seu-site.netlify.app/login

---

## 🔐 Segurança - O que NUNCA fazer

❌ **NÃO faça isso:**
```bash
# ERRADO - expõe credenciais
git add .env
git commit -m "add env"
```

✅ **Faça isso:**
```bash
# CORRETO - .env está no .gitignore
# Configure apenas no Netlify Dashboard
```

---

## 🆘 Problemas Comuns

### Erro: "Prisma Client not found"
```bash
# Adicione ao netlify.toml (já está configurado)
[build]
  command = "prisma generate && npm run build"
```

### Erro: "Database connection failed"
- Verifique se rotacionou a senha no Neon
- Verifique se a DATABASE_URL está correta no Netlify
- Certifique-se de ter `?sslmode=require` no final

### Erro: "JWT_SECRET is not defined"
- Execute: `node scripts/generate-secrets.js`
- Adicione as chaves no Netlify
- Faça um novo deploy

---

## ✅ Tudo Funcionando?

Se o health check retornar OK, você está pronto! 🎉

Próximos passos:
1. Crie o primeiro usuário admin
2. Configure um domínio customizado
3. Configure Sentry (opcional)
4. Configure email (opcional)

---

## 📞 Suporte

Problemas? Verifique:
1. Logs de build no Netlify
2. Logs de função no Netlify  
3. Variáveis de ambiente configuradas
4. Banco de dados acessível
