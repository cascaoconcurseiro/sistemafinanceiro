# 🚀 Passo a Passo: Deploy no Netlify

## 📌 Resumo do Problema

Você está tentando fazer deploy no Netlify, mas está recebendo o erro:
```
Unable to read file dev.db
```

**Causa**: Seu projeto usa SQLite (arquivo local), mas o Netlify precisa de PostgreSQL (banco remoto).

---

## ✅ Solução em 6 Passos

### 📍 PASSO 1: Criar Banco PostgreSQL no Neon (5 minutos)

1. Abra: https://console.neon.tech
2. Clique em **Sign Up** (ou **Sign In** se já tem conta)
3. Clique em **New Project**
4. Preencha:
   - **Project name**: `SuaGrana`
   - **Region**: `US East (Ohio)` ← Mais próximo do Netlify
   - **PostgreSQL version**: `16`
5. Clique em **Create Project**
6. **COPIE** a **Pooled Connection String** (tem `-pooler` no meio):
   ```
   postgresql://neondb_owner:abc123@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   ⚠️ **GUARDE ESSA URL!** Você vai usar nos próximos passos.

---

### 📍 PASSO 2: Gerar Chaves Secretas (2 minutos)

Abra o terminal e execute estes 3 comandos:

```bash
# 1. JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Cron Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cada comando vai gerar uma chave. **COPIE AS 3 CHAVES!**

Exemplo de saída:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

### 📍 PASSO 3: Configurar Variáveis no Netlify (3 minutos)

1. Acesse: https://app.netlify.com
2. Clique no seu site
3. Vá em: **Site settings** → **Environment variables**
4. Clique em **Add a variable**
5. Adicione **CADA UMA** dessas variáveis:

```bash
# 1. Banco de Dados
Key: DATABASE_URL
Value: postgresql://neondb_owner:abc123@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
Scopes: All

# 2. JWT Secret (use a chave que você gerou)
Key: JWT_SECRET
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Scopes: All

# 3. JWT Refresh Secret (use a segunda chave)
Key: JWT_REFRESH_SECRET
Value: b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1
Scopes: All

# 4. JWT Expires In
Key: JWT_EXPIRES_IN
Value: 24h
Scopes: All

# 5. JWT Refresh Expires In
Key: JWT_REFRESH_EXPIRES_IN
Value: 7d
Scopes: All

# 6. Cron Secret (use a terceira chave)
Key: CRON_SECRET
Value: c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2
Scopes: All

# 7. Node Environment
Key: NODE_ENV
Value: production
Scopes: All

# 8. App URL (substitua pelo seu domínio Netlify)
Key: NEXT_PUBLIC_APP_URL
Value: https://seu-site.netlify.app
Scopes: All

# 9. Allowed Origins (mesmo valor do App URL)
Key: ALLOWED_ORIGINS
Value: https://seu-site.netlify.app
Scopes: All

# 10. Rate Limit Max
Key: RATE_LIMIT_MAX
Value: 100
Scopes: All

# 11. Rate Limit Window
Key: RATE_LIMIT_WINDOW
Value: 60000
Scopes: All

# 12. Backup Enabled
Key: BACKUP_ENABLED
Value: true
Scopes: All

# 13. Backup Retention Days
Key: BACKUP_RETENTION_DAYS
Value: 30
Scopes: All

# 14. Log Level
Key: LOG_LEVEL
Value: info
Scopes: All

# 15. Log Retention Days
Key: LOG_RETENTION_DAYS
Value: 7
Scopes: All
```

---

### 📍 PASSO 4: Atualizar Código Local (2 minutos)

O schema do Prisma já foi atualizado para PostgreSQL. Agora execute:

```bash
# 1. Navegar até a pasta do projeto
cd "Não apagar/SuaGrana-Clean"

# 2. Criar arquivo .env local
copy .env.production.example .env

# 3. Editar .env e adicionar a DATABASE_URL do Neon
# (Use um editor de texto)

# 4. Gerar Prisma Client para PostgreSQL
npx prisma generate

# 5. Criar tabelas no PostgreSQL
npx prisma db push
```

Se você tem dados no SQLite e quer migrar:
```bash
node scripts/migrate-sqlite-to-postgres.js
```

---

### 📍 PASSO 5: Testar Localmente (2 minutos)

```bash
# Rodar aplicação
npm run dev

# Abrir no navegador
# http://localhost:3000

# Testar:
# - Login funciona?
# - Criar transação funciona?
# - Dados aparecem?
```

Se tudo funcionar, pode ir para o próximo passo!

---

### 📍 PASSO 6: Deploy no Netlify (3 minutos)

```bash
# 1. Adicionar mudanças ao Git
git add .

# 2. Commit
git commit -m "Migrar de SQLite para PostgreSQL para deploy no Netlify"

# 3. Push (vai disparar deploy automático no Netlify)
git push
```

Aguarde o deploy (2-5 minutos). Você pode acompanhar em:
- https://app.netlify.com → Seu site → **Deploys**

---

## ✅ Verificar se Funcionou

1. Acesse seu site: `https://seu-site.netlify.app`
2. Teste a API de saúde: `https://seu-site.netlify.app/api/health`
   - Deve retornar: `{"status":"ok"}`
3. Faça login
4. Crie uma transação
5. Verifique se os dados aparecem

---

## 🐛 Problemas Comuns

### ❌ Erro: "Prisma Client not found"

**Solução**: Adicione ao `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

Depois:
```bash
git add package.json
git commit -m "Adicionar postinstall script"
git push
```

---

### ❌ Erro: "Can't reach database server"

**Causas possíveis**:
1. DATABASE_URL incorreta no Netlify
2. Não usou a "Pooled Connection" (deve ter `-pooler`)
3. Falta `?sslmode=require` no final

**Solução**:
1. Volte ao Neon Console
2. Copie novamente a **Pooled Connection String**
3. Atualize no Netlify
4. Faça novo deploy

---

### ❌ Erro: "JWT_SECRET is not defined"

**Solução**:
1. Verifique se adicionou TODAS as variáveis no Netlify
2. Faça um novo deploy após adicionar

---

### ❌ Erro 404 em todas as páginas

**Solução**: Verifique se o `netlify.toml` está correto:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

## 📊 Checklist Final

- [ ] Conta criada no Neon
- [ ] Banco PostgreSQL criado
- [ ] Connection String copiada
- [ ] 3 chaves secretas geradas
- [ ] 15 variáveis configuradas no Netlify
- [ ] Schema do Prisma atualizado
- [ ] `npx prisma generate` executado
- [ ] `npx prisma db push` executado
- [ ] Testado localmente (funcionou!)
- [ ] Commit e push feitos
- [ ] Deploy concluído no Netlify
- [ ] Site acessível e funcionando
- [ ] API `/api/health` retorna OK
- [ ] Login funciona
- [ ] Transações funcionam

---

## 🎉 Pronto!

Seu site agora está rodando no Netlify com PostgreSQL!

### Próximos Passos (Opcional):

1. **Domínio customizado**: Configure em Site settings → Domain management
2. **SSL**: Automático no Netlify ✅
3. **Monitoramento**: Configure Sentry
4. **Backups**: Configure backups automáticos do Neon
5. **Email**: Configure SMTP para notificações

---

## 🆘 Precisa de Ajuda?

- **Neon**: https://neon.tech/docs
- **Netlify**: https://docs.netlify.com
- **Prisma**: https://www.prisma.io/docs
