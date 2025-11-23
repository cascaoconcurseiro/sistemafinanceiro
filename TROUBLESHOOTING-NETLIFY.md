# 🔍 Troubleshooting - Erro no Netlify

## 📋 Checklist Rápido

- [ ] DATABASE_URL está correta no Netlify (com `.c-2`)
- [ ] Todas as 7 variáveis essenciais foram adicionadas
- [ ] Deploy foi concluído com sucesso (sem erros de build)
- [ ] Aguardou 2-3 minutos após o deploy
- [ ] Tentou fazer login com: admin@suagrana.com / admin123

---

## 🔍 Como Ver os Logs de Erro no Netlify

### 1️⃣ Ver Logs de Build

1. Acesse: https://app.netlify.com
2. Clique no seu site
3. Vá em **Deploys**
4. Clique no último deploy (o mais recente)
5. Role para baixo e veja o **Deploy log**
6. Procure por erros em vermelho

**Erros comuns:**
- `Prisma Client not found` → Falta gerar o Prisma Client
- `Environment variable not found` → Falta variável de ambiente
- `Can't reach database` → DATABASE_URL incorreta

### 2️⃣ Ver Logs de Função (Runtime)

1. No Netlify, vá em **Functions**
2. Clique em **Function log**
3. Tente fazer login no site
4. Volte para o Function log
5. Veja o erro que apareceu

**Erros comuns:**
- `password authentication failed` → DATABASE_URL com senha errada
- `relation "users" does not exist` → Tabelas não foram criadas
- `JWT_SECRET is not defined` → Falta variável JWT_SECRET

---

## 🔧 Soluções para Erros Comuns

### ❌ Erro: "Prisma Client not found"

**Solução:**
```bash
# Adicione ao package.json se não tiver:
"scripts": {
  "postinstall": "prisma generate"
}
```

Depois:
```bash
git add package.json
git commit -m "Adicionar postinstall para Prisma"
git push
```

---

### ❌ Erro: "Can't reach database server"

**Causa:** DATABASE_URL incorreta

**Solução:**
1. Verifique se a URL tem `.c-2` no host
2. Verifique se tem `?sslmode=require` no final
3. Verifique se a senha está correta

URL correta:
```
postgresql://neondb_owner:SENHA@ep-restless-sunset-ae2tj136-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### ❌ Erro: "relation 'users' does not exist"

**Causa:** Tabelas não foram criadas no banco

**Solução:**
Execute localmente:
```bash
cd "Não apagar/SuaGrana-Clean"
npx prisma db push
node scripts/create-first-user.js
```

---

### ❌ Erro: "JWT_SECRET is not defined"

**Causa:** Variáveis de ambiente não foram configuradas

**Solução:**
1. Verifique se adicionou TODAS as 7 variáveis no Netlify
2. Faça um novo deploy: **Deploys** → **Trigger deploy** → **Deploy site**

---

### ❌ Erro: "Invalid credentials" ou "User not found"

**Causa:** Usuário não existe no banco

**Solução:**
Execute localmente:
```bash
node scripts/create-first-user.js
```

Depois tente fazer login com:
- Email: `admin@suagrana.com`
- Senha: `admin123`

---

## 🧪 Testar Localmente Primeiro

Antes de debugar no Netlify, teste localmente:

```bash
# 1. Configurar .env
# (já está configurado)

# 2. Rodar aplicação
npm run dev

# 3. Abrir no navegador
# http://localhost:3000

# 4. Tentar fazer login
# Email: admin@suagrana.com
# Senha: admin123
```

Se funcionar localmente mas não no Netlify:
- O problema é com as variáveis de ambiente no Netlify
- Ou com o build do Netlify

---

## 📊 Verificar Status do Banco

Execute localmente:
```bash
node test-db-connection.js
```

Deve mostrar:
- ✅ Conexão bem-sucedida
- 📋 43 tabelas no banco

Se mostrar 0 tabelas:
```bash
npx prisma db push
node scripts/create-first-user.js
```

---

## 🆘 Ainda Não Funciona?

### Opção 1: Fazer Deploy Manual

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Link ao site
netlify link

# 4. Deploy
netlify deploy --prod
```

### Opção 2: Verificar Logs Detalhados

No Netlify:
1. **Functions** → **Function log**
2. Tente fazer login
3. Copie o erro completo
4. Me envie o erro

### Opção 3: Resetar Tudo

1. No Netlify: **Site settings** → **Environment variables** → Delete todas
2. Reimporte o arquivo `.env.netlify`
3. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## 📝 Informações Úteis

**Site:** https://suagranas.netlify.app
**Repositório:** https://github.com/cascaoconcurseiro/sistemafinanceiro

**Credenciais de Teste:**
- Email: admin@suagrana.com
- Senha: admin123

**Banco de Dados:**
- Provider: Neon PostgreSQL
- Tabelas: 43
- Status: ✅ Criadas

**Variáveis Essenciais:**
1. DATABASE_URL
2. JWT_SECRET
3. JWT_REFRESH_SECRET
4. NODE_ENV
5. NEXT_PUBLIC_APP_URL
6. JWT_EXPIRES_IN
7. JWT_REFRESH_EXPIRES_IN
